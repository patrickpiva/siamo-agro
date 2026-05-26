'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle } from '@agraia/ui/icons'
import { Button } from '@agraia/ui'

interface Props {
  transactionId: string
  listingId: string
}

export function ProposalReviewActions({ transactionId, listingId }: Props) {
  const router = useRouter()
  const [accepting, setAccepting] = useState(false)
  const [refusing, setRefusing] = useState(false)
  const [confirmRefuse, setConfirmRefuse] = useState(false)
  const [showCounter, setShowCounter] = useState(false)
  const [counterAmount, setCounterAmount] = useState('')
  const [counterMessage, setCounterMessage] = useState('')
  const [counterLoading, setCounterLoading] = useState(false)

  async function handleAccept() {
    setAccepting(true)
    try {
      const res = await fetch(`/api/proxy/transactions/${transactionId}/accept`, {
        method: 'POST',
      })
      if (res.ok) router.push(`/transacoes/${transactionId}`)
    } finally {
      setAccepting(false)
    }
  }

  async function handleRefuse() {
    setRefusing(true)
    try {
      await fetch(`/api/proxy/transactions/${transactionId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'PRICE_DISAGREEMENT' }),
      })
      router.push(`/anuncio/${listingId}`)
    } finally {
      setRefusing(false)
      setConfirmRefuse(false)
    }
  }

  async function handleCounter() {
    const parsed = parseFloat(counterAmount.replace(',', '.'))
    if (isNaN(parsed) || parsed <= 0) return
    setCounterLoading(true)
    try {
      const res = await fetch(`/api/proxy/transactions/${transactionId}/counter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsed, message: counterMessage }),
      })
      if (res.ok) router.push(`/transacoes/${transactionId}`)
    } finally {
      setCounterLoading(false)
    }
  }

  // ── Refuse confirmation state ──────────────────────────────────────────────
  if (confirmRefuse) {
    return (
      <div className="border-border bg-card flex flex-col gap-3 border-t px-5 py-4">
        <p className="text-foreground text-[13px]">Tem certeza que deseja recusar esta proposta?</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setConfirmRefuse(false)}
            className="bg-muted rounded-[12px] py-3 text-[14px] font-medium"
          >
            Voltar
          </button>
          <button
            type="button"
            disabled={refusing}
            onClick={() => void handleRefuse()}
            className="rounded-[12px] bg-red-500 py-3 text-[14px] font-medium text-white disabled:opacity-50"
          >
            {refusing ? 'Recusando…' : 'Confirmar recusa'}
          </button>
        </div>
      </div>
    )
  }

  // ── Counter-proposal state ─────────────────────────────────────────────────
  if (showCounter) {
    return (
      <div className="border-border bg-card border-t px-5 py-4">
        <p className="text-muted-foreground mb-3 font-mono text-[10px] tracking-[0.4px]">
          [CONTRAPROPOSTA]
        </p>
        <div className="mb-3">
          <label className="text-muted-foreground mb-1 block text-[11px]">
            Novo valor total (R$)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={counterAmount}
            onChange={(e) => setCounterAmount(e.target.value)}
            placeholder="0,00"
            className="border-border bg-background w-full rounded-[10px] border px-3 py-2.5 text-[14px] outline-none focus:border-[#c6e845]"
          />
        </div>
        <div className="mb-4">
          <label className="text-muted-foreground mb-1 block text-[11px]">
            Mensagem (opcional)
          </label>
          <textarea
            value={counterMessage}
            onChange={(e) => setCounterMessage(e.target.value)}
            placeholder="Explique o motivo da contraproposta…"
            rows={2}
            className="border-border bg-background placeholder:text-muted-foreground w-full rounded-[10px] border px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:border-[#c6e845]"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowCounter(false)}
            className="bg-muted flex-1 rounded-[10px] py-2.5 text-[13px] font-medium"
          >
            Cancelar
          </button>
          <Button
            variant={counterLoading ? 'cta-disabled' : 'cta'}
            disabled={counterLoading}
            onClick={() => void handleCounter()}
            className="flex-1"
          >
            {counterLoading ? 'Enviando…' : 'Enviar'}
          </Button>
        </div>
      </div>
    )
  }

  // ── Default: refuse + accept + counter ────────────────────────────────────
  return (
    <div className="border-border bg-card flex flex-col gap-2 border-t px-5 py-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={accepting}
          onClick={() => setConfirmRefuse(true)}
          className="rounded-[12px] border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] py-[14px] text-[14px] font-medium text-[#EF4444] disabled:opacity-40"
        >
          Recusar
        </button>
        <button
          type="button"
          disabled={accepting}
          onClick={() => void handleAccept()}
          className="bg-cta-bg text-cta-fg rounded-[12px] py-[14px] text-[14px] font-medium disabled:opacity-50"
        >
          {accepting ? 'Aceitando…' : 'Aceitar'}
        </button>
      </div>
      <button
        type="button"
        onClick={() => setShowCounter(true)}
        className="bg-muted border-border flex w-full items-center justify-center gap-2 rounded-[12px] border py-3 text-[13px] font-medium"
      >
        <MessageCircle size={15} strokeWidth={1.8} />
        Fazer contra-proposta
      </button>
    </div>
  )
}
