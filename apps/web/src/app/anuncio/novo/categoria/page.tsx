'use client'

import { useState, useEffect, type ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import {
  CATEGORY_ICONS,
  Wrench,
  Package,
  Truck,
  Users,
  Plus,
  type IconProps,
} from '@agraia/ui/icons'
import { ProgressIndicator, BottomCTA, Button, SectionLabel, SummaryBadge, cn } from '@agraia/ui'
import { WizardHeader } from '@/components/listings/wizard-header'
import { useListingDraftStore } from '@/stores/listing-draft'

// ─── Category data per kind ────────────────────────────────────────────────────

type CatItem = { key: string; label: string; Icon: ComponentType<IconProps> }

const OFFER_DEMAND_CATS: CatItem[] = [
  { key: 'COFFEE', label: 'Café', Icon: CATEGORY_ICONS.COFFEE },
  { key: 'SOY', label: 'Soja', Icon: CATEGORY_ICONS.SOY },
  { key: 'CORN', label: 'Milho', Icon: CATEGORY_ICONS.CORN },
  { key: 'GRAINS', label: 'Grãos', Icon: CATEGORY_ICONS.GRAINS },
  { key: 'LIVESTOCK', label: 'Pecuária', Icon: CATEGORY_ICONS.LIVESTOCK },
  { key: 'DAIRY', label: 'Laticínios', Icon: CATEGORY_ICONS.DAIRY },
  { key: 'FRUITS', label: 'Frutas', Icon: CATEGORY_ICONS.FRUITS },
  { key: 'VEGETABLES', label: 'Hortaliças', Icon: CATEGORY_ICONS.VEGETABLES },
  { key: 'OTHER', label: 'Outros', Icon: Plus },
]

const SERVICE_CATS: CatItem[] = [
  { key: 'AGRONOMY', label: 'Agronomia', Icon: CATEGORY_ICONS.AGRONOMY },
  { key: 'VETERINARY', label: 'Veterinária', Icon: CATEGORY_ICONS.VETERINARY },
  { key: 'IRRIGATION', label: 'Irrigação', Icon: CATEGORY_ICONS.IRRIGATION },
  { key: 'CONSULTING', label: 'Consultoria', Icon: CATEGORY_ICONS.CONSULTING },
  { key: 'MECHANICS', label: 'Mecânica', Icon: Wrench },
  { key: 'LABOR', label: 'Mão de obra', Icon: Users },
  { key: 'TRANSPORT', label: 'Transporte', Icon: Truck },
  { key: 'OTHER', label: 'Outros', Icon: Plus },
]

const EQUIPMENT_CATS: CatItem[] = [
  { key: 'TRACTOR', label: 'Trator', Icon: CATEGORY_ICONS.TRACTOR },
  { key: 'HARVESTER', label: 'Colheitadeira', Icon: CATEGORY_ICONS.HARVESTER },
  { key: 'IRRIGATION_SYSTEM', label: 'Irrigação', Icon: CATEGORY_ICONS.IRRIGATION_SYSTEM },
  { key: 'TOOLS', label: 'Ferramentas', Icon: Wrench },
  { key: 'STORAGE', label: 'Armazenamento', Icon: Package },
  { key: 'OTHER', label: 'Outros', Icon: Plus },
]

const CATS_BY_KIND: Record<string, CatItem[]> = {
  OFFER: OFFER_DEMAND_CATS,
  DEMAND: OFFER_DEMAND_CATS,
  SERVICE: SERVICE_CATS,
  EQUIPMENT: EQUIPMENT_CATS,
}

const KIND_LABELS: Record<string, string> = {
  OFFER: 'OFERTA',
  DEMAND: 'DEMANDA',
  SERVICE: 'SERVIÇO',
  EQUIPMENT: 'EQUIPAMENTO',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WizardStep2() {
  const router = useRouter()
  const { kind, category, title, setCategory, setTitle, reset } = useListingDraftStore()

  const [localTitle, setLocalTitle] = useState(title)

  // Guard: kind must be set
  useEffect(() => {
    if (!kind) router.replace('/anuncio/novo')
  }, [kind, router])

  const cats = CATS_BY_KIND[kind ?? ''] ?? []
  const isValid = !!category && localTitle.length >= 10

  function handleClose() {
    if (!window.confirm('Descartar anúncio? Seu rascunho será perdido.')) return
    reset()
    router.push('/feed')
  }

  function handleContinue() {
    if (!isValid) return
    setTitle(localTitle)
    router.push('/anuncio/novo/detalhes')
  }

  if (!kind) return null

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <WizardHeader
        title="Novo anúncio"
        onBack={() => router.push('/anuncio/novo')}
        onClose={handleClose}
      />
      <ProgressIndicator current={2} total={5} />

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <SummaryBadge
          kindLabel={KIND_LABELS[kind] ?? kind}
          text={
            kind === 'OFFER' ? 'Estou vendendo' : kind === 'DEMAND' ? 'Estou procurando' : undefined
          }
          onEdit={() => router.push('/anuncio/novo')}
          className="mb-5"
        />

        {/* Category grid */}
        <SectionLabel className="mb-2">CATEGORIA</SectionLabel>
        <div className="mb-5 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Categoria">
          {cats.map(({ key, label, Icon }) => {
            const selected = category === key
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setCategory(key)}
                className={cn(
                  'flex flex-col items-center gap-[6px] rounded-[10px] border px-2 py-[14px] transition-all',
                  selected
                    ? 'border-accent bg-primary-subtle border-[1.5px]'
                    : 'border-border bg-card',
                )}
              >
                <Icon
                  size={22}
                  strokeWidth={1.8}
                  className={selected ? 'text-accent' : 'text-muted-foreground'}
                />
                <span
                  className={cn(
                    'text-[11px]',
                    selected ? 'text-foreground font-medium' : 'text-fg-secondary',
                  )}
                >
                  {label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Title */}
        <div className="mb-2 flex items-center justify-between">
          <SectionLabel>TÍTULO DO ANÚNCIO</SectionLabel>
          <span className="text-muted-foreground font-mono text-[10px]">
            {localTitle.length}/120
          </span>
        </div>
        <div
          className={cn(
            'bg-card border-border flex items-center rounded-[12px] border px-4 py-[14px]',
            localTitle.length > 0 && 'border-accent border-[1.5px]',
          )}
        >
          <input
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value.slice(0, 120))}
            placeholder="Ex: Café arábica especial — safra 2025"
            className="text-foreground placeholder:text-muted-foreground w-full bg-transparent text-[15px] outline-none"
          />
        </div>
        {localTitle.length > 0 && localTitle.length < 10 && (
          <p className="text-destructive mt-1 text-[11px]">Mínimo de 10 caracteres.</p>
        )}
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
