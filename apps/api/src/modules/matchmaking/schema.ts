import { z } from 'zod'

// ─── Shared ───────────────────────────────────────────────────────────────────

const CandidateSchema = z.object({
  id: z.string(),
  name: z.string(),
  photo: z.string().nullable(),
  rating: z.number(),
  badge: z.string(),
  city: z.string().nullable(),
  state: z.string().nullable(),
})

const BestListingSchema = z.object({
  kind: z.string(),
  category: z.string(),
  title: z.string(),
})

const MatchResultSchema = z.object({
  id: z.string(),
  score: z.number(),
  distanceKm: z.number().nullable(),
  computedAt: z.string().datetime(),
  candidate: CandidateSchema,
  bestListing: BestListingSchema.nullable(),
})

// ─── GET /:id/matches — query ─────────────────────────────────────────────────

export const ListMatchesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

// ─── GET /:id/matches — responses ────────────────────────────────────────────

export const MatchesResponseSchema = z.object({
  data: z.array(MatchResultSchema),
  meta: z.object({ nextCursor: z.string().nullable(), limit: z.number() }),
  error: z.null(),
})

export const MatchesProcessingResponseSchema = z.object({
  data: z.null(),
  processing: z.literal(true),
  error: z.null(),
})

export const ErrorResponseSchema = z.object({
  data: z.null(),
  error: z.object({ code: z.string(), message: z.string() }),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type ListMatchesQuery = z.infer<typeof ListMatchesQuerySchema>
export type MatchResult = z.infer<typeof MatchResultSchema>
