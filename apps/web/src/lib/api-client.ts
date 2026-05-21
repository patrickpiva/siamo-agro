/**
 * Client-safe API helpers (no cookies / server-only imports).
 * Use these inside 'use client' components.
 * For Server Components, use @/lib/api instead.
 */

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

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
    const res = await fetch(`${API_URL}/api/v1/listings/${id}`, { cache: 'no-store' })
    if (!res.ok) return null
    const json = (await res.json()) as ListingResponse
    return json.data
  } catch {
    return null
  }
}
