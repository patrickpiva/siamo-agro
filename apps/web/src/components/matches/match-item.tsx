import Link from 'next/link'
import Image from 'next/image'
import { MapPin } from '@agraia/ui/icons'
import { MatchScoreBadge } from '@agraia/ui'
import { Star } from '@agraia/ui/icons'
import { cn } from '@agraia/ui'

export interface MatchItemData {
  id: string
  counterListing: {
    id: string
    title: string
    price: number | null
    kind: string
    thumbnail?: string | null
    category?: string
  }
  score: number
  distanceKm: number
  reasonLabel: string
  reasonTier: 'positive' | 'neutral' | 'negative'
  owner: { name: string; reputationSeal?: string | null }
}

const SEAL_LABEL: Record<string, string> = {
  GOLD: 'OURO',
  SILVER: 'PRATA',
  BRONZE: 'BRONZE',
}

const REASON_COLOR: Record<string, string> = {
  positive: 'text-accent dark:text-primary',
  neutral: 'text-warning',
  negative: 'text-muted-foreground',
}

const REASON_STAR_FILL: Record<string, string> = {
  positive: 'fill-accent dark:fill-primary',
  neutral: 'fill-warning',
  negative: 'fill-muted-foreground',
}

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function MatchItem({ match }: { match: MatchItemData }) {
  const seal = match.owner.reputationSeal ? SEAL_LABEL[match.owner.reputationSeal] : null
  const reasonColor = REASON_COLOR[match.reasonTier]
  const reasonStarFill = REASON_STAR_FILL[match.reasonTier]

  return (
    <Link
      href={`/match/${match.id}`}
      className="bg-card border-border mx-4 mb-[10px] flex gap-3 rounded-[14px] border p-3 transition-shadow hover:shadow-sm"
    >
      {/* Thumb */}
      <div className="bg-muted relative size-[64px] shrink-0 overflow-hidden rounded-[10px]">
        {match.counterListing.thumbnail && (
          <Image
            src={match.counterListing.thumbnail}
            alt={match.counterListing.title}
            fill
            className="object-cover"
            sizes="64px"
          />
        )}
        <div className="absolute -bottom-1 -right-1">
          <MatchScoreBadge score={match.score} size="sm" showLabel={false} />
        </div>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="mb-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium">
          {match.counterListing.title}
        </p>
        {match.counterListing.price != null ? (
          <p className="text-accent dark:text-primary mb-[5px] font-mono text-[12px] font-medium">
            {formatBRL(match.counterListing.price)}
          </p>
        ) : (
          <p className="text-muted-foreground mb-[5px] font-mono text-[12px]">A combinar</p>
        )}
        <div className="text-muted-foreground mb-[6px] flex items-center gap-[5px] text-[11px]">
          <MapPin size={10} strokeWidth={2} />
          <span>
            {match.owner.name}
            {seal && ` · ${seal}`}
            {` · ${match.distanceKm} km`}
          </span>
        </div>
        <div className={cn('flex items-center gap-1 text-[10px] italic', reasonColor)}>
          <Star size={10} strokeWidth={0} className={reasonStarFill} />
          <span>{match.reasonLabel}</span>
        </div>
      </div>
    </Link>
  )
}
