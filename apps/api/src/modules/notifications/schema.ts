import { z } from 'zod'

const NotificationTypeSchema = z.enum([
  'PROPOSAL_RECEIVED',
  'PROPOSAL_ACCEPTED',
  'PROPOSAL_REFUSED',
  'TRANSACTION_COMPLETED',
  'RATING_RECEIVED',
  'MATCH_FOUND',
  'COLLECTIVE_UPDATE',
  'SYSTEM',
])

const NotificationItemSchema = z.object({
  id: z.string(),
  type: NotificationTypeSchema,
  read: z.boolean(),
  data: z.record(z.unknown()),
  createdAt: z.string(),
})

// ─── GET /notifications ───────────────────────────────────────────────────────

export const ListNotificationsQuerySchema = z.object({
  type: NotificationTypeSchema.optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const ListNotificationsResponseSchema = z.object({
  data: z.array(NotificationItemSchema),
  meta: z.object({
    nextCursor: z.string().nullable(),
    limit: z.number(),
    unreadCount: z.number(),
  }),
  error: z.null(),
})

// ─── POST /notifications/read-all ────────────────────────────────────────────

export const ReadAllResponseSchema = z.object({
  data: z.object({ ok: z.literal(true) }),
  error: z.null(),
})

// ─── PATCH /notifications/:id/read ───────────────────────────────────────────

export const NotificationParamsSchema = z.object({ id: z.string() })

export const ReadOneResponseSchema = z.object({
  data: z.object({ ok: z.literal(true) }),
  error: z.null(),
})

// ─── Error ───────────────────────────────────────────────────────────────────

export const ErrorResponseSchema = z.object({
  data: z.null(),
  error: z.object({ code: z.string(), message: z.string() }),
})

export type ListNotificationsQuery = z.infer<typeof ListNotificationsQuerySchema>
