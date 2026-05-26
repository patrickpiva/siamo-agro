import { z } from 'zod'

// ─── Shared ───────────────────────────────────────────────────────────────────

const ListingPhotoSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  order: z.number().int(),
})

const ListingProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  photo: z.string().url().nullable(),
  rating: z.number(),
  badge: z.enum(['NONE', 'BRONZE', 'SILVER', 'GOLD']),
  city: z.string().nullable(),
  state: z.string().nullable(),
})

const SavedListingSchema = z.object({
  id: z.string(),
  kind: z.enum(['OFFER', 'DEMAND', 'SERVICE', 'EQUIPMENT']),
  category: z.string(),
  title: z.string(),
  description: z.string(),
  price: z.number().nullable(),
  negotiable: z.boolean(),
  status: z.enum(['ACTIVE', 'PAUSED', 'CLOSED']),
  viewCount: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  photos: z.array(ListingPhotoSchema),
  profile: ListingProfileSchema,
})

// ─── Toggle ───────────────────────────────────────────────────────────────────

export const ToggleParamsSchema = z.object({
  listingId: z.string().min(1),
})

export const ToggleResponseSchema = z.object({
  data: z.object({ saved: z.boolean() }),
  error: z.null(),
})

// ─── Status ───────────────────────────────────────────────────────────────────

export const StatusParamsSchema = z.object({
  listingId: z.string().min(1),
})

export const StatusResponseSchema = z.object({
  data: z.object({ saved: z.boolean() }),
  error: z.null(),
})

// ─── List ─────────────────────────────────────────────────────────────────────

export const ListSavedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const ListSavedResponseSchema = z.object({
  data: z.array(SavedListingSchema),
  meta: z.object({
    nextCursor: z.string().nullable(),
    limit: z.number(),
  }),
  error: z.null(),
})

// ─── Error ────────────────────────────────────────────────────────────────────

export const ErrorResponseSchema = z.object({
  data: z.null(),
  error: z.object({ code: z.string(), message: z.string() }),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type ListSavedQuery = z.infer<typeof ListSavedQuerySchema>
