import type { BadgeTier, ListingKind, ListingStatus } from '@agrolink/db'

// ─── Weights ──────────────────────────────────────────────────────────────────
//
// Rationale for each weight:
//
//   DISTANCE (0.40) — in rural Brazil, logistics cost is the primary friction.
//     A great match 400 km away is rarely actionable. Distance dominates.
//
//   REPUTATION (0.35) — trust is scarce in low-information markets. A verified,
//     well-rated profile dramatically reduces counterparty risk.
//
//   COMPATIBILITY (0.20) — semantic fit (kind + category). Important, but a
//     perfect semantic match at 300 km loses to a decent match at 10 km.
//
//   RESPONSIVENESS (0.05) — tiebreaker. Slow responders frustrate buyers, but
//     rural connectivity issues make this an unreliable signal at higher weight.
//
// All weights must sum to 1.0. Adjust via env vars for A/B tuning without deploy.

function loadWeights() {
  const w = {
    distance: parseFloat(process.env['MATCH_WEIGHT_DISTANCE'] ?? '0.40'),
    reputation: parseFloat(process.env['MATCH_WEIGHT_REPUTATION'] ?? '0.35'),
    compatibility: parseFloat(process.env['MATCH_WEIGHT_COMPATIBILITY'] ?? '0.20'),
    responsiveness: parseFloat(process.env['MATCH_WEIGHT_RESPONSIVENESS'] ?? '0.05'),
  }
  const sum = w.distance + w.reputation + w.compatibility + w.responsiveness
  if (Math.abs(sum - 1.0) > 0.001) {
    console.warn(`[matchmaking] weights sum to ${sum.toFixed(3)}, expected 1.0 — using defaults`)
    return { distance: 0.4, reputation: 0.35, compatibility: 0.2, responsiveness: 0.05 }
  }
  return w
}

/** Maximum radius used for both candidate fetching and distance score normalization. */
const MAX_DISTANCE_KM = parseFloat(process.env['MATCH_MAX_DISTANCE_KM'] ?? '200')

/** Minimum number of ratings before full trust is given to the rating value. */
const MIN_RATING_COUNT = 3

// ─── Input types ──────────────────────────────────────────────────────────────

export interface MatchListingProfile {
  id: string
  currentRating: number
  ratingCount: number
  badge: BadgeTier
  location: { latitude: number; longitude: number }
}

export interface MatchListing {
  id: string
  kind: ListingKind
  category: string
  createdAt: Date
  profile: MatchListingProfile
}

export interface CandidateListing {
  kind: ListingKind
  category: string
  status: ListingStatus
}

export interface CandidateProfile {
  id: string
  currentRating: number
  ratingCount: number
  badge: BadgeTier
  /**
   * Pre-fetched average first-response time in hours from completed transactions.
   * Pass `null` or `undefined` when the candidate has no transaction history —
   * the score will fall back to the neutral 0.5 value.
   */
  avgResponseHours?: number | null
  location: { latitude: number; longitude: number }
  listings: CandidateListing[]
}

// ─── Output types ─────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  distance: number
  reputation: number
  compatibility: number
  responsiveness: number
  weights: { distance: number; reputation: number; compatibility: number; responsiveness: number }
}

export interface MatchScoreResult {
  score: number
  breakdown: ScoreBreakdown
  distanceKm: number
  bestCandidateListing: CandidateListing | null
}

// ─── Distance ─────────────────────────────────────────────────────────────────

/**
 * Haversine great-circle distance between two lat/lng points, in km.
 * Accurate to ~0.3% for distances relevant to this domain (< 1000 km).
 */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * score_distancia: linear decay from 1.0 at 0 km to 0.0 at MAX_DISTANCE_KM.
 * Formula: max(0, 1 - km / MAX_DISTANCE_KM)
 */
export function scoreDistance(distanceKm: number): number {
  return Math.max(0, 1 - distanceKm / MAX_DISTANCE_KM)
}

// ─── Reputation ───────────────────────────────────────────────────────────────

const BADGE_BONUS: Record<BadgeTier, number> = {
  GOLD: 0.1,
  SILVER: 0.05,
  BRONZE: 0.0,
  NONE: 0.0,
}

/**
 * score_reputacao: normalized rating with cold-start penalty and badge bonus.
 *
 * Cold-start: profiles with fewer than MIN_RATING_COUNT reviews have their
 * score scaled down proportionally. This prevents a new account with one
 * 5-star rating from outscoring a veteran with 20 honest reviews.
 *
 * Badge bonus: platform-awarded tiers add up to 0.10. Applied after clamping
 * so it can rescue a mid-range score but cannot push a poor score to 1.0.
 */
export function scoreReputation(
  currentRating: number,
  ratingCount: number,
  badge: BadgeTier,
): number {
  const base = currentRating / 5
  const coldStartMultiplier = ratingCount < MIN_RATING_COUNT ? ratingCount / MIN_RATING_COUNT : 1
  const badgeBonus = BADGE_BONUS[badge]
  return Math.min(1, Math.max(0, base * coldStartMultiplier + badgeBonus))
}

// ─── Compatibility ────────────────────────────────────────────────────────────

