'use client'

import { useState, useEffect } from 'react'
import { WifiOff, RefreshCw, Loader2 } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { cn } from '@siamo/ui'

function minutesAgo(since: Date): number {
  return Math.floor((Date.now() - since.getTime()) / 60_000)
}

export function OfflineBanner() {
  const [mounted, setMounted] = useState(false)
  const { isOnline, offlineSince } = useOnlineStatus()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Treat "went offline < 2s ago" as a reconnecting grace period
  const isReconnecting = isOnline && offlineSince !== null
  const showBanner = !isOnline || isReconnecting

  if (!mounted || !showBanner) return null

  const age = offlineSince ? minutesAgo(offlineSince) : null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'flex items-center justify-between gap-[10px] px-4 py-[10px]',
        isReconnecting ? 'offline-banner-reconnecting' : 'offline-banner-amber',
      )}
    >
      {/* Dot */}
      <span
        aria-hidden
        className={cn(
          'size-2 shrink-0 rounded-full',
          isReconnecting ? 'offline-dot-pulse' : 'offline-dot-amber',
        )}
      />

      {/* Text */}
      <div className="flex-1">
        <span
          className={cn(
            'text-[12px] font-medium',
            isReconnecting ? 'text-blue-500 dark:text-blue-400' : 'offline-text-amber',
          )}
        >
          {isReconnecting ? 'Reconectando…' : 'Sem conexão'}
        </span>
        {age !== null && !isReconnecting && (
          <span className="text-muted-foreground ml-1 font-mono text-[11px]">
            dados de {age} min atrás
          </span>
        )}
      </div>

      {/* CTA */}
      {!isReconnecting && (
        <button
          type="button"
          aria-label="Tentar reconectar à internet"
          onClick={() => window.location.reload()}
          className={cn(
            'flex min-h-0 min-w-0 items-center gap-[5px] font-mono text-[11px] font-medium',
            'offline-reconnect-btn',
          )}
        >
          <RefreshCw size={11} strokeWidth={2.5} />
          RECONECTAR
        </button>
      )}

      {isReconnecting && (
        <Loader2
          size={14}
          className="shrink-0 animate-spin text-blue-500 dark:text-blue-400"
          aria-hidden
        />
      )}

      {/* Hidden icon for screen readers */}
      <span className="sr-only">
        <WifiOff size={14} />
      </span>
    </div>
  )
}
