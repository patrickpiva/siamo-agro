'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, BottomCTA, ProgressIndicator, AvatarUpload } from '@siamo/ui'
import { Camera, Image } from '@siamo/ui/icons'
import { StatusBar } from '@/components/layout/status-bar'
import { ScreenHeader } from '@/components/layout/screen-header'
import { useOnboardingStore } from '@/stores/onboarding'

const MAX_SIZE_BYTES = 5 * 1024 * 1024

export default function CadastroFotoPage() {
  const router = useRouter()
  const { name, avatarUrl: storedUrl, setAvatarUrl } = useOnboardingStore()

  const [avatarUrl, setLocalUrl] = useState<string | undefined>(storedUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file: File) {
    setError('')
    if (file.size > MAX_SIZE_BYTES) {
      setError('Arquivo muito grande. Máximo 5 MB.')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Formato não suportado. Use JPEG, PNG ou WebP.')
      return
    }

    setUploading(true)
    try {
      const localUrl = URL.createObjectURL(file)
      setLocalUrl(localUrl)

      const presignedRes = await fetch('/api/v1/uploads/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'profile', count: 1 }),
      })
      if (!presignedRes.ok) throw new Error('Erro ao preparar upload')
      type PresignedUpload = { uploadUrl: string; key: string; publicUrl: string }
      const { data } = (await presignedRes.json()) as { data: { uploads: PresignedUpload[] } }
      const upload = data.uploads[0]
      if (!upload) throw new Error('Resposta de upload inválida')

      await fetch(upload.uploadUrl, { method: 'PUT', body: file })

      await fetch('/api/v1/uploads/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: [upload.key] }),
      })

      setAvatarUrl(upload.publicUrl)
      setLocalUrl(upload.publicUrl)
    } catch {
      setError('Erro ao fazer upload. Tente novamente.')
      setLocalUrl(storedUrl)
    } finally {
      setUploading(false)
    }
  }

  function handleSkip() {
    router.push('/cadastro/consentimento')
  }

  function handleContinue() {
    router.push('/cadastro/consentimento')
  }

  return (
    <main className="bg-background mx-auto flex min-h-screen max-w-[430px] flex-col">
      <StatusBar />
      <ScreenHeader
        backHref="/cadastro/localizacao"
        right={
          <button
            type="button"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground min-h-0 min-w-0 text-sm transition-colors"
          >
            Pular
          </button>
        }
      />
      <ProgressIndicator current={4} total={5} />

      <div className="flex flex-1 flex-col items-center px-5">
        <h1 className="mb-2 w-full text-2xl font-medium leading-tight tracking-[-0.3px]">
          Adicione uma foto
        </h1>
        <p className="text-fg-secondary mb-8 w-full text-sm leading-relaxed">
          Perfis com foto recebem em média 3x mais propostas. Tire uma foto agora ou escolha da
          galeria.
        </p>

        <AvatarUpload
          avatarUrl={avatarUrl}
          name={name}
          onFileSelect={(file) => {
            void handleFile(file)
          }}
          disabled={uploading}
          className="mb-8"
        />

        {error && (
          <p className="text-destructive mb-4 text-xs" role="alert">
            {error}
          </p>
        )}

        <div className="grid w-full grid-cols-2 gap-3">
          <label className="bg-background border-border hover:bg-bg-elevated flex cursor-pointer items-center justify-center gap-2.5 rounded-[12px] border px-4 py-[15px] transition-colors">
            <Camera size={18} strokeWidth={1.8} className="text-foreground flex-shrink-0" />
            <span className="text-foreground text-sm font-medium">Câmera</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleFile(file)
                e.target.value = ''
              }}
            />
          </label>

          <label className="bg-background border-border hover:bg-bg-elevated flex cursor-pointer items-center justify-center gap-2.5 rounded-[12px] border px-4 py-[15px] transition-colors">
            <Image size={18} strokeWidth={1.8} className="text-foreground flex-shrink-0" />
            <span className="text-foreground text-sm font-medium">Galeria</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleFile(file)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </div>

      <BottomCTA>
        <Button variant="cta" disabled={uploading} onClick={handleContinue} aria-busy={uploading}>
          {uploading ? 'Enviando…' : 'Continuar'}
        </Button>
      </BottomCTA>
    </main>
  )
}
