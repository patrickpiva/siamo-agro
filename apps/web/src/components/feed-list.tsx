'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ListingCardSkeleton, EmptyState } from '@siamo/ui'
import { CoffeeBean } from '@siamo/ui/icons'
import { FeedCard } from '@/components/feed/feed-card'
import type { FeedCardListing } from '@/components/feed/feed-card'
import type { FetchListingsQuery, Listing } from '@/lib/api'

// ─── Response shapes ──────────────────────────────────────────────────────────

interface FeedListResponse {
  data: Listing[]
  meta: {
    nextCursor: string | null
    limit: number
    /** First page only — see CLAUDE.md §5. */
    total?: number
    /** Present when the request carried `search`; not 'exact' means approximate. */
    searchRelaxed?: 'exact' | 'partial' | 'fuzzy'
  }
  error: null
  /** Marcador local (não vem da API): 401 nas abas autenticadas → CTA de login */
  unauthenticated?: boolean
}

interface MatchesFeedResponse extends FeedListResponse {
  computing: boolean
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

/**
 * Error carrying the API's typed code, so the UI can explain WHICH filter is the
 * problem. `radiusKm` without a location and `minMatchScore` while logged out
 * are deliberate errors on the API side (CLAUDE.md §5) — rendering them as a
 * generic "erro ao carregar" would hide an entirely actionable message.
 */
class ListingsRequestError extends Error {
  constructor(
    message: string,
    public readonly code: string | null,
  ) {
    super(message)
    this.name = 'ListingsRequestError'
  }
}

async function fetchListingsPage(
  query: FetchListingsQuery & { cursor?: string },
): Promise<FeedListResponse> {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== '') params.set(k, String(v))
  }
  const res = await fetch(`/api/proxy/listings?${params.toString()}`)
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null)
    const code =
      typeof body === 'object' && body !== null && 'error' in body
        ? ((body as { error?: { code?: string } }).error?.code ?? null)
        : null
    throw new ListingsRequestError('Erro ao buscar anúncios', code)
  }
  return res.json() as Promise<FeedListResponse>
}

/** Actionable copy for the filter errors the API raises on purpose. */
const FILTER_ERROR_MESSAGES: Record<string, string> = {
  LISTING_LOCATION_REQUIRED:
    'Para filtrar por distância, cadastre sua localização no perfil ou remova o filtro.',
  LISTING_MATCH_FILTER_UNAUTHENTICATED: 'Entre na sua conta para filtrar por score de match.',
}

async function fetchMatchesPage(cursor?: string): Promise<MatchesFeedResponse> {
  const params = new URLSearchParams()
  params.set('limit', '20')
  if (cursor) params.set('cursor', cursor)
  const res = await fetch(`/api/proxy/me/feed/matches?${params.toString()}`, {
    credentials: 'include',
  })
  if (res.status === 401) {
    return {
      data: [],
      meta: { nextCursor: null, limit: 20 },
      computing: false,
      error: null,
      unauthenticated: true,
    }
  }
  if (!res.ok) throw new Error('Erro ao buscar matches')
  return res.json() as Promise<MatchesFeedResponse>
}

async function fetchSavedPage(cursor?: string): Promise<FeedListResponse> {
  const params = new URLSearchParams()
  params.set('limit', '20')
  if (cursor) params.set('cursor', cursor)
  const res = await fetch(`/api/proxy/saved-listings?${params.toString()}`, {
    credentials: 'include',
  })
  if (res.status === 401) {
    return { data: [], meta: { nextCursor: null, limit: 20 }, error: null, unauthenticated: true }
  }
  if (!res.ok) throw new Error('Erro ao buscar anúncios salvos')
  return res.json() as Promise<FeedListResponse>
}

// ─── Shape normaliser ─────────────────────────────────────────────────────────

