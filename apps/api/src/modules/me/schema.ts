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

// ─── Types ───────────────────────────────────────────────────────────────────

export type UpdateMeBody = z.infer<typeof UpdateMeBodySchema>
export type UpdateNotificationPrefsBody = z.infer<typeof UpdateNotificationPrefsBodySchema>
export type UpdateConsentsBody = z.infer<typeof UpdateConsentsBodySchema>
