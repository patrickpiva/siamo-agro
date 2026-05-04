import { describe, it, expect } from 'vitest'
import { createUserSchema, createListingSchema, paginationSchema } from './index'

describe('createUserSchema', () => {
  it('valida usuário válido', () => {
    const result = createUserSchema.safeParse({
      email: 'joao@fazenda.com',
      name: 'João Silva',
      role: 'PRODUCER',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita e-mail inválido', () => {
    const result = createUserSchema.safeParse({
      email: 'nao-é-email',
      name: 'João',
      role: 'PRODUCER',
    })
    expect(result.success).toBe(false)
  })
})

describe('paginationSchema', () => {
  it('aplica defaults', () => {
    const result = paginationSchema.parse({})
    expect(result).toEqual({ page: 1, pageSize: 20 })
  })

  it('rejeita pageSize acima do limite', () => {
    const result = paginationSchema.safeParse({ pageSize: 999 })
    expect(result.success).toBe(false)
  })
})

describe('createListingSchema', () => {
  it('valida anúncio válido', () => {
    const result = createListingSchema.safeParse({
      title: 'Serviço de plantio',
      description: 'Oferecemos serviço de plantio mecanizado para soja e milho.',
      category: 'MACHINERY',
    })
    expect(result.success).toBe(true)
  })
})
