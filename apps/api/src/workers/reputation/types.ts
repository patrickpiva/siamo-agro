export interface RecomputeProfileJobData {
  type: 'recompute-profile'
  /** userId of the profile to recompute */
  userId: string
}

export interface RecomputeAllJobData {
  type: 'recompute-all'
}

export type ReputationJobData = RecomputeProfileJobData | RecomputeAllJobData
