import { z } from 'zod'

export const LISTING_KINDS = ['OFFER', 'DEMAND', 'SERVICE', 'EQUIPMENT'] as const
export type ListingKindEnum = (typeof LISTING_KINDS)[number]

export const LISTING_CATEGORIES = [
  'COFFEE',
  'SOY',
  'CORN',
  'GRAINS',
  'LIVESTOCK',
  'DAIRY',
  'FRUITS',
  'VEGETABLES',
  'AGRONOMY',
  'VETERINARY',
  'CONSULTING',
  'MECHANICS',
  'LABOR',
  'TRANSPORT',
  'IRRIGATION',
  'TRACTOR',
  'HARVESTER',
  'IRRIGATION_SYSTEM',
  'TOOLS',
  'STORAGE',
  'OTHER',
] as const
export type ListingCategoryEnum = (typeof LISTING_CATEGORIES)[number]

export const LISTING_STATUSES = ['ACTIVE', 'PAUSED', 'CLOSED'] as const
export type ListingStatusEnum = (typeof LISTING_STATUSES)[number]

export const stepOneSchema = z.object({
  kind: z.enum(LISTING_KINDS),
})

export const stepTwoSchema = z.object({
  category: z.enum(LISTING_CATEGORIES),
  title: z
    .string()
    .min(10, 'Título precisa de pelo menos 10 caracteres')
    .max(120, 'Máximo 120 caracteres')
    .refine((s) => !/^[A-Z\s!?0-9]+$/.test(s), 'Evite escrever tudo em maiúsculas'),
})

export const stepThreeSchema = z.object({
  description: z
    .string()
    .min(30, 'Descrição precisa de pelo menos 30 caracteres')
    .max(2000, 'Máximo 2000 caracteres'),
  price: z.number().int().positive().nullable(),
  negotiable: z.boolean().default(false),
})

export const stepFourSchema = z.object({
  photos: z
    .array(
      z.object({
        remoteKey: z.string(),
        remoteUrl: z.string().url(),
      }),
    )
    .min(1, 'Adicione ao menos uma foto')
    .max(8, 'Máximo 8 fotos'),
})

export const editListingSchema = stepTwoSchema
  .and(stepThreeSchema)
  .and(z.object({ photos: stepFourSchema.shape.photos.optional() }))

export type StepOneInput = z.infer<typeof stepOneSchema>
export type StepTwoInput = z.infer<typeof stepTwoSchema>
export type StepThreeInput = z.infer<typeof stepThreeSchema>
export type StepFourInput = z.infer<typeof stepFourSchema>
export type EditListingInput = z.infer<typeof editListingSchema>
