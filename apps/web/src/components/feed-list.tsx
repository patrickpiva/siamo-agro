'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ListingCard, ListingCardSkeleton } from '@agrolink/ui'
import type { ListingCardData } from '@agrolink/ui'
import type { FetchListingsQuery, Listing } from '@/lib/api'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

interface FeedListResponse {
  data: Listing[]
  meta: { nextCursor: string | null; limit: number }
  error: null
}

async function fetchPage(
  query: FetchListingsQuery & { cursor?: string },
): Promise<FeedListResponse> {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== '') params.set(k, String(v))
  }
  const res = await fetch(`${API_URL}/api/v1/listings?${params.toString()}`)
  if (!res.ok) throw new Error('Erro ao buscar anúncios')
  return res.json() as Promise<FeedListResponse>
}

function toCardData(listing: Listing): ListingCardData {
  return {
    id: listing.id,
    kind: listing.kind,
    category: listing.category,
    title: listing.title,
    price: listing.price,
    photos: listing.photos,
    profile: listing.profile,
    createdAt: listing.createdAt,
  }
}

interface FeedListProps {
  filters: FetchListingsQuery
}

export function FeedList({ filters }: FeedListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
    queryKey: ['listings', filters],
    queryFn: ({ pageParam }) => fetchPage({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor ?? undefined,
  })

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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
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

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <span className="text-6xl">🌾</span>
        <p className="text-lg font-semibold">Nenhum anúncio encontrado</p>
        <p className="text-muted-foreground max-w-xs text-sm">
          Seja o primeiro a anunciar nessa categoria ou ajuste os filtros.
        </p>
        <Link
          href="/anuncio/novo"
          className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium"
        >
          Criar primeiro anúncio
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={toCardData(listing)} />
        ))}
      </div>

      {isFetchingNextPage && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Intersection observer sentinel */}
      <div ref={sentinelRef} className="h-px" aria-hidden />
    </>
  )
}
