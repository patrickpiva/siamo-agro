'use client'

import type { ReactNode } from 'react'
import { cn } from './lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ErrorAction = {
  label: string
  icon?: ReactNode
  variant: 'primary' | 'secondary' | 'amber-mono' | 'blue-mono' | 'secondary-mono'
  href?: string
  onClick?: () => void
}

export interface ErrorScreenProps {
  code: string
  icon: ReactNode
  /** Tailwind class string for the icon wrapper — use error-icon-* utilities */
  iconVariant: 'red' | 'amber' | 'blue'
  title: string
  message: string
  /** When true: horizontal compact row layout (inline error). Default: full-screen centered. */
  compact?: boolean
  actions?: ErrorAction[]
  /** Next.js error digest + timestamp — rendered invisible but copy-able */
  errorId?: string
}

// ─── Action button ────────────────────────────────────────────────────────────

function ActionButton({ action }: { action: ErrorAction }) {
  const base = cn(
    'flex min-h-0 min-w-0 items-center justify-center gap-[6px] rounded-[12px] px-4 font-medium transition-opacity active:opacity-70',
    'py-[12px] text-[13px]',
  )

  const variants: Record<ErrorAction['variant'], string> = {
    primary: 'bg-cta-bg text-cta-fg',
    secondary: 'bg-muted text-foreground border border-border',
    'amber-mono': 'error-retry-amber font-mono text-[12px] rounded-[10px] px-3 py-[8px]',
    'blue-mono': 'error-cache-btn font-mono text-[12px] rounded-[10px] px-3 py-[8px]',
    'secondary-mono': 'bg-muted text-foreground border border-border font-mono text-[12px]',
  }

  const className = cn(base, variants[action.variant])

  if (action.href) {
    return (
      <a href={action.href} className={className}>
        {action.icon}
        {action.label}
      </a>
    )
  }

  return (
    <button type="button" onClick={action.onClick} className={className}>
      {action.icon}
      {action.label}
    </button>
  )
}

// ─── ErrorScreen ──────────────────────────────────────────────────────────────

export function ErrorScreen({
  code,
  icon,
  iconVariant,
  title,
  message,
  compact = false,
  actions = [],
  errorId,
}: ErrorScreenProps) {
  const iconWrapperClass: Record<typeof iconVariant, string> = {
    red: 'error-icon-red',
    amber: 'error-icon-amber',
    blue: 'error-icon-blue',
  }

  if (compact) {
    return (
      <div className="px-6 py-4" role="main" aria-labelledby="error-title">
        <div className="flex items-center gap-[14px]">
          <div
            className={cn(
              'flex size-[48px] shrink-0 items-center justify-center rounded-full',
              iconWrapperClass[iconVariant],
            )}
          >
            {icon}
          </div>
          <div className="flex-1">
            <p className="text-muted-foreground mb-[3px] font-mono text-[9px] tracking-[0.8px]">
              {code}
            </p>
            <p id="error-title" className="mb-[3px] text-[14px] font-medium">
              {title}
            </p>
            <p className="text-muted-foreground text-[12px] leading-[1.4]">{message}</p>
          </div>
          {actions[0] && (
            <div className="shrink-0">
              <ActionButton action={actions[0]} />
            </div>
          )}
        </div>
        {errorId && (
          <p
            className="mt-3 select-all text-center font-mono text-[10px]"
            style={{ color: 'hsl(var(--muted-foreground) / 0.35)' }}
          >
            {errorId}
          </p>
        )}
      </div>
    )
  }

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center"
      role="main"
      aria-labelledby="error-title"
    >
      <div
        className={cn(
          'mb-4 flex size-[72px] items-center justify-center rounded-full',
          iconWrapperClass[iconVariant],
        )}
      >
        {icon}
      </div>

      <p className="text-muted-foreground mb-3 font-mono text-[10px] tracking-[1px]">{code}</p>

      <p id="error-title" className="mb-2 text-[18px] font-medium">
        {title}
      </p>

      <p className="text-muted-foreground mb-7 max-w-[280px] text-[13px] leading-[1.6]">
        {message}
      </p>

      {actions.length > 0 && (
        <div className="flex w-full gap-2">
          {actions.map((action) => (
            <div key={action.label} className="flex-1">
              <ActionButton action={action} />
            </div>
          ))}
        </div>
      )}

      {errorId && (
        <p
          className="mt-6 select-all font-mono text-[10px]"
          style={{ color: 'hsl(var(--muted-foreground) / 0.35)' }}
        >
          {errorId}
        </p>
      )}
    </div>
  )
}
