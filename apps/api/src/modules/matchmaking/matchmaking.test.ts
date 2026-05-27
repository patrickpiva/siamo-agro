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
import type { CandidateListing, CandidateProfile, MatchListing } from './algorithm.js'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SP = { latitude: -23.5505, longitude: -46.6333 } // São Paulo
const CWB = { latitude: -25.4284, longitude: -49.2733 } // Curitiba (~340 km)
const BSB = { latitude: -15.7801, longitude: -47.9292 } // Brasília (~873 km)

function makeListing(overrides: Partial<MatchListing> = {}): MatchListing {
  return {
    id: 'listing-1',
    kind: 'OFFER',
    category: 'GRAINS',
    createdAt: new Date('2025-01-01'),
    profile: {
      id: 'profile-1',
      currentRating: 4.0,
      ratingCount: 10,
      badge: 'NONE',
      location: SP,
    },
    ...overrides,
  }
}

function makeCandidate(overrides: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    id: 'profile-2',
    currentRating: 3.5,
    ratingCount: 5,
    badge: 'NONE',
    avgResponseHours: null,
    location: SP,
    listings: [{ kind: 'DEMAND', category: 'GRAINS', status: 'ACTIVE' }],
    ...overrides,
  }
}

// ─── haversineKm ──────────────────────────────────────────────────────────────

describe('haversineKm', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineKm(SP.latitude, SP.longitude, SP.latitude, SP.longitude)).toBe(0)
  })

  it('SP → Curitiba is approximately 340 km', () => {
    const d = haversineKm(SP.latitude, SP.longitude, CWB.latitude, CWB.longitude)
    expect(d).toBeGreaterThan(320)
    expect(d).toBeLessThan(360)
  })

  it('is symmetric', () => {
    const ab = haversineKm(SP.latitude, SP.longitude, CWB.latitude, CWB.longitude)
    const ba = haversineKm(CWB.latitude, CWB.longitude, SP.latitude, SP.longitude)
    expect(ab).toBeCloseTo(ba, 5)
  })
})

// ─── scoreDistance ────────────────────────────────────────────────────────────

describe('scoreDistance', () => {
  it('returns 1.0 at 0 km', () => {
    expect(scoreDistance(0)).toBe(1.0)
  })

  // Logarithmic decay: 1 - log(1 + d) / log(1 + 200)
  // At 100 km: 1 - log(101)/log(201) ≈ 0.13
  it('returns ~0.13 at 100 km (log decay, MAX=200)', () => {
    expect(scoreDistance(100)).toBeCloseTo(0.13, 1)
  })

  it('returns 0.0 at exactly 200 km', () => {
    expect(scoreDistance(200)).toBe(0.0)
  })

  it('clamps at 0.0 beyond 200 km', () => {
    expect(scoreDistance(500)).toBe(0.0)
    expect(scoreDistance(1000)).toBe(0.0)
  })

  // At 50 km: 1 - log(51)/log(201) ≈ 0.26
  it('returns ~0.26 at 50 km (log decay, MAX=200)', () => {
    expect(scoreDistance(50)).toBeCloseTo(0.26, 1)
  })
})

// ─── scoreReputation ──────────────────────────────────────────────────────────

describe('scoreReputation', () => {
  it('returns 1.0 for max rating with enough reviews', () => {
    expect(scoreReputation(5, 10, 'NONE')).toBe(1.0)
  })

  it('applies cold-start penalty when ratingCount < 3', () => {
    // ratingCount=1: base=4/5=0.8, multiplied by 1/3 ≈ 0.267
    const withPenalty = scoreReputation(4, 1, 'NONE')
    const withoutPenalty = scoreReputation(4, 10, 'NONE')
    expect(withPenalty).toBeLessThan(withoutPenalty)
    expect(withPenalty).toBeCloseTo(0.267, 2)
  })

  it('applies no cold-start penalty at exactly 3 reviews', () => {
    const at3 = scoreReputation(4, 3, 'NONE')
    const above3 = scoreReputation(4, 10, 'NONE')
    expect(at3).toBeCloseTo(above3, 5)
  })

  it('adds GOLD badge bonus of 0.10', () => {
    const base = scoreReputation(3, 10, 'NONE')
    const withGold = scoreReputation(3, 10, 'GOLD')
    expect(withGold - base).toBeCloseTo(0.1, 5)
  })

  it('adds SILVER badge bonus of 0.05', () => {
    const base = scoreReputation(3, 10, 'NONE')
    const withSilver = scoreReputation(3, 10, 'SILVER')
    expect(withSilver - base).toBeCloseTo(0.05, 5)
  })

  it('clamps to [0, 1] — GOLD + perfect rating does not exceed 1.0', () => {
    expect(scoreReputation(5, 100, 'GOLD')).toBe(1.0)
  })

  it('returns 0.0 for a 0-star profile with no reviews', () => {
    expect(scoreReputation(0, 0, 'NONE')).toBe(0.0)
  })
})

// ─── scoreCompatibilityPair ───────────────────────────────────────────────────

