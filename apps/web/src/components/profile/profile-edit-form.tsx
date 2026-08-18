'use client'

import { useState, useEffect, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { AvatarUpload } from '@siamo/ui'
import { MapPin, Settings } from '@siamo/ui/icons'
import Link from 'next/link'

const editProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(80),
  propertyName: z.string().max(80).optional(),
  bio: z.string().max(280).optional(),
  photo: z.string().url().nullable().optional(),
})

interface ProfileEditFormProps {
  initialValues: {
    name: string
    propertyName?: string | null
    bio?: string | null
    photo?: string | null
  }
  profileType: 'PRODUCER' | 'PROVIDER'
  location?: { city: string; state: string } | null
}

const TYPE_LABEL: Record<string, string> = {
  PRODUCER: 'Produtor Rural',
  PROVIDER: 'Prestador de Serviços',
}

export function ProfileEditForm({ initialValues, profileType, location }: ProfileEditFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(initialValues.name)
  const [propertyName, setPropertyName] = useState(initialValues.propertyName ?? '')
  const [bio, setBio] = useState(initialValues.bio ?? '')
  const [photo, setPhoto] = useState<string | null>(initialValues.photo ?? null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState<string | null>(null)

  const isDirty =
    name !== initialValues.name ||
    propertyName !== (initialValues.propertyName ?? '') ||
    bio !== (initialValues.bio ?? '') ||
    photo !== (initialValues.photo ?? null)

  // Block browser navigation when form has unsaved changes
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  async function handleFileSelect(file: File) {
    // Upload via presigned URL — reuse existing upload flow
    try {
      const presignedRes = await fetch('/api/proxy/uploads/presigned', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'profile', count: 1 }),
      })
      if (!presignedRes.ok) return
      const { data } = (await presignedRes.json()) as {
        data: { uploads: Array<{ uploadUrl: string; key: string; publicUrl: string }> }
      }
      const upload = data.uploads[0]
      if (!upload) return

      await fetch(upload.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      const confirmRes = await fetch('/api/proxy/uploads/confirm', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: [upload.key] }),
      })
      if (!confirmRes.ok) return
      const { data: confirmed } = (await confirmRes.json()) as { data: { urls: string[] } }
      if (confirmed.urls[0]) setPhoto(confirmed.urls[0])
    } catch {
      // Upload failed silently — user can retry
    }
  }

  async function handleSave() {
    const result = editProfileSchema.safeParse({
      name,
      propertyName: propertyName || undefined,
      bio: bio || undefined,
      photo,
    })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string
        fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setSaveError(null)

    startTransition(async () => {
      try {
        const res = await fetch('/api/proxy/me', {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: result.data.name,
            propertyName: result.data.propertyName ?? null,
            bio: result.data.bio ?? null,
            photo: result.data.photo,
          }),
        })
        if (!res.ok) {
          const { error } = (await res.json()) as { error: { message: string } }
          setSaveError(error?.message ?? 'Erro ao salvar')
          return
        }
        router.push('/perfil')
        router.refresh()
      } catch {
        setSaveError('Erro de conexão. Tente novamente.')
      }
    })
  }

  return (
    <div className="flex flex-col">
      {/* Avatar section */}
      <div className="flex flex-col items-center px-5 pb-5 pt-6">
        <AvatarUpload
          avatarUrl={photo}
          name={name}
          onFileSelect={(file) => void handleFileSelect(file)}
          disabled={isPending}
          className="size-[96px]"
        />
        <button
          type="button"
          className="text-primary mt-2 text-[13px] font-medium"
          onClick={() =>
            document.querySelector<HTMLElement>('[aria-label="Alterar foto de perfil"]')?.click()
          }
        >
          Trocar foto
        </button>
      </div>

      {/* Form fields */}
      <div className="space-y-0 px-5">
        <FormField label="NOME COMPLETO" required error={errors['name']} id="name">
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-describedby={errors['name'] ? 'name-error' : undefined}
            className="bg-muted border-border focus:border-primary focus:bg-primary/[0.04] text-foreground w-full rounded-[12px] border px-4 py-[14px] text-[15px] outline-none transition-colors"
            disabled={isPending}
          />
        </FormField>

        <FormField label="NOME DA PROPRIEDADE" id="propertyName">
          <input
            id="propertyName"
            type="text"
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            placeholder="Opcional"
            className="bg-muted border-border focus:border-primary focus:bg-primary/[0.04] text-foreground placeholder:text-muted-foreground w-full rounded-[12px] border px-4 py-[14px] text-[15px] outline-none transition-colors"
            disabled={isPending}
          />
        </FormField>

        <FormField label={`APRESENTAÇÃO`} id="bio" hint={`${bio.length}/280`}>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 280))}
            placeholder="Fale um pouco sobre você e seu trabalho..."
            rows={3}
            className="bg-muted border-border focus:border-primary focus:bg-primary/[0.04] text-foreground placeholder:text-muted-foreground w-full resize-none rounded-[12px] border px-4 py-[14px] text-[14px] leading-[1.5] outline-none transition-colors"
            disabled={isPending}
          />
        </FormField>

        {/* Location — readonly with edit link */}
        <div className="mb-4">
          <label className="text-muted-foreground mb-2 block font-mono text-[11px] tracking-[0.4px]">
            LOCALIZAÇÃO
          </label>
          <div className="bg-muted border-border flex items-center gap-2 rounded-[12px] border px-4 py-[14px]">
            <MapPin size={16} strokeWidth={1.8} className="text-muted-foreground flex-shrink-0" />
            <span className="text-foreground flex-1 text-[15px]">
              {location ? `${location.city}, ${location.state}` : 'Não definida'}
            </span>
            <Link href="/configuracoes" className="text-primary text-[13px] font-medium">
              Editar
            </Link>
          </div>
        </div>

        {/* Profile type — readonly */}
        <div className="mb-6">
          <label className="text-muted-foreground mb-2 block font-mono text-[11px] tracking-[0.4px]">
            TIPO DE PERFIL
          </label>
          <div className="bg-muted border-border flex items-center gap-2 rounded-[12px] border px-4 py-[14px]">
            <Settings size={16} strokeWidth={1.8} className="text-muted-foreground flex-shrink-0" />
            <span className="text-foreground flex-1 text-[15px]">{TYPE_LABEL[profileType]}</span>
            <Link href="/configuracoes" className="text-muted-foreground text-[11px]">
              Alterar
            </Link>
          </div>
        </div>
      </div>

      {/* Save error */}
      {saveError && (
        <p className="text-destructive px-5 pb-2 text-[13px]" role="alert">
          {saveError}
        </p>
      )}

      {/* CTA */}
      <div className="border-border border-t px-5 pb-6 pt-4">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!isDirty || isPending}
          className="bg-cta-bg text-cta-fg w-full rounded-[12px] py-[15px] text-[15px] font-medium disabled:opacity-50"
        >
          {isPending ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}

function FormField({
  label,
  id,
  required,
  hint,
  error,
  children,
}: {
  label: string
  id: string
  required?: boolean
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-muted-foreground font-mono text-[11px] tracking-[0.4px]"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        {hint && <span className="text-muted-foreground font-mono text-[10px]">{hint}</span>}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-destructive mt-1 text-[11px]" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
