'use client'

import { cn } from './lib/utils'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterChipGroupProps {
  options: FilterOption[]
  value: string | string[]
  onChange: (value: string | string[]) => void
  multiple?: boolean
  className?: string
}

export function FilterChipGroup({
  options,
  value,
  onChange,
  multiple = false,
  className,
}: FilterChipGroupProps) {
  const selected = Array.isArray(value) ? value : [value]

  function toggle(v: string) {
    if (multiple) {
      const next = selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]
      onChange(next)
    } else {
      onChange(v)
    }
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((opt) => {
        const active = selected.includes(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={cn(
              'min-h-0 min-w-0 rounded-full px-[14px] py-2 text-[12px] transition-colors',
              active
                ? 'border-accent dark:border-primary text-accent dark:text-primary bg-primary-subtle border-[1.5px] font-medium'
                : 'border-border text-fg-secondary hover:border-accent hover:text-accent dark:hover:border-primary dark:hover:text-primary bg-card border',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
