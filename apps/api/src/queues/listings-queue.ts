import { Queue } from 'bullmq'

let _queue: Queue | null = null

function getQueue(): Queue | null {
  const hasRedis = process.env['REDIS_URL'] ?? process.env['REDIS_HOST']
  if (!hasRedis) {
    return null
  }
  if (!_queue) {
    const url = process.env['REDIS_URL']
    const connection = url
      ? { url }
      : {
          host: process.env['REDIS_HOST'] ?? 'localhost',
          port: Number(process.env['REDIS_PORT'] ?? 6379),
        }
    _queue = new Queue('listings', { connection })
  }
  return _queue
}

export async function addComputeMatchesJob(listingId: string): Promise<void> {
  const queue = getQueue()
  if (!queue) {
    console.warn('[listings-queue] Redis não configurado, job compute-matches ignorado')
    return
  }
  await queue.add('compute-matches', { listingId })
}
