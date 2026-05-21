import { cn } from './lib/utils'
import type { ReactNode } from 'react'

export interface SuggestionChipProps {
  label: string
  icon?: ReactNode
  onClick?: () => void
  className?: string
}

export function SuggestionChip({ label, icon, onClick, className }: SuggestionChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex min-h-0 min-w-0 items-center gap-[6px] rounded-full px-3 py-[7px]',
        'border text-[12px] transition-colors',
        'bg-card border-border text-fg-secondary hover:border-accent hover:text-accent',
        'dark:hover:border-primary dark:hover:text-primary',
        className,
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
