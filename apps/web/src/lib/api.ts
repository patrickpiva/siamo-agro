import { cookies } from 'next/headers'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

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
}

export interface ListingMeta {
  nextCursor: string | null
  limit: number
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

export async function fetchListing(id: string): Promise<Listing | null> {
  const res = await fetch(`${API_URL}/api/v1/listings/${id}`, {
    cache: 'no-store',
    headers: await authHeader(),
  })
  if (!res.ok) return null
  const json = (await res.json()) as ListingResponse
  return json.data
}

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

export interface Proposal {
  id: string
  listingId: string
  profile: { id: string; name: string; avatarUrl: string | null }
  price: number | null
  quantity: number | null
  message: string | null
  status: string
  createdAt: string
}

export interface ProposalsResponse {
  data: Proposal[]
  meta: ListingMeta
  error: null
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

export async function fetchListingProposals(id: string, limit = 3): Promise<Proposal[]> {
  const res = await fetch(`${API_URL}/api/v1/listings/${id}/proposals?limit=${limit}`, {
    cache: 'no-store',
    headers: await authHeader(),
  })
  if (!res.ok) return []
  const json = (await res.json()) as ProposalsResponse
  return json.data
}
