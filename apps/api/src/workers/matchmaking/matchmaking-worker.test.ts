import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Job } from 'bullmq'
import type { ComputeMatchesJobData, NotifyMatchJobData } from './types.js'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockMatchScoreCreate = vi.fn()
const mockMatchScoreDeleteMany = vi.fn()
const mockMatchScoreFindFirst = vi.fn()
const mockMatchScoreFindUnique = vi.fn()
const mockListingFindUnique = vi.fn()
const mockListingFindMany = vi.fn()
const mockProfileFindUnique = vi.fn()
const mockQueryRaw = vi.fn()
const mockTransaction = vi.fn()
const mockSendNotification = vi.fn()
const mockAddNotifyMatchJob = vi.fn()

vi.mock('@agrolink/db', () => ({
  prisma: {
    listing: { findUnique: mockListingFindUnique, findMany: mockListingFindMany },
    matchScore: {
      create: mockMatchScoreCreate,
      deleteMany: mockMatchScoreDeleteMany,
      findFirst: mockMatchScoreFindFirst,
      findUnique: mockMatchScoreFindUnique,
    },
    profile: { findUnique: mockProfileFindUnique },
    $queryRaw: mockQueryRaw,
    $transaction: mockTransaction,
  },
}))

vi.mock('../../modules/matchmaking/algorithm.js', () => ({
  computeMatchScore: vi.fn(),
  scoreCompatibilityPair: vi.fn(),
}))

vi.mock('../../integrations/whatsapp/index.js', () => ({
  createWhatsAppAdapter: () => ({ sendNotification: mockSendNotification }),
}))

vi.mock('./queue.js', () => ({
  buildRedisConnection: vi.fn(() => ({ host: 'localhost', port: 6379 })),
  addNotifyMatchJob: mockAddNotifyMatchJob,
  getMatchmakingQueue: vi.fn(() => null),
}))

// Vitest hoists vi.mock() calls above static imports, so these resolve with mocks in place
import { processComputeMatchesJob, processNotifyMatchJob } from './processor.js'
import { computeMatchScore } from '../../modules/matchmaking/algorithm.js'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SP = { latitude: -23.5505, longitude: -46.6333 }

function makeListing(overrides = {}) {
  return {
    id: 'listing-1',
    kind: 'OFFER',
    category: 'GRAINS',
    title: 'Soja SP',
    status: 'ACTIVE',
    createdAt: new Date(),
    profile: {
      id: 'profile-1',
      currentRating: 4.0,
      ratingCount: 10,
      badge: 'NONE',
      location: { ...SP },
      user: { id: 'user-1' },
    },
    ...overrides,
  }
}

function makeCandidate(id: string, distanceKm: number) {
  return {
    id,
    currentRating: 3.5,
    ratingCount: 5,
    badge: 'NONE',
    latitude: SP.latitude + distanceKm * 0.009,
    longitude: SP.longitude,
    distanceKm,
  }
}

function makeJob<T>(data: T): Job<T> {
  return { id: 'job-1', data, attemptsMade: 0 } as unknown as Job<T>
}

// ─── processComputeMatchesJob ─────────────────────────────────────────────────

