// ─── Job data types ───────────────────────────────────────────────────────────

export interface ComputeMatchesJobData {
  type: 'compute-matches-for-listing'
  listingId: string
}

export interface NotifyMatchJobData {
  type: 'notify-match'
  matchScoreId: string
  /** Pre-loaded to avoid a DB round-trip in the dedup jobId. */
  listingOwnerUserId: string
}

export type MatchmakingJobData = ComputeMatchesJobData | NotifyMatchJobData

// ─── Internal processing types ────────────────────────────────────────────────

export interface CandidateRow {
  id: string
  currentRating: number
  ratingCount: number
  badge: string
  latitude: number
  longitude: number
  distanceKm: number
}
