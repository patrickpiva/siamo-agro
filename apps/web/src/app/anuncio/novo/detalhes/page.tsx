'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ProgressIndicator,
  BottomCTA,
  Button,
  SectionLabel,
  SummaryBadge,
  PriceInput,
  Toggle,
} from '@agraia/ui'
import { WizardHeader } from '@/components/listings/wizard-header'
import { useListingDraftStore } from '@/stores/listing-draft'
import { cn } from '@agraia/ui'

// ─── Price unit by category ───────────────────────────────────────────────────

const UNIT_BY_CATEGORY: Record<string, string> = {
  COFFEE: 'SACA · 60KG',
  SOY: 'SACA · 60KG',
  CORN: 'SACA · 60KG',
  GRAINS: 'SACA · 60KG',
  LIVESTOCK: 'CABEÇA',
  DAIRY: 'LITRO',
  FRUITS: 'KG',
  VEGETABLES: 'KG',
  AGRONOMY: 'HORA',
  VETERINARY: 'CONSULTA',
  CONSULTING: 'HORA',
  MECHANICS: 'HORA',
  LABOR: 'DIA',
  TRANSPORT: 'VIAGEM',
  IRRIGATION: 'MÊS',
  TRACTOR: 'DIA',
  HARVESTER: 'HECTARE',
  IRRIGATION_SYSTEM: 'MÊS',
  TOOLS: 'DIA',
  STORAGE: 'MÊS',
  OTHER: 'UNIDADE',
}

const KIND_LABELS: Record<string, string> = {
  OFFER: 'OFERTA',
  DEMAND: 'DEMANDA',
  SERVICE: 'SERVIÇO',
  EQUIPMENT: 'EQUIPAMENTO',
}

const CATEGORY_LABELS: Record<string, string> = {
  COFFEE: 'Café',
  SOY: 'Soja',
  CORN: 'Milho',
  GRAINS: 'Grãos',
  LIVESTOCK: 'Pecuária',
  DAIRY: 'Laticínios',
  FRUITS: 'Frutas',
  VEGETABLES: 'Hortaliças',
  AGRONOMY: 'Agronomia',
  VETERINARY: 'Veterinária',
  CONSULTING: 'Consultoria',
  MECHANICS: 'Mecânica',
  LABOR: 'Mão de obra',
  TRANSPORT: 'Transporte',
  IRRIGATION: 'Irrigação',
  TRACTOR: 'Trator',
  HARVESTER: 'Colheitadeira',
  IRRIGATION_SYSTEM: 'Irrigação',
  TOOLS: 'Ferramentas',
  STORAGE: 'Armazenamento',
  OTHER: 'Outros',
}

// ─── Price label by kind ──────────────────────────────────────────────────────

function priceLabel(kind: string, category: string): string {
  if (kind === 'SERVICE') return 'VALOR DO SERVIÇO'
  if (kind === 'EQUIPMENT') return 'VALOR · LOCAÇÃO/VENDA'
  if (kind === 'DEMAND') return 'VALOR MÁXIMO QUE PAGO · OPCIONAL'
  const unit = UNIT_BY_CATEGORY[category] ?? 'UNIDADE'
  return `PREÇO POR ${unit}`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WizardStep3() {
  const router = useRouter()
  const {
    kind,
    category,
    title,
    description,
    price,
    negotiable,
    setDescription,
    setPrice,
    setNegotiable,
    reset,
  } = useListingDraftStore()

  const [localDesc, setLocalDesc] = useState(description)
  const [localPrice, setLocalPrice] = useState<number | null>(price)
  const [localNeg, setLocalNeg] = useState(negotiable)

  useEffect(() => {
    if (!kind || !category) router.replace('/anuncio/novo/categoria')
  }, [kind, category, router])

  const priceRequired = kind !== 'DEMAND'
  const isValid =
    localDesc.length >= 30 && (!priceRequired || (localPrice !== null && localPrice > 0))

  function handleClose() {
    if (!window.confirm('Descartar anúncio? Seu rascunho será perdido.')) return
    reset()
    router.push('/')
  }

  function handleContinue() {
    if (!isValid) return
    setDescription(localDesc)
    setPrice(localPrice)
    setNegotiable(localNeg)
    router.push('/anuncio/novo/fotos')
  }

  if (!kind || !category) return null

  const summaryText = `${CATEGORY_LABELS[category] ?? category} · ${title.slice(0, 30)}${title.length > 30 ? '…' : ''}`

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <WizardHeader
        title="Novo anúncio"
        onBack={() => router.push('/anuncio/novo/categoria')}
        onClose={handleClose}
      />
      <ProgressIndicator current={3} total={5} />

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <SummaryBadge
          kindLabel={KIND_LABELS[kind] ?? kind}
          text={summaryText}
          onEdit={() => router.push('/anuncio/novo/categoria')}
          className="mb-5"
        />

        {/* Description */}
        <div className="mb-2 flex items-center justify-between">
          <SectionLabel>DESCRIÇÃO</SectionLabel>
          <span className="text-muted-foreground font-mono text-[10px]">
            {localDesc.length}/2000
          </span>
        </div>
        <textarea
          value={localDesc}
          onChange={(e) => setLocalDesc(e.target.value.slice(0, 2000))}
          placeholder="Descreva os detalhes, condições, quantidade disponível..."
          rows={5}
          className={cn(
            'bg-card w-full resize-none rounded-[12px] border-[1.5px] px-4 py-[14px]',
            'text-foreground placeholder:text-muted-foreground text-[14px] leading-relaxed outline-none',
            localDesc.length > 0 ? 'border-accent' : 'focus:border-accent border-border',
          )}
        />
        {localDesc.length > 0 && localDesc.length < 30 && (
          <p className="text-destructive mt-1 text-[11px]">Mínimo de 30 caracteres.</p>
        )}

        {/* Price */}
        <SectionLabel className="mb-2 mt-4">{priceLabel(kind, category)}</SectionLabel>
        <PriceInput
          value={localPrice}
          onChange={setLocalPrice}
          ariaLabel="Preço"
          className="mb-3"
        />

        {/* Negotiable toggle */}
        <Toggle
          checked={localNeg}
          onCheckedChange={setLocalNeg}
          label="Preço negociável"
          description="Compradores poderão fazer contra-proposta"
        />
      </div>

      <BottomCTA>
        <Button
          variant={isValid ? 'cta' : 'cta-disabled'}
          disabled={!isValid}
          onClick={handleContinue}
          className="w-full"
        >
          Continuar
        </Button>
      </BottomCTA>
    </div>
  )
}
