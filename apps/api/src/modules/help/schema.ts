import { z } from 'zod'

const FaqItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  category: z.string().optional(),
})

export const ListFaqResponseSchema = z.object({
  data: z.array(FaqItemSchema),
  error: z.null(),
})

export const SearchFaqQuerySchema = z.object({
  q: z.string().min(1).max(200),
})

export const SearchFaqResponseSchema = z.object({
  data: z.array(FaqItemSchema),
  error: z.null(),
})

export const ErrorResponseSchema = z.object({
  data: z.null(),
  error: z.object({ code: z.string(), message: z.string() }),
})
