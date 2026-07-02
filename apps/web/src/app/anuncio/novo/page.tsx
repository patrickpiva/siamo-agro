'use client'

import { useRouter } from 'next/navigation'
import { OfferKind, DemandKind, ServiceKind, EquipmentKind } from '@agraia/ui/icons'
import { ProgressIndicator, BottomCTA, Button } from '@agraia/ui'
import { WizardHeader } from '@/components/listings/wizard-header'
import { useListingDraftStore, type ListingKind } from '@/stores/listing-draft'
import { cn } from '@agraia/ui'
import type { ComponentType } from 'react'
import type { IconProps } from '@agraia/ui/icons'

type KindOption = {
  kind: ListingKind
  Icon: ComponentType<IconProps>
  title: string
  description: string
}

const KIND_OPTIONS: KindOption[] = [
  {
    kind: 'OFFER',
    Icon: OfferKind,
    title: 'Oferta',
    description: 'Estou vendendo um produto',
  },
  {
    kind: 'DEMAND',
    Icon: DemandKind,
    title: 'Demanda',
    description: 'Estou procurando algo',
  },
  {
    kind: 'SERVICE',
    Icon: ServiceKind,
    title: 'Serviço',
    description: 'Ofereço meu trabalho',
  },
  {
    kind: 'EQUIPMENT',
    Icon: EquipmentKind,
    title: 'Equipamento',
    description: 'Tenho um equipamento',
  },
]

export default function WizardStep1() {
  const router = useRouter()
  const { kind, setKind, reset } = useListingDraftStore()

  function handleClose() {
    if (kind && !window.confirm('Descartar anúncio? Seu rascunho será perdido.')) return
    reset()
    router.push('/')
  }

  function handleContinue() {
    if (!kind) return
    router.push('/anuncio/novo/categoria')
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <WizardHeader title="Novo anúncio" onClose={handleClose} />
      <ProgressIndicator current={1} total={5} />

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <h2 className="mb-2 text-[22px] font-medium leading-snug tracking-tight">
          O que você quer publicar?
        </h2>
        <p className="text-fg-secondary mb-[22px] text-[14px] leading-relaxed">
          Escolha o tipo de anúncio. Você poderá ajustar depois se mudar de ideia.
        </p>

        <div className="grid grid-cols-2 gap-[10px]" role="radiogroup" aria-label="Tipo de anúncio">
          {KIND_OPTIONS.map(({ kind: k, Icon, title, description }) => {
            const selected = kind === k
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setKind(k)}
                className={cn(
                  'flex flex-col items-center gap-[10px] rounded-[14px] border px-[14px] py-[18px] text-center transition-all',
                  selected
                    ? 'border-accent bg-primary-subtle border-[1.5px]'
                    : 'border-border bg-card',
                )}
              >
                <div
                  className={cn(
                    'flex size-[48px] items-center justify-center rounded-[12px] transition-colors',
                    selected ? 'bg-primary text-foreground' : 'bg-muted text-foreground',
                  )}
                >
                  <Icon size={28} strokeWidth={1.8} />
                </div>
                <span className="text-[14px] font-medium">{title}</span>
                <span className="text-muted-foreground text-[11px] leading-snug">
                  {description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <BottomCTA>
        <Button
          variant={kind ? 'cta' : 'cta-disabled'}
          disabled={!kind}
          onClick={handleContinue}
          className="w-full"
        >
          Continuar
        </Button>
      </BottomCTA>
    </div>
  )
}
