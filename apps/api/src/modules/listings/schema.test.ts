import { describe, it, expect } from 'vitest'
import {
  ListingDetailProfileSchema,
  CreateListingBodySchema,
  UpdateListingBodySchema,
} from './schema.js'

// ─── ListingDetailProfileSchema ───────────────────────────────────────────────

describe('ListingDetailProfileSchema', () => {
  const validProfile = {
    id: 'profile-cuid',
    userId: 'user-cuid',
    name: 'João Silva',
    photo: 'https://cdn.example.com/photo.jpg',
    rating: 4.5,
    badge: 'GOLD' as const,
    city: 'Uberlândia',
    state: 'MG',
  }

  it('accepts a fully populated profile', () => {
    expect(ListingDetailProfileSchema.safeParse(validProfile).success).toBe(true)
  })

  it('allows null city and state (user without location)', () => {
    const result = ListingDetailProfileSchema.safeParse({
      ...validProfile,
      city: null,
      state: null,
    })
    expect(result.success).toBe(true)
  })

  it('requires id', () => {
    const { id: _id, ...withoutId } = validProfile
    expect(ListingDetailProfileSchema.safeParse(withoutId).success).toBe(false)
  })

  it('requires userId', () => {
    const { userId: _userId, ...withoutUserId } = validProfile
    expect(ListingDetailProfileSchema.safeParse(withoutUserId).success).toBe(false)
  })

  it('rejects invalid badge value', () => {
    const result = ListingDetailProfileSchema.safeParse({
      ...validProfile,
      badge: 'PLATINUM',
    })
    expect(result.success).toBe(false)
  })
})

// ─── CreateListingBodySchema ──────────────────────────────────────────────────

describe('CreateListingBodySchema', () => {
  const validOffer = {
    kind: 'OFFER' as const,
    category: 'COFFEE',
    title: 'Café arábica especial safra 2025',
    description: 'Café de alta qualidade, colhido à mão, certificado orgânico.',
    price: 850,
    negotiable: false,
    photoUrls: [],
  }

  it('accepts a valid OFFER payload', () => {
    expect(CreateListingBodySchema.safeParse(validOffer).success).toBe(true)
  })

  it('accepts GRAINS for OFFER', () => {
    expect(CreateListingBodySchema.safeParse({ ...validOffer, category: 'GRAINS' }).success).toBe(
      true,
    )
  })

  it('accepts DAIRY for DEMAND', () => {
    expect(
      CreateListingBodySchema.safeParse({ ...validOffer, kind: 'DEMAND', category: 'DAIRY' })
        .success,
    ).toBe(true)
  })

  it('accepts VEGETABLES for OFFER', () => {
    expect(
      CreateListingBodySchema.safeParse({ ...validOffer, category: 'VEGETABLES' }).success,
    ).toBe(true)
  })

  it('rejects title shorter than 10 characters', () => {
    const result = CreateListingBodySchema.safeParse({ ...validOffer, title: 'Curto' })
    expect(result.success).toBe(false)
  })

  it('rejects description shorter than 30 characters', () => {
    const result = CreateListingBodySchema.safeParse({ ...validOffer, description: 'Muito curto.' })
    expect(result.success).toBe(false)
  })

  it('rejects category that does not match kind (TRACTOR is EQUIPMENT-only)', () => {
    const result = CreateListingBodySchema.safeParse({ ...validOffer, category: 'TRACTOR' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('category')
    }
  })

  it('rejects more than 8 photo URLs', () => {
    const urls = Array.from({ length: 9 }, (_, i) => `https://cdn.example.com/img${i}.jpg`)
    const result = CreateListingBodySchema.safeParse({ ...validOffer, photoUrls: urls })
    expect(result.success).toBe(false)
  })

  it('makes price optional for DEMAND', () => {
    const { price: _price, ...withoutPrice } = validOffer
    const result = CreateListingBodySchema.safeParse({
      ...withoutPrice,
      kind: 'DEMAND',
      category: 'COFFEE',
    })
    expect(result.success).toBe(true)
  })
})

// ─── UpdateListingBodySchema ──────────────────────────────────────────────────

describe('UpdateListingBodySchema', () => {
  it('accepts partial update with title only', () => {
    const result = UpdateListingBodySchema.safeParse({
      title: 'Novo título com mais de dez caracteres',
    })
    expect(result.success).toBe(true)
  })

  it('accepts partial update with negotiable only', () => {
    const result = UpdateListingBodySchema.safeParse({ negotiable: true })
    expect(result.success).toBe(true)
  })

  it('rejects completely empty object (at least one field required)', () => {
    const result = UpdateListingBodySchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects title shorter than 10 characters', () => {
    const result = UpdateListingBodySchema.safeParse({ title: 'Curto' })
    expect(result.success).toBe(false)
  })

  it('accepts null price (removing price from listing)', () => {
    const result = UpdateListingBodySchema.safeParse({ price: null })
    expect(result.success).toBe(true)
  })
})
