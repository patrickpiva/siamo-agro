import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { MatchScoreBadge } from '@agrolink/ui'
import type { MatchResult } from '@/lib/matches-api'

interface MatchCardProps {
  match: MatchResult
  className?: string
}

const KIND_LABELS: Record<string, string> = {
  OFFER: 'Oferta',
  DEMAND: 'Demanda',
  SERVICE: 'Serviço',
  EQUIPMENT: 'Equipamento',
}

export function MatchCard({ match, className }: MatchCardProps) {
  const { candidate, bestListing, score, distanceKm } = match

  return (
    <Link
      href={`/perfil/${candidate.id}` as Route}
      className={[
        'border-border bg-card hover:bg-muted flex flex-col gap-3 rounded-xl border p-4 transition-colors',
        className ?? '',
      ].join(' ')}
    >
      {/* Header: avatar + name + score */}
      <div className="flex items-center gap-3">
        <div className="bg-muted relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
          {candidate.photo && (
            <Image
              src={candidate.photo}
              alt={candidate.name}
              fill
              sizes="44px"
              className="object-cover"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{candidate.name}</p>
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            {candidate.rating != null && (
              <span className="text-amber-500">★ {candidate.rating.toFixed(1)}</span>
            )}
            {candidate.city && (
              <span>
                {candidate.city}
                {candidate.state ? `, ${candidate.state}` : ''}
              </span>
            )}
          </div>
        </div>

        <MatchScoreBadge score={score * 100} size="sm" />
      </div>

      {/* Best listing */}
      {bestListing && (
        <div className="bg-muted rounded-lg px-3 py-2 text-sm">
          <span className="text-muted-foreground text-xs">
            {KIND_LABELS[bestListing.kind] ?? bestListing.kind} ·{' '}
          </span>
          <span className="font-medium">{bestListing.title}</span>
        </div>
      )}

      {/* Distance */}
      {distanceKm != null && (
        <p className="text-muted-foreground text-xs">
          {distanceKm < 1
            ? `${Math.round(distanceKm * 1000)} m de distância`
            : `${distanceKm.toFixed(1)} km de distância`}
        </p>
      )}
    </Link>
  )
}
