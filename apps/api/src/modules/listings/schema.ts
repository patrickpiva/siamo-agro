import { z } from 'zod'
import { CATEGORIES, isCategoryValidForKind } from '@agrolink/shared'

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const LISTING_KINDS = ['OFFER', 'DEMAND', 'SERVICE', 'EQUIPMENT'] as const
export type ListingKindEnum = (typeof LISTING_KINDS)[number]

// Re-export for convenience in tests
export { isCategoryValidForKind, CATEGORIES }

// ─── Shared sub-schemas ───────────────────────────────────────────────────────

export const ListingPhotoSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  order: z.number().int(),
})

export const ListingProfileSchema = z.object({
  name: z.string(),
  photo: z.string().url().nullable(),
  rating: z.number(),
  badge: z.enum(['NONE', 'BRONZE', 'SILVER', 'GOLD']),
})

export const ListingDetailProfileSchema = ListingProfileSchema.extend({
  id: z.string(),
  userId: z.string(),
  city: z.string().nullable(),
  state: z.string().nullable(),
})

export const ListingSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  kind: z.enum(LISTING_KINDS),
  category: z.string(),
  title: z.string(),
  description: z.string(),
  price: z.number().nullable(),
  negotiable: z.boolean(),
  status: z.enum(['ACTIVE', 'PAUSED', 'CLOSED']),
  viewCount: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const ListingWithProfileSchema = ListingSchema.extend({
  profile: ListingProfileSchema,
})

export const ListingDetailSchema = ListingSchema.extend({
  profile: ListingDetailProfileSchema,
  photos: z.array(ListingPhotoSchema),
})

export const ErrorResponseSchema = z.object({
  data: z.null(),
  error: z.object({ code: z.string(), message: z.string() }),
})

// ─── POST /listings ───────────────────────────────────────────────────────────

export const CreateListingBodySchema = z
  .object({
    kind: z.enum(LISTING_KINDS),
    category: z.string().min(1, 'Categoria é obrigatória'),
    title: z
      .string()
      .min(10, 'Título deve ter pelo menos 10 caracteres')
      .max(120, 'Título deve ter no máximo 120 caracteres'),
    description: z
      .string()
      .min(30, 'Descrição deve ter pelo menos 30 caracteres')
      .max(2000, 'Descrição deve ter no máximo 2000 caracteres'),
    price: z.number().positive('Preço deve ser positivo').optional(),
    negotiable: z.boolean().default(false),
    photoUrls: z
      .array(z.string().url('URL de foto inválida'))
      .max(8, 'Máximo de 8 fotos')
      .default([]),
  })
  .refine(({ kind, category }) => isCategoryValidForKind(category, kind), {
    message: 'Categoria inválida para o tipo de anúncio',
    path: ['category'],
  })

export const CreateListingResponseSchema = z.object({
  data: ListingDetailSchema,
  error: z.null(),
})

// ─── GET /listings ────────────────────────────────────────────────────────────

export const ListListingsQuerySchema = z.object({
  kind: z.enum(LISTING_KINDS).optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().optional(),
  search: z.string().min(1).max(200).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export const ListListingsResponseSchema = z.object({
  data: z.array(ListingWithProfileSchema),
  error: z.null(),
  meta: z.object({
    nextCursor: z.string().nullable(),
    limit: z.number(),
  }),
})

// ─── GET /listings/:id ────────────────────────────────────────────────────────

export const GetListingParamsSchema = z.object({
  id: z.string(),
})

export const GetListingResponseSchema = z.object({
  data: ListingDetailSchema,
  error: z.null(),
})

// ─── PATCH /listings/:id ──────────────────────────────────────────────────────

export const UpdateListingBodySchema = z
  .object({
    category: z.string().min(1).optional(),
    title: z
      .string()
      .min(10, 'Título deve ter pelo menos 10 caracteres')
      .max(120, 'Título deve ter no máximo 120 caracteres')
      .optional(),
    description: z
      .string()
      .min(30, 'Descrição deve ter pelo menos 30 caracteres')
      .max(2000, 'Descrição deve ter no máximo 2000 caracteres')
      .optional(),
    price: z.number().positive('Preço deve ser positivo').nullable().optional(),
    negotiable: z.boolean().optional(),
    photoUrls: z
      .array(z.string().url('URL de foto inválida'))
      .max(8, 'Máximo de 8 fotos')
      .optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'Ao menos um campo deve ser fornecido para atualização',
  })

export const UpdateListingResponseSchema = z.object({
  data: ListingDetailSchema,
  error: z.null(),
})

// ─── GET /listings/mine ───────────────────────────────────────────────────────

export const ListMyListingsQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'CLOSED']).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export const ListMyListingsResponseSchema = z.object({
  data: z.array(ListingDetailSchema),
  error: z.null(),
  meta: z.object({
    nextCursor: z.string().nullable(),
    limit: z.number(),
  }),
})

// ─── DELETE / pause / resume ──────────────────────────────────────────────────

export const StatusUpdateResponseSchema = z.object({
  data: z.object({ ok: z.literal(true) }),
  error: z.null(),
})

// ─── Tipos inferidos ──────────────────────────────────────────────────────────

export type CreateListingBody = z.infer<typeof CreateListingBodySchema>
export type UpdateListingBody = z.infer<typeof UpdateListingBodySchema>
export type ListListingsQuery = z.infer<typeof ListListingsQuerySchema>
export type ListMyListingsQuery = z.infer<typeof ListMyListingsQuerySchema>
export type ListingDetail = z.infer<typeof ListingDetailSchema>
export type ListingWithProfile = z.infer<typeof ListingWithProfileSchema>