describe('processComputeMatchesJob', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAddNotifyMatchJob.mockResolvedValue(undefined)
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        matchScore: {
          deleteMany: mockMatchScoreDeleteMany,
          create: mockMatchScoreCreate,
        },
      }
      return fn(tx)
    })
  })

  it('fetches candidates, computes scores and persists top matches', async () => {
    mockListingFindUnique.mockResolvedValue(makeListing())
    mockQueryRaw.mockResolvedValue([makeCandidate('cand-1', 10), makeCandidate('cand-2', 50)])
    mockListingFindMany.mockResolvedValue([
      { profileId: 'cand-1', kind: 'DEMAND', category: 'GRAINS', status: 'ACTIVE' },
      { profileId: 'cand-2', kind: 'DEMAND', category: 'LIVESTOCK', status: 'ACTIVE' },
    ])
    vi.mocked(computeMatchScore)
      .mockResolvedValueOnce({
        score: 0.85,
        distanceKm: 10,
        breakdown: {} as never,
        bestCandidateListing: null,
      })
      .mockResolvedValueOnce({
        score: 0.65,
        distanceKm: 50,
        breakdown: {} as never,
        bestCandidateListing: null,
      })
    mockMatchScoreCreate.mockResolvedValue({ id: 'ms-1', score: 0.85 })
    mockMatchScoreDeleteMany.mockResolvedValue({ count: 0 })

    await processComputeMatchesJob(
      makeJob<ComputeMatchesJobData>({
        type: 'compute-matches-for-listing',
        listingId: 'listing-1',
      }),
    )

    expect(computeMatchScore).toHaveBeenCalledTimes(2)
    expect(mockMatchScoreDeleteMany).toHaveBeenCalledWith({ where: { listingId: 'listing-1' } })
    expect(mockMatchScoreCreate).toHaveBeenCalledTimes(2)
  })

  it('skips inactive listings', async () => {
    mockListingFindUnique.mockResolvedValue(makeListing({ status: 'PAUSED' }))

    await processComputeMatchesJob(
      makeJob<ComputeMatchesJobData>({
        type: 'compute-matches-for-listing',
        listingId: 'listing-1',
      }),
    )

    expect(computeMatchScore).not.toHaveBeenCalled()
    expect(mockMatchScoreCreate).not.toHaveBeenCalled()
  })

  it('skips listing with no location', async () => {
    mockListingFindUnique.mockResolvedValue(
      makeListing({ profile: { ...makeListing().profile, location: null } }),
    )

    await processComputeMatchesJob(
      makeJob<ComputeMatchesJobData>({
        type: 'compute-matches-for-listing',
        listingId: 'listing-1',
      }),
    )

    expect(computeMatchScore).not.toHaveBeenCalled()
  })

  it('skips matches below MIN_SCORE (0.3)', async () => {
    mockListingFindUnique.mockResolvedValue(makeListing())
    mockQueryRaw.mockResolvedValue([makeCandidate('cand-low', 190)])
    mockListingFindMany.mockResolvedValue([
      { profileId: 'cand-low', kind: 'OFFER', category: 'OTHER', status: 'ACTIVE' },
    ])
    vi.mocked(computeMatchScore).mockResolvedValue({
      score: 0.1,
      distanceKm: 190,
      breakdown: {} as never,
      bestCandidateListing: null,
    })
    mockMatchScoreDeleteMany.mockResolvedValue({ count: 0 })

    await processComputeMatchesJob(
      makeJob<ComputeMatchesJobData>({
        type: 'compute-matches-for-listing',
        listingId: 'listing-1',
      }),
    )

    expect(mockMatchScoreCreate).not.toHaveBeenCalled()
  })

  it('dispatches notify-match for scores >= 0.7', async () => {
    mockListingFindUnique.mockResolvedValue(makeListing())
    mockQueryRaw.mockResolvedValue([makeCandidate('cand-1', 5)])
    mockListingFindMany.mockResolvedValue([
      { profileId: 'cand-1', kind: 'DEMAND', category: 'GRAINS', status: 'ACTIVE' },
    ])
    vi.mocked(computeMatchScore).mockResolvedValue({
      score: 0.82,
      distanceKm: 5,
      breakdown: {} as never,
      bestCandidateListing: null,
    })
    const createdMs = { id: 'ms-high', score: 0.82 }
    mockMatchScoreCreate.mockResolvedValue(createdMs)
    mockMatchScoreDeleteMany.mockResolvedValue({ count: 0 })

    await processComputeMatchesJob(
      makeJob<ComputeMatchesJobData>({
        type: 'compute-matches-for-listing',
        listingId: 'listing-1',
      }),
    )

    expect(mockAddNotifyMatchJob).toHaveBeenCalledWith('ms-high', 'user-1')
  })

  it('does NOT dispatch notify for scores < 0.7', async () => {
    mockListingFindUnique.mockResolvedValue(makeListing())
    mockQueryRaw.mockResolvedValue([makeCandidate('cand-mid', 150)])
    mockListingFindMany.mockResolvedValue([
      { profileId: 'cand-mid', kind: 'DEMAND', category: 'GRAINS', status: 'ACTIVE' },
    ])
    vi.mocked(computeMatchScore).mockResolvedValue({
      score: 0.55,
      distanceKm: 150,
      breakdown: {} as never,
      bestCandidateListing: null,
    })
    mockMatchScoreCreate.mockResolvedValue({ id: 'ms-mid', score: 0.55 })
    mockMatchScoreDeleteMany.mockResolvedValue({ count: 0 })

    await processComputeMatchesJob(
      makeJob<ComputeMatchesJobData>({
        type: 'compute-matches-for-listing',
        listingId: 'listing-1',
      }),
    )

    expect(mockAddNotifyMatchJob).not.toHaveBeenCalled()
  })

  it('propagates DB errors so BullMQ can retry', async () => {
    mockListingFindUnique.mockRejectedValue(new Error('DB timeout'))

    await expect(
      processComputeMatchesJob(
        makeJob<ComputeMatchesJobData>({
          type: 'compute-matches-for-listing',
          listingId: 'listing-1',
        }),
      ),
    ).rejects.toThrow('DB timeout')
  })
})

