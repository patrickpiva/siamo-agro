'use client'

import Link from 'next/link'
import { useAllMatches } from '@/hooks/use-all-matches'
import { MatchCard } from './match-card'
import type { ActiveListing } from '@/hooks/use-all-matches'

interface MatchesCarouselProps {
  listings: ActiveListing[]
}

export function MatchesCarousel({ listings }: MatchesCarouselProps) {
  const { matches, processing, isLoading } = useAllMatches(listings)

  if (listings.length === 0) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Matches para você</h2>
        <Link href="/matches" className="text-primary text-sm font-medium hover:underline">
          Ver todos
        </Link>
      </div>

      {isLoading || processing ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
          <p className="text-muted-foreground text-sm">
            Calculando matches… isso pode levar alguns segundos
          </p>
        </div>
      ) : matches.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">
          Nenhum match encontrado ainda. Tente novamente mais tarde.
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {matches.slice(0, 10).map((match) => (
            <div key={match.id} className="w-64 shrink-0">
              <MatchCard match={match} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
