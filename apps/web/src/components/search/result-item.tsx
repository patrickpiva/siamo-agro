import Link from 'next/link'
import Image from 'next/image'
import { CATEGORY_ICONS } from '@siamo/ui/icons'
import { MatchScoreBadge } from '@siamo/ui'
import { cn } from '@siamo/ui'

export interface ResultItemData {
  id: string
  title: string
  price: number | null
  distanceKm?: number | null
  publishedAt: Date | string
  matchScore: number
  owner: { name: string; reputationScore?: number | null }
  thumbnail?: string | null
  category?: string
}

function relativeDate(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'agora'
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const CATEGORY_BG: Record<string, string> = {
  COFFEE: 'bg-[#D4B896] dark:bg-[#3d2817]',
  CORN: 'bg-[#C8D4B8] dark:bg-[#2d4a2a]',
  SOY: 'bg-[#C8B888] dark:bg-[#4a4220]',
  LIVESTOCK: 'bg-[#C8D0B8] dark:bg-[#2d3a1a]',
}

export function ResultItem({ item }: { item: ResultItemData }) {
  const CategoryIcon = item.category
    ? CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS]
    : null
  const bgClass = item.category ? (CATEGORY_BG[item.category] ?? 'bg-muted') : 'bg-muted'

  return (
    <Link
      href={`/anuncio/${item.id}`}
      className="bg-card border-border flex gap-3 rounded-[14px] border p-3 transition-shadow hover:shadow-sm"
    >
      {/* Thumb */}
      <div
        className={cn(
          'relative size-[72px] shrink-0 overflow-hidden rounded-[10px]',
          !item.thumbnail && bgClass,
        )}
      >
        {item.thumbnail ? (
          <Image src={item.thumbnail} alt={item.title} fill className="object-cover" sizes="72px" />
        ) : (
          CategoryIcon && (
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <CategoryIcon size={28} strokeWidth={1.5} className="text-foreground" />
            </div>
          )
        )}
        {/* Match badge — overlapping corner */}
        <div className="absolute -bottom-[6px] -right-[6px]">
          <MatchScoreBadge score={item.matchScore} size="sm" showLabel={false} />
        </div>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-foreground mb-1 text-[13px] font-medium leading-[1.3]">{item.title}</p>
        {item.price != null ? (
          <p className="text-accent dark:text-primary mb-1 font-mono text-[12px] font-medium">
            {formatBRL(item.price)}
          </p>
        ) : (
          <p className="text-muted-foreground mb-1 font-mono text-[12px]">A combinar</p>
        )}
        <div className="text-muted-foreground flex flex-wrap items-center gap-[6px] text-[11px]">
          <span>
            {item.owner.name}
            {item.owner.reputationScore != null && ` ★${item.owner.reputationScore.toFixed(1)}`}
          </span>
          {item.distanceKm != null && (
            <>
              <span className="bg-muted-foreground size-[3px] rounded-full" />
              <span>{item.distanceKm} km</span>
            </>
          )}
          <span className="bg-muted-foreground size-[3px] rounded-full" />
          <span>{relativeDate(item.publishedAt)}</span>
        </div>
      </div>
    </Link>
  )
}
