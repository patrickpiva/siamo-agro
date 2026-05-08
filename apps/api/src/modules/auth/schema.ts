import { z } from 'zod'

// ─── Shared ───────────────────────────────────────────────────────────────────

/** Formato E.164 brasileiro: +55 + DDD (2 dígitos) + número (8 ou 9 dígitos) */
export const PhoneSchema = z
  .string()
  .regex(/^\+55\d{2}\d{8,9}$/, 'Telefone deve estar no formato +55DDD9XXXXXXXX')

export const AuthUserSchema = z.object({
  id: z.string(),
  phone: z.string().nullable(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']),
  createdAt: z.string().datetime(),
})

export const ErrorResponseSchema = z.object({
  data: z.null(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
})

// ─── OTP Request ──────────────────────────────────────────────────────────────

export const RequestOtpBodySchema = z.object({
  phone: PhoneSchema,
})

export const RequestOtpResponseSchema = z.object({
  data: z.object({
    expiresIn: z.number().int().describe('Segundos até expiração do código'),
  }),
  error: z.null(),
})

// ─── OTP Verify ───────────────────────────────────────────────────────────────

export const VerifyOtpBodySchema = z.object({
  phone: PhoneSchema,
  code: z
    .string()
    .length(6)
    .regex(/^\d{6}$/, 'Código deve conter 6 dígitos'),
})

export const VerifyOtpResponseSchema = z.object({
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    user: AuthUserSchema,
    needsOnboarding: z.boolean().describe('true se o usuário ainda não tem perfil'),
  }),
  error: z.null(),
})

// ─── Refresh ──────────────────────────────────────────────────────────────────

export const RefreshBodySchema = z.object({
  refreshToken: z.string().min(1),
})

export const RefreshResponseSchema = z.object({
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
  error: z.null(),
})

// ─── Logout ───────────────────────────────────────────────────────────────────

export const LogoutBodySchema = z.object({
  refreshToken: z.string().min(1),
})

export const LogoutResponseSchema = z.object({
  data: z.object({ ok: z.literal(true) }),
  error: z.null(),
})

// ─── Tipos inferidos ──────────────────────────────────────────────────────────

export type RequestOtpBody = z.infer<typeof RequestOtpBodySchema>
export type VerifyOtpBody = z.infer<typeof VerifyOtpBodySchema>
export type RefreshBody = z.infer<typeof RefreshBodySchema>
export type LogoutBody = z.infer<typeof LogoutBodySchema>
export type AuthUser = z.infer<typeof AuthUserSchema>
