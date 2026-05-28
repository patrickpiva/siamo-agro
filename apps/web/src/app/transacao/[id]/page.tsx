'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StateBanner, ChatBubble, ChatInput } from '@agraia/ui'
import { TransactionStrip } from '@/components/transactions/transaction-strip'
import { ScreenHeader } from '@/components/layout/screen-header'
import { route } from '@/lib/route'

// Mock — Sprint 4: GET /api/v1/transactions/:id
const MOCK = {
  transactionId: 'txn-4821',
  listing: {
    id: 'listing-1',
    title: 'Café arábica especial — safra 2025',
    valueCents: 5250000,
  },
  counterpart: {
    name: 'Celso Aguiar',
    initials: 'CA',
  },
}

type Message = {
  id: string
  variant: 'mine' | 'theirs' | 'system'
  content: string
  timestamp?: string
}

const MOCK_MESSAGES: Message[] = [
  { id: '1', variant: 'system', content: 'Proposta aceita · negociação iniciada' },
  {
    id: '2',
    variant: 'theirs',
    content: 'Ótimo! Confirmo o interesse nas 30 sacas. Quando posso retirar?',
    timestamp: '14:32',
  },
  {
    id: '3',
    variant: 'mine',
    content:
      'Pode ser a partir de quinta-feira. O endereço do armazém é Fazenda São João, km 12 da rodovia SP-215.',
    timestamp: '14:35',
  },
  {
    id: '4',
    variant: 'theirs',
    content: 'Perfeito, na quinta às 9h fica bem. Preciso de nota fiscal?',
    timestamp: '14:38',
  },
  {
    id: '5',
    variant: 'mine',
    content: 'Sim, emito NF-e. Você receberá por e-mail antes da retirada.',
    timestamp: '14:40',
  },
]

interface TransacaoPageProps {
  params: Promise<{ id: string }>
}

export default function TransacaoPage({ params: _params }: TransacaoPageProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [messages])

  // Sprint 4: Supabase Realtime subscription would go here
  // supabase.channel(`transaction:${id}`).on('postgres_changes', ...).subscribe()

  function handleSend(text: string) {
    const msg: Message = {
      id: String(Date.now()),
      variant: 'mine',
      content: text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, msg])
  }

  function handleMarkComplete() {
    router.push(route(`/transacao/${MOCK.transactionId}/concluir`))
  }

  return (
    <div className="bg-background flex h-screen flex-col">
      <StateBanner variant="in-progress">EM NEGOCIAÇÃO</StateBanner>

      <ScreenHeader
        backHref="/transacoes"
        title={
          <div className="flex items-center gap-[10px]">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#C6E845] text-[11px] font-medium text-[#0A0A0A]">
              {MOCK.counterpart.initials}
            </div>
            <span className="text-[15px] font-medium">{MOCK.counterpart.name}</span>
          </div>
        }
        right={
          <button
            type="button"
            onClick={handleMarkComplete}
            className="rounded-[8px] border border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.08)] px-[10px] py-[5px] text-[11px] font-medium text-[#15803d] dark:border-[rgba(34,197,94,0.2)] dark:text-[#22c55e]"
          >
            Concluir
          </button>
        }
      />

      {/* Transaction strip */}
      <div className="px-4 pb-3">
        <TransactionStrip
          transactionId={MOCK.transactionId}
          title={MOCK.listing.title}
          valueCents={MOCK.listing.valueCents}
        />
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-2">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            variant={msg.variant}
            content={msg.content}
            timestamp={msg.timestamp}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} />
    </div>
  )
}
