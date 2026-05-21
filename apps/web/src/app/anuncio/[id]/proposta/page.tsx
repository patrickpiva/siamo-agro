'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ListingContextStrip,
  PriceProposalInput,
  QuantityStepper,
  BottomCTA,
  Button,
} from '@agrolink/ui'
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

  useEffect(() => {
    void fetchListing(id).then((data) => {
      if (data) {
        setListing(data)
        setPriceCents(data.price !== null ? Math.round(data.price * 100) : 0)
      }
    })
  }, [id])

  const totalCents = priceCents * qty

  async function handleSubmit() {
    setSubmitting(true)
    // Sprint 4: POST /api/v1/listings/:id/proposals
    await new Promise((r) => setTimeout(r, 600))
    const params = new URLSearchParams({
      sellerName: listing?.profile.name ?? '',
      title: listing?.title ?? '',
      priceCents: String(priceCents),
      qty: String(qty),
      total: String(priceCents * qty),
      ...(message && { message }),
    })
    router.push(`/proposta/mock-proposal-1/enviada?${params.toString()}`)
  }

  if (!listing) {
    return (
      <div className="bg-background flex min-h-screen flex-col">
        <ScreenHeader
          backHref={`/anuncio/${id}`}
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
        backHref={`/anuncio/${id}`}
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
          <div className="mb-6 rounded-[10px] border border-[#c6e845] bg-[#f0f7d9] px-[14px] py-3 dark:border-[rgba(198,232,69,0.2)] dark:bg-[rgba(198,232,69,0.06)]">
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
        <Button
          variant={submitting ? 'cta-disabled' : 'cta'}
          disabled={submitting}
          onClick={() => void handleSubmit()}
        >
          {submitting ? 'Enviando...' : 'Enviar proposta'}
        </Button>
      </BottomCTA>
    </div>
  )
}
