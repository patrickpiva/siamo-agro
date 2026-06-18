/**
 * Client-safe API helpers (no cookies / server-only imports).
 * Use these inside 'use client' components.
 * For Server Components, use @/lib/api instead.
 *
 * Sempre via /api/proxy — chamadas diretas a NEXT_PUBLIC_API_URL do browser
 * perdem a injeção de auth e fazem hop cross-region (Railway US-East).
 */

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
  createdAt: string
  updatedAt: string
  photos: ListingPhoto[]
  profile: ListingProfile
}

interface ListingResponse {
  data: Listing
  error: null
}

export async function fetchListing(id: string): Promise<Listing | null> {
  try {
    const res = await fetch(`/api/proxy/listings/${id}`, { cache: 'no-store' })
    if (!res.ok) return null
    const json = (await res.json()) as ListingResponse
    return json.data
  } catch {
    return null
  }
}
