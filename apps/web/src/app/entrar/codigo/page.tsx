'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button, BottomCTA, OTPInput } from '@agraia/ui'
import { Info } from '@agraia/ui/icons'
import { StatusBar } from '@/components/layout/status-bar'
import { ScreenHeader } from '@/components/layout/screen-header'
import { useOnboardingStore } from '@/stores/onboarding'
import { verifyOtp, requestOtp } from '@/actions/auth'

const MAX_ATTEMPTS = 5

function formatTimer(ms: number): string {
  if (ms <= 0) return '00:00'
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function EntrarCodigoPage() {
  const router = useRouter()
  const { phone, otpExpiresAt, incrementOtpAttempts, otpAttempts, setPhoneVerified, setOtpExpiry } =
    useOnboardingStore()

  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(() =>
    otpExpiresAt ? Math.max(0, otpExpiresAt - Date.now()) : 0,
  )

  const isBlocked = otpAttempts >= MAX_ATTEMPTS
  const canResend = timeLeft === 0 && !isBlocked

  useEffect(() => {
    if (!otpExpiresAt) return
    const interval = setInterval(() => {
      const left = Math.max(0, otpExpiresAt - Date.now())
      setTimeLeft(left)
      if (left === 0) clearInterval(interval)
    }, 1000)
    return () => clearInterval(interval)
  }, [otpExpiresAt])

  const verify = useCallback(
    async (code: string) => {
      if (isBlocked || !phone) return
      setError('')
      setLoading(true)

      const result = await verifyOtp(phone, code)
      setLoading(false)

      if (!result.ok) {
        incrementOtpAttempts()
        const remaining = MAX_ATTEMPTS - (otpAttempts + 1)
        if (remaining <= 0 || result.code === 'BLOCKED') {
          setError('Muitas tentativas incorretas. Solicite um novo código.')
        } else {
          setError(`${result.message} ${remaining} tentativa(s) restante(s).`)
        }
        setOtp('')
        return
      }

      setPhoneVerified(true)

      if (result.data.needsOnboarding) {
        router.push('/cadastro/perfil')
      } else {
        router.push('/feed')
      }
    },
    [isBlocked, phone, otpAttempts, incrementOtpAttempts, setPhoneVerified, router],
  )

  async function handleResend() {
    if (!phone) return
    setError('')
    setOtp('')
    const result = await requestOtp(phone)
    if (result.ok) {
      setOtpExpiry(Date.now() + 5 * 60 * 1000)
      setTimeLeft(5 * 60 * 1000)
    } else {
      setError(result.message)
    }
  }

  const displayPhone = phone
    ? phone.replace(/^\+55(\d{2})(\d{4,5})(\d{4})$/, '+55 ($1) $2-$3')
    : '—'

  return (
    <main className="bg-background mx-auto flex min-h-screen max-w-[430px] flex-col">
      <StatusBar />
      <ScreenHeader backHref="/entrar" />

      <div className="flex-1 px-5 pt-2">
        <h1 className="mb-2 text-2xl font-medium leading-tight tracking-[-0.3px]">
          Digite o código
        </h1>
        <p className="text-fg-secondary mb-7 text-sm leading-relaxed">
          Enviamos um código para <span className="text-foreground font-mono">{displayPhone}</span>.{' '}
          <button
            type="button"
            onClick={() => router.push('/entrar')}
            className="text-accent-forest dark:text-accent-lime min-h-0 min-w-0 font-medium underline underline-offset-2 hover:opacity-80"
          >
            Trocar número
          </button>
        </p>

        <OTPInput
          value={otp}
          onChange={setOtp}
          onComplete={(value) => {
            void verify(value)
          }}
          disabled={loading || isBlocked}
          error={!!error}
        />

        <p className="text-muted-foreground mb-4 mt-5 text-center text-[13px]" aria-live="polite">
          {canResend ? (
            <button
              type="button"
              onClick={() => {
                void handleResend()
              }}
              className="text-accent-forest dark:text-accent-lime min-h-0 min-w-0 font-medium underline underline-offset-2"
            >
              Reenviar código
            </button>
          ) : isBlocked ? (
            'Muitas tentativas. Solicite um novo código ao voltar.'
          ) : (
            <>
              Reenviar código em{' '}
              <span className="text-accent-forest dark:text-accent-lime font-mono font-medium">
                {formatTimer(timeLeft)}
              </span>
            </>
          )}
        </p>

        <div
          className="bg-primary-subtle dark:bg-accent-lime/[0.08] border-accent-lime/30 flex items-start gap-3 rounded-[12px] border p-3.5"
          role="note"
        >
          <Info
            size={20}
            strokeWidth={1.8}
            className="text-accent-forest dark:text-accent-lime mt-0.5 flex-shrink-0"
          />
          <p className="text-fg-secondary text-xs leading-snug">
            Não recebeu? Verifique se o WhatsApp está atualizado e se há sinal no seu celular.
          </p>
        </div>

        {error && (
          <p className="text-destructive mt-3 text-xs" role="alert">
            {error}
          </p>
        )}
      </div>

      <BottomCTA>
        <Button
          variant={otp.length === 6 && !isBlocked ? 'cta' : 'cta-disabled'}
          disabled={otp.length < 6 || loading || isBlocked}
          onClick={() => {
            void verify(otp)
          }}
          aria-busy={loading}
        >
          {loading ? 'Verificando…' : 'Verificar e continuar'}
        </Button>
      </BottomCTA>
    </main>
  )
}
