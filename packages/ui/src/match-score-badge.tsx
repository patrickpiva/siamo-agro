import { Star } from 'lucide-react'
import { cn } from './lib/utils'

export interface MatchScoreBadgeProps {
  score: number // 0–100 integer
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

type Tier = 'high' | 'medium' | 'low'

function getTier(score: number): Tier {
  if (score >= 80) return 'high'
  if (score >= 60) return 'medium'
  return 'low'
}

const TIER_CLASS: Record<Tier, string> = {
  high: 'match-badge-high',
  medium: 'match-badge-medium',
  low: 'match-badge-low',
}

export function MatchScoreBadge({
  score,
  size = 'md',
  showLabel = true,
  className,
}: MatchScoreBadgeProps) {
  const tier = getTier(score)
  const display = Math.round(score)
  const starSize = size === 'md' ? 9 : 8

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full',
        size === 'md' ? 'px-[9px] py-[3px]' : 'px-[7px] py-[2px]',
        TIER_CLASS[tier],
        className,
      )}
      aria-label={`Score de match: ${display} de 100`}
    >
      <Star size={starSize} fill="currentColor" strokeWidth={0} />
      <span className="font-mono text-[12px] font-medium leading-none">{display}</span>
      {showLabel && <span className="text-[9px] leading-none tracking-[0.3px]">MATCH</span>}
    </div>
  )
}
