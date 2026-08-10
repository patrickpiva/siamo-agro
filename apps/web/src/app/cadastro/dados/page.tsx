'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Button, BottomCTA, ProgressIndicator, SectionLabel } from '@siamo/ui'
import { StatusBar } from '@/components/layout/status-bar'
import { ScreenHeader } from '@/components/layout/screen-header'
import { useOnboardingStore } from '@/stores/onboarding'
import { cn } from '@siamo/ui'

const schema = z.object({
  name: z
    .string()
    .min(2, 'Nome muito curto')
    .max(80, 'Nome muito longo')
    .refine((s) => /[a-zA-ZÀ-ú]/.test(s), 'Nome inválido'),
  propertyName: z.string().max(80, 'Muito longo').optional(),
  bio: z.string().max(280, 'Máximo 280 caracteres').optional(),
})

const inputClass =
  'w-full bg-bg-elevated border border-border rounded-[12px] px-4 py-[14px] text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent-forest dark:focus:border-accent-lime focus:bg-primary-subtle dark:focus:bg-accent-lime/[0.04] transition-colors min-h-0'

export default function CadastroDadosPage() {
  const router = useRouter()
  const { profileType, name, propertyName, bio, setPersonalData } = useOnboardingStore()

  const [nameVal, setName] = useState(name)
  const [propertyVal, setProperty] = useState(propertyName ?? '')
  const [bioVal, setBio] = useState(bio ?? '')
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    if (!profileType) router.replace('/cadastro/perfil')
  }, [profileType, router])

  function validateName(val: string) {
    const result = schema.shape.name.safeParse(val)
    setNameError(result.success ? '' : (result.error.errors[0]?.message ?? ''))
    return result.success
  }

  const isValid = nameVal.trim().length >= 2 && !nameError

  function handleSubmit() {
    if (!validateName(nameVal)) return
    setPersonalData({
      name: nameVal.trim(),
      propertyName: propertyVal.trim() || undefined,
      bio: bioVal.trim() || undefined,
    })
    router.push('/cadastro/localizacao')
  }

  const isProducer = profileType === 'PRODUCER'
  const propertyLabel = isProducer ? 'NOME DA PROPRIEDADE' : 'NOME DO NEGÓCIO / EMPRESA'
  const bioPlaceholder = isProducer
    ? 'Produtor de café arábica há 15 anos na região serrana…'
    : 'Agrônomo especializado em análise de solo…'

  return (
    <main className="bg-background mx-auto flex min-h-screen max-w-[430px] flex-col">
      <StatusBar />
      <ScreenHeader backHref="/cadastro/perfil" />
      <ProgressIndicator current={2} total={5} />

      <div className="flex-1 px-5">
        <h1 className="mb-2 text-2xl font-medium leading-tight tracking-[-0.3px]">
          Conte um pouco sobre você
        </h1>
        <p className="text-fg-secondary mb-6 text-sm leading-relaxed">
          Essas informações aparecem no seu perfil público.
        </p>

        <SectionLabel>NOME COMPLETO</SectionLabel>
        <div className="mb-4">
          <input
            type="text"
            value={nameVal}
            onChange={(e) => {
              setName(e.target.value)
              if (nameError) validateName(e.target.value)
            }}
            onBlur={() => validateName(nameVal)}
            autoFocus
            placeholder="João Silva"
            className={cn(inputClass, nameError && 'border-destructive')}
            aria-invalid={!!nameError}
            aria-describedby={nameError ? 'name-error' : undefined}
          />
          {nameError && (
            <p id="name-error" className="text-destructive mt-1 text-xs" role="alert">
              {nameError}
            </p>
          )}
        </div>

        <SectionLabel optional>{propertyLabel}</SectionLabel>
        <div className="mb-4">
          <input
            type="text"
            value={propertyVal}
            onChange={(e) => setProperty(e.target.value)}
            placeholder={isProducer ? 'Ex: Fazenda Boa Vista' : 'Ex: AgroConsult Ltda'}
            className={inputClass}
          />
        </div>

        <SectionLabel optional>BREVE APRESENTAÇÃO</SectionLabel>
        <textarea
          value={bioVal}
          onChange={(e) => setBio(e.target.value)}
          placeholder={bioPlaceholder}
          rows={3}
          className={cn(inputClass, 'min-h-[88px] resize-none leading-relaxed')}
          maxLength={280}
        />
        {bioVal.length > 240 && (
          <p className="text-muted-foreground mt-1 text-right text-xs">{bioVal.length}/280</p>
        )}
      </div>

      <BottomCTA>
        <Button
          variant={isValid ? 'cta' : 'cta-disabled'}
          disabled={!isValid}
          onClick={handleSubmit}
        >
          Continuar
        </Button>
      </BottomCTA>
    </main>
  )
}