describe('scoreCompatibilityPair', () => {
  it('OFFER ↔ DEMAND same category returns 1.0', () => {
    expect(scoreCompatibilityPair('OFFER', 'GRAINS', 'DEMAND', 'GRAINS')).toBe(1.0)
  })

  it('OFFER ↔ DEMAND different category returns 0.7', () => {
    expect(scoreCompatibilityPair('OFFER', 'GRAINS', 'DEMAND', 'LIVESTOCK')).toBe(0.7)
  })

  it('SERVICE ↔ DEMAND same category returns 1.0', () => {
    expect(scoreCompatibilityPair('SERVICE', 'CONSULTING', 'DEMAND', 'CONSULTING')).toBe(1.0)
  })

  it('EQUIPMENT ↔ DEMAND returns 0.7', () => {
    expect(scoreCompatibilityPair('EQUIPMENT', 'TRACTOR', 'DEMAND', 'TRACTOR')).toBe(1.0)
  })

  it('OFFER ↔ SERVICE returns 0.4 base (cross-kind)', () => {
    expect(scoreCompatibilityPair('OFFER', 'GRAINS', 'SERVICE', 'OTHER')).toBe(0.4)
  })

  it('same-kind OFFER ↔ OFFER returns 0.0', () => {
    expect(scoreCompatibilityPair('OFFER', 'GRAINS', 'OFFER', 'GRAINS')).toBe(0.0)
  })

  it('same-kind DEMAND ↔ DEMAND returns 0.0 regardless of category', () => {
    expect(scoreCompatibilityPair('DEMAND', 'GRAINS', 'DEMAND', 'GRAINS')).toBe(0.0)
  })

  it('category bonus does not apply when base is 0', () => {
    expect(scoreCompatibilityPair('OFFER', 'GRAINS', 'OFFER', 'GRAINS')).toBe(0.0)
  })

  it('result never exceeds 1.0', () => {
    const score = scoreCompatibilityPair('DEMAND', 'GRAINS', 'OFFER', 'GRAINS')
    expect(score).toBeLessThanOrEqual(1.0)
  })
})

// ─── scoreCompatibility ───────────────────────────────────────────────────────

describe('scoreCompatibility', () => {
  it('picks the best-matching listing from the candidate portfolio', () => {
    const listing = makeListing({ kind: 'OFFER', category: 'GRAINS' })
    const listings: CandidateListing[] = [
      { kind: 'DEMAND', category: 'LIVESTOCK', status: 'ACTIVE' }, // 0.7
      { kind: 'DEMAND', category: 'GRAINS', status: 'ACTIVE' }, // 1.0 ← best
    ]
    const { score } = scoreCompatibility(listing, listings)
    expect(score).toBe(1.0)
  })

  it('ignores PAUSED and CLOSED listings', () => {
    const listing = makeListing({ kind: 'OFFER', category: 'GRAINS' })
    const listings: CandidateListing[] = [
      { kind: 'DEMAND', category: 'GRAINS', status: 'PAUSED' },
      { kind: 'DEMAND', category: 'GRAINS', status: 'CLOSED' },
    ]
    const { score, bestListing } = scoreCompatibility(listing, listings)
    expect(score).toBe(0)
    expect(bestListing).toBeNull()
  })

  it('returns 0 and null when candidate has no listings', () => {
    const listing = makeListing()
    const { score, bestListing } = scoreCompatibility(listing, [])
    expect(score).toBe(0)
    expect(bestListing).toBeNull()
  })

  it('returns the bestListing reference that drove the score', () => {
    const listing = makeListing({ kind: 'OFFER', category: 'GRAINS' })
    const best: CandidateListing = { kind: 'DEMAND', category: 'GRAINS', status: 'ACTIVE' }
    const { bestListing } = scoreCompatibility(listing, [
      { kind: 'SERVICE', category: 'OTHER', status: 'ACTIVE' },
      best,
    ])
    expect(bestListing).toBe(best)
  })
})

// ─── scoreResponsiveness ──────────────────────────────────────────────────────

describe('scoreResponsiveness', () => {
  it('returns 0.5 for null (no history)', () => {
    expect(scoreResponsiveness(null)).toBe(0.5)
  })

  it('returns 0.5 for undefined (no history)', () => {
    expect(scoreResponsiveness(undefined)).toBe(0.5)
  })

  it('returns 1.0 for < 1h response time', () => {
    expect(scoreResponsiveness(0.5)).toBe(1.0)
    expect(scoreResponsiveness(0)).toBe(1.0)
  })

  it('returns 0.7 for < 6h response time', () => {
    expect(scoreResponsiveness(2)).toBe(0.7)
    expect(scoreResponsiveness(5.9)).toBe(0.7)
  })

  it('returns 0.4 for < 24h response time', () => {
    expect(scoreResponsiveness(12)).toBe(0.4)
    expect(scoreResponsiveness(23)).toBe(0.4)
  })

  it('returns 0.1 for >= 24h response time', () => {
    expect(scoreResponsiveness(24)).toBe(0.1)
    expect(scoreResponsiveness(72)).toBe(0.1)
  })
})

// ─── computeMatchScore — integration fixtures ─────────────────────────────────

