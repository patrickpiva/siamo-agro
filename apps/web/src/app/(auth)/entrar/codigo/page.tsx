'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@agrolink/ui'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress'
import { useOnboardingStore } from '@/lib/onboarding-store'
import { requestOtp, verifyOtp } from '@/lib/auth-client'

const RESEND_COOLDOWN = 60

export default function CodigoPage() {
  const router = useRouter()
  const { phone, setAuth } = useOnboardingStore()

  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!phone) {
      router.replace('/entrar')
    }
  }, [phone, router])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const handleVerify = useCallback(
    async (value: string) => {
      if (value.length !== 6 || !phone) return
      setError(null)
      setLoading(true)

      try {
        const result = await verifyOtp(phone, value)

        if (!result.ok) {
          setCode('')
          switch (result.code) {
            case 'OTP_INVALID':
              setError('Código incorreto. Verifique e tente novamente.')
              break
            case 'OTP_EXPIRED':
              setError('Código expirado. Solicite um novo código.')
              break
            case 'OTP_MAX_ATTEMPTS':
              setError('Máximo de tentativas atingido. Solicite um novo código.')
              break
            default:
              setError(result.message)
          }
          return
        }

        setAuth(result.data.userId)

        if (result.data.needsOnboarding) {
          router.push('/cadastro/perfil')
        } else {
          router.push('/feed')
        }
      } finally {
        setLoading(false)
      }
    },
    [phone, router, setAuth],
  )

  const handleResend = useCallback(async () => {
    if (!phone || resendCooldown > 0) return
    setResending(true)
    setError(null)
    try {
      const result = await requestOtp(phone)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setResendCooldown(RESEND_COOLDOWN)
      setCode('')
    } finally {
      setResending(false)
    }
  }, [phone, resendCooldown])

  const maskedPhone = phone ? phone.replace(/(\+55)(\d{2})(\d{4,5})(\d{4})/, '$1 ($2) $3-$4') : ''

  return (
    <>
      <OnboardingProgress currentStep={1} totalSteps={4} />

      <main className="flex flex-col items-center p-6 pb-32">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 mt-4">
            <h1 className="text-2xl font-bold tracking-tight">Código de verificação</h1>
            <p className="text-muted-foreground mt-2">
              Enviamos um código para{' '}
              <span className="text-foreground font-medium">{maskedPhone}</span>
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(val) => {
                setCode(val)
                if (val.length === 6) {
                  void handleVerify(val)
                }
              }}
              disabled={loading}
              aria-label="Código de verificação de 6 dígitos"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            {error && (
              <p className="text-destructive text-center text-sm" role="alert">
                {error}
              </p>
            )}

            {loading && <p className="text-muted-foreground text-sm">Verificando código…</p>}

            <div className="text-center">
              {resendCooldown > 0 ? (
                <p className="text-muted-foreground text-sm">Reenviar em {resendCooldown}s</p>
              ) : (
                <button
                  type="button"
                  className="text-primary text-sm font-medium underline underline-offset-2 disabled:opacity-50"
                  disabled={resending}
                  onClick={() => void handleResend()}
                >
                  {resending ? 'Reenviando…' : 'Reenviar código'}
                </button>
              )}
            </div>
          </div>

          <footer className="bg-background fixed bottom-0 left-0 right-0 border-t p-4">
            <Button
              className="w-full"
              size="lg"
              disabled={code.length !== 6 || loading}
              onClick={() => void handleVerify(code)}
            >
              {loading ? 'Verificando…' : 'Confirmar'}
            </Button>
          </footer>
        </div>
      </main>
    </>
  )
}
