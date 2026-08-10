import Link from 'next/link'
import { Star } from '@siamo/ui/icons'
import { getInitials } from '@siamo/ui'
import type { ListingProfile } from '@/lib/api'

const BADGE_LABELS: Record<string, string> = {
  GOLD: 'OURO',
  SILVER: 'PRATA',
  BRONZE: 'BRONZE',
}

interface SellerCardProps {
  profile: ListingProfile & {
    rating?: number | null
    reviewCount?: number
    transactionCount?: number
    responseTime?: string
    yearsActive?: number
  }
}

export function SellerCard({ profile }: SellerCardProps) {
  const initials = getInitials(profile.name)

  return (
    <Link href={profile.id ? `/perfil/${profile.id}` : '#'} className="block">
      <div className="bg-card border-border mb-4 rounded-[14px] border px-4 py-[14px]">
        {/* Top row */}
        <div className="mb-[14px] flex items-center gap-3">
          {/* Avatar */}
          <div className="bg-accent text-accent-foreground flex size-[44px] flex-shrink-0 items-center justify-center rounded-full text-[14px] font-medium">
            {profile.photo ? (
              <img
                src={profile.photo}
                alt={profile.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          {/* Name + badge + rating */}
          <div className="min-w-0 flex-1">
            <div className="mb-[3px] flex items-center gap-2">
              <span className="truncate text-[13px] font-medium">{profile.name}</span>
              {profile.badge && profile.badge !== 'NONE' && (
                <span className="bg-accent text-accent-foreground rounded-[4px] px-[7px] py-[2px] font-mono text-[9px] font-medium tracking-[0.4px]">
                  {BADGE_LABELS[profile.badge] ?? profile.badge}
                </span>
              )}
            </div>
            {profile.rating !== undefined && profile.rating !== null && profile.rating > 0 && (
              <div className="text-fg-secondary flex items-center gap-[6px] text-[11px]">
                <Star size={11} strokeWidth={0} fill="currentColor" className="text-accent" />
                <span>{profile.rating.toFixed(1)}</span>
                {profile.reviewCount !== undefined && profile.reviewCount > 0 && (
                  <span>
                    · {profile.reviewCount} {profile.reviewCount === 1 ? 'avaliação' : 'avaliações'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="border-border grid grid-cols-3 gap-[10px] border-t pt-3">
          <StatCell value={String(profile.transactionCount ?? '—')} label="transações" />
          <StatCell value={profile.responseTime ?? '—'} label="resposta" />
          <StatCell
            value={profile.yearsActive ? `${profile.yearsActive} anos` : '—'}
            label="no AgraIA"
          />
        </div>
      </div>
    </Link>
  )
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="mb-[2px] font-mono text-[14px] font-medium">{value}</div>
      <div className="text-muted-foreground text-[10px] leading-snug">{label}</div>
    </div>
  )
}