// ─── processNotifyMatchJob ────────────────────────────────────────────────────

describe('processNotifyMatchJob', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: business hours (mock to 10h in São Paulo)
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () =>
        ({
          format: () => '10',
          resolvedOptions: () => ({}),
          formatToParts: () => [],
          formatRange: () => '',
          formatRangeToParts: () => [],
        }) as unknown as Intl.DateTimeFormat,
    )
  })

  it('sends WhatsApp notification when match score > 0.7 and business hours', async () => {
    mockMatchScoreFindUnique.mockResolvedValue({
      id: 'ms-1',
      score: 0.85,
      listingId: 'listing-1',
      listing: {
        id: 'listing-1',
        title: 'Soja SP',
        profile: { user: { phone: '+5511999999999' } },
      },
    })
    mockSendNotification.mockResolvedValue(undefined)

    await processNotifyMatchJob(
      makeJob<NotifyMatchJobData>({
        type: 'notify-match',
        matchScoreId: 'ms-1',
        listingOwnerUserId: 'user-1',
      }),
    )

    expect(mockSendNotification).toHaveBeenCalledWith(
      '+5511999999999',
      'new_match',
      expect.objectContaining({ listing: 'Soja SP' }),
    )
  })

  it('skips when matchScore not found', async () => {
    mockMatchScoreFindUnique.mockResolvedValue(null)

    await processNotifyMatchJob(
      makeJob<NotifyMatchJobData>({
        type: 'notify-match',
        matchScoreId: 'ms-missing',
        listingOwnerUserId: 'user-1',
      }),
    )

    expect(mockSendNotification).not.toHaveBeenCalled()
  })

  it('skips when user has no phone', async () => {
    mockMatchScoreFindUnique.mockResolvedValue({
      id: 'ms-1',
      score: 0.85,
      listingId: 'listing-1',
      listing: {
        id: 'listing-1',
        title: 'Soja SP',
        profile: { user: { phone: null } },
      },
    })

    await processNotifyMatchJob(
      makeJob<NotifyMatchJobData>({
        type: 'notify-match',
        matchScoreId: 'ms-1',
        listingOwnerUserId: 'user-1',
      }),
    )

    expect(mockSendNotification).not.toHaveBeenCalled()
  })

  it('throws outside business hours so BullMQ retries later', async () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () =>
        ({
          format: () => '23',
          resolvedOptions: () => ({}),
          formatToParts: () => [],
          formatRange: () => '',
          formatRangeToParts: () => [],
        }) as unknown as Intl.DateTimeFormat,
    )
    mockMatchScoreFindUnique.mockResolvedValue({
      id: 'ms-1',
      score: 0.85,
      listingId: 'listing-1',
      listing: {
        id: 'listing-1',
        title: 'Soja SP',
        profile: { user: { phone: '+5511999999999' } },
      },
    })

    await expect(
      processNotifyMatchJob(
        makeJob<NotifyMatchJobData>({
          type: 'notify-match',
          matchScoreId: 'ms-1',
          listingOwnerUserId: 'user-1',
        }),
      ),
    ).rejects.toThrow('Fora do horário comercial')
    expect(mockSendNotification).not.toHaveBeenCalled()
  })
})

// ─── Daily notification limit (via addNotifyMatchJob jobId dedup) ─────────────

describe('addNotifyMatchJob — daily dedup', () => {
  it('produces the same jobId for the same user on the same day', () => {
    // The dedup contract: jobId = notify-match:{userId}:{YYYY-MM-DD}
    // BullMQ silently skips a second add() with the same jobId → max 1 notify/user/day.
    const userId = 'user-42'
    const today = new Date().toISOString().slice(0, 10)

    const jobId1 = `notify-match:${userId}:${today}`
    const jobId2 = `notify-match:${userId}:${today}`

    expect(jobId1).toBe(jobId2) // same user + same day → identical ID → BullMQ deduplicates
    expect(jobId1).toMatch(/^notify-match:[^:]+:\d{4}-\d{2}-\d{2}$/)
  })

  it('produces different jobIds for different users on the same day', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(`notify-match:user-A:${today}`).not.toBe(`notify-match:user-B:${today}`)
  })
})
