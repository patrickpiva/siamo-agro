'use client'

import { useRouter } from 'next/navigation'
import { MessageCircle } from '@agrolink/ui/icons'
import { StateBanner, ProposalBlock, ListingContextStrip } from '@agrolink/ui'
import { ProposerCard } from '@/components/transactions/proposer-card'
import { ScreenHeader } from '@/components/layout/screen-header'

// Mock — Sprint 4: GET /api/v1/proposals/:id
const MOCK = {
  proposalId: 'mock-proposal-1',
  proposer: {
    name: 'Celso Aguiar',
    initials: 'CA',
    reputationSeal: 'SILVER' as const,
    reputationScore: 4.7,
    reviewCount: 31,
    transactionCount: 28,
    avgResponseHours: 3,
    memberYears: 2,
  },
  proposal: {
    priceCents: 175000,
    unit: 'saca',
    quantity: 30,
    totalCents: 5250000,
    message: 'Tenho interesse em 30 sacas. Posso retirar na próxima semana.',
  },
  listing: {
    id: 'listing-1',
    title: 'Café arábica especial — safra 2025',
    kind: 'OFFER',
    priceCents: 185000,
    priceUnit: 'saca',
  },
  transactionId: 'txn-4821',
}

export default function PropostaPage() {
  const router = useRouter()

  function handleAccept() {
    // Sprint 4: PATCH /api/v1/proposals/:id/accept
    router.push(`/transacao/${MOCK.transactionId}`)
  }

  function handleRefuse() {
    const ok = window.confirm(
      `Tem certeza que deseja recusar esta proposta? ${MOCK.proposer.name} será notificado.`,
    )
    if (ok) {
      // Sprint 4: PATCH /api/v1/proposals/:id/refuse
      router.push(`/anuncio/${MOCK.listing.id}`)
    }
  }

  function handleCounter() {
    // Sprint 4: open contra-proposta Sheet
    alert('Funcionalidade de contra-proposta em breve.')
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <StateBanner variant="proposed">PROPOSTA PENDENTE</StateBanner>

      <ScreenHeader
        backHref={`/anuncio/${MOCK.listing.id}`}
        title={<span className="text-[15px] font-medium">Nova proposta</span>}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-1">
        <ProposerCard
          name={MOCK.proposer.name}
          initials={MOCK.proposer.initials}
          reputationSeal={MOCK.proposer.reputationSeal}
          reputationScore={MOCK.proposer.reputationScore}
          reviewCount={MOCK.proposer.reviewCount}
          transactionCount={MOCK.proposer.transactionCount}
          avgResponseHours={MOCK.proposer.avgResponseHours}
          memberYears={MOCK.proposer.memberYears}
          className="mb-4"
        />

        <ProposalBlock
          label="PROPOSTA RECEBIDA"
          priceCents={MOCK.proposal.priceCents}
          unit={MOCK.proposal.unit}
          quantity={MOCK.proposal.quantity}
          totalCents={MOCK.proposal.totalCents}
          message={MOCK.proposal.message}
          className="mb-4"
        />

        <ListingContextStrip
          title={MOCK.listing.title}
          kind={MOCK.listing.kind}
          price={MOCK.listing.priceCents}
          priceUnit={MOCK.listing.priceUnit}
          ownerLabel="Seu anúncio"
        />
      </div>

      {/* Actions */}
      <div className="border-border bg-card flex flex-col gap-2 border-t px-5 py-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleRefuse}
            className="rounded-[12px] border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] py-3 text-[14px] font-medium text-[#EF4444]"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="bg-cta-bg text-cta-fg rounded-[12px] py-3 text-[14px] font-medium"
          >
            Aceitar
          </button>
        </div>
        <button
          type="button"
          onClick={handleCounter}
          className="bg-muted border-border flex w-full items-center justify-center gap-2 rounded-[12px] border py-3 text-[13px] font-medium"
        >
          <MessageCircle size={16} strokeWidth={1.8} />
          Fazer contra-proposta
        </button>
      </div>
    </div>
  )
}
