import { Queue } from 'bullmq'
import type { TransactionJobData } from './types.js'

// ─── Connection (reuses same Redis as matchmaking) ────────────────────────────

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

// ─── Queue singleton ──────────────────────────────────────────────────────────

let _queue: Queue<TransactionJobData> | null = null

function getQueue(): Queue<TransactionJobData> | null {
  if (!process.env['REDIS_URL']) return null
  _queue ??= new Queue<TransactionJobData>('transactions', {
    connection: buildConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 86400 * 7 },
    },
  })
  return _queue
}

// ─── Job helpers ──────────────────────────────────────────────────────────────

export async function addAutoCancelJob(transactionId: string): Promise<void> {
  const queue = getQueue()
  if (!queue) {
    console.warn('[transactions-queue] Redis não configurado, auto-cancel ignorado', {
      transactionId,
    })
    return
  }
  try {
    await queue.add(
      'auto-cancel',
      { type: 'auto-cancel', transactionId },
      {
        // jobId dedup: only one auto-cancel per transaction
        jobId: `auto-cancel_${transactionId}`,
        delay: 72 * 60 * 60 * 1000, // 72h
      },
    )
  } catch (err) {
    console.warn(
      '[transactions-queue] Falha ao enfileirar auto-cancel — transação criada normalmente',
      {
        transactionId,
        err,
      },
    )
  }
}

export async function addStaleProgressAlertJob(transactionId: string): Promise<void> {
  const queue = getQueue()
  if (!queue) return
  try {
    await queue.add(
      'stale-progress-alert',
      { type: 'stale-progress-alert', transactionId },
      {
        jobId: `stale-progress_${transactionId}`,
        delay: 90 * 24 * 60 * 60 * 1000, // 90d
      },
    )
  } catch (err) {
    console.warn('[transactions-queue] Falha ao enfileirar stale-progress-alert', {
      transactionId,
      err,
    })
  }
}
