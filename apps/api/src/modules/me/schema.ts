import { z } from 'zod'

// ─── GET /me ─────────────────────────────────────────────────────────────────

export const MeResponseSchema = z.object({
  data: z.object({
    profile: z.object({
      id: z.string(),
      type: z.enum(['PRODUCER', 'PROVIDER']),
      name: z.string(),
      propertyName: z.string().nullable(),
      bio: z.string().nullable(),
      photo: z.string().nullable(),
      badge: z.enum(['NONE', 'BRONZE', 'SILVER', 'GOLD']),
      currentRating: z.number(),
      ratingCount: z.number(),
      activeListingCount: z.number(),
      termsAcceptedAt: z.string().nullable(),
      privacyAcceptedAt: z.string().nullable(),
      marketingOptIn: z.boolean(),
      location: z
        .object({
          city: z.string(),
          state: z.string(),
        })
        .nullable(),
    }),
  }),
  error: z.null(),
})

// ─── PATCH /me ───────────────────────────────────────────────────────────────

export const UpdateMeBodySchema = z.object({
  name: z.string().min(2).max(80).optional(),
  propertyName: z.string().max(80).nullable().optional(),
  bio: z.string().max(280).nullable().optional(),
  photo: z.string().url().nullable().optional(),
})

export const UpdateMeResponseSchema = z.object({
  data: z.object({ ok: z.literal(true) }),
  error: z.null(),
})

// ─── GET/PATCH /me/notification-preferences ──────────────────────────────────

export const NotificationPrefsResponseSchema = z.object({
  data: z.object({
    preferences: z.object({
      whatsapp: z.boolean(),
      push: z.boolean(),
      proposalReceived: z.boolean(),
      transactionUpdate: z.boolean(),
      matchFound: z.boolean(),
      ratingReceived: z.boolean(),
      collectiveUpdate: z.boolean(),
      weeklyTips: z.boolean(),
    }),
  }),
  error: z.null(),
})

export const UpdateNotificationPrefsBodySchema = z.object({
  whatsapp: z.boolean().optional(),
  push: z.boolean().optional(),
  proposalReceived: z.boolean().optional(),
  transactionUpdate: z.boolean().optional(),
  matchFound: z.boolean().optional(),
  ratingReceived: z.boolean().optional(),
  collectiveUpdate: z.boolean().optional(),
  weeklyTips: z.boolean().optional(),
})

// ─── GET /me/consents ────────────────────────────────────────────────────────

export const ConsentsResponseSchema = z.object({
  data: z.object({
    consents: z.object({
      termsAcceptedAt: z.string().nullable(),
      privacyAcceptedAt: z.string().nullable(),
      marketingOptIn: z.boolean(),
      marketingOptInAt: z.string().nullable(),
    }),
  }),
  error: z.null(),
})

export const UpdateConsentsBodySchema = z.object({
  marketingOptIn: z.boolean(),
})

// ─── POST /me/data-export ────────────────────────────────────────────────────

export const DataExportResponseSchema = z.object({
  data: z.object({ requested: z.literal(true) }),
  error: z.null(),
})

// ─── DELETE /me ──────────────────────────────────────────────────────────────

export const DeleteMeResponseSchema = z.object({
  data: z.object({ scheduled: z.literal(true) }),
  error: z.null(),
})

// ─── Error ───────────────────────────────────────────────────────────────────

export const ErrorResponseSchema = z.object({
  data: z.null(),
  error: z.object({ code: z.string(), message: z.string() }),
})

// ─── GET /me/feed/matches ─────────────────────────────────────────────────────

export const FeedMatchesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

const FeedMatchListingSchema = z.object({
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
  matchScore: z.number(),
  distanceKm: z.number().nullable(),
  photos: z.array(z.object({ id: z.string(), url: z.string(), order: z.number() })),
  profile: z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    photo: z.string().nullable(),
    rating: z.number(),
    badge: z.enum(['NONE', 'BRONZE', 'SILVER', 'GOLD']),
    city: z.string().nullable(),
    state: z.string().nullable(),
  }),
})

export const FeedMatchesResponseSchema = z.object({
  data: z.array(FeedMatchListingSchema),
  meta: z.object({
    nextCursor: z.string().nullable(),
    limit: z.number(),
  }),
  computing: z.boolean(),
  error: z.null(),
})

// ─── Types ───────────────────────────────────────────────────────────────────

export type UpdateMeBody = z.infer<typeof UpdateMeBodySchema>
export type UpdateNotificationPrefsBody = z.infer<typeof UpdateNotificationPrefsBodySchema>
export type UpdateConsentsBody = z.infer<typeof UpdateConsentsBodySchema>
export type FeedMatchesQuery = z.infer<typeof FeedMatchesQuerySchema>
