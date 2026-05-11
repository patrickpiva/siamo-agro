'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@agrolink/ui'
import { PhoneInput } from '@/components/onboarding/PhoneInput'
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress'
import { useOnboardingStore, useHasHydrated } from '@/lib/onboarding-store'
import { requestOtp } from '@/lib/auth-client'
import { phoneSchema } from '@/lib/schemas'

export default function EntrarPage() {
  const router = useRouter()
  const { phone: storedPhone, setPhone } = useOnboardingStore()
  const hasHydrated = useHasHydrated()

  const [phone, setLocalPhone] = useState('')

  // Restaura o telefone do sessionStorage após hidratação
  useEffect(() => {
    if (hasHydrated && storedPhone) {
      setLocalPhone(storedPhone)
    }
  }, [hasHydrated, storedPhone])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = phoneSchema.safeParse(phone)
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Telefone inválido')
      return
    }

    setLoading(true)
    try {
      const result = await requestOtp(phone)

      if (!result.ok) {
        if (result.code === 'RATE_LIMIT_EXCEEDED') {
          setError('Muitas tentativas. Aguarde 15 minutos e tente novamente.')
        } else {
          setError(result.message)
        }
        return
      }

      setPhone(phone)
      router.push('/entrar/codigo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <OnboardingProgress currentStep={1} totalSteps={4} />

      <main className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="mx-auto max-w-sm">
          <div className="mb-8 mt-4">
            <h1 className="text-2xl font-bold tracking-tight">Bem-vindo ao AgroLink</h1>
            <p className="text-muted-foreground mt-2">
              Informe seu número do WhatsApp para começar. Você receberá um código de verificação.
            </p>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-6">
            <PhoneInput
              value={phone}
              onChange={setLocalPhone}
              error={error ?? undefined}
              disabled={loading}
            />

            <footer className="bg-background fixed bottom-0 left-0 right-0 border-t p-4">
              <Button type="submit" className="w-full" size="lg" disabled={loading || !phone}>
                {loading ? 'Enviando…' : 'Receber código via WhatsApp'}
              </Button>
            </footer>
          </form>
        </div>
      </main>
    </>
  )
}
