import { cn } from './lib/utils'

export interface CollectiveProgressBarProps {
  current: number
  target: number
  className?: string
}

export function CollectiveProgressBar({ current, target, className }: CollectiveProgressBarProps) {
  const pct = Math.min(100, Math.round((current / target) * 100))
  const filled = pct === 100

  return (
    <div
      role="progressbar"
      aria-valuenow={current}
      aria-valuemax={target}
      aria-label={`${current} de ${target} participantes`}
      className={cn('bg-muted h-[8px] overflow-hidden rounded-full', className)}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all',
          filled ? 'bg-success' : 'bg-accent dark:bg-primary',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
