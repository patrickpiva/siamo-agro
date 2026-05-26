'use client'

import { useState, useEffect } from 'react'
import { RefreshCw } from '@agraia/ui/icons'
import { RangeSlider, FilterChipGroup } from '@agraia/ui'
import { cn } from '@agraia/ui'

export interface FilterValues {
  kinds: string[]
  categories: string[]
  maxDistKm: number
  minPrice: number
  maxPrice: number
  reputation: string[]
  minMatchScore: string
}

const DEFAULT_FILTERS: FilterValues = {
  kinds: [],
  categories: [],
  maxDistKm: 200,
  minPrice: 0,
  maxPrice: 10000,
  reputation: [],
  minMatchScore: '',
}

interface FilterSheetProps {
  open: boolean
  onClose: () => void
  initial?: Partial<FilterValues>
  onApply: (filters: FilterValues) => void
  resultCount?: number
}

const KIND_OPTIONS = [
  { value: 'OFFER', label: 'Oferta' },
  { value: 'DEMAND', label: 'Demanda' },
  { value: 'SERVICE', label: 'Serviço' },
  { value: 'EQUIPMENT', label: 'Equipamento' },
]

const CATEGORY_OPTIONS = [
  { value: 'COFFEE', label: 'Café' },
  { value: 'SOY', label: 'Soja' },
  { value: 'CORN', label: 'Milho' },
  { value: 'LIVESTOCK', label: 'Pecuária' },
  { value: 'TRACTOR', label: 'Tratores' },
  { value: 'AGRONOMY', label: 'Agronomia' },
]

const REP_OPTIONS = [
  { value: 'GOLD', label: 'OURO' },
  { value: 'SILVER', label: 'PRATA' },
  { value: 'BRONZE', label: 'BRONZE' },
  { value: '', label: 'Qualquer' },
]

const SCORE_OPTIONS = [
  { value: '', label: 'Qualquer' },
  { value: '70', label: '≥ 70' },
  { value: '80', label: '≥ 80' },
  { value: '90', label: '≥ 90' },
]

export function FilterSheet({ open, onClose, initial, onApply, resultCount }: FilterSheetProps) {
  const [filters, setFilters] = useState<FilterValues>({ ...DEFAULT_FILTERS, ...initial })

  useEffect(() => {
    if (open) setFilters({ ...DEFAULT_FILTERS, ...initial })
  }, [open, initial])

  function update<K extends keyof FilterValues>(key: K, value: FilterValues[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} aria-hidden />

      {/* Sheet */}
      <div
        className={cn(
          'bg-background fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[20px]',
          'max-h-[90dvh]',
        )}
        role="dialog"
        aria-modal
        aria-label="Filtros avançados"
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        {/* Handle */}
        <div className="flex justify-center pb-3 pt-3">
          <div className="bg-border h-1 w-9 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 pb-3">
          <span className="text-[15px] font-medium">Filtros</span>
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="text-accent dark:text-primary flex min-h-0 min-w-0 items-center gap-1 font-mono text-[12px] font-medium"
          >
            <RefreshCw size={12} strokeWidth={2.5} />
            LIMPAR
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <Section label="TIPO DE ANÚNCIO">
            <FilterChipGroup
              options={KIND_OPTIONS}
              value={filters.kinds}
              onChange={(v) => update('kinds', v as string[])}
              multiple
            />
          </Section>

          <Section label="CATEGORIA">
            <FilterChipGroup
              options={CATEGORY_OPTIONS}
              value={filters.categories}
              onChange={(v) => update('categories', v as string[])}
              multiple
            />
          </Section>

          <Section label="DISTÂNCIA MÁXIMA">
            <RangeSlider
              min={0}
              max={200}
              value={[0, filters.maxDistKm]}
              onChange={([, hi]) => update('maxDistKm', hi)}
              step={5}
              format={(v) => `${v} km`}
              single
            />
          </Section>

          <Section label="FAIXA DE PREÇO">
            <RangeSlider
              min={0}
              max={10000}
              value={[filters.minPrice, filters.maxPrice]}
              onChange={([lo, hi]) => {
                update('minPrice', lo)
                update('maxPrice', hi)
              }}
              step={100}
              format={(v) => `R$ ${v}`}
            />
          </Section>

          <Section label="REPUTAÇÃO">
            <FilterChipGroup
              options={REP_OPTIONS}
              value={filters.reputation}
              onChange={(v) => update('reputation', v as string[])}
              multiple
            />
          </Section>

          <Section label="SCORE MÍNIMO DE MATCH">
            <FilterChipGroup
              options={SCORE_OPTIONS}
              value={filters.minMatchScore}
              onChange={(v) => update('minMatchScore', v as string)}
            />
          </Section>
        </div>

        {/* CTA */}
        <div className="border-t px-5 py-4">
          <button
            type="button"
            onClick={() => {
              onApply(filters)
              onClose()
            }}
            className="bg-cta-bg text-cta-fg w-full rounded-[12px] py-[15px] text-[15px] font-medium transition-opacity active:opacity-80"
          >
            {resultCount != null ? `Ver ${resultCount} resultados` : 'Aplicar filtros'}
          </button>
        </div>
      </div>
    </>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-5 pt-4">
      <p className="text-muted-foreground mb-3 font-mono text-[11px] tracking-[0.4px]">[{label}]</p>
      {children}
    </div>
  )
}
