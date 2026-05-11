import { z } from 'zod'

// ─── Auth ─────────────────────────────────────────────────────────────────────

// Telefone BR no formato E.164: +55 + DDD (2 dígitos) + número (8 ou 9 dígitos)
export const phoneSchema = z
  .string()
  .regex(/^\+55\d{2}\d{8,9}$/, 'Informe um telefone brasileiro válido com DDD')

// OTP: 6 dígitos numéricos
export const otpCodeSchema = z
  .string()
  .length(6, 'O código deve ter 6 dígitos')
  .regex(/^\d{6}$/, 'O código deve conter apenas números')

// ─── Profile ──────────────────────────────────────────────────────────────────

export const profileNameSchema = z
  .string()
  .min(2, 'Nome deve ter ao menos 2 caracteres')
  .max(80, 'Nome deve ter no máximo 80 caracteres')
  .refine((s) => !/^\d+$/.test(s), 'Nome não pode conter apenas números')

export const bioSchema = z.string().max(300, 'Bio deve ter no máximo 300 caracteres').optional()

export const photoSchema = z
  .instanceof(File)
  .refine((f) => f.size <= 5 * 1024 * 1024, 'Foto deve ter no máximo 5MB')
  .refine(
    (f) => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type),
    'Formato aceito: JPEG, PNG ou WebP',
  )
  .optional()

// ─── Location ─────────────────────────────────────────────────────────────────

export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  city: z.string().min(1, 'Informe a cidade'),
  state: z.string().length(2, 'Estado inválido'),
})

// ─── Onboarding forms ─────────────────────────────────────────────────────────

export const phoneFormSchema = z.object({
  phone: phoneSchema,
})

export const otpFormSchema = z.object({
  code: otpCodeSchema,
})

export const profileTypeFormSchema = z.object({
  profileType: z.enum(['PRODUCER', 'PROVIDER'], {
    required_error: 'Selecione um tipo de perfil',
  }),
})

export const profileDataFormSchema = z.object({
  name: profileNameSchema,
  bio: bioSchema,
})

export const locationFormSchema = z.object({
  location: locationSchema,
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type PhoneForm = z.infer<typeof phoneFormSchema>
export type OtpForm = z.infer<typeof otpFormSchema>
export type ProfileTypeForm = z.infer<typeof profileTypeFormSchema>
export type ProfileDataForm = z.infer<typeof profileDataFormSchema>
export type LocationForm = z.infer<typeof locationFormSchema>
