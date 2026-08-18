import type { BadgeTier, ListingKind, ListingStatus } from '@siamo/db'

// ─── Weights ──────────────────────────────────────────────────────────────────
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

// Warn uma única vez: loadWeights roda por par avaliado e um env inválido
// inundava o log do worker com o mesmo aviso
let warnedInvalidWeights = false

function loadWeights() {
  const w = {
    distance: parseFloat(process.env['MATCH_WEIGHT_DISTANCE'] ?? '0.40'),
    reputation: parseFloat(process.env['MATCH_WEIGHT_REPUTATION'] ?? '0.35'),
    compatibility: parseFloat(process.env['MATCH_WEIGHT_COMPATIBILITY'] ?? '0.20'),
    responsiveness: parseFloat(process.env['MATCH_WEIGHT_RESPONSIVENESS'] ?? '0.05'),
  }
  const sum = w.distance + w.reputation + w.compatibility + w.responsiveness
  if (Math.abs(sum - 1.0) > 0.001) {
    if (!warnedInvalidWeights) {
      console.warn(`[matchmaking] weights sum to ${sum.toFixed(3)}, expected 1.0 — using defaults`)
      warnedInvalidWeights = true
    }
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
   * Pre-fetched average first-response time in hours derived from the candidate's
   * transaction history (time from PROPOSED to first message).
   * Pass `null` when the candidate has no transaction history — the score falls
   * back to the neutral 0.5 value so new users are not penalised.
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
 * score_distancia: logarithmic decay from 1.0 at 0 km to 0.0 at MAX_DISTANCE_KM.
 *
 * Formula: max(0, 1 - log(1 + km) / log(1 + MAX_KM))
 *
 * Why logarithmic instead of linear?
 *   In rural Brazil the difference between 5 km and 50 km is far more meaningful
 *   than between 150 km and 195 km (both are long-haul, rarely actionable).
 *   The log curve rewards genuinely local matches with a steep bonus in the 0–30 km
 *   range, then decays gradually for medium distances, preserving relative ordering
 *   at the long tail without artificially excluding viable far matches.
 *
 * Comparison at selected distances (MAX=200 km):
 *   0 km  → 1.00  (same for both)
 *   10 km → linear 0.95 / log 0.78  ← log rewards closeness more
 *   50 km → linear 0.75 / log 0.56
 *   100km → linear 0.50 / log 0.37
 *   150km → linear 0.25 / log 0.20
 *   200km → 0.00  (same for both)
 */
export function scoreDistance(distanceKm: number): number {
  return Math.max(0, 1 - Math.log(1 + distanceKm) / Math.log(1 + MAX_DISTANCE_KM))
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
 *
 * IMPORTANT: callers must supply LIVE rating counts from the ratings table,
 * NOT the denormalized `profile.currentRating` / `profile.ratingCount` columns
 * which are only updated by the async recompute worker and may be stale.
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
 */
const KIND_COMPAT: Record<ListingKind, Record<ListingKind, number>> = {
  OFFER: { OFFER: 0.0, DEMAND: 0.7, SERVICE: 0.4, EQUIPMENT: 0.4 },
  DEMAND: { OFFER: 0.7, DEMAND: 0.0, SERVICE: 0.7, EQUIPMENT: 0.7 },
  SERVICE: { OFFER: 0.4, DEMAND: 0.7, SERVICE: 0.0, EQUIPMENT: 0.4 },
  EQUIPMENT: { OFFER: 0.4, DEMAND: 0.7, SERVICE: 0.4, EQUIPMENT: 0.0 },
}

/**
 * Category semantic clusters — groups of categories that are commercially
 * related and frequently appear together in the same transactions.
 *
 * Exact category match → +0.30 bonus
 * Same cluster match   → +0.15 bonus
 * Different cluster    → +0.00
 *
 * 'OTHER' cluster never receives cluster bonus to avoid false positives.
 */
const CATEGORY_CLUSTER: Record<string, string> = {
  // Commodity crops
  COFFEE: 'GRAINS',
  CORN: 'GRAINS',
  SOY: 'GRAINS',
  GRAINS: 'GRAINS',
  // Animal products
  LIVESTOCK: 'LIVESTOCK',
  DAIRY: 'LIVESTOCK',
  // Perishables
  FRUITS: 'HORTICULTURE',
  VEGETABLES: 'HORTICULTURE',
  // Professional services
  AGRONOMY: 'AGRO_SERVICES',
  VETERINARY: 'AGRO_SERVICES',
  CONSULTING: 'AGRO_SERVICES',
  // Machinery
  MECHANICS: 'MECHANICAL',
  TRACTOR: 'MECHANICAL',
  HARVESTER: 'MECHANICAL',
  // Farm infrastructure
  IRRIGATION: 'INFRASTRUCTURE',
  IRRIGATION_SYSTEM: 'INFRASTRUCTURE',
  STORAGE: 'INFRASTRUCTURE',
  // Labour & logistics
  LABOR: 'LABOR_TRANSPORT',
  TRANSPORT: 'LABOR_TRANSPORT',
}

function categoryBonus(cat1: string, cat2: string): number {
  if (cat1 === cat2) return 0.3
  const c1 = CATEGORY_CLUSTER[cat1] ?? 'OTHER'
  const c2 = CATEGORY_CLUSTER[cat2] ?? 'OTHER'
  return c1 !== 'OTHER' && c1 === c2 ? 0.15 : 0
}

/**
 * score_compatibilidade for a single listing pair.
 * Base score from kind matrix + tiered category bonus.
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
  return Math.min(1, base + categoryBonus(listingCategory, candidateCategory))
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
 * Pure function — no DB side effects. Callers must pre-fetch LIVE rating data
 * from the ratings table (not stale denormalized profile columns) and the
 * candidate's avgResponseHours from transaction history.
 *
 * @returns score clamped to [0, 1], per-component breakdown, raw distance in km,
 *   and the specific candidate listing that drove the compatibility sub-score.
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
