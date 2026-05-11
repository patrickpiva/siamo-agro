// ─── Types ────────────────────────────────────────────────────────────────────

export interface MatchCandidate {
  id: string
  name: string
  photo: string | null
  rating: number
  badge: string
  city: string | null
  state: string | null
}

export interface MatchBestListing {
  kind: string
  category: string
  title: string
}

export interface MatchResult {
  id: string
  score: number
  distanceKm: number | null
  computedAt: string
  candidate: MatchCandidate
  bestListing: MatchBestListing | null
}

export interface MatchesMeta {
  nextCursor: string | null
  limit: number
}

export interface MatchesData {
  data: MatchResult[]
  meta: MatchesMeta
}

export type MatchesResponse =
  | { processing: false; data: MatchResult[]; meta: MatchesMeta }
  | { processing: true; data: null }

// ─── Client fetch ─────────────────────────────────────────────────────────────

export async function fetchMatches(
  listingId: string,
  cursor?: string,
  limit = 20,
): Promise<MatchesResponse> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (cursor) params.set('cursor', cursor)

  const res = await fetch(`/api/listings/${listingId}/matches?${params.toString()}`)
  if (!res.ok) throw new Error('Erro ao buscar matches')

  const json = (await res.json()) as unknown
  const body = json as Record<string, unknown>

  if (body['processing'] === true) {
    return { processing: true, data: null }
  }

  return {
    processing: false,
    data: body['data'] as MatchResult[],
    meta: body['meta'] as MatchesMeta,
  }
}
