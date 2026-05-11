'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wheat, Tractor, type LucideIcon } from 'lucide-react'
import { Button } from '@agrolink/ui'
import { RadioGroup } from '@/components/ui/radio-group'
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress'
import { useOnboardingStore } from '@/lib/onboarding-store'
import type { ProfileType } from '@/lib/onboarding-store'
import { cn } from '@agrolink/ui'

interface ProfileCard {
  type: ProfileType
  title: string
  description: string
  Icon: LucideIcon
  examples: string[]
}

const PROFILE_CARDS: ProfileCard[] = [
  {
    type: 'PRODUCER',
    title: 'Produtor Rural',
    description: 'Preciso contratar serviços e profissionais para minha propriedade.',
    Icon: Wheat,
    examples: ['Consultoria agronômica', 'Operação de máquinas', 'Insumos agrícolas'],
  },
  {
    type: 'PROVIDER',
    title: 'Prestador de Serviço',
    description: 'Ofereço serviços, equipamentos ou expertise para produtores rurais.',
    Icon: Tractor,
    examples: ['Engenheiro agrônomo', 'Operador de máquinas', 'Fornecedor de insumos'],
  },
]

export default function CadastroPerfilPage() {
  const router = useRouter()
  const { profileType: storedType, setProfileType } = useOnboardingStore()
  const [selected, setSelected] = useState<ProfileType | null>(storedType)

  function handleContinue() {
    if (!selected) return
    setProfileType(selected)
    router.push('/cadastro/dados')
  }

  return (
    <>
      <OnboardingProgress currentStep={2} totalSteps={4} />

      <main className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="mx-auto max-w-sm">
          <div className="mb-8 mt-4">
            <h1 className="text-2xl font-bold tracking-tight">Qual é o seu perfil?</h1>
            <p className="text-muted-foreground mt-2">
              Escolha como você quer usar o AgroLink. Isso define o que você verá na plataforma.
            </p>
          </div>

          <RadioGroup
            value={selected ?? ''}
            onValueChange={(val) => setSelected(val as ProfileType)}
            className="flex flex-col gap-4"
          >
            {PROFILE_CARDS.map((card) => {
              const isSelected = selected === card.type
              return (
                <button
                  key={card.type}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelected(card.type)}
                  className={cn(
                    'flex w-full cursor-pointer flex-col gap-3 rounded-xl border-2 p-5 text-left transition-all',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-primary/40',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <card.Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{card.title}</p>
                      <p className="text-muted-foreground mt-0.5 text-sm">{card.description}</p>
                    </div>
                    {/* Indicador de seleção */}
                    <div
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                        isSelected
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/40 bg-transparent',
                      )}
                    >
                      {isSelected && (
                        <svg viewBox="0 0 12 10" fill="none" className="h-3 w-3" aria-hidden="true">
                          <path
                            d="M1 5l3.5 3.5L11 1"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <ul className="flex flex-wrap gap-1.5">
                    {card.examples.map((ex) => (
                      <li
                        key={ex}
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-xs transition-colors',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {ex}
                      </li>
                    ))}
                  </ul>
                </button>
              )
            })}
          </RadioGroup>
        </div>
      </main>

      <footer className="bg-background fixed bottom-0 left-0 right-0 border-t p-4">
        <Button className="w-full" size="lg" disabled={!selected} onClick={handleContinue}>
          Continuar
        </Button>
      </footer>
    </>
  )
}
