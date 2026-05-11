'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@agrolink/ui'
import { LocationPicker } from '@/components/onboarding/LocationPicker'
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress'
import { useOnboardingStore } from '@/lib/onboarding-store'
import { createProfileAction } from '@/actions/profile'
import type { OnboardingLocation } from '@/lib/onboarding-store'

export default function CadastroLocalizacaoPage() {
  const router = useRouter()
  const store = useOnboardingStore()

  const [location, setLocation] = useState<OnboardingLocation | null>(store.location)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFinish() {
    if (!location) return
    if (!store.userId || !store.profileType || !store.name) {
      // Estado inconsistente — reinicia o fluxo
      router.replace('/entrar')
      return
    }

    setLoading(true)
    setError(null)

    try {
      store.setLocation(location)

      const result = await createProfileAction({
        userId: store.userId,
        profileType: store.profileType,
        name: store.name,
        bio: store.bio || undefined,
        location,
      })

      if (!result.ok) {
        setError(result.message)
        return
      }

      // Limpa o store de onboarding
      store.reset()

      router.push('/feed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <OnboardingProgress currentStep={4} totalSteps={4} />

      <main className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="mx-auto max-w-sm">
          <div className="mb-8 mt-4">
            <h1 className="text-2xl font-bold tracking-tight">Sua localização</h1>
            <p className="text-muted-foreground mt-2">
              Usamos sua localização para conectar você a oportunidades próximas.
            </p>
          </div>

          <LocationPicker onLocationSelect={setLocation} initialLocation={store.location} />

          {error && (
            <p className="text-destructive mt-4 text-sm" role="alert">
              {error}
            </p>
          )}
        </div>
      </main>

      <footer className="bg-background fixed bottom-0 left-0 right-0 border-t p-4">
        <Button
          className="w-full"
          size="lg"
          disabled={!location || loading}
          onClick={() => void handleFinish()}
        >
          {loading ? 'Criando seu perfil…' : 'Concluir cadastro'}
        </Button>
      </footer>
    </>
  )
}
