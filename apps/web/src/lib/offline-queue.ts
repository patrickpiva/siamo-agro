const QUEUE_KEY = 'siamo:offline-queue'

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
      // Sempre via /api/proxy: mesma origem (sem CORS) e o proxy injeta o
      // `Authorization: Bearer` a partir do cookie httpOnly. Chamar
      // NEXT_PUBLIC_API_URL direto daqui mandava a requisição sem credencial
      // nenhuma — o endpoint é autenticado, então toda mensagem enfileirada
      // tomava 401 e era descartada em silêncio após 3 tentativas.
      const res = await fetch(`/api/proxy/transactions/${msg.transactionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msg.content }),
      })

      // 401/403: sessão expirada enquanto offline. Reenfileirar não resolve —
      // mantém a mensagem para a próxima sessão em vez de queimar as retries.
      if (res.status === 401 || res.status === 403) {
        failed.push(msg)
        continue
      }
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
