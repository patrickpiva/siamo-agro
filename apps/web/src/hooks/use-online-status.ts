'use client'

import { useState, useEffect } from 'react'
import { flushOfflineQueue } from '@/lib/offline-queue'

export interface OnlineStatus {
  isOnline: boolean
  /** Timestamp of when the device went offline. null when online. */
  offlineSince: Date | null
}

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )
  const [offlineSince, setOfflineSince] = useState<Date | null>(null)

  useEffect(() => {
    function handleOffline() {
      setIsOnline(false)
      setOfflineSince(new Date())
    }

    async function handleOnline() {
      setIsOnline(true)
      setOfflineSince(null)
      // Drain queued messages and invalidate stale query cache
      await flushOfflineQueue()
      // Dispatch custom event so QueryClient can invalidate feed queries
      window.dispatchEvent(new CustomEvent('siamo:reconnected'))
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', () => void handleOnline())

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', () => void handleOnline())
    }
  }, [])

  return { isOnline, offlineSince }
}
