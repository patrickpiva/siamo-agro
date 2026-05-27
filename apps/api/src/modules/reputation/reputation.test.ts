import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computeReputation, valueFactor, temporalFactor, determineBadge } from './algorithm.js'
import { ReputationService } from './service.js'
import { RatingNotAllowedError, RatingConflictError, ProfileNotFoundError } from './errors.js'
import type { BadgeContext } from './algorithm.js'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../workers/reputation/queue.js', () => ({
  addReputationRecomputeJob: vi.fn(),
}))

const noCtx: BadgeContext = {
  completedLast180Days: 0,
  totalTransactions: 0,
  cancelledTransactions: 0,
}
const bronzeCtx: BadgeContext = {
  completedLast180Days: 3,
  totalTransactions: 10,
  cancelledTransactions: 1,
}
const silverCtx: BadgeContext = {
  completedLast180Days: 10,
  totalTransactions: 20,
  cancelledTransactions: 2,
}
const goldCtx: BadgeContext = {
  completedLast180Days: 20,
  totalTransactions: 30,
  cancelledTransactions: 2,
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000)
}

// ─── algorithm.ts — pure function tests ───────────────────────────────────────

describe('valueFactor', () => {
  it('R$10 → 0.25 (floor)', () => {
    expect(valueFactor(10)).toBeCloseTo(0.25, 5)
  })

  it('R$100 → 0.50', () => {
    expect(valueFactor(100)).toBeCloseTo(0.5, 5)
  })

  it('R$1000 → 0.75', () => {
    expect(valueFactor(1000)).toBeCloseTo(0.75, 5)
  })

  it('R$10000 → 1.00 (ceiling)', () => {
    expect(valueFactor(10000)).toBeCloseTo(1.0, 5)
  })

  it('values below R$10 are clamped to R$10 floor', () => {
    expect(valueFactor(1)).toBeCloseTo(valueFactor(10), 5)
  })

  it('values above R$10000 are clamped to 1.0', () => {
    expect(valueFactor(1_000_000)).toBeCloseTo(1.0, 5)
  })
})

describe('temporalFactor', () => {
  it('rating today → 1.0', () => {
    expect(temporalFactor(new Date())).toBeCloseTo(1.0, 3)
  })

  it('rating 365 days ago → e^-1 ≈ 0.368', () => {
    expect(temporalFactor(daysAgo(365))).toBeCloseTo(Math.exp(-1), 3)
  })

  it('rating 730 days ago → e^-2 ≈ 0.135', () => {
    expect(temporalFactor(daysAgo(730))).toBeCloseTo(Math.exp(-2), 3)
  })

  it('is monotonically decreasing', () => {
    expect(temporalFactor(daysAgo(1))).toBeGreaterThan(temporalFactor(daysAgo(100)))
    expect(temporalFactor(daysAgo(100))).toBeGreaterThan(temporalFactor(daysAgo(365)))
  })
})

describe('determineBadge', () => {
  it('NONE when < 5 ratings', () => {
    expect(determineBadge(4, 4.9, goldCtx)).toBe('NONE')
  })

  it('NONE when rating < 3.5', () => {
    expect(determineBadge(30, 3.4, goldCtx)).toBe('NONE')
  })

  it('BRONZE at threshold (5 ratings, 3.5 avg, 3 completed)', () => {
    expect(determineBadge(5, 3.5, bronzeCtx)).toBe('BRONZE')
  })

  it('BRONZE but not SILVER when < 15 ratings', () => {
    expect(determineBadge(10, 4.2, bronzeCtx)).toBe('BRONZE')
  })

  it('SILVER at threshold (15 ratings, 4.0 avg, 10 completed)', () => {
    expect(determineBadge(15, 4.0, silverCtx)).toBe('SILVER')
  })

  it('SILVER but not GOLD when < 30 ratings', () => {
    expect(determineBadge(20, 4.8, silverCtx)).toBe('SILVER')
  })

  it('GOLD at threshold (30 ratings, 4.5 avg, 20 completed, <10% cancelled)', () => {
    // goldCtx: 2/30 cancelled = 6.7%
    expect(determineBadge(30, 4.5, goldCtx)).toBe('GOLD')
  })

  it('not GOLD when cancellation rate >= 10%', () => {
    const highCancelCtx: BadgeContext = {
      completedLast180Days: 20,
      totalTransactions: 30,
      cancelledTransactions: 3, // 3/30 = 10% — boundary, not < 10%
    }
    expect(determineBadge(30, 4.5, highCancelCtx)).toBe('SILVER')
  })

  it('not GOLD when completedLast180Days < 20', () => {
    const ctx: BadgeContext = {
      completedLast180Days: 19,
      totalTransactions: 30,
      cancelledTransactions: 1,
    }
    expect(determineBadge(30, 4.5, ctx)).toBe('SILVER')
  })
})

