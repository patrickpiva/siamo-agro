'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ListingCardSkeleton, EmptyState } from '@agraia/ui'
import { CoffeeBean } from '@agraia/ui/icons'
import { FeedCard } from '@/components/feed/feed-card'
import type { FeedCardListing } from '@/components/feed/feed-card'
import type { FetchListingsQuery, Listing } from '@/lib/api'

// ─── Response shapes ──────────────────────────────────────────────────────────

interface FeedListResponse {
  data: Listing[]
  meta: { nextCursor: string | null; limit: number }
  error: null
}

interface MatchesFeedResponse extends FeedListResponse {
  computing: boolean
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchListingsPage(
  query: FetchListingsQuery & { cursor?: string },
): Promise<FeedListResponse> {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== '') params.set(k, String(v))
  }
  const res = await fetch(`/api/proxy/listings?${params.toString()}`)
  if (!res.ok) throw new Error('Erro ao buscar anúncios')
  return res.json() as Promise<FeedListResponse>
}

async function fetchMatchesPage(cursor?: string): Promise<MatchesFeedResponse> {
  const params = new URLSearchParams()
  params.set('limit', '20')
  if (cursor) params.set('cursor', cursor)
  const res = await fetch(`/api/proxy/me/feed/matches?${params.toString()}`, {
    credentials: 'include',
  })
  if (res.status === 401) {
    return { data: [], meta: { nextCursor: null, limit: 20 }, computing: false, error: null }
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
    return { data: [], meta: { nextCursor: null, limit: 20 }, error: null }
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

// ─── Component ────────────────────────────────────────────────────────────────

interface FeedListProps {
  filters: FetchListingsQuery
  activeTab?: string
}

export function FeedList({ filters, activeTab }: FeedListProps) {
  const isMatches = activeTab === 'matches'
  const isSaved = activeTab === 'saved'

  const sentinelRef = useRef<HTMLDivElement>(null)

  const { data, refetch, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: isMatches ? ['feed-matches'] : isSaved ? ['saved-listings'] : ['listings', filters],
      queryFn: ({ pageParam }) => {
        if (isMatches) return fetchMatchesPage(pageParam)
        if (isSaved) return fetchSavedPage(pageParam)
        return fetchListingsPage({ ...filters, cursor: pageParam })
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.meta.nextCursor ?? undefined,
    })

  // Refetch saved / matches whenever the tab becomes active
  useEffect(() => {
    if (isMatches || isSaved) void refetch()
  }, [isMatches, isSaved])

  // Listen for same-page unsave events (saved tab only)
  useEffect(() => {
    if (!isSaved) return
    const handler = () => void refetch()
    window.addEventListener('agraia:bookmark-toggled', handler)
    return () => window.removeEventListener('agraia:bookmark-toggled', handler)
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

  if (listings.length === 0) {
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

  return (
    <>
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
