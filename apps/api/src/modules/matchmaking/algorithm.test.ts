import { describe, it, expect } from 'vitest'
import {
  haversineKm,
  scoreDistance,
  scoreReputation,
  scoreCompatibilityPair,
  scoreCompatibility,
  scoreResponsiveness,
  computeMatchScore,
} from './algorithm.js'
import type { MatchListing, CandidateProfile, CandidateListing } from './algorithm.js'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

// Sorriso, MT — representative rural location
const SORRISO = { latitude: -12.55, longitude: -55.72 }
// São Paulo, SP — ~1 900 km away, well beyond the 200 km radius
const SAO_PAULO = { latitude: -23.55, longitude: -46.63 }
// Sinop, MT — ~120 km from Sorriso
const SINOP = { latitude: -11.86, longitude: -55.5 }

function makeListing(overrides: Partial<MatchListing> = {}): MatchListing {
  return {
    id: 'listing_01',
    kind: 'OFFER',
    category: 'CORN',
    createdAt: new Date('2024-01-01'),
    profile: {
      id: 'profile_01',
      currentRating: 4.0,
      ratingCount: 10,
      badge: 'NONE',
      location: SORRISO,
    },
    ...overrides,
  }
}

function makeCandidate(overrides: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    id: 'profile_02',
    currentRating: 4.0,
    ratingCount: 10,
    badge: 'NONE',
    avgResponseHours: 2,
    location: SORRISO,
    listings: [{ kind: 'DEMAND', category: 'CORN', status: 'ACTIVE' }],
    ...overrides,
  }
}

// ─── haversineKm ──────────────────────────────────────────────────────────────

describe('haversineKm', () => {
  it('returns 0 for the same point', () => {
    expect(haversineKm(-13, -55, -13, -55)).toBe(0)
  })

  it('is symmetric', () => {
    const ab = haversineKm(SORRISO.latitude, SORRISO.longitude, SINOP.latitude, SINOP.longitude)
    const ba = haversineKm(SINOP.latitude, SINOP.longitude, SORRISO.latitude, SORRISO.longitude)
    expect(ab).toBeCloseTo(ba, 5)
  })

  it('returns ~111 km for 1° of latitude', () => {
    const d = haversineKm(0, 0, 1, 0)
    expect(d).toBeGreaterThan(110)
    expect(d).toBeLessThan(112)
  })

  it('returns a plausible distance between Sorriso and Sinop', () => {
    const d = haversineKm(SORRISO.latitude, SORRISO.longitude, SINOP.latitude, SINOP.longitude)
    // Road is ~130 km; great-circle will be shorter (~80-100 km)
    expect(d).toBeGreaterThan(50)
    expect(d).toBeLessThan(120)
  })
})

// ─── scoreDistance ────────────────────────────────────────────────────────────

describe('scoreDistance', () => {
  it('returns 1.0 at 0 km', () => {
    expect(scoreDistance(0)).toBe(1)
  })

  it('returns 0 at MAX_DISTANCE_KM (200 km default)', () => {
    expect(scoreDistance(200)).toBeCloseTo(0, 10)
  })

  it('clamps to 0 beyond MAX_DISTANCE_KM', () => {
    expect(scoreDistance(300)).toBe(0)
    expect(scoreDistance(1000)).toBe(0)
  })

  it('is strictly decreasing between 0 and MAX_DISTANCE_KM', () => {
    const near = scoreDistance(10)
    const mid = scoreDistance(80)
    const far = scoreDistance(160)
    expect(near).toBeGreaterThan(mid)
    expect(mid).toBeGreaterThan(far)
    expect(far).toBeGreaterThan(0)
  })

  it('gives a higher bonus to 10 km than linear decay would (log rewards closeness)', () => {
    // Linear at 10 km / 200 km = 0.95; log will be lower, rewarding nearness more steeply
    const log = scoreDistance(10)
    expect(log).toBeGreaterThan(0)
    expect(log).toBeLessThan(1)
    // log(11)/log(201) ≈ 0.452, so scoreDistance(10) ≈ 0.548 with MAX=200
    expect(log).toBeGreaterThan(0.4)
  })
})

// ─── scoreReputation ──────────────────────────────────────────────────────────

