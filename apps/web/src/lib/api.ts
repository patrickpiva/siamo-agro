import { cache } from 'react'
import { cookies } from 'next/headers'
import { prisma } from '@siamo/db'

const API_URL = process.env['API_URL'] ?? 'http://localhost:3001'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ListingPhoto {
  id: string
  url: string
  order: number
}

export interface ListingProfile {
  id?: string
  userId?: string
  name: string
  photo: string | null
  rating: number
  badge: string
  city?: string | null
  state?: string | null
}

export interface Listing {
  id: string
  kind: string
  category: string
  title: string
  description: string
  price: number | null
  negotiable: boolean
  status: string
  profileId: string
  viewCount: number
  proposalCount: number
  matchCount: number
  createdAt: string
  updatedAt: string
  photos: ListingPhoto[]
  profile: ListingProfile
  /** Present only on listings returned by the personalized matches feed. */
  matchScore?: number
  distanceKm?: number | null
}

export interface ListingMeta {
  nextCursor: string | null
  limit: number
  /**
   * Present only when the request carried `search`. Signals that the API had to
   * relax the search to find anything — the UI should warn that results are
   * approximate rather than showing them as exact matches. See CLAUDE.md §5.
   */
  searchRelaxed?: 'exact' | 'partial' | 'fuzzy'
}

export interface ListingsResponse {
  data: Listing[]
  meta: ListingMeta
  error: null
}

export interface ListingResponse {
  data: Listing
  error: null
}

// ─── Server-side helpers (use in Server Components) ───────────────────────────

async function authHeader(): Promise<Record<string, string>> {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Direct Prisma read (Vercel → Supabase, co-located) — replaces the old fetch to
 * the Railway API, which detoured cross-region (US-East) for data sitting right
 * next to the Vercel function. Mirrors the API's `ListingsService.findById`.
 *
 * cache(): generateMetadata e a página chamam fetchListing no mesmo request —
 * sem o cache, a query e o incremento de viewCount rodariam em dobro.
 */
export const fetchListing = cache(async (id: string): Promise<Listing | null> => {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      profile: { include: { location: true } },
      photos: { orderBy: { order: 'asc' } },
    },
  })
  if (!listing) return null

  // Fire-and-forget view-count increment — matches the API behaviour, non-blocking.
  void prisma.listing
    .update({ where: { id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {})

  return {
    id: listing.id,
    kind: listing.kind,
    category: listing.category,
    title: listing.title,
    description: listing.description,
    price: listing.price !== null ? Number(listing.price) : null,
    negotiable: listing.negotiable,
    status: listing.status,
    profileId: listing.profileId,
    viewCount: listing.viewCount,
    // Not used by the detail page (it recomputes these via Prisma when owner);
    // kept for type compatibility with the API response shape.
    proposalCount: 0,
    matchCount: 0,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    photos: listing.photos.map((p) => ({ id: p.id, url: p.url, order: p.order })),
    profile: {
      id: listing.profile.id,
      userId: listing.profile.userId,
      name: listing.profile.name,
      photo: listing.profile.photo ?? null,
      rating: listing.profile.currentRating,
      badge: listing.profile.badge,
      city: listing.profile.location?.city ?? null,
      state: listing.profile.location?.state ?? null,
    },
  }
})

export interface FetchListingsQuery {
  kind?: string
  category?: string
  minPrice?: string
  maxPrice?: string
  search?: string
  cursor?: string
  limit?: number
}

export async function fetchListings(query: FetchListingsQuery = {}): Promise<{
  data: Listing[]
  meta: ListingMeta
}> {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== '') params.set(k, String(v))
  }
  const res = await fetch(`${API_URL}/api/v1/listings?${params.toString()}`, {
    cache: 'no-store',
  })
  if (!res.ok) return { data: [], meta: { nextCursor: null, limit: 20 } }
  const json = (await res.json()) as ListingsResponse
  return { data: json.data, meta: json.meta }
}

export async function fetchMyListings(
  query: {
    status?: string
    cursor?: string
    limit?: number
  } = {},
): Promise<{ data: Listing[]; meta: ListingMeta }> {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== '') params.set(k, String(v))
  }
  const res = await fetch(`${API_URL}/api/v1/listings/mine?${params.toString()}`, {
    cache: 'no-store',
    headers: await authHeader(),
  })
  if (!res.ok) return { data: [], meta: { nextCursor: null, limit: 20 } }
  const json = (await res.json()) as ListingsResponse
  return { data: json.data, meta: json.meta }
}
