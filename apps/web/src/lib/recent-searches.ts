const STORAGE_KEY = 'siamo:recent-searches'
const MAX_ENTRIES = 5

/**
 * Recent searches, kept on the device.
 *
 * Local rather than server-side on purpose: the list is only ever shown back to
 * the person who typed it, so persisting it would mean storing user behaviour
 * (LGPD surface) to power a convenience feature. It also keeps working offline,
 * which matters for the connectivity this app targets.
 *
 * Replaces the hardcoded RECENT_SEARCHES array that used to ship fake entries
 * ("soja em grão safra 2025 · Resultados · 4 km") to every user.
 */
export function readRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((v): v is string => typeof v === 'string').slice(0, MAX_ENTRIES)
  } catch {
    // Corrupt JSON or storage disabled (private mode) — recents are optional
    return []
  }
}

/** Adds a term to the top, de-duplicated case-insensitively. */
export function pushRecentSearch(term: string): void {
  if (typeof window === 'undefined') return
  const trimmed = term.trim()
  if (!trimmed) return

  const existing = readRecentSearches().filter((v) => v.toLowerCase() !== trimmed.toLowerCase())
  const next = [trimmed, ...existing].slice(0, MAX_ENTRIES)

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage full or blocked — losing a recent search is not worth surfacing
  }
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