describe('computeReputation', () => {
  it('returns 0 / NONE for empty ratings', () => {
    const result = computeReputation([], noCtx)
    expect(result.currentRating).toBe(0)
    expect(result.ratingCount).toBe(0)
    expect(result.badge).toBe('NONE')
  })

  it('single rating today → score ≈ that score (no decay, no dilution)', () => {
    const result = computeReputation([{ score: 4, amount: 100, createdAt: new Date() }], noCtx)
    expect(result.currentRating).toBeCloseTo(4, 1)
    expect(result.ratingCount).toBe(1)
  })

  it('recent high ratings outweigh old low ratings', () => {
    const ratings = [
      { score: 5, amount: 1000, createdAt: daysAgo(1) }, // recent + high value
      { score: 1, amount: 10, createdAt: daysAgo(700) }, // old + low value
    ]
    const result = computeReputation(ratings, noCtx)
    // Recent 5-star should dominate
    expect(result.currentRating).toBeGreaterThan(4)
  })

  it('larger transactions carry more weight than smaller ones', () => {
    const same = new Date()
    const bigTx = [{ score: 5, amount: 10000, createdAt: same }]
    const smallTx = [{ score: 5, amount: 10, createdAt: same }]
    // Both give score 5 but bigTx has larger weight — same result (5)
    // What differs: if mixed with a bad rating, bigTx 5-star dilutes more
    const withBad = (base: typeof bigTx) => [...base, { score: 1, amount: 10, createdAt: same }]
    const bigResult = computeReputation(withBad(bigTx), noCtx)
    const smallResult = computeReputation(withBad(smallTx), noCtx)
    expect(bigResult.currentRating).toBeGreaterThan(smallResult.currentRating)
  })

  it('ratingCount equals number of ratings input', () => {
    const ratings = Array.from({ length: 7 }, (_, i) => ({
      score: (i % 5) + 1,
      amount: 100,
      createdAt: daysAgo(i * 10),
    }))
    expect(computeReputation(ratings, noCtx).ratingCount).toBe(7)
  })

  it('temporal decay: older ratings have less influence', () => {
    const now = new Date()
    const recentOnly = [{ score: 5, amount: 100, createdAt: now }]
    const oldOnly = [{ score: 5, amount: 100, createdAt: daysAgo(730) }]
    // Both should still give score ≈ 5, but old has tiny weight
    expect(computeReputation(recentOnly, noCtx).currentRating).toBeCloseTo(5, 0)
    expect(computeReputation(oldOnly, noCtx).currentRating).toBeCloseTo(5, 0)
  })
})

// ─── ReputationService tests ──────────────────────────────────────────────────

const mockPrisma = {
  transaction: { findUnique: vi.fn() },
  rating: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() },
  profile: { findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
}

