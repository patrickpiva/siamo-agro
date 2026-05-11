'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CATEGORIES } from '@agrolink/shared'
import type { ListingKindKey } from '@agrolink/shared'

const KINDS: { key: string; label: string }[] = [
  { key: '', label: 'Todos' },
  { key: 'OFFER', label: 'Oferta' },
  { key: 'DEMAND', label: 'Demanda' },
  { key: 'SERVICE', label: 'Serviço' },
  { key: 'EQUIPMENT', label: 'Equipamento' },
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
      router.push(`/feed?${params.toString()}`)
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
      <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
        {KINDS.map((k) => (
          <button
            key={k.key}
            type="button"
            onClick={() => update('kind', k.key)}
            className={[
              'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              kind === k.key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:bg-muted',
            ].join(' ')}
          >
            {k.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="sticky top-20 space-y-5">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Tipo</p>
        <div className="flex flex-col gap-1">
          {KINDS.map((k) => (
            <button
              key={k.key}
              type="button"
              onClick={() => update('kind', k.key)}
              className={[
                'rounded-lg px-3 py-2 text-left text-sm transition-colors',
                kind === k.key ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted',
              ].join(' ')}
            >
              {k.label}
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
