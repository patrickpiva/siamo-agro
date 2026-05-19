'use client'

import * as React from 'react'
import { cn } from './lib/utils'

interface SelectCardProps {
  title: string
  description?: string
  icon?: React.ReactNode
  selected?: boolean
  onSelect?: () => void
  disabled?: boolean
}

/**
 * SelectCard — cartão de seleção (radio visual) para onboarding.
 * Estado active: borda lime 1.5px + fundo lime/6.
 * Acessibilidade: role="radio" + aria-checked.
 */
export function SelectCard({
  title,
  description,
  icon,
  selected = false,
  onSelect,
  disabled = false,
}: SelectCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'rounded-card flex w-full items-center gap-3.5 border p-[18px] text-left transition-all',
        'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        'disabled:pointer-events-none disabled:opacity-50',
        selected
          ? 'border-accent-forest dark:border-accent-lime bg-primary-subtle dark:bg-accent-lime/[0.06] border-[1.5px]'
          : 'border-border bg-bg-surface hover:bg-bg-elevated',
      )}
    >
      {/* Ícone */}
      {icon && (
        <div
          className={cn(
            'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[12px] transition-colors',
            selected
              ? 'bg-accent-lime text-foreground dark:bg-accent-lime/15 dark:text-accent-lime'
              : 'bg-bg-elevated text-foreground',
          )}
        >
          {icon}
        </div>
      )}

      {/* Conteúdo */}
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[15px] font-medium leading-tight">{title}</p>
        {description && <p className="text-muted-foreground text-xs leading-snug">{description}</p>}
      </div>

      {/* Radio visual */}
      <div
        style={{ width: 22, height: 22, flexShrink: 0 }}
        className={cn(
          'flex items-center justify-center rounded-full border transition-colors',
          selected
            ? 'border-accent-forest dark:border-accent-lime border-[1.5px]'
            : 'border-muted-foreground/30 border',
        )}
      >
        {selected && (
          <div
            style={{ width: 10, height: 10 }}
            className="bg-accent-forest dark:bg-accent-lime rounded-full"
          />
        )}
      </div>
    </button>
  )
}
