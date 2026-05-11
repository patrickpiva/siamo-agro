import { Medal } from 'lucide-react'
import { cn } from '@agrolink/ui'
import type { BadgeTier } from '@/lib/profile-mock'

interface ProfileBadgeProps {
  tier: BadgeTier
  className?: string
}

const BADGE_CONFIG: Record<BadgeTier, { label: string; className: string; show: boolean }> = {
  NONE: { label: '', className: '', show: false },
  BRONZE: {
    label: 'Bronze',
    className:
      'border-amber-700 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    show: true,
  },
  SILVER: {
    label: 'Prata',
    className:
      'border-slate-400 bg-slate-50 text-slate-600 dark:bg-slate-900/50 dark:text-slate-300',
    show: true,
  },
  GOLD: {
    label: 'Ouro',
    className:
      'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 badge-gold',
    show: true,
  },
}

export function ProfileBadge({ tier, className }: ProfileBadgeProps) {
  const config = BADGE_CONFIG[tier]
  if (!config.show) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        config.className,
        className,
      )}
    >
      <Medal className="h-3 w-3" aria-hidden="true" />
      {config.label}
    </span>
  )
}