function toFeedCardData(listing: Listing): FeedCardListing {
  return {
    id: listing.id,
    kind: listing.kind,
    category: listing.category,
    title: listing.title,
    price: listing.price,
    thumbnail: listing.photos?.[0]?.url ?? null,
    location: { city: listing.profile.city ?? null, state: listing.profile.state ?? null },
    distanceKm: listing.distanceKm ?? null,
    publishedAt: new Date(listing.createdAt),
    owner: {
      name: listing.profile.name,
      reputationScore: listing.profile.rating,
      reputationSeal: listing.profile.badge ?? null,
    },
    // matchScore stored as 0–1 float; card expects 0–100 integer percentage
    matchScore: listing.matchScore != null ? Math.round(listing.matchScore * 100) : undefined,
  }
}

// ─── Results header ───────────────────────────────────────────────────────────

/**
 * Result count plus, when the API had to relax the search, an explicit warning
 * that the matches are approximate.
 *
 * The warning is the point: `partial` and `fuzzy` results are NOT what the user
 * typed, and presenting them silently as if they were is how a search loses
 * trust. `exact` renders no banner.
 */
function ResultsHeader({
  total,
  loaded,
  searchRelaxed,
  query,
}: {
  total?: number
  loaded: number
  searchRelaxed?: 'exact' | 'partial' | 'fuzzy'
  query?: string
}) {
  const showCount = total !== undefined
  const relaxed = searchRelaxed && searchRelaxed !== 'exact'
  if (!showCount && !relaxed) return null

  return (
    <div className="px-4 pb-2">
      {showCount && (
        <p className="text-muted-foreground font-mono text-[11px]">
          {total === 1 ? '1 resultado' : `${total} resultados`}
        </p>
      )}
      {relaxed && (
        <p className="error-retry-amber mt-2 rounded-[8px] px-[10px] py-2 text-[12px] leading-[1.4]">
          {searchRelaxed === 'partial'
            ? `Nenhum anúncio tem todos os termos de "${query}". Mostrando os que têm parte deles.`
            : `Nenhum anúncio corresponde a "${query}". Mostrando resultados parecidos.`}
        </p>
      )}
      {/* Loaded-vs-total is intentionally not shown: total comes from the first
          page only, so it would read "20 de 47" and never advance on scroll. */}
      <span className="sr-only">{loaded} carregados</span>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface FeedListProps {
  filters: FetchListingsQuery
  activeTab?: string
}

export function FeedList({ filters, activeTab }: FeedListProps) {
  const isMatches = activeTab === 'matches'
  const isSaved = activeTab === 'saved'

  const sentinelRef = useRef<HTMLDivElement>(null)
  // Teto de re-polls do estado "calculando matches" — região sem candidatos não
  // deve pollar para sempre
  const computingPolls = useRef(0)

  const { data, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: isMatches ? ['feed-matches'] : isSaved ? ['saved-listings'] : ['listings', filters],
      queryFn: ({ pageParam }) => {
        if (isMatches) return fetchMatchesPage(pageParam)
        if (isSaved) return fetchSavedPage(pageParam)
        return fetchListingsPage({ ...filters, cursor: pageParam })
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.meta.nextCursor ?? undefined,
      refetchInterval: (query) => {
        if (!isMatches) return false
        const first = query.state.data?.pages[0] as MatchesFeedResponse | undefined
        if (!first?.computing) {
          computingPolls.current = 0
          return false
        }
        if (computingPolls.current >= 10) return false
        computingPolls.current += 1
        return 4000
      },
    })

  // Refetch saved / matches whenever the tab becomes active
  useEffect(() => {
    if (isMatches || isSaved) void refetch()
  }, [isMatches, isSaved])

  // Listen for same-page unsave events (saved tab only)
  useEffect(() => {
    if (!isSaved) return
    const handler = () => void refetch()
    window.addEventListener('siamo:bookmark-toggled', handler)
    return () => window.removeEventListener('siamo:bookmark-toggled', handler)
  }, [isSaved, refetch])

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  if (status === 'pending') {
    return (
      <div className="flex flex-col">
        {Array.from({ length: 4 }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (status === 'error') {
    const code = error instanceof ListingsRequestError ? error.code : null
    const filterMessage = code ? FILTER_ERROR_MESSAGES[code] : undefined

    if (filterMessage) {
      return (
        <EmptyState
          icon={<CoffeeBean size={40} strokeWidth={1.2} />}
          iconVariant="muted"
          title="Não dá para aplicar esse filtro"
          description={filterMessage}
          {...(code === 'LISTING_MATCH_FILTER_UNAUTHENTICATED' && {
            actions: [{ label: 'Entrar', variant: 'primary' as const, href: '/entrar' }],
          })}
        />
      )
    }

    return (
      <p className="text-muted-foreground py-12 text-center">
        Erro ao carregar anúncios. Tente novamente.
      </p>
    )
  }

  const listings = data.pages.flatMap((p) => p.data)

  // Check if first page has computing:true (matches tab only)
  const isComputing =
    isMatches && listings.length === 0 && (data.pages[0] as MatchesFeedResponse)?.computing

  const isUnauthenticated =
    (isMatches || isSaved) && listings.length === 0 && data.pages[0]?.unauthenticated

  if (listings.length === 0) {
    if (isUnauthenticated) {
      return (
        <EmptyState
          icon={<CoffeeBean size={40} strokeWidth={1.2} />}
          iconVariant="muted"
          title={isMatches ? 'Entre para ver seus matches' : 'Entre para ver seus salvos'}
          description="Faça login com seu WhatsApp para acessar esta aba."
          actions={[{ label: 'Entrar', variant: 'primary', href: '/entrar' }]}
        />
      )
    }

    if (isComputing) {
      return (
        <div className="flex flex-col items-center gap-3 px-6 py-16">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
          <p className="text-muted-foreground text-center text-[13px] leading-relaxed">
            Calculando seus matches…
            <br />
            Volte em alguns instantes.
          </p>
        </div>
      )
    }

    if (isMatches) {
      return (
        <EmptyState
          icon={<CoffeeBean size={40} strokeWidth={1.2} />}
          iconVariant="muted"
          title="Sem matches ainda"
          description="Publique um anúncio ativo para começar a aparecer nos matches de outras pessoas."
          actions={[{ label: 'Publicar anúncio', variant: 'primary', href: '/anuncio/novo' }]}
        />
      )
    }

    if (isSaved) {
      return (
        <EmptyState
          icon={<CoffeeBean size={40} strokeWidth={1.2} />}
          iconVariant="muted"
          title="Nenhum anúncio salvo"
          description="Toque no ícone de favorito em qualquer anúncio para salvá-lo aqui."
        />
      )
    }

    // An active search or filter returning nothing is not an empty feed — telling
    // the user to publish an ad when they just searched for "trator" is a non
    // sequitur. The API already tried its relaxation tiers before answering.
    const hasQuery = Boolean(filters.search) || Boolean(filters.kind) || Boolean(filters.category)
    if (hasQuery) {
      return (
        <EmptyState
          icon={<CoffeeBean size={40} strokeWidth={1.2} />}
          iconVariant="muted"
          title={filters.search ? `Sem resultados para "${filters.search}"` : 'Sem resultados'}
          description="Tente outras palavras, remova alguns filtros ou aumente a distância máxima."
        />
      )
    }

    return (
      <EmptyState
        icon={<CoffeeBean size={40} strokeWidth={1.2} />}
        iconVariant="lime"
        title="Seu feed está vazio"
        description="Publique seu primeiro anúncio ou complete seu perfil para começar a receber matches."
        actions={[
          { label: 'Publicar anúncio', variant: 'primary', href: '/anuncio/novo' },
          { label: 'Completar perfil', variant: 'secondary', href: '/perfil' },
        ]}
      />
    )
  }

  const firstPage = data.pages[0]

  return (
    <>
      <ResultsHeader
        total={firstPage?.meta.total}
        loaded={listings.length}
        searchRelaxed={firstPage?.meta.searchRelaxed}
        query={filters.search}
      />

      <div className="flex flex-col">
        {listings.map((listing) => (
          <FeedCard key={listing.id} listing={toFeedCardData(listing)} />
        ))}
      </div>

      {isFetchingNextPage && (
        <div className="flex flex-col">
          {Array.from({ length: 2 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Intersection observer sentinel */}
      <div ref={sentinelRef} className="h-px" aria-hidden />
    </>
  )
}
