import Link from 'next/link'
import Image from 'next/image'
import { MapPin } from '@agrolink/ui/icons'
import { CATEGORY_ICONS } from '@agrolink/ui/icons'
import { MatchScoreBadge } from '@agrolink/ui'
import { cn } from '@agrolink/ui'

export interface FeedCardListing {
  id: string
  kind: string
  category: string
  title: string
  price: number | null
  priceUnit?: string
  thumbnail?: string | null
  location: { city: string | null; state: string | null }
  distanceKm?: number | null
  publishedAt: Date | string
  owner: {
    name: string
    reputationScore?: number | null
    reputationSeal?: string | null
  }
  matchScore?: number
}

const KIND_LABEL: Record<string, string> = {
  OFFER: 'OFERTA',
  DEMAND: 'DEMANDA',
  SERVICE: 'SERVIÇO',
  EQUIPMENT: 'EQUIP.',
}

const CATEGORY_BG: Record<string, string> = {
  COFFEE: 'bg-[#D4B896] dark:bg-[#3d2817]',
  CORN: 'bg-[#C8D4B8] dark:bg-[#2d4a2a]',
  SOY: 'bg-[#C8B888] dark:bg-[#4a4220]',
  LIVESTOCK: 'bg-[#C8D0B8] dark:bg-[#2d3a1a]',
  DAIRY: 'bg-[#C8D0B8] dark:bg-[#2d3a1a]',
  TRACTOR: 'bg-[#D8D8E8] dark:bg-[#2a2a3a]',
  HARVESTER: 'bg-[#D8D8E8] dark:bg-[#2a2a3a]',
}

const SEAL_LABEL: Record<string, string> = {
  GOLD: 'OURO',
  SILVER: 'PRATA',
  BRONZE: 'BRONZE',
}

function relativeDate(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'agora'
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function FeedCard({ listing }: { listing: FeedCardListing }) {
  const CategoryIcon = CATEGORY_ICONS[listing.category as keyof typeof CATEGORY_ICONS]
  const categoryBg = CATEGORY_BG[listing.category] ?? 'bg-muted'
  const kindLabel = KIND_LABEL[listing.kind] ?? listing.kind
  const isEquip = listing.kind === 'EQUIPMENT'
  const seal = listing.owner.reputationSeal ? SEAL_LABEL[listing.owner.reputationSeal] : null

  return (
    <Link
      href={`/anuncio/${listing.id}`}
      className={cn(
        'bg-card border-border block overflow-hidden rounded-[16px] border transition-shadow hover:shadow-md',
        'mx-4 mb-3',
      )}
      role="article"
      aria-label={`${listing.title}${listing.matchScore ? ` · ${listing.matchScore}% de compatibilidade` : ''}${listing.distanceKm ? ` · ${listing.distanceKm} km` : ''}`}
    >
      {/* Thumbnail */}
      <div className={cn('relative h-[140px]', !listing.thumbnail && categoryBg)}>
        {listing.thumbnail ? (
          <Image
            src={listing.thumbnail}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="(max-width: 400px) 100vw, 360px"
          />
        ) : (
          CategoryIcon && (
            <div className="absolute inset-0 flex items-center justify-center opacity-40">
              <CategoryIcon size={48} strokeWidth={1.5} className="text-foreground" />
            </div>
          )
        )}

        {/* Kind pill — top left */}
        <span
          className={cn(
            'absolute left-[10px] top-[10px] rounded-[3px] px-[6px] py-[2px] font-mono text-[9px] font-medium tracking-[0.3px]',
            isEquip
              ? 'bg-muted text-fg-secondary'
              : 'bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground',
          )}
        >
          {kindLabel}
        </span>

        {/* Distance — top right */}
        {listing.distanceKm != null && (
          <span className="absolute right-[10px] top-[10px] flex items-center gap-1 rounded-[5px] bg-black/75 px-2 py-1 font-mono text-[11px] text-white">
            <MapPin size={10} strokeWidth={2} />
            {listing.distanceKm} km
          </span>
        )}

        {/* Match score — bottom right */}
        {listing.matchScore != null && (
          <div className="absolute bottom-[10px] right-[10px]">
            <MatchScoreBadge score={listing.matchScore} size="md" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-[14px] pb-[14px] pt-3">
        {/* Category */}
        <div className="mb-1 flex items-center gap-[6px]">
          {CategoryIcon && (
            <CategoryIcon size={14} strokeWidth={1.8} className="text-accent dark:text-primary" />
          )}
          <span className="bg-primary-subtle border-primary text-accent dark:text-primary rounded-[4px] border-[0.5px] px-[7px] py-[2px] text-[10px] font-medium">
            {listing.category}
          </span>
        </div>

        {/* Title */}
        <p className="mb-[6px] text-[15px] font-medium leading-[1.3]">{listing.title}</p>

        {/* Price */}
        {listing.price != null ? (
          <p className="text-accent dark:text-primary font-mono text-[14px] font-medium">
            {formatBRL(listing.price)}
            {listing.priceUnit && (
              <span className="text-muted-foreground ml-1 text-[11px] font-normal">
                /{listing.priceUnit}
              </span>
            )}
          </p>
        ) : (
          <p className="text-muted-foreground font-mono text-[14px]">A combinar</p>
        )}

        {/* Seller row */}
        <div className="border-border mt-[10px] flex items-center gap-2 border-t pt-[10px]">
          <div className="bg-accent flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-medium text-white">
            {listing.owner.name.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-fg-secondary flex-1 truncate text-[12px]">
            {listing.owner.name}
            {listing.owner.reputationScore != null && (
              <span className="text-accent dark:text-primary ml-1 font-medium">
                · ★ {listing.owner.reputationScore.toFixed(1)}
                {seal && ` ${seal}`}
              </span>
            )}
          </span>
          <span className="text-muted-foreground font-mono text-[10px]">
            {relativeDate(listing.publishedAt)}
          </span>
        </div>
      </div>
    </Link>
  )
}
