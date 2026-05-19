'use client'

import { cn } from './lib/utils'

interface ProgressIndicatorProps {
  current: number
  total: number
  className?: string
}

/**
 * ProgressIndicator — barra de progresso do onboarding.
 * Mostra [PASSO X DE Y] em mono + barra lime 3px.
 */
export function ProgressIndicator({ current, total, className }: ProgressIndicatorProps) {
  const percent = Math.round((current / total) * 100)

  return (
    <div className={cn('px-5 pb-8', className)}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-accent-forest dark:text-accent-lime font-mono text-[11px] tracking-[0.3px]">
          [PASSO {current} DE {total}]
        </span>
        <span className="text-muted-foreground text-[11px]">{percent}%</span>
      </div>
      <div className="bg-border h-[3px] overflow-hidden rounded-full">
        <div
          className="bg-accent-forest dark:bg-accent-lime h-full rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
