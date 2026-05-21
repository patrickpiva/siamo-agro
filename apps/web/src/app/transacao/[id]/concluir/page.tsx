'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock } from '@agrolink/ui/icons'
import { StateBanner, ListingContextStrip, BottomCTA, Button } from '@agrolink/ui'
import { CompletionConfirmSplit } from '@/components/transactions/completion-confirm-split'
import { ScreenHeader } from '@/components/layout/screen-header'

// Mock — Sprint 4: GET /api/v1/transactions/:id
const MOCK = {
  transactionId: 'txn-4821',
  listing: {
    id: 'listing-1',
    title: 'Café arábica especial — safra 2025',
    kind: 'OFFER',
    priceCents: 185000,
    priceUnit: 'saca',
  },
  buyer: { name: 'Celso Aguiar', initials: 'CA', confirmed: false },
  seller: { name: 'João Silva', initials: 'JS', confirmed: true },
  deadlineHours: 48,
}

interface ConcluirPageProps {
  params: Promise<{ id: string }>
}

export default function ConcluirPage({ params: _params }: ConcluirPageProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function handleConfirm() {
    setSubmitting(true)
    // Sprint 4: PATCH /api/v1/transactions/:id/complete
    await new Promise((r) => setTimeout(r, 600))
    router.push(`/transacao/${MOCK.transactionId}/avaliar`)
  }

  const parties: [typeof MOCK.seller, typeof MOCK.buyer] = [MOCK.seller, MOCK.buyer]

  return (
    <div className="bg-background flex min-h-screen flex-col pb-[80px]">
      <StateBanner variant="in-progress">EM NEGOCIAÇÃO</StateBanner>

      <ScreenHeader
        backHref={`/transacao/${MOCK.transactionId}`}
        title={<span className="text-[15px] font-medium">Concluir negociação</span>}
      />

      {/* Content */}
      <div className="flex-1 px-4 pt-1">
        <p className="text-foreground/70 mb-4 text-[13px] leading-[1.6]">
          Ambas as partes precisam confirmar a conclusão para a transação ser finalizada.
        </p>

        <CompletionConfirmSplit parties={parties} className="mb-4" />

        {/* Deadline warning */}
        <div className="mb-5 flex items-start gap-[10px] rounded-[12px] border border-[rgba(234,179,8,0.25)] bg-[rgba(234,179,8,0.06)] px-[14px] py-[14px]">
          <Clock
            size={16}
            strokeWidth={1.8}
            className="mt-[2px] shrink-0 text-[#b45309] dark:text-[#eab308]"
          />
          <p className="text-foreground/70 text-[12px] leading-[1.55]">
            Se ambas as partes não confirmarem em{' '}
            <span className="font-mono font-medium text-[#b45309] dark:text-[#eab308]">
              {MOCK.deadlineHours}h
            </span>
            , a transação será marcada como concluída automaticamente.
          </p>
        </div>

        <ListingContextStrip
          title={MOCK.listing.title}
          kind={MOCK.listing.kind}
          price={MOCK.listing.priceCents}
          priceUnit={MOCK.listing.priceUnit}
          ownerLabel="Seu anúncio"
        />
      </div>

      <BottomCTA>
        <Button
          variant={submitting ? 'cta-disabled' : 'cta'}
          disabled={submitting}
          onClick={() => void handleConfirm()}
        >
          {submitting ? 'Confirmando...' : 'Confirmar conclusão'}
        </Button>
      </BottomCTA>
    </div>
  )
}
