'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, Search, X } from '@siamo/ui/icons'
import { cn } from '@siamo/ui'
import { FilterSheet } from '@/components/search/filter-sheet'
import type { FilterValues } from '@/components/search/filter-sheet'
import { SearchOverlay } from '@/components/search/search-overlay'
import {
  countActiveFilters,
  filtersToParams,
  paramsToFilters,
  FILTER_PARAM_KEYS,
} from '@/lib/listing-filters'

/**
 * Search + filter controls for /explorar.
 *
 * All state lives in the URL, not in React: a filtered search stays shareable,
 * survives back-navigation, and `FeedList` re-queries off the same params
 * without any state plumbing between the two.
 *
 * Replaces the /busca toolbar, whose filters were collected into component
 * state and never sent anywhere.
 */
export function SearchControls() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchOpen, setSearchOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)

  const query = searchParams.get('search') ?? ''
  const currentFilters = useMemo(() => paramsToFilters(searchParams), [searchParams])
  const activeCount = countActiveFilters(currentFilters)

  /** Rewrites the URL, preserving params this component does not own (tab, etc.). */
  const pushParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      // Any filter or search change invalidates the cursor position
      params.delete('cursor')
      const qs = params.toString()
      router.push(qs ? `/explorar?${qs}` : '/explorar')
    },
    [router, searchParams],
  )

  function applySearch(value: string) {
    pushParams((params) => {
      params.set('search', value)
      // A text search has to leave the matches/saved tabs — those ignore filters
      params.set('tab', 'recent')
    })
    setSearchOpen(false)
  }

  function applyCategory(category: string) {
    pushParams((params) => {
      params.set('category', category)
      params.delete('search')
      params.set('tab', 'recent')
    })
    setSearchOpen(false)
  }

  function clearSearch() {
    pushParams((params) => params.delete('search'))
  }

  function applyFilters(filters: FilterValues) {
    pushParams((params) => {
      for (const key of FILTER_PARAM_KEYS) params.delete(key)
      for (const [key, value] of Object.entries(filtersToParams(filters))) {
        params.set(key, value)
      }
      // Filters only apply to the query-backed tabs
      const tab = params.get('tab')
      if (tab === 'matches' || tab === 'saved') params.set('tab', 'recent')
    })
  }

  return (
    <div className="px-4 pb-1 pt-2">
      <div className="flex items-center gap-2">
        {/* Search trigger — shows the active query so it is obvious what is filtering */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className={cn(
            'bg-card border-border flex min-h-12 flex-1 items-center gap-[10px] rounded-[12px] border px-4 py-3 text-left',
            query && 'border-accent dark:border-primary border-[1.5px]',
          )}
        >
          <Search
            size={18}
            strokeWidth={1.8}
            className={cn(
              'shrink-0',
              query ? 'text-accent dark:text-primary' : 'text-muted-foreground',
            )}
          />
          <span
            className={cn(
              'flex-1 truncate text-[15px]',
              query ? 'text-accent dark:text-primary font-medium' : 'text-muted-foreground',
            )}
          >
            {query || 'Buscar anúncios...'}
          </span>
        </button>

        {query && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Limpar busca"
            className="bg-muted text-muted-foreground hover:text-foreground flex size-12 shrink-0 items-center justify-center rounded-full"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        )}

        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-label={activeCount > 0 ? `Filtros (${activeCount} ativos)` : 'Filtros'}
          className={cn(
            'relative flex size-12 shrink-0 items-center justify-center rounded-full transition-colors',
            activeCount > 0
              ? 'bg-primary-subtle text-accent dark:text-primary'
              : 'bg-muted text-muted-foreground',
          )}
        >
          <Filter size={18} strokeWidth={1.8} />
          {activeCount > 0 && (
            <span className="bg-accent dark:bg-primary absolute right-[6px] top-[6px] flex size-[16px] items-center justify-center rounded-full text-[9px] font-bold text-white dark:text-black">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <SearchOverlay
        open={searchOpen}
        initialQuery={query}
        onClose={() => setSearchOpen(false)}
        onSubmitQuery={applySearch}
        onSelectCategory={applyCategory}
      />

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        initial={currentFilters}
        onApply={applyFilters}
      />
    </div>
  )
}
