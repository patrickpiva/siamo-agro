import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SavedListingsService } from './service.js'
import { ListingNotFoundError } from './errors.js'

// ─── Mock do Prisma ───────────────────────────────────────────────────────────

const mockPrisma = {
  listing: {
    findUnique: vi.fn(),
  },
  savedListing: {
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
  },
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const userId = 'user_01'
const listingId = 'listing_01'
const savedId = 'saved_01'

function makeSavedRow(
  listingOverrides: Record<string, unknown> = {},
  rowOverrides: Record<string, unknown> = {},
) {
  return {
    id: savedId,
    userId,
    listingId,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01'),
    listing: {
      id: listingId,
      kind: 'OFFER',
      category: 'GRAINS',
      title: 'Venda de milho safra 2024',
      description: 'Milho de alta qualidade, colheita recente.',
      price: 150,
      negotiable: false,
      status: 'ACTIVE',
      viewCount: 0,
      createdAt: new Date('2024-06-01'),
      updatedAt: new Date('2024-06-01'),
      photos: [],
      profile: {
        id: 'profile_02',
        userId: 'user_02',
        name: 'Maria Souza',
        photo: null,
        currentRating: 4.5,
        badge: 'SILVER',
        location: { city: 'Sorriso', state: 'MT' },
      },
      ...listingOverrides,
    },
    ...rowOverrides,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SavedListingsService', () => {
  let service: SavedListingsService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new SavedListingsService(mockPrisma as never)
  })

  // ── toggle ─────────────────────────────────────────────────────────────────

  describe('toggle', () => {
    it('throws ListingNotFoundError when listing does not exist', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null)

      await expect(service.toggle(userId, listingId)).rejects.toBeInstanceOf(ListingNotFoundError)
    })

    it('creates a saved record and returns { saved: true } when not yet saved', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({ id: listingId })
      mockPrisma.savedListing.findUnique.mockResolvedValue(null)
      mockPrisma.savedListing.create.mockResolvedValue({ id: savedId })

      const result = await service.toggle(userId, listingId)

      expect(result).toEqual({ saved: true })
      expect(mockPrisma.savedListing.create).toHaveBeenCalledWith({
        data: { userId, listingId },
      })
      expect(mockPrisma.savedListing.delete).not.toHaveBeenCalled()
    })

    it('deletes the saved record and returns { saved: false } when already saved', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({ id: listingId })
      mockPrisma.savedListing.findUnique.mockResolvedValue({ id: savedId })
      mockPrisma.savedListing.delete.mockResolvedValue({ id: savedId })

      const result = await service.toggle(userId, listingId)

      expect(result).toEqual({ saved: false })
      expect(mockPrisma.savedListing.delete).toHaveBeenCalledWith({
        where: { userId_listingId: { userId, listingId } },
      })
      expect(mockPrisma.savedListing.create).not.toHaveBeenCalled()
    })

    it('uses the compound key { userId_listingId } to look up the existing record', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({ id: listingId })
      mockPrisma.savedListing.findUnique.mockResolvedValue(null)
      mockPrisma.savedListing.create.mockResolvedValue({ id: savedId })

      await service.toggle(userId, listingId)

      expect(mockPrisma.savedListing.findUnique).toHaveBeenCalledWith({
        where: { userId_listingId: { userId, listingId } },
      })
    })
  })

  // ── isSaved ────────────────────────────────────────────────────────────────

  describe('isSaved', () => {
    it('returns true when the record exists', async () => {
      mockPrisma.savedListing.findUnique.mockResolvedValue({ id: savedId })

      expect(await service.isSaved(userId, listingId)).toBe(true)
    })

    it('returns false when no record exists', async () => {
      mockPrisma.savedListing.findUnique.mockResolvedValue(null)

      expect(await service.isSaved(userId, listingId)).toBe(false)
    })
  })

  // ── list ───────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns empty data when user has no saved listings', async () => {
      mockPrisma.savedListing.findMany.mockResolvedValue([])

      const result = await service.list(userId, { limit: 20 })

      expect(result.data).toHaveLength(0)
      expect(result.meta.nextCursor).toBeNull()
      expect(result.meta.limit).toBe(20)
    })

    it('maps a saved listing row to the expected shape', async () => {
      mockPrisma.savedListing.findMany.mockResolvedValue([makeSavedRow()])

      const result = await service.list(userId, { limit: 20 })

      expect(result.data).toHaveLength(1)
      const item = result.data[0]!
      expect(item.id).toBe(listingId)
      expect(item.kind).toBe('OFFER')
      expect(item.price).toBe(150)
      expect(item.profile.name).toBe('Maria Souza')
      expect(item.profile.city).toBe('Sorriso')
      expect(item.profile.state).toBe('MT')
      expect(item.profile.badge).toBe('SILVER')
    })

    it('filters out CLOSED listings from the result', async () => {
      mockPrisma.savedListing.findMany.mockResolvedValue([makeSavedRow({ status: 'CLOSED' })])

      const result = await service.list(userId, { limit: 20 })

      expect(result.data).toHaveLength(0)
    })

    it('keeps ACTIVE and PAUSED listings', async () => {
      mockPrisma.savedListing.findMany.mockResolvedValue([
        makeSavedRow({ status: 'ACTIVE' }),
        makeSavedRow({ status: 'PAUSED' }, { id: 'saved_02', listingId: 'listing_02' }),
      ])

      const result = await service.list(userId, { limit: 20 })

      expect(result.data).toHaveLength(2)
    })

    it('returns nextCursor when there are more pages', async () => {
      // limit=1, findMany returns 2 rows (limit + 1)
      const rows = [makeSavedRow({}, { id: 'saved_01' }), makeSavedRow({}, { id: 'saved_02' })]
      mockPrisma.savedListing.findMany.mockResolvedValue(rows)

      const result = await service.list(userId, { limit: 1 })

      expect(result.meta.nextCursor).toBe('saved_01')
      expect(result.data).toHaveLength(1)
    })

    it('returns nextCursor:null on the last page', async () => {
      mockPrisma.savedListing.findMany.mockResolvedValue([makeSavedRow()])

      const result = await service.list(userId, { limit: 20 })

      expect(result.meta.nextCursor).toBeNull()
    })

    it('passes cursor to findMany when provided', async () => {
      mockPrisma.savedListing.findMany.mockResolvedValue([])

      await service.list(userId, { cursor: 'saved_00', limit: 20 })

      expect(mockPrisma.savedListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: 'saved_00' },
          skip: 1,
        }),
      )
    })
  })
})
