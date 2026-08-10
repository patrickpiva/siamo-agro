'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LayoutGrid, Package, Search, Wrench, Tractor } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { CATEGORIES } from '@siamo/shared'
import type { ListingKindKey } from '@siamo/shared'

const KINDS: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: '', label: 'Todos', Icon: LayoutGrid },
  { key: 'OFFER', label: 'Oferta', Icon: Package },
  { key: 'DEMAND', label: 'Demanda', Icon: Search },
  { key: 'SERVICE', label: 'Serviço', Icon: Wrench },
  { key: 'EQUIPMENT', label: 'Equipamento', Icon: Tractor },
]

interface FeedFiltersProps {
  initialFilters: {
    kind?: string
    category?: string
    minPrice?: string
    maxPrice?: string
  }
  mobile?: boolean
}

export function FeedFilters({ initialFilters, mobile }: FeedFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      if (key === 'kind') params.delete('category')
      router.push(`/explorar?${params.toString()}`)
    },
    [router, searchParams],
  )

  const kind = initialFilters.kind ?? ''
  const categories =
    kind && kind in CATEGORIES
      ? Object.entries(CATEGORIES[kind as ListingKindKey] as Record<string, string>)
      : []

  if (mobile) {
    return (
      <div className="relative">
        {/* Fade hint on the right edge */}
        <div className="from-background pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l to-transparent" />

        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {KINDS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => update('kind', key)}
              className={[
                'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all',
                kind === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-foreground/70 hover:text-foreground',
              ].join(' ')}
            >
              <Icon size={14} strokeWidth={2} aria-hidden="true" />
              {label}
            </button>
          ))}
          {/* Extra right padding so last chip clears the fade */}
          <span className="w-4 shrink-0" aria-hidden />
        </div>
      </div>
    )
  }

  return (
    <div className="sticky top-20 space-y-5">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Tipo</p>
        <div className="flex flex-col gap-1">
          {KINDS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => update('kind', key)}
              className={[
                'flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                kind === key ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted',
              ].join(' ')}
            >
              <Icon size={15} strokeWidth={1.75} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {categories.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
            Categoria
          </p>
          <select
            value={initialFilters.category ?? ''}
            onChange={(e) => update('category', e.target.value)}
            className="border-border bg-background w-full rounded-lg border px-2 py-1.5 text-sm"
          >
            <option value="">Todas</option>
            {categories.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
          Preço (R$)
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={initialFilters.minPrice ?? ''}
            onChange={(e) => update('minPrice', e.target.value)}
            className="border-border bg-background w-full rounded-lg border px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            placeholder="Máx"
            value={initialFilters.maxPrice ?? ''}
            onChange={(e) => update('maxPrice', e.target.value)}
            className="border-border bg-background w-full rounded-lg border px-2 py-1.5 text-sm"
          />
        </div>
      </div>
    </div>
  )
}
