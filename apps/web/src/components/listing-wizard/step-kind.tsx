'use client'

import { useWizardStore } from './use-wizard-store'

const KINDS = [
  {
    key: 'OFFER',
    icon: '🌾',
    label: 'Oferta',
    description: 'Venda produtos agrícolas, como grãos, gado, frutas ou laticínios.',
  },
  {
    key: 'DEMAND',
    icon: '🛒',
    label: 'Demanda',
    description: 'Procura por produtos ou matérias-primas para seu negócio.',
  },
  {
    key: 'SERVICE',
    icon: '🔧',
    label: 'Serviço',
    description: 'Ofereça ou contrate serviços: agronomia, mecânica, mão de obra e mais.',
  },
  {
    key: 'EQUIPMENT',
    icon: '🚜',
    label: 'Equipamento',
    description: 'Alugue ou venda máquinas e implementos agrícolas.',
  },
]

export function StepKind() {
  const { kind, setKind, setStep } = useWizardStore()

  function handleSelect(key: string) {
    setKind(key)
    setStep(2)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Que tipo de anúncio você quer criar?</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Escolha uma categoria para o seu anúncio.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {KINDS.map((k) => (
          <button
            key={k.key}
            type="button"
            onClick={() => handleSelect(k.key)}
            className={[
              'flex flex-col items-start gap-2 rounded-xl border-2 p-5 text-left transition-all',
              kind === k.key
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/50',
            ].join(' ')}
          >
            <span className="text-3xl">{k.icon}</span>
            <span className="font-semibold">{k.label}</span>
            <span className="text-muted-foreground text-sm leading-snug">{k.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
