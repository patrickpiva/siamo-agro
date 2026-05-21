// ─── Mock data para páginas de perfil ────────────────────────────────────────
// TODO Sprint 2: substituir por fetch(`${process.env.API_URL}/api/v1/profiles/${id}`)
//                com next: { revalidate: 60 }

export type BadgeTier = 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD'
export type ProfileType = 'PRODUCER' | 'PROVIDER'

export interface ProfileRating {
  score: number
  count: number
}

export interface ProfileListing {
  id: string
  title: string
  description: string
  price?: string
  city: string
  state: string
  createdAt: string
}

export interface ProfileReview {
  id: string
  authorName: string
  authorPhotoUrl?: string
  score: number
  comment: string
  createdAt: string
}

export interface ProfileData {
  id: string
  name: string
  type: ProfileType
  badge: BadgeTier
  bio: string
  photoUrl?: string
  city: string
  state: string
  memberSince: string
  rating: ProfileRating
  listings: ProfileListing[]
  reviews: ProfileReview[]
  completedTransactions: number
}
