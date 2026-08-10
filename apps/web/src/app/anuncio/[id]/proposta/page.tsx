'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ListingContextStrip,
  PriceProposalInput,
  QuantityStepper,
  BottomCTA,
  Button,
} from '@siamo/ui'
import { AlertCircle } from '@siamo/ui/icons'
import { ScreenHeader } from '@/components/layout/screen-header'
import { fetchListing, type Listing } from '@/lib/api-client'

interface PropostaPageProps {
  params: Promise<{ id: string }>
}

export default function PropostaPage({ params }: PropostaPageProps) {
  const { id } = use(params)
  const router = useRouter()

  const [listing, setListing] = useState<Listing | null>(null)
  const [priceCents, setPriceCents] = useState(0)
  const [qty, setQty] = useState(1)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    void fetchListing(id).then((data) => {
      if (data) {
        setListing(data)
        setPriceCents(data.price !== null ? Math.round(data.price * 100) : 0)
      }
    })
  }, [id])

  const totalCents = priceCents * qty
  const canSubmit = priceCents > 0

  const ERROR_MESSAGES: Record<string, string> = {
    TRANSACTION_CONFLICT: 'Você já tem uma proposta ativa para este anúncio.',
    TRANSACTION_FORBIDDEN: 'Você não pode fazer uma proposta no próprio anúncio.',
    LISTING_NOT_FOUND: 'Este anúncio não está mais disponível.',
    VALIDATION_ERROR: 'Verifique os dados da proposta e tente novamente.',
    UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
    PROXY_ERROR: 'Sem conexão com o servidor. Verifique sua internet.',
  }

  async function handleSubmit() {
    if (!listing) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/proxy/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          amount: (priceCents * qty) / 100,
          message:
            message ||
            `Proposta de ${qty} un a ${(priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: { code?: string; message?: string }
        }
        const code = body.error?.code ?? ''
        setSubmitError(
          ERROR_MESSAGES[code] ??
            body.error?.message ??
            'Erro ao enviar proposta. Tente novamente.',
        )
        setSubmitting(false)
        return
      }
      const json = (await res.json()) as { data: { id: string } }
      const params = new URLSearchParams({
        sellerName: listing.profile.name,
        priceCents: String(priceCents),
        qty: String(qty),
        total: String(priceCents * qty),
        message: (
          message ||
          `Proposta de ${qty} un a ${(priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
        ).slice(0, 200),
      })
      router.push(`/proposta/${json.data.id}/enviada?${params.toString()}`)
    } catch {
      setSubmitError('Sem conexão. Verifique sua internet e tente novamente.')
      setSubmitting(false)
    }
  }

  if (!listing) {
    return (
      <div className="bg-background flex min-h-screen flex-col">
        <ScreenHeader
          onBack={() => router.back()}
          title={<span className="text-[15px] font-medium">Fazer proposta</span>}
        />
        <div className="flex flex-1 items-center justify-center">
          <span className="text-muted-foreground text-sm">Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background flex min-h-screen flex-col pb-[80px]">
      <ScreenHeader
        onBack={() => router.back()}
        title={<span className="text-[15px] font-medium">Fazer proposta</span>}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-3">
        <ListingContextStrip
          title={listing.title}
          kind={listing.kind}
          price={listing.price !== null ? Math.round(listing.price * 100) : 0}
          priceUnit="un"
          ownerLabel={listing.profile.name}
          className="mb-5"
        />

        {/* Price */}
        <div className="mb-4">
          <div className="input-label text-muted-foreground mb-2 flex justify-between font-mono text-[11px] tracking-[0.4px]">
            <span>[SUA OFERTA]</span>
            {listing.price !== null && (
              <span className="text-[10px]">
                anunciante pede{' '}
                {listing.price.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            )}
          </div>
          <PriceProposalInput
            valueCents={priceCents}
            onChange={setPriceCents}
            referenceCents={listing.price !== null ? Math.round(listing.price * 100) : 0}
          />
        </div>

        {/* Quantity */}
        <div className="mb-4">
          <div className="text-muted-foreground mb-2 flex justify-between font-mono text-[11px] tracking-[0.4px]">
            <span>[QUANTIDADE]</span>
          </div>
          <QuantityStepper value={qty} onChange={setQty} min={1} max={99} unit="un" />
        </div>

        {/* Message */}
        <div className="mb-4">
          <div className="text-muted-foreground mb-2 flex justify-between font-mono text-[11px] tracking-[0.4px]">
            <span>[MENSAGEM PARA O VENDEDOR]</span>
            <span className="text-[10px]">{message.length}/500</span>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            placeholder="Ex: Tenho interesse em comprar. Posso retirar na próxima semana..."
            className="bg-card border-border placeholder:text-muted-foreground focus:border-accent dark:focus:border-primary w-full rounded-[12px] border px-4 py-[14px] text-[14px] leading-[1.5] outline-none"
            rows={3}
          />
        </div>

        {/* Total estimado */}
        {listing.price !== null && (
          <div className="border-primary bg-primary-subtle mb-6 rounded-[10px] border px-[14px] py-3">
            <p className="text-foreground/70 text-[11px] leading-[1.55]">
              <span className="text-foreground font-medium">Total estimado: </span>
              <span className="text-accent dark:text-primary font-mono font-medium">
                {(totalCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </p>
            <p className="text-muted-foreground mt-1 text-[11px]">
              {qty} un ×{' '}
              {(priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ·
              sujeito a aceitação
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      <BottomCTA>
        {submitError && (
          <div className="mb-3 flex items-start gap-2 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-900/40 dark:bg-red-950/30">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-500" strokeWidth={2} />
            <p className="text-[13px] leading-snug text-red-700 dark:text-red-400">{submitError}</p>
          </div>
        )}
        <Button
          variant={submitting || !canSubmit ? 'cta-disabled' : 'cta'}
          disabled={submitting || !canSubmit}
          onClick={() => void handleSubmit()}
        >
          {submitting ? 'Enviando...' : 'Enviar proposta'}
        </Button>
      </BottomCTA>
    </div>
  )
}
