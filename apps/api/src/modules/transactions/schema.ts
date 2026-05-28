import { z } from 'zod'

// ─── Shared ───────────────────────────────────────────────────────────────────

export const CancellationReasonSchema = z.enum([
  'NO_RESPONSE',
  'PRICE_DISAGREEMENT',
  'QUALITY_ISSUE',
  'CHANGED_MIND',
  'OTHER',
])

export const TransactionStatusSchema = z.enum([
  'PROPOSED',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
])

export const TransactionMessageSchema = z.object({
  id: z.string(),
  transactionId: z.string(),
  senderId: z.string(),
  content: z.string(),
  createdAt: z.string().datetime(),
})

export const TransactionSchema = z.object({
  id: z.string(),
  listingId: z.string(),
  buyerId: z.string(),
  sellerId: z.string(),
  amount: z.number(),
  status: TransactionStatusSchema,
  buyerConfirmedStart: z.boolean(),
  sellerConfirmedStart: z.boolean(),
  buyerConfirmedEnd: z.boolean(),
  sellerConfirmedEnd: z.boolean(),
  cancelledById: z.string().nullable(),
  cancellationReason: CancellationReasonSchema.nullable(),
  cancelledAt: z.string().datetime().nullable(),
  completionFirstConfirmedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const ParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
  photo: z.string().nullable(),
  badge: z.string(),
})

export const TransactionDetailSchema = TransactionSchema.extend({
  messages: z.array(TransactionMessageSchema),
  listing: z.object({ id: z.string(), title: z.string(), kind: z.string() }),
  buyer: ParticipantSchema,
  seller: ParticipantSchema,
})

// ─── Params ───────────────────────────────────────────────────────────────────

export const TransactionParamsSchema = z.object({
  id: z.string(),
})

// ─── Create ───────────────────────────────────────────────────────────────────

export const CreateTransactionBodySchema = z.object({
  // z.string().cuid() would reject seed / legacy IDs; DB foreign-key handles
  // referential integrity, so any non-empty string is acceptable here.
  listingId: z.string().min(1),
  amount: z.number().positive(),
  message: z.string().min(1).max(1000),
})

export const CreateTransactionResponseSchema = z.object({
  data: TransactionSchema,
  error: z.null(),
})

// ─── List ─────────────────────────────────────────────────────────────────────

export const ListTransactionsQuerySchema = z.object({
  role: z.enum(['as_buyer', 'as_seller', 'all']).default('all'),
  status: TransactionStatusSchema.optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const ListTransactionsResponseSchema = z.object({
  data: z.array(TransactionSchema),
  error: z.null(),
  meta: z.object({ nextCursor: z.string().nullable(), limit: z.number() }),
})

// ─── Get detail ───────────────────────────────────────────────────────────────

export const GetTransactionResponseSchema = z.object({
  data: TransactionDetailSchema,
  error: z.null(),
})

// ─── Counter proposal ─────────────────────────────────────────────────────────

export const CounterProposalBodySchema = z.object({
  amount: z.number().positive(),
  message: z.string().min(1).max(1000),
})

// ─── Cancel ───────────────────────────────────────────────────────────────────

export const CancelTransactionBodySchema = z.object({
  reason: CancellationReasonSchema,
})

// ─── Send message ─────────────────────────────────────────────────────────────

export const SendMessageBodySchema = z.object({
  content: z.string().min(1).max(1000),
})

export const SendMessageResponseSchema = z.object({
  data: TransactionMessageSchema,
  error: z.null(),
})

// ─── Action responses (accept, start, complete, cancel, counter) ──────────────

export const TransactionActionResponseSchema = z.object({
  data: TransactionSchema,
  error: z.null(),
})

// ─── Error ────────────────────────────────────────────────────────────────────

export const ErrorResponseSchema = z.object({
  data: z.null(),
  error: z.object({ code: z.string(), message: z.string() }),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateTransactionBody = z.infer<typeof CreateTransactionBodySchema>
export type ListTransactionsQuery = z.infer<typeof ListTransactionsQuerySchema>
export type CounterProposalBody = z.infer<typeof CounterProposalBodySchema>
export type CancelTransactionBody = z.infer<typeof CancelTransactionBodySchema>
export type SendMessageBody = z.infer<typeof SendMessageBodySchema>
