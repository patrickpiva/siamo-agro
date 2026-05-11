'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@agrolink/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress'
import { useOnboardingStore, useHasHydrated } from '@/lib/onboarding-store'
import { profileDataFormSchema } from '@/lib/schemas'

export default function CadastroDadosPage() {
  const router = useRouter()
  const store = useOnboardingStore()
  const hasHydrated = useHasHydrated()

  // Inicializa os campos APÓS a hidratação do sessionStorage
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    if (hasHydrated) {
      setName(store.name)
      setBio(store.bio)
      setPhotoUrl(store.photoPreviewUrl)
    }
  }, [hasHydrated])

  const { setProfile } = store
  const [errors, setErrors] = useState<{ name?: string; bio?: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('Foto deve ter no máximo 5MB')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Formato aceito: JPEG, PNG ou WebP')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      setPhotoUrl(url)
    }
    reader.readAsDataURL(file)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrors(null)

    const parsed = profileDataFormSchema.safeParse({ name, bio: bio || undefined })
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      setErrors({
        name: fieldErrors.name?.[0],
        bio: fieldErrors.bio?.[0],
      })
      return
    }

    setLoading(true)
    try {
      setProfile(name, bio, photoUrl)
      router.push('/cadastro/localizacao')
    } finally {
      setLoading(false)
    }
  }

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <>
      <OnboardingProgress currentStep={3} totalSteps={4} />

      <main className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="mx-auto max-w-sm">
          <div className="mb-8 mt-4">
            <h1 className="text-2xl font-bold tracking-tight">Seus dados</h1>
            <p className="text-muted-foreground mt-2">
              Como você quer ser identificado na plataforma?
            </p>
          </div>

          <form
            id="dados-form"
            onSubmit={(e) => void handleSubmit(e)}
            className="flex flex-col gap-6"
          >
            {/* Foto */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative"
                aria-label="Alterar foto de perfil"
              >
                <Avatar className="h-24 w-24">
                  {photoUrl ? <AvatarImage src={photoUrl} alt="Foto de perfil" /> : null}
                  <AvatarFallback className="text-2xl">{initials || 'AL'}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-xs text-white">Alterar</span>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handlePhotoChange}
              />
              <p className="text-muted-foreground text-xs">Toque para adicionar foto (opcional)</p>
            </div>

            {/* Nome */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name-input">Nome completo</Label>
              <Input
                id="name-input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  // Persiste imediatamente no sessionStorage (protege contra refresh acidental)
                  setProfile(e.target.value, bio, photoUrl)
                }}
                placeholder="Ex: Maria Santos"
                error={errors?.name}
                autoComplete="name"
                disabled={loading}
              />
            </div>

            {/* Bio */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="bio-input">Bio (opcional)</Label>
                <span className="text-muted-foreground text-xs">{bio.length}/300</span>
              </div>
              <textarea
                id="bio-input"
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value)
                  setProfile(name, e.target.value, photoUrl)
                }}
                maxLength={300}
                rows={3}
                placeholder="Conte um pouco sobre você ou seu negócio…"
                disabled={loading}
                className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[80px] w-full resize-none rounded-md border px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors?.bio && (
                <p className="text-destructive text-sm" role="alert">
                  {errors.bio}
                </p>
              )}
            </div>
          </form>
        </div>
      </main>

      <footer className="bg-background fixed bottom-0 left-0 right-0 border-t p-4">
        <Button
          type="submit"
          form="dados-form"
          className="w-full"
          size="lg"
          disabled={!name.trim() || loading}
        >
          {loading ? 'Salvando…' : 'Continuar'}
        </Button>
      </footer>
    </>
  )
}
