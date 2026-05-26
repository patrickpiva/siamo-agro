import { z } from 'zod'

// ─── Params ───────────────────────────────────────────────────────────────────

export const TransactionParamsSchema = z.object({ id: z.string() })
export const ProfileParamsSchema = z.object({ id: z.string() })

// ─── Submit rating ────────────────────────────────────────────────────────────

export const SubmitRatingBodySchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  reliability: z.number().int().min(1).max(5).optional(),
  communication: z.number().int().min(1).max(5).optional(),
  quality: z.number().int().min(1).max(5).optional(),
})

export const RatingSchema = z.object({
  id: z.string(),
  transactionId: z.string(),
  raterId: z.string(),
  rateeId: z.string(),
  score: z.number(),
  comment: z.string().nullable(),
  reliability: z.number().nullable(),
  communication: z.number().nullable(),
  quality: z.number().nullable(),
  createdAt: z.string().datetime(),
})

export const SubmitRatingResponseSchema = z.object({
  data: RatingSchema,
  error: z.null(),
})

// ─── Get reputation ───────────────────────────────────────────────────────────

export const PeriodStatsSchema = z.object({
  count: z.number(),
  avg: z.number(),
})

export const ReputationResponseSchema = z.object({
  data: z.object({
    currentRating: z.number(),
    ratingCount: z.number(),
    badge: z.enum(['NONE', 'BRONZE', 'SILVER', 'GOLD']),
    breakdown: z.object({
      last30Days: PeriodStatsSchema,
      last90Days: PeriodStatsSchema,
      allTime: PeriodStatsSchema,
    }),
    distribution: z.object({
      5: z.number(),
      4: z.number(),
      3: z.number(),
      2: z.number(),
      1: z.number(),
    }),
    categoryAverages: z.object({
      reliability: z.number().nullable(),
      communication: z.number().nullable(),
      quality: z.number().nullable(),
    }),
    recentRatings: z.array(
      z.object({
        score: z.number(),
        comment: z.string().nullable(),
        reliability: z.number().nullable(),
        communication: z.number().nullable(),
        quality: z.number().nullable(),
        rater: z.object({
          name: z.string().nullable(),
          photo: z.string().nullable(),
        }),
        transaction: z.object({
          id: z.string(),
          amount: z.number(),
          kind: z.string(),
          title: z.string(),
        }),
        createdAt: z.string().datetime(),
      }),
    ),
  }),
  error: z.null(),
})

// ─── Error ────────────────────────────────────────────────────────────────────

export const ErrorResponseSchema = z.object({
  data: z.null(),
  error: z.object({ code: z.string(), message: z.string() }),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type SubmitRatingBody = z.infer<typeof SubmitRatingBodySchema>
