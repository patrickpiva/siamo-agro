'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Camera, Image, Plus, Trash2 } from '@siamo/ui/icons'
import { ProgressIndicator, BottomCTA, Button, cn } from '@siamo/ui'
import { WizardHeader } from '@/components/listings/wizard-header'
import { useListingDraftStore, type PendingPhoto } from '@/stores/listing-draft'
import { uploadImages } from '@/lib/upload'

export default function WizardStep4() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const {
    kind,
    category,
    photos,
    addPhoto,
    removePhoto,
    reorderPhotos,
    setPhotoUploaded,
    setPhotoError,
    reset,
  } = useListingDraftStore()

  // Mobile-first sensors: press-and-hold to drag on touch (so the page still
  // scrolls normally), 8px threshold on mouse, arrow keys for accessibility.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // An empty draft goes straight back to step 1 in a single hop — chaining through
  // /categoria made a back navigation out of the flow bounce across screens.
  useEffect(() => {
    if (!kind) router.replace('/anuncio/novo')
    else if (!category) router.replace('/anuncio/novo/categoria')
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = photos.findIndex((p) => p.id === active.id)
    const toIndex = photos.findIndex((p) => p.id === over.id)
    if (fromIndex !== -1 && toIndex !== -1) reorderPhotos(fromIndex, toIndex)
  }

  function handleClose() {
    if (!window.confirm('Descartar anúncio? Seu rascunho será perdido.')) return
    reset()
    router.push('/')
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

        {/* Photo grid — drag to reorder */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filledSlots.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="mb-5 grid grid-cols-3 gap-2">
              {filledSlots.map((photo, idx) => (
                <PhotoSlot
                  key={photo.id}
                  photo={photo}
                  isMain={idx === 0}
                  onRemove={() => removePhoto(photo.id)}
                />
              ))}
              {/* Empty slots — not sortable */}
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
          </SortableContext>
        </DndContext>

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
          Toque e segure para reordenar · A primeira foto é exibida como capa do anúncio
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
  })

  const uploading =
    photo.uploadProgress !== undefined && photo.uploadProgress < 100 && !photo.uploadError

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 20 : undefined,
      }}
      className={cn(
        'bg-muted relative select-none overflow-hidden rounded-[10px]',
        isMain ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square',
        isDragging && 'ring-accent-lime ring-2',
      )}
      {...attributes}
      {...listeners}
    >
      <img
        src={photo.previewUrl}
        alt=""
        draggable={false}
        className="pointer-events-none h-full w-full object-cover"
      />

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

      {/* Remove button — stop propagation so a tap never starts a drag */}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        aria-label="Remover foto"
        className="absolute right-[6px] top-[6px] flex size-[22px] items-center justify-center rounded-full bg-black/70 text-white"
      >
        <Trash2 size={12} strokeWidth={2} />
      </button>
    </div>
  )
}
