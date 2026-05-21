'use client'

import { cn } from './lib/utils'

type StateBannerVariant = 'proposed' | 'accepted' | 'in-progress' | 'completed'

interface StateBannerProps {
  variant: StateBannerVariant
  children: React.ReactNode
  className?: string
}

const VARIANT_CLASS: Record<StateBannerVariant, string> = {
  proposed: 'state-proposed',
  accepted: 'state-accepted',
  'in-progress': 'state-in-progress',
  completed: 'state-completed',
}

const DOT_CLASS: Record<StateBannerVariant, string> = {
  proposed: 'dot-proposed',
  accepted: 'dot-accepted',
  'in-progress': 'dot-in-progress',
  completed: 'dot-completed',
}

export function StateBanner({ variant, children, className }: StateBannerProps) {
  const isPulsing = variant === 'in-progress'
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-[10px] px-4 py-2 text-[12px] font-medium',
        VARIANT_CLASS[variant],
        className,
      )}
    >
      <div
        className={cn(
          'size-2 shrink-0 rounded-full',
          DOT_CLASS[variant],
          isPulsing && 'animate-pulse',
        )}
        aria-hidden
      />
      {children}
    </div>
  )
}
