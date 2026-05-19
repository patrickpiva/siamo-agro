import { z } from 'zod'

export const ConsentBodySchema = z.object({
  terms: z.boolean(),
  privacy: z.boolean(),
  marketingWhatsapp: z.boolean().optional().default(false),
})

export const ConsentResponseSchema = z.object({
  data: z.object({
    termsAcceptedAt: z.string().nullable(),
    privacyAcceptedAt: z.string().nullable(),
    marketingWhatsappOptInAt: z.string().nullable(),
  }),
  error: z.null(),
})

export const ErrorResponseSchema = z.object({
  data: z.null(),
  error: z.object({ code: z.string(), message: z.string() }),
})

export type ConsentBody = z.infer<typeof ConsentBodySchema>
