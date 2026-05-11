'use client'

import { useMatches } from '@/hooks/use-matches'
import { MatchCard } from './match-card'

interface ListingMatchesTabProps {
  listingId: string
}

export function ListingMatchesTab({ listingId }: ListingMatchesTabProps) {
  const { matches, processing, isLoading, isError } = useMatches(listingId)

  if (isLoading || processing) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
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
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <span className="text-4xl">🔍</span>
        <p className="font-semibold">Nenhum match encontrado</p>
        <p className="text-muted-foreground max-w-xs text-sm">
          Aguarde alguns momentos — o algoritmo está analisando perfis próximos.
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
