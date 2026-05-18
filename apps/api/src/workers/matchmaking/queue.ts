import { Queue } from 'bullmq'
import type { MatchmakingJobData } from './types.js'

// ─── Connection ───────────────────────────────────────────────────────────────

export function buildRedisConnection() {
  const url = process.env['REDIS_URL']
  if (!url) throw new Error('REDIS_URL não definida — matchmaking queue indisponível')
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    ...(parsed.password ? { password: decodeURIComponent(parsed.password) } : {}),
    ...(parsed.protocol === 'rediss:' ? { tls: {} } : {}),
  }
}

// ─── Queue singleton ──────────────────────────────────────────────────────────

let _queue: Queue<MatchmakingJobData> | null = null

export function getMatchmakingQueue(): Queue<MatchmakingJobData> | null {
  if (!process.env['REDIS_URL']) return null
  _queue ??= new Queue<MatchmakingJobData>('matchmaking', {
    connection: buildRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { age: 3600 }, // keep 1h for metrics
      removeOnFail: { age: 86400 * 7 }, // keep failed jobs 7d for replay
    },
  })
  return _queue
}

// ─── Job helpers ──────────────────────────────────────────────────────────────

export async function addComputeMatchesJob(listingId: string): Promise<void> {
  const queue = getMatchmakingQueue()
  if (!queue) {
    console.warn('[matchmaking-queue] Redis não configurado, job ignorado', { listingId })
    return
  }
  await queue.add('compute-matches-for-listing', {
    type: 'compute-matches-for-listing',
    listingId,
  })
}

/**
 * Adds a notify-match job with jobId deduplication to enforce the 1/day limit.
 * BullMQ will silently skip the add if a job with this ID already exists
 * (waiting, active, delayed, or completed within the removeOnComplete window).
 */
export async function addNotifyMatchJob(
  matchScoreId: string,
  listingOwnerUserId: string,
): Promise<void> {
  const queue = getMatchmakingQueue()
  if (!queue) return

  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  await queue.add(
    'notify-match',
    { type: 'notify-match', matchScoreId, listingOwnerUserId },
    {
      jobId: `notify-match:${listingOwnerUserId}:${today}`,
      // Keep completed notify jobs for 25h so the jobId dedup window covers the full day.
      removeOnComplete: { age: 90000 },
      removeOnFail: false,
    },
  )
}
