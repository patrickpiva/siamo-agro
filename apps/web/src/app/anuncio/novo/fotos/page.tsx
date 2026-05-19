'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Image, Plus, Trash2 } from '@agrolink/ui/icons'
import { ProgressIndicator, BottomCTA, Button, cn } from '@agrolink/ui'
import { WizardHeader } from '@/components/listings/wizard-header'
import { useListingDraftStore, type PendingPhoto } from '@/stores/listing-draft'
import { uploadImages } from '@/lib/upload'

export default function WizardStep4() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const { kind, category, photos, addPhoto, removePhoto, setPhotoUploaded, setPhotoError, reset } =
    useListingDraftStore()

  useEffect(() => {
    if (!kind || !category) router.replace('/anuncio/novo/categoria')
  }, [kind, category, router])

  const readyPhotos = photos.filter((p) => p.remoteKey)
  const hasError = photos.some((p) => p.uploadError)
  const isUploading = photos.some(
    (p) => p.uploadProgress !== undefined && p.uploadProgress < 100 && !p.uploadError,
  )
  const canContinue = readyPhotos.length >= 1 && !hasError && !isUploading

  async function handleFiles(files: FileList | null) {
    if (!files) return
    const remaining = 8 - photos.length
    const toAdd = Array.from(files).slice(0, remaining)
    for (const file of toAdd) {
      const previewUrl = URL.createObjectURL(file)
      const id = crypto.randomUUID()
      addPhoto({ id, file, previewUrl, uploadProgress: 0 })

      try {
        const urls = await uploadImages([file], 'listing')
        const remoteUrl = urls[0]
        if (remoteUrl) {
          setPhotoUploaded(id, remoteUrl, remoteUrl)
        } else {
          setPhotoError(id, 'Upload falhou')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Falha no upload. Tente novamente.'
        console.error('[upload]', message)
        setPhotoError(id, message)
      }
    }
  }

  function handleClose() {
    if (!window.confirm('Descartar anúncio? Seu rascunho será perdido.')) return
    reset()
    router.push('/feed')
  }

  if (!kind) return null

  // Build grid: slot[0] is main (span 2x2), rest are secondary
  const maxSlots = 8
  const filledSlots = photos.slice(0, maxSlots)
  const emptyCount = Math.max(0, Math.min(2, maxSlots - filledSlots.length))

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <WizardHeader
        title="Novo anúncio"
        onBack={() => router.push('/anuncio/novo/detalhes')}
        onClose={handleClose}
      />
      <ProgressIndicator current={4} total={5} />

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <h2 className="mb-1 text-[20px] font-medium leading-snug">Adicione fotos</h2>
        <p className="text-fg-secondary mb-5 text-[13px] leading-relaxed">
          Anúncios com fotos recebem 6× mais propostas. Até 8 fotos. A primeira é a principal.
        </p>

        {/* Photo grid */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          {filledSlots.map((photo, idx) => (
            <PhotoSlot
              key={photo.id}
              photo={photo}
              isMain={idx === 0}
              onRemove={() => removePhoto(photo.id)}
            />
          ))}
          {/* Empty slots */}
          {emptyCount > 0 &&
            Array.from({ length: emptyCount }).map((_, i) => (
              <button
                key={`empty-${i}`}
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="border-border bg-muted text-muted-foreground flex aspect-square items-center justify-center rounded-[10px] border border-dashed"
              >
                <Plus size={24} strokeWidth={1.5} />
              </button>
            ))}
        </div>

        {/* Add buttons */}
        {photos.length < maxSlots && (
          <div className="mb-4 grid grid-cols-2 gap-[10px]">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="bg-card border-border flex items-center justify-center gap-2 rounded-[12px] border py-3 text-[13px] font-medium"
            >
              <Camera size={18} strokeWidth={1.8} />
              Câmera
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-card border-border flex items-center justify-center gap-2 rounded-[12px] border py-3 text-[13px] font-medium"
            >
              <Image size={18} strokeWidth={1.8} />
              Galeria
            </button>
          </div>
        )}

        <p className="text-muted-foreground text-[11px] leading-relaxed">
          Arraste para reordenar · A primeira foto é exibida como capa do anúncio
        </p>

        {hasError && (
          <p className="text-destructive mt-2 text-[11px]">
            Algumas fotos falharam no upload. Remova e tente novamente.
          </p>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      <BottomCTA>
        <Button
          variant={canContinue ? 'cta' : 'cta-disabled'}
          disabled={!canContinue}
          onClick={() => router.push('/anuncio/novo/revisao')}
          className="w-full"
        >
          {isUploading ? 'Enviando fotos…' : 'Continuar'}
        </Button>
      </BottomCTA>
    </div>
  )
}

// ─── PhotoSlot ────────────────────────────────────────────────────────────────

function PhotoSlot({
  photo,
  isMain,
  onRemove,
}: {
  photo: PendingPhoto
  isMain: boolean
  onRemove: () => void
}) {
  const uploading =
    photo.uploadProgress !== undefined && photo.uploadProgress < 100 && !photo.uploadError

  return (
    <div
      className={cn(
        'bg-muted relative overflow-hidden rounded-[10px]',
        isMain ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square',
      )}
    >
      <img src={photo.previewUrl} alt="" className="h-full w-full object-cover" />

      {/* Main label */}
      {isMain && (
        <span className="bg-cta-bg text-cta-fg absolute left-[6px] top-[6px] rounded-[4px] px-[6px] py-[2px] font-mono text-[9px] font-medium tracking-[0.3px]">
          PRINCIPAL
        </span>
      )}

      {/* Upload progress overlay */}
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="h-1 w-3/4 overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${photo.uploadProgress ?? 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Error overlay */}
      {photo.uploadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <span className="px-2 text-center text-[10px] text-white">Falhou</span>
        </div>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remover foto"
        className="absolute right-[6px] top-[6px] flex size-[22px] items-center justify-center rounded-full bg-black/70 text-white"
      >
        <Trash2 size={12} strokeWidth={2} />
      </button>
    </div>
  )
}
