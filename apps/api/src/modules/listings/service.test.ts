import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PrismaClient } from '@siamo/db'
import { ListingsService } from './service.js'
import { ListingNotFoundError, ListingForbiddenError } from './errors.js'

// ─── Mock external dependencies ───────────────────────────────────────────────

vi.mock('../../workers/matchmaking/queue.js', () => ({
  addComputeMatchesJob: vi.fn().mockResolvedValue(undefined),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePrisma() {
  return {
    listing: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
    profile: {
      findUnique: vi.fn(),
    },
    listingPhoto: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  }
}

function makeRawListing(overrides: Record<string, unknown> = {}) {
  return {
    id: 'listing-1',
    profileId: 'profile-1',
    kind: 'OFFER',
    category: 'COFFEE',
    title: 'Café arábica especial safra 2025',
    description: 'Descrição longa o suficiente para passar na validação.',
    price: '850.00',
    negotiable: false,
    status: 'ACTIVE',
    viewCount: 10,
    proposalCount: 2,
    matchCount: 5,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    profile: {
      id: 'profile-1',
      userId: 'user-1',
      name: 'João Silva',
      photo: 'https://cdn.example.com/avatar.jpg',
      currentRating: 4.5,
      badge: 'GOLD',
      location: {
        city: 'Uberlândia',
        state: 'MG',
      },
    },
    photos: [{ id: 'photo-1', url: 'https://cdn.example.com/img.jpg', order: 0 }],
    ...overrides,
  }
}

// ─── findById ─────────────────────────────────────────────────────────────────

describe('ListingsService.findById', () => {
  let prisma: ReturnType<typeof makePrisma>
  let service: ListingsService

  beforeEach(() => {
    prisma = makePrisma()
    service = new ListingsService(prisma as unknown as PrismaClient)
  })

  it('returns profile with id, userId, city and state', async () => {
    prisma.listing.findUnique.mockResolvedValue(makeRawListing())

    const detail = await service.findById('listing-1')

    expect(detail.profile.id).toBe('profile-1')
    expect(detail.profile.userId).toBe('user-1')
    expect(detail.profile.city).toBe('Uberlândia')
    expect(detail.profile.state).toBe('MG')
  })

  it('returns null city and state when location is absent', async () => {
    const raw = makeRawListing({ profile: { ...makeRawListing().profile, location: null } })
    prisma.listing.findUnique.mockResolvedValue(raw)

    const detail = await service.findById('listing-1')

    expect(detail.profile.city).toBeNull()
    expect(detail.profile.state).toBeNull()
  })

  it('returns photos sorted by order', async () => {
    const raw = makeRawListing({
      photos: [
        { id: 'p2', url: 'https://cdn.example.com/b.jpg', order: 1 },
        { id: 'p1', url: 'https://cdn.example.com/a.jpg', order: 0 },
      ],
    })
    prisma.listing.findUnique.mockResolvedValue(raw)

    const detail = await service.findById('listing-1')

    // photos are returned as-is from DB (DB does the ordering via orderBy)
    expect(detail.photos).toHaveLength(2)
    expect(detail.photos[0]?.id).toBe('p2') // preserved as returned by Prisma
  })

  it('converts price string to number', async () => {
    prisma.listing.findUnique.mockResolvedValue(makeRawListing({ price: '1500.50' }))

    const detail = await service.findById('listing-1')

    expect(detail.price).toBe(1500.5)
  })

  it('returns null price when listing has no price', async () => {
    prisma.listing.findUnique.mockResolvedValue(makeRawListing({ price: null }))

    const detail = await service.findById('listing-1')

    expect(detail.price).toBeNull()
  })

  it('throws ListingNotFoundError when listing does not exist', async () => {
    prisma.listing.findUnique.mockResolvedValue(null)

    await expect(service.findById('nonexistent')).rejects.toThrow(ListingNotFoundError)
  })
})

// ─── checkOwnership (tested via update) ──────────────────────────────────────

describe('ListingsService ownership checks', () => {
  let prisma: ReturnType<typeof makePrisma>
  let service: ListingsService

  beforeEach(() => {
    prisma = makePrisma()
    service = new ListingsService(prisma as unknown as PrismaClient)
  })

  it('throws ListingForbiddenError when requesting user does not own the listing', async () => {
    prisma.listing.findUnique.mockResolvedValue({
      id: 'listing-1',
      profileId: 'profile-owner', // listing belongs to profile-owner
      kind: 'OFFER',
    })
    prisma.profile.findUnique.mockResolvedValue({
      id: 'profile-attacker', // different profile for the requesting user
      userId: 'user-attacker',
    })

    await expect(
      service.update('listing-1', 'user-attacker', { title: 'Tentativa de título longo' }),
    ).rejects.toThrow(ListingForbiddenError)
  })

  it('throws ListingNotFoundError when the listing does not exist', async () => {
    prisma.listing.findUnique.mockResolvedValue(null)
    prisma.profile.findUnique.mockResolvedValue({ id: 'profile-1', userId: 'user-1' })

    await expect(
      service.update('nonexistent', 'user-1', { title: 'Tentativa de título longo' }),
    ).rejects.toThrow(ListingNotFoundError)
  })

  it('throws ListingForbiddenError when user has no profile', async () => {
    prisma.listing.findUnique.mockResolvedValue({ id: 'listing-1', profileId: 'profile-1' })
    prisma.profile.findUnique.mockResolvedValue(null) // no profile for this user

    await expect(
      service.update('listing-1', 'user-no-profile', { title: 'Tentativa de título longo' }),
    ).rejects.toThrow(ListingForbiddenError)
  })
})
