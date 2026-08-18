'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, BottomCTA, PhoneInput, SectionLabel } from '@siamo/ui'
import { WhatsAppLogo } from '@siamo/ui/icons'
import { StatusBar } from '@/components/layout/status-bar'
import { ScreenHeader } from '@/components/layout/screen-header'
import { useOnboardingStore } from '@/stores/onboarding'
import { requestOtp } from '@/actions/auth'
import { z } from 'zod'

const phoneSchema = z.string().regex(/^\+55\d{10,11}$/, 'Número inválido — use DDD + 9 dígitos')

export default function EntrarPage() {
  const router = useRouter()
  const { setPhone, setOtpExpiry } = useOnboardingStore()

  const [phone, setPhoneLocal] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const digits = phone.replace(/\D/g, '').replace(/^55/, '')
  const isValid = digits.length >= 10

  async function handleSubmit() {
    setError('')
    const parsed = phoneSchema.safeParse(phone)
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Número inválido')
      return
    }

    setLoading(true)
    const result = await requestOtp(phone)
    setLoading(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setPhone(phone)
    setOtpExpiry(Date.now() + 5 * 60 * 1000)
    router.push('/entrar/codigo')
  }

  return (
    <main className="bg-background mx-auto flex min-h-screen max-w-[430px] flex-col">
      <StatusBar />
      <ScreenHeader backHref="/" />

      <div className="flex-1 px-5 pt-2">
        <h1 className="mb-2 text-2xl font-medium leading-tight tracking-[-0.3px]">
          Entre com seu WhatsApp
        </h1>
        <p className="text-fg-secondary mb-7 text-sm leading-relaxed">
          Enviaremos um código de 6 dígitos para confirmar seu número.
        </p>

        <SectionLabel>NÚMERO DO WHATSAPP</SectionLabel>
        <PhoneInput
          value={phone}
          onChange={setPhoneLocal}
          error={error}
          autoFocus
          disabled={loading}
        />

        <p className="text-muted-foreground mt-3 text-xs leading-snug">
          Ao continuar, você concorda com nossos{' '}
          <Link
            href="/termos"
            className="text-accent-forest dark:text-accent-lime font-medium underline underline-offset-2"
          >
            Termos de uso
          </Link>{' '}
          e{' '}
          <Link
            href="/privacidade"
            className="text-accent-forest dark:text-accent-lime font-medium underline underline-offset-2"
          >
            Política de privacidade
          </Link>
          .
        </p>
      </div>

      <BottomCTA>
        <Button
          variant={isValid ? 'cta' : 'cta-disabled'}
          icon={<WhatsAppLogo size={16} />}
          disabled={!isValid || loading}
          onClick={() => {
            void handleSubmit()
          }}
          aria-busy={loading}
        >
          {loading ? 'Enviando…' : 'Receber código no WhatsApp'}
        </Button>
      </BottomCTA>
    </main>
  )
}
