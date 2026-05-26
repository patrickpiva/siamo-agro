'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { ChatBubble, ChatInput } from '@agrolink/ui'
import { CheckCircle } from '@agrolink/ui/icons'
import { getSupabase } from '@/lib/supabase-client'

interface Message {
  id: string
  senderId: string
  content: string
  createdAt: string
}

interface Participant {
  id: string
  name: string
  photo: string | null
  badge: string
}

interface ChatViewProps {
  transactionId: string
  currentUserId: string
  initialMessages: Message[]
  /** null = canChat; 'COMPLETED' | 'CANCELLED' = read-only */
  readOnly?: boolean
  counterpart: Participant
  /** Hide the inline online-indicator strip (use when page header already shows it) */
  showOnlineStrip?: boolean
  /** System event shown as a centered info bubble before the first message */
  systemEvent?: { label: string; date: string }
  /** When set, renders "Marcar como concluída" button above the input */
  completionHref?: string
}

export function ChatView({
  transactionId,
  currentUserId,
  initialMessages,
  readOnly = false,
  counterpart,
  showOnlineStrip = true,
  systemEvent,
  completionHref,
}: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [counterpartOnline, setCounterpartOnline] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // ─── Supabase Realtime: new messages ────────────────────────────────────────

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return // Realtime not available — static messages only

    const channel = sb
      .channel(`tx-${transactionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transaction_messages',
          filter: `transaction_id=eq.${transactionId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string
            sender_id: string
            content: string
            created_at: string
          }
          setMessages((prev) => {
            // Deduplicate: ignore if already present (optimistic insert)
            if (prev.some((m) => m.id === row.id)) return prev
            return [
              ...prev,
              {
                id: row.id,
                senderId: row.sender_id,
                content: row.content,
                createdAt: row.created_at,
              },
            ]
          })
        },
      )
      .subscribe()

    return () => {
      void sb.removeChannel(channel)
    }
  }, [transactionId])

  // ─── Supabase Presence: online status ───────────────────────────────────────

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return // Realtime not available

    const presenceChannel = sb.channel(`presence-tx-${transactionId}`, {
      config: { presence: { key: currentUserId } },
    })

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const isOnline = Object.keys(state).some((key) => key === counterpart.id)
        setCounterpartOnline(isOnline)
      })
      .subscribe((status) => {
        if (String(status) === 'SUBSCRIBED') {
          void presenceChannel.track({ userId: currentUserId, online_at: new Date().toISOString() })
        }
      })

    return () => {
      void sb.removeChannel(presenceChannel)
    }
  }, [transactionId, currentUserId, counterpart.id])

  // ─── Auto-scroll to bottom ───────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Send message ────────────────────────────────────────────────────────────

  async function handleSend(content: string) {
    if (!content.trim() || sending) return
    setSending(true)

    // Optimistic: add a temp message immediately
    const tempId = `temp-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        senderId: currentUserId,
        content,
        createdAt: new Date().toISOString(),
      },
    ])

    try {
      await fetch(`/api/proxy/transactions/${transactionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      // Real message arrives via Realtime; temp will be deduped
    } catch {
      // On error, remove temp message
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
    } finally {
      setSending(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Online indicator strip — hidden when the page header already shows it */}
      {!readOnly && showOnlineStrip && (
        <div className="flex items-center gap-1.5 px-4 py-2">
          <div
            className={`size-1.5 rounded-full ${counterpartOnline ? 'bg-emerald-400' : 'bg-muted-foreground/40'}`}
          />
          <span className="text-muted-foreground text-[11px]">
            {counterpartOnline ? `${counterpart.name} online agora` : counterpart.name}
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-2">
        {/* System event bubble (e.g. "proposta aceita") */}
        {systemEvent && (
          <div className="flex justify-center py-3">
            <div className="bg-muted max-w-[85%] rounded-[10px] px-4 py-2 text-center">
              <p className="text-muted-foreground font-mono text-[11px] leading-relaxed">
                {systemEvent.label} · {systemEvent.date}
              </p>
            </div>
          </div>
        )}

        {messages.length === 0 && !systemEvent && (
          <p className="text-muted-foreground py-8 text-center text-[13px]">
            Nenhuma mensagem ainda. Diga olá!
          </p>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId
          const time = new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })
          return (
            <ChatBubble
              key={msg.id}
              variant={isMine ? 'mine' : 'theirs'}
              content={msg.content}
              timestamp={time}
            />
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* "Marcar como concluída" CTA — shown above input for IN_PROGRESS */}
      {completionHref && !readOnly && (
        <div className="px-4 pb-1 pt-2">
          <Link href={completionHref as unknown as Route}>
            <div className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#c6e845] bg-[rgba(198,232,69,0.08)] py-[14px] dark:bg-[rgba(198,232,69,0.06)]">
              <CheckCircle size={16} strokeWidth={2} className="text-accent dark:text-primary" />
              <span className="text-accent dark:text-primary text-[14px] font-medium">
                Marcar como concluída
              </span>
            </div>
          </Link>
        </div>
      )}

      {/* Input */}
      {!readOnly && <ChatInput onSend={(v) => void handleSend(v)} disabled={sending} />}
    </div>
  )
}
