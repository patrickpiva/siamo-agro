'use client'

import { useRef, useEffect } from 'react'
import { NotificationIcon } from '@siamo/ui'
import { cn } from '@siamo/ui'

export type NotificationType =
  | 'PROPOSAL_RECEIVED'
  | 'PROPOSAL_ACCEPTED'
  | 'PROPOSAL_REFUSED'
  | 'TRANSACTION_COMPLETED'
  | 'RATING_RECEIVED'
  | 'MATCH_FOUND'
  | 'COLLECTIVE_UPDATE'
  | 'SYSTEM'

export interface NotificationAction {
  label: string
  variant: 'primary' | 'secondary'
  href?: string
  onClick?: () => void
}

export interface NotificationData {
  id: string
  type: NotificationType
  read: boolean
  createdAt: string
  data: Record<string, unknown>
  actions?: NotificationAction[]
}

interface NotificationItemProps {
  notification: NotificationData
  onRead?: (id: string) => void
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Agora'
  if (diffMin < 60) return `${diffMin} min atrás`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h atrás`
  return date
    .toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(',', ' ·')
}

function str(d: Record<string, unknown>, key: string, fallback: string): string {
  const v = d[key]
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return fallback
}

function formatText(notification: NotificationData): React.ReactNode {
  const d = notification.data
  switch (notification.type) {
    case 'PROPOSAL_RECEIVED':
      return (
        <>
          <strong className="font-medium">{str(d, 'proposerName', 'Alguém')}</strong>
          {' enviou uma proposta para '}
          <strong className="font-medium">{str(d, 'listingTitle', 'seu anúncio')}</strong>
          {d['offeredPrice'] ? (
            <span className="text-muted-foreground">
              {'. Valor: '}
              {(Number(d['offeredPrice']) / 100).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          ) : null}
        </>
      )
    case 'PROPOSAL_ACCEPTED':
      return (
        <>
          <strong className="font-medium">{str(d, 'otherPartyName', 'Parceiro')}</strong>
          {' aceitou sua proposta para '}
          <strong className="font-medium">{str(d, 'listingTitle', 'o anúncio')}</strong>
        </>
      )
    case 'PROPOSAL_REFUSED':
      return (
        <>
          <strong className="font-medium">{str(d, 'otherPartyName', 'Parceiro')}</strong>
          {' recusou sua proposta para '}
          <strong className="font-medium">{str(d, 'listingTitle', 'o anúncio')}</strong>
        </>
      )
    case 'TRANSACTION_COMPLETED': {
      const txnId = str(d, 'transactionId', '')
      return (
        <>
          <strong className="font-medium">{str(d, 'otherPartyName', 'Parceiro')}</strong>
          {' confirmou a conclusão da transação '}
          {txnId && <strong className="font-medium">#{txnId}</strong>}
          {'. Avalie sua experiência!'}
        </>
      )
    }
    case 'RATING_RECEIVED': {
      const score = Math.round(Number(str(d, 'score', '5')))
      const stars = '★'.repeat(Math.max(0, Math.min(5, score)))
      return (
        <>
          <strong className="font-medium">{str(d, 'raterName', 'Alguém')}</strong>
          {' deixou uma avaliação '}
          <span className="text-amber-500">{stars}</span>
          {' para você'}
        </>
      )
    }
    case 'MATCH_FOUND':
      return (
        <>
          {'Novo match! '}
          <strong className="font-medium">{str(d, 'count', '')} anúncios</strong>
          {' foram encontrados próximos a você na categoria '}
          <strong className="font-medium">{str(d, 'category', '')}</strong>
        </>
      )
    case 'COLLECTIVE_UPDATE':
      return <span>{str(d, 'message', 'Atualização de compra coletiva')}</span>
    default:
      return <span>{str(d, 'message', 'Nova notificação')}</span>
  }
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Mark as read when visible for > 2s
  useEffect(() => {
    if (notification.read || !onRead) return
    const el = ref.current
    if (!el) return

    let timer: ReturnType<typeof setTimeout> | null = null
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          timer = setTimeout(() => onRead(notification.id), 2000)
        } else {
          if (timer) clearTimeout(timer)
        }
      },
      { threshold: 0.5 },
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [notification.id, notification.read, onRead])

  return (
    <div
      ref={ref}
      aria-label={notification.read ? 'Notificação lida' : 'Notificação não lida'}
      className={cn(
        'relative flex gap-3 border-b px-5 py-[14px] last:border-b-0',
        'border-border',
        !notification.read && 'notif-unread',
      )}
    >
      {/* Unread dot */}
      {!notification.read && (
        <span
          aria-hidden="true"
          className="bg-primary absolute left-[12px] top-1/2 size-[5px] -translate-y-1/2 rounded-full"
        />
      )}

      {/* Icon */}
      <NotificationIcon type={notification.type} />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-foreground text-[13px] leading-[1.5]">{formatText(notification)}</p>
        <p className="text-muted-foreground mt-1 font-mono text-[10px]">
          {formatTime(notification.createdAt)}
        </p>

        {/* Action buttons */}
        {notification.actions && notification.actions.length > 0 && (
          <div className="mt-3 flex gap-2">
            {notification.actions.map((action, i) => {
              const cls = cn(
                'rounded-[10px] px-4 py-[9px] text-[13px] font-medium transition-opacity active:opacity-70',
                action.variant === 'primary'
                  ? 'bg-cta-bg text-cta-fg'
                  : 'border border-border bg-transparent text-foreground',
              )
              return action.href ? (
                <a key={i} href={action.href} className={cls}>
                  {action.label}
                </a>
              ) : (
                <button key={i} type="button" onClick={action.onClick} className={cls}>
                  {action.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