/**
 * Kind compatibility matrix (listing kind → candidate listing kind → base score).
 *
 * Complementary pairs earn 0.7 (primary commercial relationships):
 *   OFFER ↔ DEMAND   — seller of goods meets buyer
 *   SERVICE ↔ DEMAND — service provider meets buyer
 *   EQUIPMENT ↔ DEMAND — equipment owner meets buyer
 *
 * Cross-kind matches earn 0.4 (secondary relationships that sometimes make sense):
 *   OFFER ↔ SERVICE   — producer might hire services
 *   OFFER ↔ EQUIPMENT — producer might rent/buy equipment
 *   SERVICE ↔ EQUIPMENT — service provider might need equipment
 *
 * Same kind always earns 0.0 — competitors do not benefit each other.
 * EQUIPMENT is intentionally flexible (can match any non-same kind).
 */
const KIND_COMPAT: Record<ListingKind, Record<ListingKind, number>> = {
  OFFER: { OFFER: 0.0, DEMAND: 0.7, SERVICE: 0.4, EQUIPMENT: 0.4 },
  DEMAND: { OFFER: 0.7, DEMAND: 0.0, SERVICE: 0.7, EQUIPMENT: 0.7 },
  SERVICE: { OFFER: 0.4, DEMAND: 0.7, SERVICE: 0.0, EQUIPMENT: 0.4 },
  EQUIPMENT: { OFFER: 0.4, DEMAND: 0.7, SERVICE: 0.4, EQUIPMENT: 0.0 },
}

/**
 * score_compatibilidade for a single listing pair.
 * Base score from kind matrix + 0.3 bonus when categories match exactly.
 * Returns 0.0 when kind base is 0 (no bonus can rescue incompatible kinds).
 */
export function scoreCompatibilityPair(
  listingKind: ListingKind,
  listingCategory: string,
  candidateKind: ListingKind,
  candidateCategory: string,
): number {
  const base = KIND_COMPAT[listingKind][candidateKind]
  if (base === 0) return 0
  const categoryBonus = listingCategory === candidateCategory ? 0.3 : 0
  return Math.min(1, base + categoryBonus)
}

/**
 * Selects the best-matching active listing from the candidate's portfolio.
 * If the candidate has no ACTIVE listings, compatibility is 0.
 */
export function scoreCompatibility(
  listing: Pick<MatchListing, 'kind' | 'category'>,
  candidateListings: CandidateListing[],
): { score: number; bestListing: CandidateListing | null } {
  const active = candidateListings.filter((l) => l.status === 'ACTIVE')
  if (active.length === 0) return { score: 0, bestListing: null }

  let best = 0
  let bestListing: CandidateListing | null = null

  for (const candidate of active) {
    const s = scoreCompatibilityPair(
      listing.kind,
      listing.category,
      candidate.kind,
      candidate.category,
    )
    if (s > best) {
      best = s
      bestListing = candidate
    }
  }

  return { score: best, bestListing }
}

// ─── Responsiveness ───────────────────────────────────────────────────────────

/**
 * score_responsividade: maps average first-response time to 0–1.
 *
 * Thresholds reflect rural Brazil usage patterns where 4G coverage is patchy.
 * A 24h response is considered the outer boundary of acceptable — beyond that,
 * deals typically fall through.
 *
 * No history → 0.5 (neutral). Penalizing new users before they have a chance
 * to respond would create a cold-start trap.
 */
export function scoreResponsiveness(avgResponseHours: number | null | undefined): number {
  if (avgResponseHours == null) return 0.5
  if (avgResponseHours < 1) return 1.0
  if (avgResponseHours < 6) return 0.7
  if (avgResponseHours < 24) return 0.4
  return 0.1
}

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Computes a match score between a source listing and a candidate profile.
 *
 * The function is intentionally pure (no DB side effects). Callers are
 * responsible for pre-fetching all required data, including `avgResponseHours`
 * from the candidate's transaction history.
 *
 * The function is async to accommodate future extensions (e.g., calling an
 * ML inference endpoint) without breaking the call sites.
 *
 * @returns score clamped to [0, 1], per-component breakdown for debugging/tuning,
 *   raw distance in km, and the specific candidate listing that drove compatibility.
 */
export async function computeMatchScore(
  listing: MatchListing,
  candidate: CandidateProfile,
): Promise<MatchScoreResult> {
  const weights = loadWeights()

  const distanceKm = haversineKm(
    listing.profile.location.latitude,
    listing.profile.location.longitude,
    candidate.location.latitude,
    candidate.location.longitude,
  )

  const distance = scoreDistance(distanceKm)
  const reputation = scoreReputation(
    candidate.currentRating,
    candidate.ratingCount,
    candidate.badge,
  )
  const { score: compatibility, bestListing } = scoreCompatibility(listing, candidate.listings)
  const responsiveness = scoreResponsiveness(candidate.avgResponseHours)

  const score =
    weights.distance * distance +
    weights.reputation * reputation +
    weights.compatibility * compatibility +
    weights.responsiveness * responsiveness

  return {
    score: Math.min(1, Math.max(0, score)),
    breakdown: { distance, reputation, compatibility, responsiveness, weights },
    distanceKm,
    bestCandidateListing: bestListing,
  }
}
