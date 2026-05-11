import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ListingsService } from './service.js'
import {
  ListingNotFoundError,
  ListingForbiddenError,
  ListingInvalidCategoryError,
  ListingProfileNotFoundError,
  ListingPhotoOwnershipError,
} from './errors.js'
import { CreateListingBodySchema } from './schema.js'

// ─── Mock do Prisma ───────────────────────────────────────────────────────────

const mockPrisma = {
  profile: {
    findUnique: vi.fn(),
  },
  listing: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  listingPhoto: {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const fakeUserId = 'user_01'
const fakeProfileId = 'profile_01'
const fakeListingId = 'listing_01'

const fakeProfile = {
  id: fakeProfileId,
  userId: fakeUserId,
  name: 'João Silva',
  photo: null,
  currentRating: 4.5,
  badge: 'SILVER' as const,
  type: 'PRODUCER',
  bio: null,
  ratingCount: 10,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

function makeListing(overrides = {}) {
  return {
    id: fakeListingId,
    profileId: fakeProfileId,
    kind: 'OFFER',
    category: 'GRAINS',
    title: 'Venda de milho safra 2024',
    description: 'Milho de alta qualidade, colheita recente, disponível para venda imediata.',
    price: { toNumber: () => 150, toString: () => '150' } as unknown,
    status: 'ACTIVE',
    viewCount: 0,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01'),
    profile: fakeProfile,
    photos: [],
    ...overrides,
  }
}

function makeRawRow(overrides = {}) {
  return {
    id: fakeListingId,
    profileId: fakeProfileId,
    kind: 'OFFER',
    category: 'GRAINS',
    title: 'Venda de milho safra 2024',
    description: 'Milho de alta qualidade, colheita recente, disponível para venda imediata.',
    price: '150.00',
    status: 'ACTIVE',
    viewCount: 0,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01'),
    profileName: 'João Silva',
    profilePhoto: null,
    profileRating: 4.5,
    profileBadge: 'SILVER',
    ...overrides,
  }
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('ListingsService', () => {
  let service: ListingsService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ListingsService(mockPrisma as never)
  })

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('cria listing OFFER com categoria válida', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(fakeProfile)
      const listing = makeListing()
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
          fn({
            ...mockPrisma,
            listing: {
              ...mockPrisma.listing,
              create: vi.fn().mockResolvedValue(listing),
              findUniqueOrThrow: vi.fn().mockResolvedValue(listing),
            },
            listingPhoto: { createMany: vi.fn(), deleteMany: vi.fn() },
          }),
      )

      const result = await service.create(fakeUserId, {
        kind: 'OFFER',
        category: 'GRAINS',
        title: 'Venda de milho safra 2024',
        description: 'Milho de alta qualidade, colheita recente, disponível para venda imediata.',
        photoUrls: [],
      })

      expect(result.kind).toBe('OFFER')
      expect(result.category).toBe('GRAINS')
    })

    it('cria listing DEMAND sem preço', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(fakeProfile)
      const listing = makeListing({ kind: 'DEMAND', category: 'LIVESTOCK', price: null })
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
          fn({
            ...mockPrisma,
            listing: {
              ...mockPrisma.listing,
              create: vi.fn().mockResolvedValue(listing),
              findUniqueOrThrow: vi.fn().mockResolvedValue(listing),
            },
            listingPhoto: { createMany: vi.fn(), deleteMany: vi.fn() },
          }),
      )

      const result = await service.create(fakeUserId, {
        kind: 'DEMAND',
        category: 'LIVESTOCK',
        title: 'Preciso de gado nelore para engorda',
        description: 'Busco pelo menos 100 cabeças de gado nelore para engorda na minha fazenda.',
        photoUrls: [],
      })

      expect(result.kind).toBe('DEMAND')
      expect(result.price).toBeNull()
    })

    it('cria listing SERVICE com categoria de serviço', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(fakeProfile)
      const listing = makeListing({
        kind: 'SERVICE',
        category: 'AGRONOMY',
        price: { toNumber: () => 300, toString: () => '300' } as unknown,
      })
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
          fn({
            ...mockPrisma,
            listing: {
              ...mockPrisma.listing,
              create: vi.fn().mockResolvedValue(listing),
              findUniqueOrThrow: vi.fn().mockResolvedValue(listing),
            },
            listingPhoto: { createMany: vi.fn(), deleteMany: vi.fn() },
          }),
      )

      const result = await service.create(fakeUserId, {
        kind: 'SERVICE',
        category: 'AGRONOMY',
        title: 'Consultoria agronômica especializada',
        description:
          'Ofereço consultoria agrônoma com 10 anos de experiência em culturas tropicais.',
        price: 300,
        photoUrls: [],
      })

      expect(result.kind).toBe('SERVICE')
      expect(result.category).toBe('AGRONOMY')
    })

    it('cria listing EQUIPMENT com categoria de equipamento', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(fakeProfile)
      const listing = makeListing({
        kind: 'EQUIPMENT',
        category: 'TRACTOR',
        price: { toNumber: () => 5000, toString: () => '5000' } as unknown,
      })
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
          fn({
            ...mockPrisma,
            listing: {
              ...mockPrisma.listing,
              create: vi.fn().mockResolvedValue(listing),
              findUniqueOrThrow: vi.fn().mockResolvedValue(listing),
            },
            listingPhoto: { createMany: vi.fn(), deleteMany: vi.fn() },
          }),
      )

      const result = await service.create(fakeUserId, {
        kind: 'EQUIPMENT',
        category: 'TRACTOR',
        title: 'Trator New Holland disponível para locação',
        description: 'Trator 110cv em ótimo estado para locação por diária ou semana.',
        price: 5000,
        photoUrls: [],
      })

      expect(result.kind).toBe('EQUIPMENT')
      expect(result.category).toBe('TRACTOR')
    })

    it('lança ListingProfileNotFoundError quando usuário não tem perfil', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(null)

      await expect(
        service.create(fakeUserId, {
          kind: 'OFFER',
          category: 'GRAINS',
          title: 'Venda de milho safra 2024',
          description: 'Milho de alta qualidade, colheita recente, disponível para venda.',
          photoUrls: [],
        }),
      ).rejects.toBeInstanceOf(ListingProfileNotFoundError)
    })

    it('lança ListingPhotoOwnershipError para fotos de outro usuário', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(fakeProfile)

      await expect(
        service.create(fakeUserId, {
          kind: 'OFFER',
          category: 'GRAINS',
          title: 'Venda de milho safra 2024',
          description: 'Milho de alta qualidade, colheita recente, disponível para venda.',
          photoUrls: [
            'https://example.supabase.co/storage/v1/object/public/listings/outro_user/foto.jpg',
          ],
        }),
      ).rejects.toBeInstanceOf(ListingPhotoOwnershipError)
    })
  })

  // ── Validações de categoria vs kind ───────────────────────────────────────

  describe('validações de categoria por kind', () => {
    it('rejeita categoria AGRONOMY (SERVICE) para kind OFFER via Zod schema', () => {
      const result = CreateListingBodySchema.safeParse({
        kind: 'OFFER',
        category: 'AGRONOMY',
        title: 'Título com dez ou mais caracteres',
        description: 'Descrição com pelo menos trinta caracteres para passar na validação.',
        photoUrls: [],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0]?.path).toContain('category')
      }
    })

    it('rejeita categoria GRAINS (OFFER) para kind SERVICE via Zod schema', () => {
      const result = CreateListingBodySchema.safeParse({
        kind: 'SERVICE',
        category: 'GRAINS',
        title: 'Título com dez ou mais caracteres',
        description: 'Descrição com pelo menos trinta caracteres para passar na validação.',
        photoUrls: [],
      })
      expect(result.success).toBe(false)
    })

    it('rejeita categoria TRACTOR (EQUIPMENT) para kind OFFER via Zod schema', () => {
      const result = CreateListingBodySchema.safeParse({
        kind: 'OFFER',
        category: 'TRACTOR',
        title: 'Título com dez ou mais caracteres',
        description: 'Descrição com pelo menos trinta caracteres para passar na validação.',
        photoUrls: [],
      })
      expect(result.success).toBe(false)
    })

    it('aceita categoria OTHER para qualquer kind', () => {
      for (const kind of ['OFFER', 'DEMAND', 'SERVICE', 'EQUIPMENT'] as const) {
        const result = CreateListingBodySchema.safeParse({
          kind,
          category: 'OTHER',
          title: 'Título com dez ou mais caracteres',
          description: 'Descrição com pelo menos trinta caracteres para passar na validação.',
          photoUrls: [],
        })
        expect(result.success).toBe(true)
      }
    })

    it('lança ListingInvalidCategoryError no update quando categoria não bate com kind', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(makeListing())
      mockPrisma.profile.findUnique.mockResolvedValue(fakeProfile)

      await expect(
        service.update(fakeListingId, fakeUserId, { category: 'TRACTOR' }),
      ).rejects.toBeInstanceOf(ListingInvalidCategoryError)
    })
  })

  // ── findById ───────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('retorna listing completo quando existe', async () => {
      const listing = makeListing()
      mockPrisma.listing.findUnique.mockResolvedValue(listing)
      mockPrisma.listing.update.mockResolvedValue(listing)

      const result = await service.findById(fakeListingId)
      expect(result.id).toBe(fakeListingId)
      expect(result.profile.name).toBe('João Silva')
    })

    it('lança ListingNotFoundError quando não existe', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null)

      await expect(service.findById('inexistente')).rejects.toBeInstanceOf(ListingNotFoundError)
    })

    it('incrementa viewCount de forma assíncrona sem bloquear', async () => {
      const listing = makeListing()
      mockPrisma.listing.findUnique.mockResolvedValue(listing)
      mockPrisma.listing.update.mockResolvedValue(listing)

      await service.findById(fakeListingId)

      // update é chamado mas sem await (fire-and-forget)
      // damos um pequeno tick para a promise disparar
      await new Promise((r) => setTimeout(r, 0))
      expect(mockPrisma.listing.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { viewCount: { increment: 1 } } }),
      )
    })
  })

  // ── list ───────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('retorna listagens paginadas', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null) // sem cursor
      mockPrisma.$queryRaw.mockResolvedValue([makeRawRow(), makeRawRow({ id: 'listing_02' })])

      const result = await service.list({ limit: 20 })
      expect(result.data).toHaveLength(2)
      expect(result.meta.nextCursor).toBeNull()
    })

    it('retorna nextCursor quando há mais itens que o limit', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null)
      const rows = [
        makeRawRow({ id: 'listing_01' }),
        makeRawRow({ id: 'listing_02' }),
        makeRawRow({ id: 'listing_03' }), // o "+1" que indica hasMore
      ]
      mockPrisma.$queryRaw.mockResolvedValue(rows)

      const result = await service.list({ limit: 2 })
      expect(result.data).toHaveLength(2)
      expect(result.meta.nextCursor).toBe('listing_02')
    })

    it('busca geográfica inclui ST_DWithin chamando $queryRaw', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null)
      mockPrisma.$queryRaw.mockResolvedValue([])

      await service.list({ limit: 20, lat: -15.78, lng: -47.93, radiusKm: 50 })

      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1)
      // $queryRaw recebe tagged template: args[0]=TemplateStringsArray, args[1..N]=values interpolados
      // ST_DWithin está dentro do whereClause (value interpolado), então serializar todos os args
      const sqlStr = JSON.stringify(mockPrisma.$queryRaw.mock.calls[0])
      expect(sqlStr).toContain('ST_DWithin')
    })

    it('busca textual inclui to_tsvector chamando $queryRaw', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null)
      mockPrisma.$queryRaw.mockResolvedValue([])

      await service.list({ limit: 20, search: 'milho' })

      // to_tsvector está dentro do whereClause (value interpolado), então serializar todos os args
      const sqlStr = JSON.stringify(mockPrisma.$queryRaw.mock.calls[0])
      expect(sqlStr).toContain('to_tsvector')
      expect(sqlStr).toContain('plainto_tsquery')
    })

    it('paginação cursor resolve createdAt antes da query principal', async () => {
      const cursorDate = new Date('2024-06-01')
      mockPrisma.listing.findUnique.mockResolvedValue({ createdAt: cursorDate })
      mockPrisma.$queryRaw.mockResolvedValue([])

      await service.list({ limit: 20, cursor: 'listing_01' })

      expect(mockPrisma.listing.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'listing_01' } }),
      )
    })

    it('soft-deleted listings (CLOSED) não aparecem na lista', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null)
      // $queryRaw já filtra status = 'ACTIVE' no SQL; mockamos retornando vazio
      mockPrisma.$queryRaw.mockResolvedValue([])

      const result = await service.list({ limit: 20 })
      expect(result.data).toHaveLength(0)
    })
  })

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('usuário não-dono recebe ListingForbiddenError', async () => {
      const outroProfileId = 'profile_outro'
      mockPrisma.listing.findUnique.mockResolvedValue(makeListing({ profileId: outroProfileId }))
      mockPrisma.profile.findUnique.mockResolvedValue({ ...fakeProfile, id: fakeProfileId })

      await expect(
        service.update(fakeListingId, fakeUserId, { title: 'Novo título longo suficiente' }),
      ).rejects.toBeInstanceOf(ListingForbiddenError)
    })

    it('dono consegue atualizar título', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(makeListing())
      mockPrisma.profile.findUnique.mockResolvedValue(fakeProfile)

      const updatedListing = makeListing({ title: 'Novo título atualizado longo' })
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
          fn({
            ...mockPrisma,
            listing: {
              ...mockPrisma.listing,
              update: vi.fn().mockResolvedValue(updatedListing),
              findUniqueOrThrow: vi.fn().mockResolvedValue(updatedListing),
            },
            listingPhoto: { deleteMany: vi.fn(), createMany: vi.fn() },
          }),
      )

      const result = await service.update(fakeListingId, fakeUserId, {
        title: 'Novo título atualizado longo',
      })
      expect(result.title).toBe('Novo título atualizado longo')
    })
  })

  // ── delete ─────────────────────────────────────────────────────────────────

  describe('delete (soft)', () => {
    it('marca status como CLOSED sem remover do banco', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(makeListing())
      mockPrisma.profile.findUnique.mockResolvedValue(fakeProfile)
      mockPrisma.listing.update.mockResolvedValue({})

      await service.delete(fakeListingId, fakeUserId)

      expect(mockPrisma.listing.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'CLOSED' } }),
      )
    })

    it('usuário não-dono recebe ListingForbiddenError', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(makeListing({ profileId: 'profile_outro' }))
      mockPrisma.profile.findUnique.mockResolvedValue(fakeProfile)

      await expect(service.delete(fakeListingId, fakeUserId)).rejects.toBeInstanceOf(
        ListingForbiddenError,
      )
    })
  })

  // ── pause / resume ─────────────────────────────────────────────────────────

  describe('pause e resume', () => {
    it('pause altera status para PAUSED', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(makeListing())
      mockPrisma.profile.findUnique.mockResolvedValue(fakeProfile)
      mockPrisma.listing.update.mockResolvedValue({})

      await service.pause(fakeListingId, fakeUserId)

      expect(mockPrisma.listing.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'PAUSED' } }),
      )
    })

    it('resume altera status para ACTIVE', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(makeListing({ status: 'PAUSED' }))
      mockPrisma.profile.findUnique.mockResolvedValue(fakeProfile)
      mockPrisma.listing.update.mockResolvedValue({})

      await service.resume(fakeListingId, fakeUserId)

      expect(mockPrisma.listing.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'ACTIVE' } }),
      )
    })
  })
})