describe('computeMatchScore', () => {
  it('nearby perfect match scores above 0.8', async () => {
    const listing = makeListing({ kind: 'OFFER', category: 'GRAINS' })
    const candidate = makeCandidate({
      currentRating: 5.0,
      ratingCount: 20,
      badge: 'GOLD',
      avgResponseHours: 0.5,
      location: { latitude: SP.latitude + 0.05, longitude: SP.longitude + 0.05 }, // ~7 km
      listings: [{ kind: 'DEMAND', category: 'GRAINS', status: 'ACTIVE' }],
    })
    const result = await computeMatchScore(listing, candidate)
    // With log decay at ~7 km / 200 km max: distScore ≈ 0.60. Overall score ≈ 0.84.
    expect(result.score).toBeGreaterThan(0.7)
    expect(result.breakdown.distance).toBeGreaterThan(0.5)
    expect(result.breakdown.compatibility).toBe(1.0)
  })

  it('far-away candidate is capped by distance=0 even with great reputation', async () => {
    // BSB (~873 km) → distance score = 0.
    // With perfect reputation (5★ + GOLD) and full compatibility (OFFER→DEMAND GRAINS),
    // score = 0.40×0 + 0.35×1.0 + 0.20×1.0 + 0.05×0.5 = 0.575.
    // Distance dominance means the ceiling is ~0.6, not the ~0.95 a nearby candidate achieves.
    const listing = makeListing()
    const candidate = makeCandidate({
      currentRating: 5.0,
      ratingCount: 100,
      badge: 'GOLD',
      location: BSB, // ~873 km — beyond max radius
    })
    const result = await computeMatchScore(listing, candidate)
    expect(result.breakdown.distance).toBe(0.0)
    expect(result.score).toBeLessThan(0.65)
    expect(result.score).toBeGreaterThan(0.55)
  })

  it('incompatible kinds (OFFER↔OFFER) score low even when nearby', async () => {
    const listing = makeListing({ kind: 'OFFER', category: 'GRAINS' })
    const candidate = makeCandidate({
      location: SP,
      listings: [{ kind: 'OFFER', category: 'GRAINS', status: 'ACTIVE' }],
    })
    const result = await computeMatchScore(listing, candidate)
    expect(result.breakdown.compatibility).toBe(0.0)
    expect(result.bestCandidateListing).toBeNull()
  })

  it('candidate with no listings gets compatibility 0', async () => {
    const listing = makeListing()
    const candidate = makeCandidate({ listings: [] })
    const result = await computeMatchScore(listing, candidate)
    expect(result.breakdown.compatibility).toBe(0.0)
  })

  it('cold-start candidate (1 rating) scores lower than established one', async () => {
    const listing = makeListing()
    const base = makeCandidate({ location: SP })

    const established = await computeMatchScore(listing, { ...base, ratingCount: 50 })
    const newbie = await computeMatchScore(listing, { ...base, ratingCount: 1 })

    expect(established.score).toBeGreaterThan(newbie.score)
  })

  it('exposes distanceKm in the result', async () => {
    const listing = makeListing()
    const candidate = makeCandidate({ location: CWB })
    const result = await computeMatchScore(listing, candidate)
    expect(result.distanceKm).toBeGreaterThan(320)
    expect(result.distanceKm).toBeLessThan(360)
  })

  it('score is always in [0, 1]', async () => {
    const listing = makeListing()
    const candidate = makeCandidate({
      currentRating: 5,
      ratingCount: 1000,
      badge: 'GOLD',
      avgResponseHours: 0,
      location: SP,
    })
    const result = await computeMatchScore(listing, candidate)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(1)
  })

  it('breakdown weights sum to 1.0', async () => {
    const result = await computeMatchScore(makeListing(), makeCandidate())
    const { distance, reputation, compatibility, responsiveness } = result.breakdown.weights
    expect(distance + reputation + compatibility + responsiveness).toBeCloseTo(1.0)
  })

  it('Curitiba grain buyer × São Paulo grain seller — realistic mid-range scenario', async () => {
    // SP producer offering soybeans meets CWB trader demanding soybeans.
    // Distance ~340 km exceeds max → distance=0. Score driven by reputation + compatibility.
    const listing = makeListing({
      kind: 'OFFER',
      category: 'GRAINS',
      profile: {
        id: 'sp-producer',
        currentRating: 4.2,
        ratingCount: 8,
        badge: 'SILVER',
        location: SP,
      },
    })
    const buyer = makeCandidate({
      id: 'cwb-buyer',
      currentRating: 3.8,
      ratingCount: 4,
      badge: 'NONE',
      avgResponseHours: 3,
      location: CWB,
      listings: [{ kind: 'DEMAND', category: 'GRAINS', status: 'ACTIVE' }],
    })
    const result = await computeMatchScore(listing, buyer)
    expect(result.distanceKm).toBeGreaterThan(300)
    expect(result.breakdown.distance).toBe(0)
    expect(result.breakdown.compatibility).toBe(1.0)
    expect(result.score).toBeGreaterThan(0.3) // reputation + compat keep it alive
    expect(result.score).toBeLessThan(0.7) // distance kills the ceiling
  })
})
