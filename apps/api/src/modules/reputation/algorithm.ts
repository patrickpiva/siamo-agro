// ─── Types ────────────────────────────────────────────────────────────────────

export interface RatingInput {
  score: number
  /** Transaction amount in BRL (decimal number) */
  amount: number
  createdAt: Date
}

export interface BadgeContext {
  /** COMPLETED transactions in the last 180 days */
  completedLast180Days: number
  /** All transactions ever (for cancellation rate) */
  totalTransactions: number
  /** CANCELLED transactions (for cancellation rate — GOLD only) */
  cancelledTransactions: number
}

export type BadgeTier = 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD'

export interface ReputationResult {
  currentRating: number
  ratingCount: number
  badge: BadgeTier
}

// ─── Factors ─────────────────────────────────────────────────────────────────

const LOG_10000 = Math.log10(10000) // = 4.0

/**
 * Value factor — larger transactions carry more weight, with diminishing returns.
 * Range: [0.25 … 1.0]
 *   R$10    → log10(10)    / 4 = 0.25
 *   R$100   → log10(100)   / 4 = 0.50
 *   R$1 000 → log10(1000)  / 4 = 0.75
 *   R$10 000→ log10(10000) / 4 = 1.00  (clamped)
 */
export function valueFactor(amount: number): number {
  return Math.min(1.0, Math.log10(Math.max(10, amount)) / LOG_10000)
}

/**
 * Temporal decay — recent ratings matter more.
 * today → 1.0 | 365 days ago → e^-1 ≈ 0.37 | 730 days ago → e^-2 ≈ 0.14
 */
export function temporalFactor(createdAt: Date, now = new Date()): number {
  const daysSince = (now.getTime() - createdAt.getTime()) / 86_400_000
  return Math.exp(-daysSince / 365)
}

// ─── Badge logic ──────────────────────────────────────────────────────────────

export function determineBadge(
  ratingCount: number,
  currentRating: number,
  ctx: BadgeContext,
): BadgeTier {
  if (ratingCount < 5 || currentRating < 3.5) return 'NONE'

  const cancellationRate =
    ctx.totalTransactions > 0 ? ctx.cancelledTransactions / ctx.totalTransactions : 0

  if (
    ratingCount >= 30 &&
    currentRating >= 4.5 &&
    ctx.completedLast180Days >= 20 &&
    cancellationRate < 0.1
  )
    return 'GOLD'

  if (ratingCount >= 15 && currentRating >= 4.0 && ctx.completedLast180Days >= 10) return 'SILVER'

  if (ratingCount >= 5 && currentRating >= 3.5 && ctx.completedLast180Days >= 3) return 'BRONZE'

  return 'NONE'
}

// ─── Core computation ─────────────────────────────────────────────────────────

/**
 * Computes weighted reputation score and badge for a profile.
 * Idempotent — safe to call multiple times with the same inputs.
 */
export function computeReputation(
  ratings: RatingInput[],
  ctx: BadgeContext,
  now = new Date(),
): ReputationResult {
  if (ratings.length === 0) {
    return { currentRating: 0, ratingCount: 0, badge: 'NONE' }
  }

  let weightedSum = 0
  let totalWeight = 0

  for (const r of ratings) {
    const vf = valueFactor(r.amount)
    const tf = temporalFactor(r.createdAt, now)
    const w = vf * tf
    weightedSum += r.score * w
    totalWeight += w
  }

  const currentRating = totalWeight > 0 ? weightedSum / totalWeight : 0
  const ratingCount = ratings.length
  const badge = determineBadge(ratingCount, currentRating, ctx)

  return { currentRating, ratingCount, badge }
}
