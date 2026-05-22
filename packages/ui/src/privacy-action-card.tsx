import type { ReactNode } from 'react'
import { ChevronRight } from './icons/index'
import { cn } from './lib/utils'

interface PrivacyActionCardProps {
  icon: ReactNode
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  variant?: 'default' | 'danger'
  className?: string
}

export function PrivacyActionCard({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
  className,
}: PrivacyActionCardProps) {
  const isDanger = variant === 'danger'

  return (
    <div
      className={cn(
        'bg-card rounded-[14px] border p-4',
        isDanger ? 'border-destructive/25 bg-destructive/5' : 'border-border',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex size-[40px] flex-shrink-0 items-center justify-center rounded-[12px]',
            isDanger ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground',
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-[14px] font-medium',
              isDanger ? 'text-destructive' : 'text-foreground',
            )}
          >
            {title}
          </p>
          <p className="text-muted-foreground mt-1 text-[12px] leading-[1.5]">{description}</p>
          <button
            type="button"
            onClick={onAction}
            className={cn(
              'mt-3 flex items-center gap-1 text-[13px] font-medium',
              isDanger ? 'text-destructive' : 'text-primary dark:text-primary',
            )}
          >
            {actionLabel}
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}
