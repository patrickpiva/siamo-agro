import { z } from 'zod'

export const createUserSchema = z.object({
  email: z.string().email('E-mail inválido'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  phone: z
    .string()
    .regex(/^\+?55\d{10,11}$/, 'Telefone inválido')
    .optional(),
  role: z.enum(['PRODUCER', 'PROVIDER']),
})

export const createProducerProfileSchema = z.object({
  farmName: z.string().min(2, 'Nome da propriedade obrigatório').max(150),
  state: z.string().length(2, 'Use a sigla do estado (ex: SP)'),
  city: z.string().min(2, 'Cidade obrigatória').max(100),
  hectares: z.number().positive('Deve ser positivo').optional(),
  cropTypes: z.array(z.string()).min(1, 'Informe pelo menos uma cultura'),
})

export const createProviderProfileSchema = z.object({
  companyName: z.string().min(2, 'Nome da empresa obrigatório').max(150),
  services: z.array(z.string()).min(1, 'Informe pelo menos um serviço'),
  states: z.array(z.string().length(2)).min(1, 'Informe pelo menos um estado'),
})

export const createListingSchema = z.object({
  title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres').max(150),
  description: z.string().min(20, 'Descrição deve ter pelo menos 20 caracteres').max(2000),
  category: z.enum([
    'MACHINERY',
    'PEST_CONTROL',
    'CONSULTING',
    'LOGISTICS',
    'SOIL_ANALYSIS',
    'IRRIGATION',
    'OTHER',
  ]),
  priceFrom: z.number().positive('Deve ser positivo').optional(),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type CreateProducerProfileInput = z.infer<typeof createProducerProfileSchema>
export type CreateProviderProfileInput = z.infer<typeof createProviderProfileSchema>
export type CreateListingInput = z.infer<typeof createListingSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
