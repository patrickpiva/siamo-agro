import type { FilterValues } from '@/components/search/filter-sheet'

/**
 * Bridge between the FilterSheet's shape and the URL / API query params.
 *
 * The URL is the single source of truth for filter state on /explorar: it makes
 * a filtered search shareable and survives back-navigation, and `FeedList`
 * already keys its TanStack query off these params.
 *
 * Scale note: the sheet speaks match score in 0–100 (the chips read "≥ 70"),
 * while the API speaks 0–1, matching `match_scores.score`. The conversion lives
 * here so exactly one place knows about the two units.
 */

export const DEFAULT_FILTERS: FilterValues = {
  kinds: [],
  categories: [],
  // 0 means "no distance filter" — a max means the opposite of no filter, and
  // sending radiusKm without an origin is a 422 from the API.
  maxDistKm: 0,
  minPrice: 0,
  maxPrice: 0,
  reputation: [],
  minMatchScore: '',
}

/** Filters actually narrowing the result set, for the "N filtros" badge. */
export function countActiveFilters(filters: Partial<FilterValues>): number {
  const f = { ...DEFAULT_FILTERS, ...filters }
  let count = 0
  if (f.kinds.length > 0) count += 1
  if (f.categories.length > 0) count += 1
  if (f.reputation.length > 0) count += 1
  if (f.maxDistKm > 0) count += 1
  if (f.minPrice > 0 || f.maxPrice > 0) count += 1
  if (f.minMatchScore !== '') count += 1
  return count
}

function csv(values: string[]): string | undefined {
  return values.length > 0 ? values.join(',') : undefined
}

/** FilterValues → URLSearchParams entries (omitting anything at its default). */
export function filtersToParams(filters: FilterValues): Record<string, string> {
  const params: Record<string, string> = {}

  const kind = csv(filters.kinds)
  if (kind) params['kind'] = kind

  const category = csv(filters.categories)
  if (category) params['category'] = category

  const badge = csv(filters.reputation)
  if (badge) params['badge'] = badge

  if (filters.maxDistKm > 0) params['radiusKm'] = String(filters.maxDistKm)
  if (filters.minPrice > 0) params['minPrice'] = String(filters.minPrice)
  if (filters.maxPrice > 0) params['maxPrice'] = String(filters.maxPrice)

  if (filters.minMatchScore !== '') {
    // Sheet chips are 0–100; the API expects the DB's 0–1 scale
    params['minMatchScore'] = String(Number(filters.minMatchScore) / 100)
  }

  return params
}

/** URLSearchParams → FilterValues, for re-opening the sheet on the current state. */
export function paramsToFilters(params: URLSearchParams): FilterValues {
  const list = (key: string): string[] => {
    const raw = params.get(key)
    return raw ? raw.split(',').filter(Boolean) : []
  }
  const num = (key: string): number => {
    const raw = params.get(key)
    const parsed = raw === null ? Number.NaN : Number(raw)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const rawScore = params.get('minMatchScore')
  const score = rawScore === null ? Number.NaN : Number(rawScore)

  return {
    kinds: list('kind'),
    categories: list('category'),
    reputation: list('badge'),
    maxDistKm: num('radiusKm'),
    minPrice: num('minPrice'),
    maxPrice: num('maxPrice'),
    minMatchScore: Number.isFinite(score) ? String(Math.round(score * 100)) : '',
  }
}

/** Every param this module owns — used to clear filters without touching tab/search. */
export const FILTER_PARAM_KEYS = [
  'kind',
  'category',
  'badge',
  'radiusKm',
  'minPrice',
  'maxPrice',
  'minMatchScore',
] as const
