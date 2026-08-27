'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Clock, X } from '@siamo/ui/icons'
import { CATEGORY_ICONS } from '@siamo/ui/icons'
import { SearchBar, SuggestionChip } from '@siamo/ui'
import { readRecentSearches, pushRecentSearch, clearRecentSearches } from '@/lib/recent-searches'

/**
 * Full-screen search entry, opened from the /explorar header.
 *
 * This is the old /busca "B2" screen kept as an overlay instead of a route, so
 * searching never leaves the feed — results render in the same FeedList that
 * already handles paging, empty states and offline caching.
 *
 * Gone from the original: the "[EM ALTA NA SUA REGIÃO]" block, which shipped
 * invented statistics ("+34% de anúncios esta semana") under a heading claiming
 * geolocation. There is no aggregate endpoint behind it; showing nothing beats
 * showing numbers we made up.
 */

const CATEGORY_CHIPS: { key: keyof typeof CATEGORY_ICONS; label: string }[] = [
  { key: 'COFFEE', label: 'Café' },
  { key: 'SOY', label: 'Soja' },
  { key: 'CORN', label: 'Milho' },
  { key: 'LIVESTOCK', label: 'Pecuária' },
  { key: 'TRACTOR', label: 'Tratores' },
  { key: 'AGRONOMY', label: 'Agronomia' },
]

interface SearchOverlayProps {
  open: boolean
  initialQuery: string
  onClose: () => void
  onSubmitQuery: (query: string) => void
  onSelectCategory: (category: string) => void
}

export function SearchOverlay({
  open,
  initialQuery,
  onClose,
  onSubmitQuery,
  onSelectCategory,
}: SearchOverlayProps) {
  const [value, setValue] = useState(initialQuery)
  const [recents, setRecents] = useState<string[]>([])

  // Read on open rather than on mount: localStorage is not available during SSR,
  // and the list may have changed since the overlay was last closed.
  useEffect(() => {
    if (!open) return
    setValue(initialQuery)
    setRecents(readRecentSearches())
  }, [open, initialQuery])

  // Escape closes; listener on document because the overlay root is not focusable
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  // Prevents the feed behind the overlay from scrolling on touch
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!open) return null

  function submit(query: string) {
    const trimmed = query.trim()
    if (!trimmed) return
    pushRecentSearch(trimmed)
    onSubmitQuery(trimmed)
  }

  return (
    <div
      className="bg-background fixed inset-0 z-50 flex flex-col"
      role="dialog"
      aria-modal
      aria-label="Buscar anúncios"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pb-1 pt-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar busca"
          className="bg-muted flex size-12 shrink-0 items-center justify-center rounded-full"
        >
          <ArrowLeft size={18} strokeWidth={1.8} />
        </button>
        <div className="flex-1">
          <SearchBar
            value={value}
            onChange={setValue}
            onSubmit={submit}
            onClear={() => setValue('')}
            focused={value.length > 0}
            placeholder="Buscar anúncios..."
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-5">
        {recents.length > 0 && (
          <div className="mb-6">
            <div className="mb-[10px] flex items-center justify-between">
              <p className="text-muted-foreground font-mono text-[11px] tracking-[0.4px]">
                [RECENTES]
              </p>
              <button
                type="button"
                onClick={() => {
                  clearRecentSearches()
                  setRecents([])
                }}
                className="text-muted-foreground hover:text-foreground min-h-0 min-w-0 font-mono text-[11px]"
              >
                LIMPAR
              </button>
            </div>
            {recents.map((term) => (
              <div key={term} className="border-border flex items-center border-b last:border-0">
                <button
                  type="button"
                  onClick={() => submit(term)}
                  className="flex min-h-12 flex-1 items-center gap-3 py-3 text-left"
                >
                  <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-[10px]">
                    <Clock size={16} strokeWidth={1.8} className="text-muted-foreground" />
                  </span>
                  <span className="flex-1 text-[13px]">{term}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Remover "${term}" dos recentes`}
                  onClick={() => {
                    const next = recents.filter((r) => r !== term)
                    clearRecentSearches()
                    next.forEach((r) => pushRecentSearch(r))
                    setRecents(readRecentSearches())
                  }}
                  className="text-muted-foreground hover:text-foreground flex size-12 shrink-0 items-center justify-center"
                >
                  <X size={14} strokeWidth={1.8} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <p className="text-muted-foreground mb-[10px] font-mono text-[11px] tracking-[0.4px]">
            [CATEGORIAS]
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_CHIPS.map(({ key, label }) => {
              const Icon = CATEGORY_ICONS[key]
              return (
                <SuggestionChip
                  key={key}
                  label={label}
                  icon={<Icon size={14} strokeWidth={1.8} />}
                  // Filters by category instead of running a text search for the
                  // Portuguese label — "Café" as free text never matched the
                  // COFFEE taxonomy, it just searched the word.
                  onClick={() => onSelectCategory(key)}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
