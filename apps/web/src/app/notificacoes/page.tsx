'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft } from '@agrolink/ui/icons'
import { cn } from '@agrolink/ui'
import {
  NotificationItem,
  type NotificationData,
} from '@/components/notifications/notification-item'
import { NotificationFilterTabs } from '@/components/notifications/notification-filter-tabs'
import { Suspense } from 'react'

const TYPE_MAP: Record<string, string> = {
  proposals: 'PROPOSAL_RECEIVED,PROPOSAL_ACCEPTED,PROPOSAL_REFUSED',
  transactions: 'TRANSACTION_COMPLETED',
  matches: 'MATCH_FOUND',
}

function groupByDay(
  notifications: NotificationData[],
): Array<{ label: string; items: NotificationData[] }> {
  const groups: Map<string, NotificationData[]> = new Map()
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  for (const n of notifications) {
    const d = new Date(n.createdAt)
    let label: string
    if (d.toDateString() === today.toDateString()) {
      label = `HOJE · ${today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()}`
    } else if (d.toDateString() === yesterday.toDateString()) {
      label = 'ONTEM'
    } else {
      label = d
        .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
        .toUpperCase()
    }
    const existing = groups.get(label) ?? []
    existing.push(n)
    groups.set(label, existing)
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }))
}

function NotificationsContent() {
  const searchParams = useSearchParams()
  const typeFilter = searchParams.get('type')

  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const fetchNotifications = useCallback(
    async (reset = false) => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (typeFilter && TYPE_MAP[typeFilter]) {
          // Pass first type from the comma-separated list
          params.set('type', TYPE_MAP[typeFilter]?.split(',')[0] ?? '')
        }
        if (!reset && cursor) params.set('cursor', cursor)
        params.set('limit', '20')

        const res = await fetch(`/api/proxy/notifications?${params.toString()}`, {
          credentials: 'include',
        })
        if (!res.ok) return

        const json = (await res.json()) as {
          data: NotificationData[]
          meta: { nextCursor: string | null }
        }
        setNotifications((prev) => (reset ? json.data : [...prev, ...json.data]))
        setCursor(json.meta.nextCursor)
        setHasMore(json.meta.nextCursor !== null)
      } finally {
        setIsLoading(false)
      }
    },
    [typeFilter, cursor],
  )

  // Reload when type filter changes
  useEffect(() => {
    setCursor(null)
    void fetchNotifications(true)
  }, [typeFilter])

  async function handleMarkAllRead() {
    setIsMarkingAll(true)
    try {
      await fetch('/api/proxy/notifications/read-all', {
        method: 'POST',
        credentials: 'include',
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } finally {
      setIsMarkingAll(false)
    }
  }

  const handleRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    fetch(`/api/proxy/notifications/${id}/read`, { method: 'PATCH', credentials: 'include' }).catch(
      () => {},
    )
  }, [])

  const groups = groupByDay(notifications)
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <Link
          href="/feed"
          aria-label="Voltar"
          className="bg-muted flex size-[36px] items-center justify-center rounded-full"
        >
          <ArrowLeft size={18} strokeWidth={1.8} />
        </Link>
        <p className="text-[15px] font-medium">Notificações</p>
        <button
          type="button"
          onClick={() => void handleMarkAllRead()}
          disabled={isMarkingAll || unreadCount === 0}
          aria-label="Marcar todas como lidas"
          aria-live="polite"
          className={cn(
            'text-primary font-mono text-[11px] font-medium tracking-[0.3px] disabled:opacity-40',
          )}
        >
          {isMarkingAll ? 'MARCANDO…' : 'MARCAR LIDAS'}
        </button>
      </header>

      {/* Filter tabs */}
      <NotificationFilterTabs />

      {/* Notifications list */}
      <main className="flex-1">
        {isLoading && notifications.length === 0 ? (
          <div className="space-y-1 px-5 pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-muted h-[72px] animate-pulse rounded-[12px]" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-8 pt-16 text-center">
            <p className="text-muted-foreground text-[15px]">Nenhuma notificação por aqui.</p>
            <p className="text-muted-foreground mt-1 text-[13px]">
              Quando acontecer algo importante, você verá aqui.
            </p>
          </div>
        ) : (
          <div className="bg-card border-border mx-4 overflow-hidden rounded-[14px] border">
            {groups.map(({ label, items }) => (
              <div key={label}>
                <p className="text-muted-foreground border-border border-b px-5 py-[10px] font-mono text-[10px] tracking-[0.4px]">
                  {label}
                </p>
                {items.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={handleRead}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center py-4">
            <button
              type="button"
              onClick={() => void fetchNotifications(false)}
              disabled={isLoading}
              className="text-primary text-[13px] font-medium disabled:opacity-50"
            >
              {isLoading ? 'Carregando…' : 'Carregar mais'}
            </button>
          </div>
        )}
      </main>
    </>
  )
}

export default function NotificacoesPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col pb-[80px]">
      <Suspense fallback={null}>
        <NotificationsContent />
      </Suspense>
    </div>
  )
}
