'use client'

import { Suspense, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, TrendingUp, Clock, Filter, Map, Search } from '@agrolink/ui/icons'
import { CATEGORY_ICONS } from '@agrolink/ui/icons'
import { SearchBar, SuggestionChip, EmptyState } from '@agrolink/ui'
import { FilterSheet } from '@/components/search/filter-sheet'
import { ResultItem } from '@/components/search/result-item'
import type { ResultItemData } from '@/components/search/result-item'
import type { FilterValues } from '@/components/search/filter-sheet'
import { cn } from '@agrolink/ui'
import Link from 'next/link'

// Mock results matching the design spec
const MOCK_RESULTS: ResultItemData[] = [
  {
    id: '1',
    title: 'Café arábica especial — safra 2025',
    price: 185000,
    distanceKm: 8,
    publishedAt: new Date(Date.now() - 2 * 3_600_000),
    matchScore: 94,
    owner: { name: 'João Silva', reputationScore: 4.9 },
    category: 'COFFEE',
  },
  {
    id: '2',
    title: 'Café conilon bebida mole — 80 sacas',
    price: 162000,
    distanceKm: 14,
    publishedAt: new Date(Date.now() - 24 * 3_600_000),
    matchScore: 81,
    owner: { name: 'Faz. Boa Vista', reputationScore: 4.6 },
    category: 'COFFEE',
  },
  {
    id: '3',
    title: 'Café natural tipo 2 — lote único',
    price: 140000,
    distanceKm: 27,
    publishedAt: new Date(Date.now() - 72 * 3_600_000),
    matchScore: 74,
    owner: { name: 'Sítio Esperança', reputationScore: 4.2 },
    category: 'COFFEE',
  },
  {
    id: '4',
    title: 'Café catucaí — 55+ sacas disponíveis',
    price: 120000,
    distanceKm: 43,
    publishedAt: new Date(Date.now() - 48 * 3_600_000),
    matchScore: 51,
    owner: { name: 'Prod. Andrade', reputationScore: 3.8 },
    category: 'COFFEE',
  },
]

const RECENT_SEARCHES = [
  { label: 'soja em grão safra 2025', sub: 'Resultados · 4 km' },
  { label: 'aluguel trator 4×4', sub: 'Resultados · 11 km' },
]

const TRENDING_ITEMS = [
  { label: 'Café arábica', change: '+34% de anúncios esta semana' },
  { label: 'Consultoria em solo', change: '+18% de demandas ativas' },
]

const CATEGORY_CHIPS: { key: keyof typeof CATEGORY_ICONS; label: string }[] = [
  { key: 'COFFEE', label: 'Café' },
  { key: 'SOY', label: 'Soja' },
  { key: 'LIVESTOCK', label: 'Pecuária' },
  { key: 'TRACTOR', label: 'Tratores' },
  { key: 'AGRONOMY', label: 'Agronomia' },
]

function BuscaPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const queryParam = searchParams.get('q') ?? ''
  const [inputValue, setInputValue] = useState(queryParam)
  const [filterOpen, setFilterOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Partial<FilterValues>>({})
  const [, startTransition] = useTransition()

  const hasQuery = queryParam.trim().length > 0

  function submit(value: string) {
    const q = value.trim()
    if (!q) return
    startTransition(() => {
      router.push(`/busca?q=${encodeURIComponent(q)}`)
    })
  }

  function clearSearch() {
    setInputValue('')
    router.push('/busca')
  }

  const activeFilterCount = Object.values(activeFilters).filter((v) =>
    Array.isArray(v) ? v.length > 0 : v !== undefined && v !== '' && v !== 0,
  ).length

  // Results view (B3)
  if (hasQuery) {
    return (
      <div className="bg-background flex min-h-screen flex-col pb-[80px]">
        <div className="px-4 pt-3">
          <SearchBar
            value={inputValue}
            onChange={setInputValue}
            onSubmit={submit}
            onClear={clearSearch}
            focused
          />

          {/* Toolbar */}
          <div className="mb-[10px] mt-[10px] flex items-center justify-between">
            <span className="text-muted-foreground font-mono text-[11px]">
              {MOCK_RESULTS.length} resultados · por match
            </span>
            <div className="flex gap-2">
              {/* Filters pill */}
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className={cn(
                  'flex min-h-0 min-w-0 items-center gap-[5px] rounded-[8px] px-[10px] py-[5px] font-mono text-[11px] transition-colors',
                  activeFilterCount > 0
                    ? 'bg-primary-subtle border-primary text-accent dark:text-primary border font-medium'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <Filter size={12} strokeWidth={2} />
                {activeFilterCount > 0 ? `${activeFilterCount} filtros` : 'Filtrar'}
              </button>
              {/* Map toggle placeholder */}
              <button
                type="button"
                className="bg-muted flex size-[30px] min-h-0 min-w-0 items-center justify-center rounded-[8px]"
                aria-label="Ver no mapa"
              >
                <Map size={15} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </div>

        {/* Results list or empty state */}
        <div className="flex-1 px-4">
          {MOCK_RESULTS.length === 0 ? (
            <EmptyState
              icon={<Search size={30} strokeWidth={1.3} />}
              iconVariant="muted"
              title={`Sem resultados para "${queryParam}"`}
              description="Tente palavras diferentes ou aumente o raio de busca nos filtros."
              hints={[
                {
                  label: 'Ampliar para 100 km',
                  onClick: () => setActiveFilters((f) => ({ ...f, radiusKm: 100 })),
                },
                { label: 'Limpar filtros', onClick: () => setActiveFilters({}) },
              ]}
            />
          ) : (
            <div className="space-y-[10px]">
              {MOCK_RESULTS.map((item) => (
                <ResultItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        <FilterSheet
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          initial={activeFilters}
          onApply={setActiveFilters}
          resultCount={MOCK_RESULTS.length}
        />
      </div>
    )
  }

  // Initial search view (B2)
  return (
    <div className="bg-background flex min-h-screen flex-col pb-[80px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          href="/feed"
          className="bg-muted flex size-12 items-center justify-center rounded-full"
          aria-label="Voltar"
        >
          <ArrowLeft size={18} strokeWidth={1.8} />
        </Link>
        <span className="text-[15px] font-medium">Buscar</span>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-label="Filtros avançados"
          className={cn(
            'relative flex size-12 items-center justify-center rounded-full transition-colors',
            activeFilterCount > 0
              ? 'bg-primary-subtle text-accent dark:text-primary'
              : 'bg-muted text-muted-foreground',
          )}
        >
          <Filter size={18} strokeWidth={1.8} />
          {activeFilterCount > 0 && (
            <span className="bg-accent dark:bg-primary absolute -right-[2px] -top-[2px] flex size-[14px] items-center justify-center rounded-full text-[8px] font-bold text-white dark:text-black">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Search bar */}
      <div className="px-4 pb-1">
        <SearchBar
          value={inputValue}
          onChange={setInputValue}
          onSubmit={submit}
          onClear={() => setInputValue('')}
          focused={inputValue.length > 0}
          placeholder="Buscar anúncios..."
        />
      </div>

      {/* Suggestions */}
      <div className="flex-1 overflow-y-auto px-5 pt-5">
        {/* Recentes */}
        <div className="mb-5">
          <p className="text-muted-foreground mb-[10px] font-mono text-[11px] tracking-[0.4px]">
            [RECENTES]
          </p>
          {RECENT_SEARCHES.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setInputValue(item.label)
                submit(item.label)
              }}
              className="border-border flex w-full items-center gap-3 border-b py-3 text-left last:border-0"
            >
              <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-[10px]">
                <Clock size={16} strokeWidth={1.8} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-[13px]">{item.label}</p>
                <p className="text-muted-foreground text-[11px]">{item.sub}</p>
              </div>
              <ArrowLeft size={14} strokeWidth={1.8} className="text-muted-foreground rotate-180" />
            </button>
          ))}
        </div>

        {/* Categorias */}
        <div className="mb-5">
          <p className="text-muted-foreground mb-[10px] font-mono text-[11px] tracking-[0.4px]">
            [CATEGORIAS EM ALTA PERTO DE VOCÊ]
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_CHIPS.map(({ key, label }) => {
              const Icon = CATEGORY_ICONS[key]
              return (
                <SuggestionChip
                  key={key}
                  label={label}
                  icon={<Icon size={14} strokeWidth={1.8} />}
                  onClick={() => router.push(`/busca?q=${label}`)}
                />
              )
            })}
          </div>
        </div>

        {/* Em alta */}
        <div>
          <p className="text-muted-foreground mb-[10px] font-mono text-[11px] tracking-[0.4px]">
            [EM ALTA NA SUA REGIÃO]
          </p>
          {TRENDING_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setInputValue(item.label)
                submit(item.label)
              }}
              className="border-border flex w-full items-center gap-3 border-b py-3 text-left last:border-0"
            >
              <div className="bg-primary-subtle flex size-9 shrink-0 items-center justify-center rounded-[10px]">
                <TrendingUp size={14} strokeWidth={2} className="text-accent dark:text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[13px]">{item.label}</p>
                <p className="text-accent dark:text-primary font-mono text-[10px] font-medium">
                  {item.change}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        initial={activeFilters}
        onApply={setActiveFilters}
      />
    </div>
  )
}

export default function BuscaPage() {
  return (
    <Suspense>
      <BuscaPageInner />
    </Suspense>
  )
}
