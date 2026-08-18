import Link from 'next/link'
import Image from 'next/image'
import { CATEGORY_ICONS, Star } from '@siamo/ui/icons'
import { cn } from '@siamo/ui'
import type { Opportunity } from '@/lib/home-state'

const CATEGORY_BG: Record<string, string> = {
  COFFEE: 'bg-[#D4B896] dark:bg-[#3d2817]',
  CORN: 'bg-[#C8D4B8] dark:bg-[#2d4a2a]',
  SOY: 'bg-[#C8B888] dark:bg-[#4a4220]',
  LIVESTOCK: 'bg-[#C8D0B8] dark:bg-[#2d3a1a]',
  DAIRY: 'bg-[#C8D0B8] dark:bg-[#2d3a1a]',
  TRACTOR: 'bg-[#D8D8E8] dark:bg-[#2a2a3a]',
  HARVESTER: 'bg-[#D8D8E8] dark:bg-[#2a2a3a]',
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Card compacto de match para a seção "Oportunidades perto" da Home. */
export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const pct = Math.round(opportunity.matchScore * 100)
  const Icon = CATEGORY_ICONS[opportunity.category as keyof typeof CATEGORY_ICONS]
  const bg = CATEGORY_BG[opportunity.category] ?? 'bg-muted'
  const meta = [
    opportunity.price != null ? `até ${formatBRL(opportunity.price)}` : 'a combinar',
    opportunity.distanceKm != null ? `${Math.round(opportunity.distanceKm)} km` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link
      href={`/anuncio/${opportunity.listingId}`}
      aria-label={`${opportunity.title} · ${pct}% de compatibilidade`}
      className="bg-card border-border mx-4 mb-[10px] flex overflow-hidden rounded-[16px] border"
    >
      <div className={cn('relative w-[90px] shrink-0', !opportunity.thumbnailUrl && bg)}>
        {opportunity.thumbnailUrl ? (
          <Image
            src={opportunity.thumbnailUrl}
            alt={opportunity.title}
            fill
            className="object-cover"
            sizes="90px"
          />
        ) : (
          Icon && (
            <div className="absolute inset-0 flex items-center justify-center opacity-40">
              <Icon size={28} strokeWidth={1.5} className="text-foreground" />
            </div>
          )
        )}
      </div>
      <div className="min-w-0 flex-1 px-[14px] py-3">
        <span className="bg-primary-subtle text-accent dark:text-primary mb-[6px] inline-flex items-center gap-1 rounded-[5px] px-[7px] py-[2px] font-mono text-[9px]">
          <Star size={9} fill="currentColor" strokeWidth={0} /> {pct}% MATCH
        </span>
        <p className="mb-1 truncate text-[14px] font-medium leading-[1.25]">{opportunity.title}</p>
        <p className="text-muted-foreground font-mono text-[11px]">{meta}</p>
      </div>
    </Link>
  )
}