describe('ReputationService', () => {
  let service: ReputationService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ReputationService(mockPrisma as never)
  })

  const completedTx = {
    id: 'tx1',
    status: 'COMPLETED',
    buyerId: 'buyer1',
    sellerId: 'seller1',
    amount: { toNumber: () => 500 },
  }

  describe('submitRating', () => {
    it('buyer can rate seller on a COMPLETED transaction', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(completedTx)
      mockPrisma.rating.findFirst.mockResolvedValue(null)
      const created = {
        id: 'r1',
        transactionId: 'tx1',
        raterId: 'buyer1',
        rateeId: 'seller1',
        score: 5,
        comment: 'Ótimo!',
        createdAt: new Date(),
      }
      mockPrisma.rating.create.mockResolvedValue(created)

      const result = await service.submitRating('buyer1', 'tx1', { score: 5, comment: 'Ótimo!' })
      expect(result.raterId).toBe('buyer1')
      expect(result.rateeId).toBe('seller1')
      expect(result.score).toBe(5)
    })

    it('seller can rate buyer on the same transaction', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(completedTx)
      mockPrisma.rating.findFirst.mockResolvedValue(null)
      const created = {
        id: 'r2',
        transactionId: 'tx1',
        raterId: 'seller1',
        rateeId: 'buyer1',
        score: 4,
        comment: null,
        createdAt: new Date(),
      }
      mockPrisma.rating.create.mockResolvedValue(created)

      const result = await service.submitRating('seller1', 'tx1', { score: 4 })
      expect(result.raterId).toBe('seller1')
      expect(result.rateeId).toBe('buyer1')
    })

    it('throws RatingNotAllowedError when transaction is not COMPLETED', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue({ ...completedTx, status: 'IN_PROGRESS' })

      await expect(service.submitRating('buyer1', 'tx1', { score: 5 })).rejects.toBeInstanceOf(
        RatingNotAllowedError,
      )
    })

    it('throws RatingNotAllowedError for non-participant', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(completedTx)

      await expect(service.submitRating('outsider', 'tx1', { score: 5 })).rejects.toBeInstanceOf(
        RatingNotAllowedError,
      )
    })

    it('throws RatingConflictError when same rater tries to rate twice', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(completedTx)
      mockPrisma.rating.findFirst.mockResolvedValue({ id: 'existing' })

      await expect(service.submitRating('buyer1', 'tx1', { score: 3 })).rejects.toBeInstanceOf(
        RatingConflictError,
      )
    })

    it('throws RatingNotAllowedError when transaction not found', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(null)

      await expect(
        service.submitRating('buyer1', 'tx-missing', { score: 5 }),
      ).rejects.toBeInstanceOf(RatingNotAllowedError)
    })
  })

  describe('getReputation', () => {
    it('throws ProfileNotFoundError when profile does not exist', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(null)

      await expect(service.getReputation('profile-missing')).rejects.toBeInstanceOf(
        ProfileNotFoundError,
      )
    })

    it('returns reputation data with breakdown and distribution', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue({
        userId: 'user1',
        currentRating: 4.2,
        ratingCount: 3,
        badge: 'BRONZE',
      })
      const now = new Date()
      mockPrisma.rating.findMany.mockResolvedValue([
        {
          score: 5,
          comment: 'Excelente',
          createdAt: now,
          transaction: { id: 't1', amount: { toNumber: () => 500 }, listing: { kind: 'OFFER' } },
        },
        {
          score: 4,
          comment: null,
          createdAt: daysAgo(20),
          transaction: { id: 't2', amount: { toNumber: () => 100 }, listing: { kind: 'SERVICE' } },
        },
        {
          score: 4,
          comment: 'Bom',
          createdAt: daysAgo(60),
          transaction: { id: 't3', amount: { toNumber: () => 200 }, listing: { kind: 'OFFER' } },
        },
      ])

      const result = await service.getReputation('profile1')
      expect(result.ratingCount).toBe(3)
      expect(result.badge).toBe('BRONZE')
      expect(result.breakdown.last30Days.count).toBe(2) // now + 20d ago
      expect(result.breakdown.last90Days.count).toBe(3)
      expect(result.distribution[5]).toBe(1)
      expect(result.distribution[4]).toBe(2)
      expect(result.recentRatings).toHaveLength(3)
    })
  })

  describe('recomputeProfile', () => {
    it('updates profile with computed rating and badge', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue({ id: 'profile1' })
      mockPrisma.rating.findMany.mockResolvedValue([
        { score: 5, createdAt: new Date(), transaction: { amount: { toNumber: () => 1000 } } },
      ])
      // Transaction counts
      mockPrisma.transaction = {
        ...mockPrisma.transaction,
        count: vi.fn().mockResolvedValue(5),
      } as never

      await service.recomputeProfile('user1')

      expect(mockPrisma.profile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            currentRating: expect.any(Number),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            badge: expect.any(String),
          }),
        }),
      )
    })

    it('does nothing when profile does not exist', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(null)

      await service.recomputeProfile('ghost-user')

      expect(mockPrisma.rating.findMany).not.toHaveBeenCalled()
      expect(mockPrisma.profile.update).not.toHaveBeenCalled()
    })

    it('is idempotent — calling twice produces the same result', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue({ id: 'profile1' })
      mockPrisma.rating.findMany.mockResolvedValue([
        { score: 4, createdAt: new Date(), transaction: { amount: { toNumber: () => 200 } } },
      ])
      mockPrisma.transaction = {
        ...mockPrisma.transaction,
        count: vi.fn().mockResolvedValue(3),
      } as never
      mockPrisma.profile.update.mockResolvedValue({})

      await service.recomputeProfile('user1')
      await service.recomputeProfile('user1')

      const calls = mockPrisma.profile.update.mock.calls as Array<
        [{ data: { currentRating: number } }]
      >
      const [call1, call2] = calls
      expect(call1![0].data.currentRating).toBeCloseTo(call2![0].data.currentRating, 5)
    })
  })
})
