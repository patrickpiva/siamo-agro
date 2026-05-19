import { z } from 'zod'

// ─── Create ──────────────────────────────────────────────────────────────────

export const CreateProfileBodySchema = z.object({
  type: z.enum(['PRODUCER', 'PROVIDER']),
  name: z.string().min(2).max(80),
  propertyName: z.string().max(80).optional(),
  bio: z.string().max(280).optional(),
  avatarUrl: z.string().url().optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      city: z.string().min(1),
      state: z.string().length(2),
    })
    .optional(),
})

export const ProfileResponseSchema = z.object({
  data: z.object({
    profile: z.object({
      id: z.string(),
      userId: z.string(),
      type: z.enum(['PRODUCER', 'PROVIDER']),
      name: z.string(),
      propertyName: z.string().nullable(),
      bio: z.string().nullable(),
      photo: z.string().nullable(),
      badge: z.enum(['NONE', 'BRONZE', 'SILVER', 'GOLD']),
      createdAt: z.string(),
    }),
  }),
  error: z.null(),
})

// ─── Error ───────────────────────────────────────────────────────────────────

export const ErrorResponseSchema = z.object({
  data: z.null(),
  error: z.object({ code: z.string(), message: z.string() }),
})

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type CreateProfileBody = z.infer<typeof CreateProfileBodySchema>
