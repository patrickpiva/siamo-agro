'use client'

import { Search, X } from 'lucide-react'
import { cn } from './lib/utils'

export interface SearchBarProps {
  value: string
  onChange: (v: string) => void
  onSubmit: (v: string) => void
  onClear: () => void
  focused?: boolean
  placeholder?: string
  className?: string
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  focused,
  placeholder = 'Buscar anúncios',
  className,
}: SearchBarProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-[10px] rounded-[12px] px-4 py-3 transition-colors',
        'bg-card border',
        focused ? 'border-accent dark:border-primary border-[1.5px]' : 'border-border',
        className,
      )}
    >
      <Search
        size={18}
        strokeWidth={1.8}
        className={cn(
          'shrink-0',
          focused ? 'text-accent dark:text-primary' : 'text-muted-foreground',
        )}
      />
      <input
        type="text"
        role="searchbox"
        aria-label="Buscar anúncios"
        aria-autocomplete="list"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit(value)}
        placeholder={placeholder}
        className={cn(
          'min-h-0 flex-1 bg-transparent text-[14px] leading-none outline-none',
          'placeholder:text-muted-foreground',
          focused ? 'text-accent dark:text-primary font-medium' : 'text-foreground',
        )}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Limpar busca"
          className="text-muted-foreground hover:text-foreground min-h-0 min-w-0 shrink-0 transition-colors"
        >
          <X size={16} strokeWidth={1.8} />
        </button>
      )}
    </div>
  )
}
