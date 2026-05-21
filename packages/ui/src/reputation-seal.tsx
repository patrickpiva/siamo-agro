import { Star } from 'lucide-react'
import { cn } from './lib/utils'

type SealTier = 'GOLD' | 'SILVER' | 'BRONZE'

interface ReputationSealProps {
  tier: SealTier
  className?: string
}

const LABEL: Record<SealTier, string> = {
  GOLD: 'OURO',
  SILVER: 'PRATA',
  BRONZE: 'BRONZE',
}

const TIER_CLASS: Record<SealTier, string> = {
  GOLD: 'bg-[#f0f7d9] border-[#c6e845] text-[#1f5f3f] dark:bg-[rgba(198,232,69,0.12)] dark:border-[rgba(198,232,69,0.3)] dark:text-[#c6e845]',
  SILVER:
    'bg-[#f0f0ef] border-[#a8a8a8] text-[#6a6a62] dark:bg-[rgba(168,168,168,0.18)] dark:border-[rgba(168,168,168,0.3)] dark:text-[#a8a8a8]',
  BRONZE:
    'bg-[#fdf0e8] border-[#d4956a] text-[#8b5c38] dark:bg-[rgba(212,149,106,0.15)] dark:border-[rgba(212,149,106,0.3)] dark:text-[#d4956a]',
}

export function ReputationSeal({ tier, className }: ReputationSealProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[6px] rounded-[20px] border px-3 py-1',
        TIER_CLASS[tier],
        className,
      )}
      aria-label={`Selo de reputação ${LABEL[tier]}`}
    >
      <Star size={11} fill="currentColor" strokeWidth={0} />
      <span className="font-mono text-[11px] font-medium tracking-[0.5px]">{LABEL[tier]}</span>
    </span>
  )
}
