'use client'

import { cn } from './lib/utils'

export type FilterTab<T extends string = string> = {
  value: T
  label: string
  count?: number
}

interface FilterTabsProps<T extends string = string> {
  tabs: FilterTab<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function FilterTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: FilterTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn('flex gap-2 overflow-x-auto px-4 pb-2 pt-3', className)}
      style={{ scrollbarWidth: 'none' }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          type="button"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            // min-h-0/min-w-0 opt out of the global `min-height: var(--tap-target)`
            // that globals.css applies to every button. Without them these pills
            // render ~48px tall, visibly larger than the identical pills on
            // /explorar, which do opt out. See CLAUDE.md §11 (Padrões de UI).
            'min-h-0 min-w-0 shrink-0 whitespace-nowrap rounded-full px-[14px] py-[7px] text-[12px] transition-colors',
            value === tab.value
              ? 'bg-cta-bg text-cta-fg font-medium'
              : 'bg-muted text-fg-secondary hover:text-foreground',
          )}
        >
          {tab.label}
          {tab.count !== undefined && <span className="ml-1 opacity-70">{tab.count}</span>}
        </button>
      ))}
    </div>
  )
}
