const QUEUE_KEY = 'agrolink:offline-queue'
const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

export interface QueuedMessage {
  transactionId: string
  content: string
  timestamp: number
  retries: number
}

function getQueue(): QueuedMessage[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as QueuedMessage[]
  } catch {
    return []
  }
}

function saveQueue(queue: QueuedMessage[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function enqueueMessage(msg: Omit<QueuedMessage, 'retries'>): void {
  const queue = getQueue()
  queue.push({ ...msg, retries: 0 })
  saveQueue(queue)
}

export function getQueueLength(): number {
  return getQueue().length
}

export async function flushOfflineQueue(): Promise<void> {
  const queue = getQueue()
  if (queue.length === 0) return

  const failed: QueuedMessage[] = []

  for (const msg of queue) {
    try {
      const res = await fetch(`${API_URL}/api/v1/transactions/${msg.transactionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msg.content }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch {
      if (msg.retries < 3) {
        failed.push({ ...msg, retries: msg.retries + 1 })
      }
      // silently drop after 3 retries
    }
  }

  saveQueue(failed)
}
