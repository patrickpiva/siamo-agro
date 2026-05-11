import { z } from 'zod'

// ─── Presigned ────────────────────────────────────────────────────────────────

export const PresignedBodySchema = z.object({
  kind: z.enum(['listing', 'profile']),
  count: z.number().int().min(1).max(8),
})

export const PresignedUploadItemSchema = z.object({
  uploadUrl: z.string(),
  publicUrl: z.string(),
  key: z.string(),
})

export const PresignedResponseSchema = z.object({
  data: z.object({ uploads: z.array(PresignedUploadItemSchema) }),
  error: z.null(),
})

// ─── Confirm ──────────────────────────────────────────────────────────────────

export const ConfirmBodySchema = z.object({
  keys: z.array(z.string().min(1)).min(1).max(8),
})

export const ConfirmResponseSchema = z.object({
  data: z.object({ urls: z.array(z.string()) }),
  error: z.null(),
})

// ─── Error ────────────────────────────────────────────────────────────────────

export const ErrorResponseSchema = z.object({
  data: z.null(),
  error: z.object({ code: z.string(), message: z.string() }),
})

// ─── Tipos inferidos ──────────────────────────────────────────────────────────

export type PresignedBody = z.infer<typeof PresignedBodySchema>
export type ConfirmBody = z.infer<typeof ConfirmBodySchema>
