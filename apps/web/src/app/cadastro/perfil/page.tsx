'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, BottomCTA, ProgressIndicator, SelectCard } from '@agrolink/ui'
import { CoffeeBean, Agronomist } from '@agrolink/ui/icons'
import { StatusBar } from '@/components/layout/status-bar'
import { ScreenHeader } from '@/components/layout/screen-header'
import { useOnboardingStore } from '@/stores/onboarding'
import type { ProfileType } from '@/stores/onboarding'

const OPTIONS: {
  type: ProfileType
  title: string
  description: string
  icon: React.ReactNode
}[] = [
  {
    type: 'PRODUCER',
    title: 'Produtor',
    description: 'Vendo produção, busco insumos, ofereço ou contrato serviços',
    icon: <CoffeeBean size={24} />,
  },
  {
    type: 'PROVIDER',
    title: 'Prestador de serviço',
    description: 'Ofereço serviços ou equipamentos para o agronegócio',
    icon: <Agronomist size={24} />,
  },
]

export default function CadastroPerfilPage() {
  const router = useRouter()
  const { profileType, setProfileType } = useOnboardingStore()
  const [selected, setSelected] = useState<ProfileType | null>(profileType)

  function handleContinue() {
    if (!selected) return
    setProfileType(selected)
    router.push('/cadastro/dados')
  }

  return (
    <main className="bg-background mx-auto flex min-h-screen max-w-[430px] flex-col">
      <StatusBar />
      <ScreenHeader backHref="/entrar/codigo" />
      <ProgressIndicator current={1} total={5} />

      <div className="flex-1 px-5">
        <h1 className="mb-2 text-2xl font-medium leading-tight tracking-[-0.3px]">
          Como você usa o AgroLink?
        </h1>
        <p className="text-fg-secondary mb-6 text-sm leading-relaxed">
          Você poderá ajustar isso depois nas configurações.
        </p>

        <div role="radiogroup" aria-label="Tipo de perfil" className="flex flex-col gap-3">
          {OPTIONS.map((opt) => (
            <SelectCard
              key={opt.type}
              title={opt.title}
              description={opt.description}
              icon={opt.icon}
              selected={selected === opt.type}
              onSelect={() => setSelected(opt.type)}
            />
          ))}
        </div>
      </div>

      <BottomCTA>
        <Button
          variant={selected ? 'cta' : 'cta-disabled'}
          disabled={!selected}
          onClick={handleContinue}
        >
          Continuar
        </Button>
      </BottomCTA>
    </main>
  )
}
