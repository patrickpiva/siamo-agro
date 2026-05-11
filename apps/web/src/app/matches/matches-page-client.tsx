'use client'

import { useState } from 'react'
import { useMatches } from '@/hooks/use-matches'
import { MatchCard } from '@/components/match-card'
import type { ActiveListing } from '@/hooks/use-all-matches'

interface MatchesPageClientProps {
  listings: ActiveListing[]
}

export function MatchesPageClient({ listings }: MatchesPageClientProps) {
  const [selectedId, setSelectedId] = useState(listings[0]?.id ?? '')

  return (
    <div className="space-y-6">
      {/* Listing selector */}
      {listings.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {listings.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setSelectedId(l.id)}
              className={[
                'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                selectedId === l.id
                  ? 'bg-primary text-primary-foreground'
                  : 'border-border bg-muted text-foreground border',
              ].join(' ')}
            >
              {l.title}
            </button>
          ))}
        </div>
      )}

      {selectedId && <MatchesList listingId={selectedId} />}
    </div>
  )
}

function MatchesList({ listingId }: { listingId: string }) {
  const { matches, processing, isLoading, isError } = useMatches(listingId)

  if (isLoading || processing) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        <p className="text-muted-foreground text-sm">
          Calculando matches… isso pode levar alguns segundos
        </p>
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        Erro ao carregar matches. Tente novamente.
      </p>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <span className="text-4xl">🔍</span>
        <p className="font-semibold">Nenhum match encontrado</p>
        <p className="text-muted-foreground max-w-xs text-sm">
          O algoritmo está analisando perfis próximos. Tente novamente em alguns momentos.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        {matches.length} match{matches.length !== 1 ? 'es' : ''} encontrado
        {matches.length !== 1 ? 's' : ''}
      </p>
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  )
}
