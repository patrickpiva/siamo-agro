'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@agrolink/ui'

interface TransactionActionsProps {
  transactionId: string
  action: 'accept' | 'start' | 'complete'
  /** Label for the primary CTA */
  label: string
  /** Whether this party has already performed the action */
  alreadyDone?: boolean
  /** Peer has already done the action */
  peerDone?: boolean
}

export function TransactionActionButton({
  transactionId,
  action,
  label,
  alreadyDone = false,
  peerDone = false,
}: TransactionActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(alreadyDone)

  async function handleClick() {
    if (done || loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/proxy/transactions/${transactionId}/${action}`, {
        method: 'POST',
      })
      if (res.ok) {
        setDone(true)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-[12px] border border-[#c6e845] bg-[#f0f7d9] px-4 py-3 text-center dark:border-[rgba(198,232,69,0.2)] dark:bg-[rgba(198,232,69,0.06)]">
        <p className="text-accent dark:text-primary text-[13px] font-medium">
          ✓ {label} confirmado
        </p>
        {!peerDone && (
          <p className="text-muted-foreground mt-1 text-[11px]">
            Aguardando confirmação da outra parte…
          </p>
        )}
      </div>
    )
  }

  return (
    <Button
      variant={loading ? 'cta-disabled' : 'cta'}
      disabled={loading}
      onClick={() => void handleClick()}
      className="w-full"
    >
      {loading ? 'Aguarde…' : label}
    </Button>
  )
}

interface CancelButtonProps {
  transactionId: string
}

export function CancelButton({ transactionId }: CancelButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleCancel() {
    setLoading(true)
    try {
      await fetch(`/api/proxy/transactions/${transactionId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'CHANGED_MIND' }),
      })
      router.refresh()
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-muted-foreground mt-2 w-full py-2 text-center text-[12px] underline-offset-2 hover:underline"
      >
        Cancelar transação
      </button>
    )
  }

  return (
    <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
      <p className="text-foreground mb-3 text-[13px]">
        Tem certeza que deseja cancelar esta transação?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="bg-muted flex-1 rounded-[10px] py-2.5 text-[13px] font-medium"
        >
          Voltar
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleCancel()}
          className="flex-1 rounded-[10px] bg-red-500 py-2.5 text-[13px] font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Cancelando…' : 'Confirmar'}
        </button>
      </div>
    </div>
  )
}

interface CounterProposalButtonProps {
  transactionId: string
}

export function CounterProposalPanel({ transactionId }: CounterProposalButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCounter() {
    const parsed = parseFloat(amount.replace(',', '.'))
    if (isNaN(parsed) || parsed <= 0) return
    setLoading(true)
    try {
      await fetch(`/api/proxy/transactions/${transactionId}/counter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsed, message }),
      })
      router.refresh()
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-muted text-foreground w-full rounded-[12px] py-3 text-[14px] font-medium"
      >
        Fazer contraproposta
      </button>
    )
  }

  return (
    <div className="border-border rounded-[14px] border p-4">
      <p className="text-muted-foreground mb-3 font-mono text-[11px] tracking-[0.4px]">
        [CONTRAPROPOSTA]
      </p>
      <div className="mb-3">
        <label className="text-muted-foreground mb-1 block text-[11px]">Novo valor (R$)</label>
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
          className="border-border bg-card w-full rounded-[10px] border px-3 py-2.5 text-[14px] outline-none focus:border-[#c6e845]"
        />
      </div>
      <div className="mb-4">
        <label className="text-muted-foreground mb-1 block text-[11px]">Mensagem (opcional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Explique o motivo da contraproposta…"
          rows={2}
          className="border-border bg-card placeholder:text-muted-foreground w-full rounded-[10px] border px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:border-[#c6e845]"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="bg-muted flex-1 rounded-[10px] py-2.5 text-[13px] font-medium"
        >
          Cancelar
        </button>
        <Button
          variant={loading ? 'cta-disabled' : 'cta'}
          disabled={loading}
          onClick={() => void handleCounter()}
          className="flex-1"
        >
          {loading ? 'Enviando…' : 'Enviar'}
        </Button>
      </div>
    </div>
  )
}
