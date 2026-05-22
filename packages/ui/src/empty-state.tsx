'use client'

import type { ReactNode } from 'react'
import { cn } from './lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmptyStateAction = {
  label: string
  variant: 'primary' | 'secondary'
  href?: string
  onClick?: () => void
}

export type EmptyStateHint = {
  label: string
  onClick?: () => void
}

export interface EmptyStateProps {
  icon: ReactNode
  /** lime — estados positivos/esperançosos. muted — neutros/transitórios. */
  iconVariant?: 'lime' | 'muted'
  title: string
  description: string
  actions?: EmptyStateAction[]
  hints?: EmptyStateHint[]
  className?: string
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  iconVariant = 'muted',
  title,
  description,
  actions = [],
  hints = [],
  className,
}: EmptyStateProps) {
  const iconClass = iconVariant === 'lime' ? 'empty-icon-lime' : 'empty-icon-muted'

  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center px-8 py-10 text-center',
        className,
      )}
    >
      <div
        className={cn('mb-5 flex size-[72px] items-center justify-center rounded-full', iconClass)}
      >
        {icon}
      </div>

      <p className="mb-[10px] text-[17px] font-medium">{title}</p>

      <p className="text-muted-foreground mb-6 max-w-[260px] text-[13px] leading-[1.6]">
        {description}
      </p>

      {hints.length > 0 && (
        <div className="mb-5 flex flex-wrap justify-center gap-2">
          {hints.map((hint) => (
            <button
              key={hint.label}
              type="button"
              onClick={hint.onClick}
              className={cn(
                'text-muted-foreground min-h-0 min-w-0 rounded-full px-3 py-[6px] text-[11px] transition-opacity active:opacity-70',
                'bg-muted border-border border',
              )}
            >
              {hint.label}
            </button>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {actions.map((action) => {
            const isPrimary = action.variant === 'primary'
            const className = cn(
              'min-h-0 rounded-[10px] px-4 py-[10px] text-[13px] font-medium transition-opacity active:opacity-70',
              isPrimary ? 'bg-cta-bg text-cta-fg' : 'bg-muted text-foreground border border-border',
            )

            if (action.href) {
              return (
                <a key={action.label} href={action.href} className={className}>
                  {action.label}
                </a>
              )
            }

            return (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className={className}
              >
                {action.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