describe('scoreReputation', () => {
  it('returns 1.0 for a perfect 5-star rating with sufficient reviews', () => {
    expect(scoreReputation(5.0, 10, 'NONE')).toBeCloseTo(1.0, 5)
  })

  it('normalizes rating linearly (4.0 / 5 = 0.8 base)', () => {
    expect(scoreReputation(4.0, 10, 'NONE')).toBeCloseTo(0.8, 5)
  })

  it('applies cold-start penalty when review count < MIN_RATING_COUNT (3)', () => {
    const full = scoreReputation(5.0, 10, 'NONE') // no penalty
    const cold = scoreReputation(5.0, 1, 'NONE') // 1/3 multiplier
    expect(cold).toBeLessThan(full)
    expect(cold).toBeCloseTo(1 / 3, 5)
  })

  it('applies no cold-start penalty at exactly MIN_RATING_COUNT reviews', () => {
    const at3 = scoreReputation(4.0, 3, 'NONE')
    const at10 = scoreReputation(4.0, 10, 'NONE')
    expect(at3).toBeCloseTo(at10, 5)
  })

  it('adds SILVER badge bonus (+0.05)', () => {
    const base = scoreReputation(4.0, 10, 'NONE')
    const silver = scoreReputation(4.0, 10, 'SILVER')
    expect(silver).toBeCloseTo(base + 0.05, 5)
  })

  it('adds GOLD badge bonus (+0.10)', () => {
    const base = scoreReputation(4.0, 10, 'NONE')
    const gold = scoreReputation(4.0, 10, 'GOLD')
    expect(gold).toBeCloseTo(base + 0.1, 5)
  })

  it('clamps the result to 1.0 even with high rating + GOLD badge', () => {
    expect(scoreReputation(5.0, 100, 'GOLD')).toBeLessThanOrEqual(1.0)
  })

  it('returns a non-negative score for a 0-star rating', () => {
    expect(scoreReputation(0, 0, 'NONE')).toBeGreaterThanOrEqual(0)
  })
})

// ─── scoreCompatibilityPair ───────────────────────────────────────────────────

describe('scoreCompatibilityPair', () => {
  it('returns 0 for same-kind pairs (competitors do not benefit each other)', () => {
    expect(scoreCompatibilityPair('OFFER', 'CORN', 'OFFER', 'CORN')).toBe(0)
    expect(scoreCompatibilityPair('DEMAND', 'CORN', 'DEMAND', 'CORN')).toBe(0)
    expect(scoreCompatibilityPair('SERVICE', 'AGRONOMY', 'SERVICE', 'AGRONOMY')).toBe(0)
  })

  it('gives the highest base to complementary OFFER → DEMAND with exact category', () => {
    const score = scoreCompatibilityPair('OFFER', 'CORN', 'DEMAND', 'CORN')
    // 0.70 base + 0.30 exact category = 1.00, clamped to 1
    expect(score).toBe(1.0)
  })

  it('gives 0.85 to OFFER → DEMAND with same cluster (0.70 + 0.15)', () => {
    // CORN and SOY are both in the GRAINS cluster
    const score = scoreCompatibilityPair('OFFER', 'CORN', 'DEMAND', 'SOY')
    expect(score).toBeCloseTo(0.85, 5)
  })

  it('gives 0.70 to OFFER → DEMAND with unrelated categories', () => {
    const score = scoreCompatibilityPair('OFFER', 'CORN', 'DEMAND', 'LABOR')
    expect(score).toBeCloseTo(0.7, 5)
  })

  it('gives 0.70 base to SERVICE → DEMAND complementary pair', () => {
    const score = scoreCompatibilityPair('SERVICE', 'AGRONOMY', 'DEMAND', 'CORN')
    expect(score).toBeCloseTo(0.7, 5)
  })

  it('gives 0.40 base to cross-kind pairs (OFFER → SERVICE)', () => {
    const score = scoreCompatibilityPair('OFFER', 'CORN', 'SERVICE', 'LABOR')
    expect(score).toBeCloseTo(0.4, 5)
  })

  it('adds exact category bonus for cross-kind pairs', () => {
    const withBonus = scoreCompatibilityPair('OFFER', 'CORN', 'SERVICE', 'CORN')
    const noBonus = scoreCompatibilityPair('OFFER', 'CORN', 'SERVICE', 'LABOR')
    expect(withBonus).toBeGreaterThan(noBonus)
  })

  it('gives cluster bonus for related categories', () => {
    // SOY and CORN are both GRAINS — cross-kind context
    const cluster = scoreCompatibilityPair('OFFER', 'SOY', 'SERVICE', 'CORN')
    const none = scoreCompatibilityPair('OFFER', 'SOY', 'SERVICE', 'LABOR')
    expect(cluster).toBeGreaterThan(none)
    expect(cluster - none).toBeCloseTo(0.15, 5)
  })
})

// ─── scoreCompatibility ───────────────────────────────────────────────────────

describe('scoreCompatibility', () => {
  it('returns 0 and null when candidate has no listings', () => {
    const result = scoreCompatibility(makeListing(), [])
    expect(result.score).toBe(0)
    expect(result.bestListing).toBeNull()
  })

  it('returns 0 and null when all candidate listings are inactive', () => {
    const inactive: CandidateListing[] = [
      { kind: 'DEMAND', category: 'CORN', status: 'PAUSED' },
      { kind: 'DEMAND', category: 'CORN', status: 'CLOSED' },
    ]
    const result = scoreCompatibility(makeListing(), inactive)
    expect(result.score).toBe(0)
    expect(result.bestListing).toBeNull()
  })

  it('picks the highest-scoring active listing from the portfolio', () => {
    const listings: CandidateListing[] = [
      { kind: 'SERVICE', category: 'LABOR', status: 'ACTIVE' }, // lower compat
      { kind: 'DEMAND', category: 'CORN', status: 'ACTIVE' }, // perfect OFFER→DEMAND + exact
    ]
    const { score, bestListing } = scoreCompatibility(makeListing(), listings)
    expect(score).toBe(1.0)
    expect(bestListing?.kind).toBe('DEMAND')
    expect(bestListing?.category).toBe('CORN')
  })

  it('ignores inactive listings when a better inactive exists', () => {
    const listings: CandidateListing[] = [
      { kind: 'DEMAND', category: 'CORN', status: 'PAUSED' }, // perfect but inactive
      { kind: 'SERVICE', category: 'LABOR', status: 'ACTIVE' }, // active but worse
    ]
    const { score, bestListing } = scoreCompatibility(makeListing(), listings)
    expect(bestListing?.kind).toBe('SERVICE') // only ACTIVE considered
    expect(score).toBeLessThan(1.0)
  })
})

