'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMatches } from '@/lib/matches-api'
import type { MatchResult, MatchesMeta } from '@/lib/matches-api'

const POLL_INTERVAL_MS = 3000
const MAX_POLLS = 10

export interface UseMatchesResult {
  matches: MatchResult[]
  meta: MatchesMeta | null
  processing: boolean
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

export function useMatches(listingId: string): UseMatchesResult {
  const queryClient = useQueryClient()
  const pollCount = useRef(0)
  const [polling, setPolling] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['matches', listingId],
    queryFn: () => fetchMatches(listingId),
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

  const processing = data?.processing === true

  useEffect(() => {
    if (!processing) {
      pollCount.current = 0
      setPolling(false)
      return
    }

    if (pollCount.current >= MAX_POLLS) {
      setPolling(false)
      return
    }

    setPolling(true)
    const timer = setTimeout(() => {
      pollCount.current += 1
      void queryClient.invalidateQueries({ queryKey: ['matches', listingId] })
    }, POLL_INTERVAL_MS)

    return () => clearTimeout(timer)
  }, [processing, data, listingId, queryClient])

  return {
    matches: data && !data.processing ? data.data : [],
    meta: data && !data.processing ? data.meta : null,
    processing: processing || polling,
    isLoading,
    isError,
    refetch: () => void refetch(),
  }
}
