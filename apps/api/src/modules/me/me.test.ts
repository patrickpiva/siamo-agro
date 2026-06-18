import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MeService } from './service.js'

// ─── Mock queue ───────────────────────────────────────────────────────────────

const mockAddComputeMatchesJob = vi.fn().mockResolvedValue(undefined)

vi.mock('../../workers/matchmaking/queue.js', () => ({
  addComputeMatchesJob: (...args: unknown[]): Promise<void> =>
    mockAddComputeMatchesJob(...args) as Promise<void>,
}))

// ─── Mock do Prisma ───────────────────────────────────────────────────────────

const mockPrisma = {
  profile: {
    findUnique: vi.fn(),
  },
  matchScore: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  listing: {
    findMany: vi.fn(),
  },
  notification: {
    create: vi.fn(),
  },
  user: {
    update: vi.fn(),
  },
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const userId = 'user_01'
const profileId = 'profile_01'

function makeProfile(activeListingCount = 0) {
  return {
    id: profileId,
    _count: { listings: activeListingCount },
  }
}

function makeMatchRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ms_01',
    score: 0.82,
    distanceKm: 12.5,
    listing: {
      id: 'listing_01',
      kind: 'DEMAND',
      category: 'CORN',
      title: 'Compra de milho 2024',
      description: 'Produtor buscando milho a granel.',
      price: null,
      negotiable: true,
      status: 'ACTIVE',
      viewCount: 5,
      createdAt: new Date('2024-06-01'),
      updatedAt: new Date('2024-06-01'),
      photos: [],
      profile: {
        id: 'profile_02',
        userId: 'user_02',
        name: 'Carlos Lima',
        photo: null,
        currentRating: 4.2,
        badge: 'GOLD',
        location: { city: 'Sinop', state: 'MT' },
      },
    },
    ...overrides,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MeService.getFeedMatches', () => {
  let service: MeService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new MeService(mockPrisma as never)
  })

  // ── Profile not found ──────────────────────────────────────────────────────

  it('returns empty data and computing:false when profile does not exist', async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(null)

    const result = await service.getFeedMatches(userId, { limit: 20 })

    expect(result.data).toHaveLength(0)
    expect(result.meta.nextCursor).toBeNull()
    expect(result.computing).toBe(false)
  })

  // ── No match scores yet ────────────────────────────────────────────────────

  it('returns computing:false when user has no active listings and no scores', async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(makeProfile(0))
    mockPrisma.matchScore.findMany.mockResolvedValue([])

    const result = await service.getFeedMatches(userId, { limit: 20 })

    expect(result.computing).toBe(false)
    expect(result.data).toHaveLength(0)
    expect(mockAddComputeMatchesJob).not.toHaveBeenCalled()
  })

  it('returns computing:true and dispatches jobs when user has active listings but no scores', async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(makeProfile(2))
    mockPrisma.matchScore.findMany.mockResolvedValue([])
    mockPrisma.listing.findMany.mockResolvedValue([{ id: 'listing_01' }, { id: 'listing_02' }])

    const result = await service.getFeedMatches(userId, { limit: 20 })

    expect(result.computing).toBe(true)
    expect(result.data).toHaveLength(0)
    expect(mockAddComputeMatchesJob).toHaveBeenCalledTimes(2)
    // dedupe: true — disparos via feed usam jobId fixo para não inundar a fila
    expect(mockAddComputeMatchesJob).toHaveBeenCalledWith('listing_01', { dedupe: true })
    expect(mockAddComputeMatchesJob).toHaveBeenCalledWith('listing_02', { dedupe: true })
  })

  // ── With match scores ──────────────────────────────────────────────────────

  it('returns match data in the expected shape when scores exist', async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(makeProfile(1))
    mockPrisma.matchScore.findMany.mockResolvedValue([makeMatchRow()])

    const result = await service.getFeedMatches(userId, { limit: 20 })

    expect(result.computing).toBe(false)
    expect(result.data).toHaveLength(1)

    const item = result.data[0]!
    expect(item.id).toBe('listing_01')
    expect(item.matchScore).toBe(0.82)
    expect(item.distanceKm).toBe(12.5)
    expect(item.profile.name).toBe('Carlos Lima')
    expect(item.profile.city).toBe('Sinop')
    expect(item.profile.state).toBe('MT')
  })

  it('sets price to null when listing has no price', async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(makeProfile(1))
    mockPrisma.matchScore.findMany.mockResolvedValue([makeMatchRow({ price: null })])

    const result = await service.getFeedMatches(userId, { limit: 20 })

    expect(result.data[0]!.price).toBeNull()
  })

  it('converts Decimal price to Number', async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(makeProfile(1))
    mockPrisma.matchScore.findMany.mockResolvedValue([
      makeMatchRow({ listing: { ...makeMatchRow().listing, price: 250 } }),
    ])

    const result = await service.getFeedMatches(userId, { limit: 20 })

    expect(result.data[0]!.price).toBe(250)
  })

  // ── Pagination ─────────────────────────────────────────────────────────────

  it('returns nextCursor when there are more results than the limit', async () => {
    const rows = [
      makeMatchRow({ id: 'ms_01', score: 0.9 }),
      makeMatchRow({ id: 'ms_02', score: 0.8 }),
    ]
    mockPrisma.profile.findUnique.mockResolvedValue(makeProfile(1))
    mockPrisma.matchScore.findMany.mockResolvedValue(rows)

    const result = await service.getFeedMatches(userId, { limit: 1 })

    expect(result.data).toHaveLength(1)
    expect(result.meta.nextCursor).toBe('ms_01')
  })

  it('returns nextCursor:null on the last page', async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(makeProfile(1))
    mockPrisma.matchScore.findMany.mockResolvedValue([makeMatchRow()])

    const result = await service.getFeedMatches(userId, { limit: 20 })

    expect(result.meta.nextCursor).toBeNull()
  })

  it('does not dispatch compute jobs when cursor is provided (not first page)', async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(makeProfile(2))
    // Simulate no results on page 2
    mockPrisma.matchScore.findUnique.mockResolvedValue({ score: 0.7 })
    mockPrisma.matchScore.findMany.mockResolvedValue([])

    const result = await service.getFeedMatches(userId, { cursor: 'ms_00', limit: 20 })

    expect(result.computing).toBe(false)
    expect(mockAddComputeMatchesJob).not.toHaveBeenCalled()
  })

  it('pre-fetches the cursor score when a cursor is provided', async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(makeProfile(1))
    mockPrisma.matchScore.findUnique.mockResolvedValue({ score: 0.75 })
    mockPrisma.matchScore.findMany.mockResolvedValue([makeMatchRow()])

    await service.getFeedMatches(userId, { cursor: 'ms_00', limit: 20 })

    expect(mockPrisma.matchScore.findUnique).toHaveBeenCalledWith({
      where: { id: 'ms_00' },
      select: { score: true },
    })
  })
})
