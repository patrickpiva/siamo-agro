import { Queue } from 'bullmq'
import type { ReputationJobData } from './types.js'

function buildConnection() {
  const url = process.env['REDIS_URL']
  if (!url) throw new Error('REDIS_URL não definida')
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    ...(parsed.password ? { password: decodeURIComponent(parsed.password) } : {}),
    ...(parsed.protocol === 'rediss:' ? { tls: {} } : {}),
  }
}

let _queue: Queue<ReputationJobData> | null = null

function getQueue(): Queue<ReputationJobData> | null {
  if (!process.env['REDIS_URL']) return null
  _queue ??= new Queue<ReputationJobData>('reputation', {
    connection: buildConnection(),
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 86400 * 7 },
    },
  })
  return _queue
}

// ─── Job helpers ──────────────────────────────────────────────────────────────

/**
 * Enqueues a reputation recompute for a single user.
 * Uses jobId dedup so concurrent ratings don't flood the queue.
 */
export async function addReputationRecomputeJob(userId: string): Promise<void> {
  const queue = getQueue()
  if (!queue) {
    console.warn('[reputation-queue] Redis não configurado, recompute ignorado', { userId })
    return
  }
  try {
    await queue.add(
      'recompute-profile',
      { type: 'recompute-profile', userId },
      {
        // Dedup: only one pending recompute per user
        jobId: `recompute_${userId}`,
        // Small delay to batch multiple concurrent ratings into one job
        delay: 2000,
      },
    )
  } catch (err) {
    console.warn('[reputation-queue] Falha ao enfileirar recompute — avaliação salva normalmente', {
      userId,
      err,
    })
  }
}

/**
 * Enqueues a full recompute for all profiles (daily cron).
 * Needed because temporal decay changes scores over time.
 */
export async function addRecomputeAllJob(): Promise<void> {
  const queue = getQueue()
  if (!queue) return
  try {
    await queue.add('recompute-all', { type: 'recompute-all' }, { jobId: 'recompute-all' })
  } catch (err) {
    console.warn('[reputation-queue] Falha ao enfileirar recompute-all', { err })
  }
}
