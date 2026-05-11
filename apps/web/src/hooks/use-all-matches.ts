'use client'

import { useQueries } from '@tanstack/react-query'
import { fetchMatches } from '@/lib/matches-api'
import type { MatchResult } from '@/lib/matches-api'

export interface ActiveListing {
  id: string
  kind: string
  category: string
  title: string
}

export interface UseAllMatchesResult {
  matches: (MatchResult & { fromListingId: string; fromListingTitle: string })[]
  processing: boolean
  isLoading: boolean
}

export function useAllMatches(listings: ActiveListing[]): UseAllMatchesResult {
  const results = useQueries({
    queries: listings.map((l) => ({
      queryKey: ['matches', l.id],
      queryFn: () => fetchMatches(l.id),
      staleTime: 0,
      refetchOnWindowFocus: false,
    })),
  })

  const isLoading = results.some((r) => r.isLoading)
  const processing = results.some((r) => r.data?.processing === true)

  const matches = results.flatMap((r, i) => {
    if (!r.data || r.data.processing) return []
    const listing = listings[i]
    if (!listing) return []
    return r.data.data.map((m) => ({
      ...m,
      fromListingId: listing.id,
      fromListingTitle: listing.title,
    }))
  })

  matches.sort((a, b) => b.score - a.score)

  return { matches, processing, isLoading }
}
