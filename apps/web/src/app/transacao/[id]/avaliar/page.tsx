'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StateBanner, StarRating, RatingCategoryRow, BottomCTA, Button } from '@siamo/ui'
import { ScreenHeader } from '@/components/layout/screen-header'
import { route } from '@/lib/route'

// Mock — Sprint 4: GET /api/v1/transactions/:id
const MOCK = {
  transactionId: 'txn-4821',
  counterpartName: 'Celso Aguiar',
  counterpartInitials: 'CA',
}

interface AvaliarPageProps {
  params: Promise<{ id: string }>
}

export default function AvaliarPage({ params: _params }: AvaliarPageProps) {
  const router = useRouter()
  const [overall, setOverall] = useState(0)
  const [reliability, setReliability] = useState(0)
  const [communication, setCommunication] = useState(0)
  const [quality, setQuality] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = overall > 0

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    // Sprint 4: POST /api/v1/transactions/:id/reviews
    await new Promise((r) => setTimeout(r, 600))
    router.push('/transacoes')
  }

  return (
    <div className="bg-background flex min-h-screen flex-col pb-[80px]">
      <StateBanner variant="completed">TRANSAÇÃO CONCLUÍDA</StateBanner>

      <ScreenHeader
        backHref={route(`/transacao/${MOCK.transactionId}`)}
        title={<span className="text-[15px] font-medium">Avaliar negociação</span>}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-2">
        {/* Who are you rating */}
        <div className="mb-5 flex flex-col items-center">
          <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-[#C6E845] text-[16px] font-medium text-[#0A0A0A]">
            {MOCK.counterpartInitials}
          </div>
          <p className="mb-1 text-[15px] font-medium">{MOCK.counterpartName}</p>
          <p className="text-muted-foreground text-[12px]">Como foi negociar com ele?</p>
        </div>

        {/* Overall rating */}
        <div className="mb-5">
          <p className="text-muted-foreground mb-3 text-center font-mono text-[11px] tracking-[0.4px]">
            [AVALIAÇÃO GERAL]
          </p>
          <StarRating value={overall} onChange={setOverall} />
        </div>

        {/* Category ratings */}
        <div className="mb-4">
          <p className="text-muted-foreground mb-2 font-mono text-[11px] tracking-[0.4px]">
            [CRITÉRIOS ESPECÍFICOS]
          </p>
          <div className="flex flex-col gap-2">
            <RatingCategoryRow
              label="Confiabilidade"
              value={reliability}
              onChange={setReliability}
            />
            <RatingCategoryRow
              label="Comunicação"
              value={communication}
              onChange={setCommunication}
            />
            <RatingCategoryRow label="Qualidade" value={quality} onChange={setQuality} />
          </div>
        </div>

        {/* Comment */}
        <div className="mb-6">
          <div className="text-muted-foreground mb-2 flex justify-between font-mono text-[11px] tracking-[0.4px]">
            <span>[COMENTÁRIO OPCIONAL]</span>
            <span className="text-[10px]">{comment.length}/300</span>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={300}
            placeholder="Conte como foi a negociação..."
            className="bg-card border-border placeholder:text-muted-foreground focus:border-accent dark:focus:border-primary w-full rounded-[12px] border px-4 py-[14px] text-[14px] leading-[1.5] outline-none"
            rows={3}
          />
        </div>
      </div>

      <BottomCTA>
        <Button
          variant={submitting || !canSubmit ? 'cta-disabled' : 'cta'}
          disabled={submitting || !canSubmit}
          onClick={() => void handleSubmit()}
        >
          {submitting ? 'Enviando...' : 'Enviar avaliação'}
        </Button>
      </BottomCTA>
    </div>
  )
}
