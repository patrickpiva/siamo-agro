import type { PrismaClient } from '@siamo/db'
import type { SubmitRatingBody } from './schema.js'
import { RatingNotAllowedError, RatingConflictError, ProfileNotFoundError } from './errors.js'
import { Prisma } from '@siamo/db'
import { computeReputation } from './algorithm.js'
import { addReputationRecomputeJob } from '../../workers/reputation/queue.js'

const MS_30D = 30 * 24 * 60 * 60 * 1000
const MS_90D = 90 * 24 * 60 * 60 * 1000
const MS_180D = 180 * 24 * 60 * 60 * 1000

export class ReputationService {
  constructor(private readonly prisma: PrismaClient) {}

  // ─── Submit rating ──────────────────────────────────────────────────────────

  async submitRating(userId: string, transactionId: string, body: SubmitRatingBody) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    })

    if (!tx) throw new RatingNotAllowedError('Transação não encontrada')
    if (tx.status !== 'COMPLETED') {
      throw new RatingNotAllowedError('Só é possível avaliar transações concluídas')
    }
    if (tx.buyerId !== userId && tx.sellerId !== userId) {
      throw new RatingNotAllowedError('Você não é parte desta transação')
    }

    const rateeId = tx.buyerId === userId ? tx.sellerId : tx.buyerId

    // One rating per rater per transaction
    const existing = await this.prisma.rating.findFirst({
      where: { transactionId, raterId: userId },
    })
    if (existing) throw new RatingConflictError()

    let rating
    try {
      rating = await this.prisma.rating.create({
        data: {
          transactionId,
          raterId: userId,
          rateeId,
          score: body.score,
          comment: body.comment ?? null,
          reliability: body.reliability ?? null,
          communication: body.communication ?? null,
          quality: body.quality ?? null,
        },
      })
    } catch (err) {
      // P2002 = unique constraint → race condition or retry after a swallowed error
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new RatingConflictError()
      }
      throw err
    }

    // Trigger async recompute for the ratee's profile (non-blocking — don't fail the request)
    addReputationRecomputeJob(rateeId).catch((err: unknown) => {
      console.error('[reputation] Failed to enqueue recompute job:', err)
    })

    return {
      id: rating.id,
      transactionId: rating.transactionId,
      raterId: rating.raterId,
      rateeId: rating.rateeId,
      score: rating.score,
      comment: rating.comment,
      reliability: rating.reliability,
      communication: rating.communication,
      quality: rating.quality,
      createdAt: rating.createdAt.toISOString(),
    }
  }

  // ─── Get profile reputation ─────────────────────────────────────────────────

  async getReputation(profileId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { userId: true, currentRating: true, ratingCount: true, badge: true },
    })
    if (!profile) throw new ProfileNotFoundError(profileId)

    const { userId } = profile

    // Load all ratings received (with transaction for amount + kind + title)
    const ratings = await this.prisma.rating.findMany({
      where: { rateeId: userId },
      include: {
        transaction: {
          select: {
            id: true,
            amount: true,
            listing: { select: { kind: true, title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch rater profiles for the 5 most recent ratings only
    const recentRaterIds = [...new Set(ratings.slice(0, 5).map((r) => r.raterId))]
    const raterProfiles = await this.prisma.profile.findMany({
      where: { userId: { in: recentRaterIds } },
      select: { userId: true, name: true, photo: true },
    })
    const raterProfileMap = new Map(raterProfiles.map((p) => [p.userId, p]))

    // ── Breakdown ─────────────────────────────────────────────────────────────

    const now = Date.now()
    const periodStats = (ms: number) => {
      const cutoff = new Date(now - ms)
      const period = ratings.filter((r) => r.createdAt >= cutoff)
      const avg = period.length > 0 ? period.reduce((s, r) => s + r.score, 0) / period.length : 0
      return { count: period.length, avg: Math.round(avg * 100) / 100 }
    }

    const breakdown = {
      last30Days: periodStats(MS_30D),
      last90Days: periodStats(MS_90D),
      allTime: {
        count: ratings.length,
        avg:
          ratings.length > 0
            ? Math.round((ratings.reduce((s, r) => s + r.score, 0) / ratings.length) * 100) / 100
            : 0,
      },
    }

    // ── Distribution ──────────────────────────────────────────────────────────

    const distribution: { 5: number; 4: number; 3: number; 2: number; 1: number } = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    }
    for (const r of ratings) {
      distribution[r.score as 1 | 2 | 3 | 4 | 5] =
        (distribution[r.score as 1 | 2 | 3 | 4 | 5] ?? 0) + 1
    }

    // ── Recent ratings (last 5) ───────────────────────────────────────────────

    const recentRatings = ratings.slice(0, 5).map((r) => {
      const raterProfile = raterProfileMap.get(r.raterId)
      return {
        score: r.score,
        comment: r.comment,
        reliability: r.reliability,
        communication: r.communication,
        quality: r.quality,
        rater: {
          name: raterProfile?.name ?? null,
          photo: raterProfile?.photo ?? null,
        },
        transaction: {
          id: r.transaction.id,
          amount: Number(r.transaction.amount),
          kind: r.transaction.listing.kind,
          title: r.transaction.listing.title,
        },
        createdAt: r.createdAt.toISOString(),
      }
    })

    // ── Category averages (across all ratings that have those fields) ─────────

    const avg = (field: 'reliability' | 'communication' | 'quality') => {
      const vals = ratings.map((r) => r[field]).filter((v): v is number => v != null)
      return vals.length > 0
        ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100
        : null
    }

    const categoryAverages = {
      reliability: avg('reliability'),
      communication: avg('communication'),
      quality: avg('quality'),
    }

    // ── Stored aggregates (updated by recompute worker) ───────────────────────

    // Use ratings.length as the authoritative count — profile.ratingCount is a
    // denormalised aggregate updated only by the async recompute worker and may lag.
    const liveRatingCount = ratings.length
    const liveCurrentRating =
      liveRatingCount > 0
        ? Math.round((ratings.reduce((s, r) => s + r.score, 0) / liveRatingCount) * 100) / 100
        : 0

    return {
      currentRating: liveCurrentRating,
      ratingCount: liveRatingCount,
      badge: profile.badge,
      breakdown,
      distribution,
      categoryAverages,
      recentRatings,
    }
  }

  // ─── Recompute a single profile's reputation (called by worker) ─────────────

  async recomputeProfile(userId: string): Promise<void> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!profile) return

    const [ratings, completedLast180Days, totalTransactions, cancelledTransactions] =
      await Promise.all([
        this.prisma.rating.findMany({
          where: { rateeId: userId },
          include: { transaction: { select: { amount: true } } },
        }),
        this.prisma.transaction.count({
          where: {
            OR: [{ buyerId: userId }, { sellerId: userId }],
            status: 'COMPLETED',
            updatedAt: { gte: new Date(Date.now() - MS_180D) },
          },
        }),
        this.prisma.transaction.count({
          where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
        }),
        this.prisma.transaction.count({
          where: {
            OR: [{ buyerId: userId }, { sellerId: userId }],
            status: 'CANCELLED',
          },
        }),
      ])

    const { currentRating, ratingCount, badge } = computeReputation(
      ratings.map((r) => ({
        score: r.score,
        amount: Number(r.transaction.amount),
        createdAt: r.createdAt,
      })),
      { completedLast180Days, totalTransactions, cancelledTransactions },
    )

    await this.prisma.profile.update({
      where: { id: profile.id },
      data: { currentRating, ratingCount, badge },
    })
  }

  // ─── Recompute all profiles (daily cron) ────────────────────────────────────

  async recomputeAll(): Promise<number> {
    const profiles = await this.prisma.profile.findMany({ select: { userId: true } })
    await Promise.all(profiles.map((p) => this.recomputeProfile(p.userId)))
    return profiles.length
  }
}