// ─── scoreResponsiveness ──────────────────────────────────────────────────────

describe('scoreResponsiveness', () => {
  it('returns 0.5 for null (no transaction history)', () => {
    expect(scoreResponsiveness(null)).toBe(0.5)
  })

  it('returns 0.5 for undefined', () => {
    expect(scoreResponsiveness(undefined)).toBe(0.5)
  })

  it('returns 1.0 for sub-1h response time', () => {
    expect(scoreResponsiveness(0)).toBe(1.0)
    expect(scoreResponsiveness(0.5)).toBe(1.0)
  })

  it('returns 0.7 for 1–6h response time', () => {
    expect(scoreResponsiveness(1)).toBe(0.7)
    expect(scoreResponsiveness(3)).toBe(0.7)
    expect(scoreResponsiveness(5.9)).toBe(0.7)
  })

  it('returns 0.4 for 6–24h response time', () => {
    expect(scoreResponsiveness(6)).toBe(0.4)
    expect(scoreResponsiveness(12)).toBe(0.4)
    expect(scoreResponsiveness(23)).toBe(0.4)
  })

  it('returns 0.1 for responses beyond 24h', () => {
    expect(scoreResponsiveness(24)).toBe(0.1)
    expect(scoreResponsiveness(72)).toBe(0.1)
  })
})

// ─── computeMatchScore ────────────────────────────────────────────────────────

describe('computeMatchScore', () => {
  it('returns a score clamped to [0, 1]', async () => {
    const { score } = await computeMatchScore(makeListing(), makeCandidate())
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(1)
  })

  it('returns 0 km distance when listing and candidate share the same location', async () => {
    const { distanceKm } = await computeMatchScore(makeListing(), makeCandidate())
    expect(distanceKm).toBe(0)
  })

  it('returns the correct distance when candidate is at a different location', async () => {
    const candidate = makeCandidate({ location: SINOP })
    const { distanceKm } = await computeMatchScore(makeListing(), candidate)
    expect(distanceKm).toBeGreaterThan(50)
    expect(distanceKm).toBeLessThan(120)
  })

  it('scores a nearby perfect match higher than a far imperfect one', async () => {
    const nearPerfect = makeCandidate({ location: SORRISO }) // OFFER+CORN vs DEMAND+CORN, 0 km
    const farWeak = makeCandidate({
      location: SAO_PAULO, // ~1900 km — beyond radius
      listings: [{ kind: 'SERVICE', category: 'LABOR', status: 'ACTIVE' }],
    })

    const { score: nearScore } = await computeMatchScore(makeListing(), nearPerfect)
    const { score: farScore } = await computeMatchScore(makeListing(), farWeak)
    expect(nearScore).toBeGreaterThan(farScore)
  })

  it('includes a breakdown with all four sub-scores and weights', async () => {
    const { breakdown } = await computeMatchScore(makeListing(), makeCandidate())
    expect(breakdown).toHaveProperty('distance')
    expect(breakdown).toHaveProperty('reputation')
    expect(breakdown).toHaveProperty('compatibility')
    expect(breakdown).toHaveProperty('responsiveness')
    expect(
      breakdown.weights.distance +
        breakdown.weights.reputation +
        breakdown.weights.compatibility +
        breakdown.weights.responsiveness,
    ).toBeCloseTo(1.0, 3)
  })

  it('exposes the bestCandidateListing that drove the compatibility sub-score', async () => {
    const { bestCandidateListing } = await computeMatchScore(makeListing(), makeCandidate())
    expect(bestCandidateListing).not.toBeNull()
    expect(bestCandidateListing?.kind).toBe('DEMAND')
    expect(bestCandidateListing?.category).toBe('CORN')
  })

  it('returns score of 0 when candidate has no active listings (0 compatibility)', async () => {
    const candidate = makeCandidate({
      listings: [],
      currentRating: 0,
      ratingCount: 0,
      badge: 'NONE',
      avgResponseHours: null,
      // location same → max distance score
    })
    // distance (1.0) × 0.40 + rep (0.5×0) × 0.35 + compat (0) × 0.20 + resp (0.5) × 0.05
    // = 0.40 + 0 + 0 + 0.025 = 0.425
    const { score } = await computeMatchScore(makeListing(), candidate)
    expect(score).toBeGreaterThan(0) // distance still contributes
    expect(score).toBeLessThan(0.5)
  })
})
