'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, BottomCTA, ProgressIndicator, ConsentCheckbox } from '@agraia/ui'
import { StatusBar } from '@/components/layout/status-bar'
import { ScreenHeader } from '@/components/layout/screen-header'
import { useOnboardingStore } from '@/stores/onboarding'

export default function CadastroConsentimentoPage() {
  const router = useRouter()
  const { consents, setConsents, profileType, name, propertyName, bio, location, avatarUrl } =
    useOnboardingStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { terms, privacy, marketingWhatsapp } = consents
  const canProceed = terms && privacy

  async function handleSubmit() {
    if (!canProceed) return
    setError('')
    setLoading(true)

    try {
      const profileRes = await fetch('/api/v1/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: profileType,
          name,
          propertyName,
          bio,
          location,
          avatarUrl,
        }),
      })
      if (!profileRes.ok) {
        const body = (await profileRes.json().catch(() => ({}))) as { error?: { message?: string } }
        throw new Error(body.error?.message ?? 'Erro ao criar perfil')
      }

      const consentRes = await fetch('/api/v1/privacy/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms: true, privacy: true, marketingWhatsapp }),
      })
      if (!consentRes.ok) throw new Error('Erro ao registrar consentimento')

      const firstName = name.split(' ')[0] ?? ''
      useOnboardingStore.getState().reset()
      router.push(`/cadastro/pronto?nome=${encodeURIComponent(firstName)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="bg-background mx-auto flex min-h-screen max-w-[430px] flex-col">
      <StatusBar />
      <ScreenHeader backHref="/cadastro/foto" />
      <ProgressIndicator current={5} total={5} />

      <div className="flex-1 px-5">
        <h1 className="mb-2 text-2xl font-medium leading-tight tracking-[-0.3px]">Quase lá!</h1>
        <p className="text-fg-secondary mb-6 text-sm leading-relaxed">
          Precisamos do seu consentimento para finalizar seu cadastro com segurança.
        </p>

        <div className="rounded-card border-border bg-bg-surface overflow-hidden border">
          <ConsentCheckbox
            id="consent-terms"
            checked={terms}
            onCheckedChange={(v) => setConsents({ terms: v })}
            title="Termos de uso"
            required
            description="Concordo com as regras de uso da plataforma."
            linkText="Ler termos"
            linkHref="/termos"
          />

          <ConsentCheckbox
            id="consent-privacy"
            checked={privacy}
            onCheckedChange={(v) => setConsents({ privacy: v })}
            title="Política de privacidade"
            required
            description="Concordo com o tratamento dos meus dados pessoais."
            linkText="Ler política"
            linkHref="/privacidade"
          />

          <ConsentCheckbox
            id="consent-marketing"
            checked={marketingWhatsapp}
            onCheckedChange={(v) => setConsents({ marketingWhatsapp: v })}
            title="Comunicações por WhatsApp"
            description="Quero receber notificações de matches e propostas no WhatsApp."
          />
        </div>

        {error && (
          <p className="text-destructive mt-4 text-xs" role="alert">
            {error}
          </p>
        )}
      </div>

      <BottomCTA>
        <Button
          variant={canProceed ? 'cta' : 'cta-disabled'}
          disabled={!canProceed || loading}
          onClick={() => {
            void handleSubmit()
          }}
          aria-busy={loading}
        >
          {loading ? 'Criando conta…' : 'Criar minha conta'}
        </Button>
      </BottomCTA>
    </main>
  )
}
