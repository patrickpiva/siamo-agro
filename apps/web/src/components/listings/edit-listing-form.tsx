'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Camera, Trash2 } from '@siamo/ui/icons'
import {
  SectionLabel,
  PriceInput,
  Toggle,
  BottomCTA,
  Button,
  KindBadge,
  StatusBadge,
  cn,
} from '@siamo/ui'
import { WizardHeader } from '@/components/listings/wizard-header'
import { uploadImages } from '@/lib/upload'
import type { Listing } from '@/lib/api'
import { route } from '@/lib/route'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  COFFEE: 'Café',
  SOY: 'Soja',
  CORN: 'Milho',
  GRAINS: 'Grãos',
  LIVESTOCK: 'Pecuária',
  DAIRY: 'Laticínios',
  FRUITS: 'Frutas',
  VEGETABLES: 'Hortaliças',
  AGRONOMY: 'Agronomia',
  VETERINARY: 'Veterinária',
  CONSULTING: 'Consultoria',
  MECHANICS: 'Mecânica',
  LABOR: 'Mão de obra',
  TRANSPORT: 'Transporte',
  IRRIGATION: 'Irrigação',
  TRACTOR: 'Trator',
  HARVESTER: 'Colheitadeira',
  IRRIGATION_SYSTEM: 'Irrigação',
  TOOLS: 'Ferramentas',
  STORAGE: 'Armazenamento',
  OTHER: 'Outros',
}

const UNIT_BY_CATEGORY: Record<string, string> = {
  COFFEE: 'SACA · 60KG',
  SOY: 'SACA · 60KG',
  CORN: 'SACA · 60KG',
  GRAINS: 'SACA · 60KG',
  LIVESTOCK: 'CABEÇA',
  DAIRY: 'LITRO',
  FRUITS: 'KG',
  VEGETABLES: 'KG',
  AGRONOMY: 'HORA',
  VETERINARY: 'CONSULTA',
  CONSULTING: 'HORA',
  MECHANICS: 'HORA',
  LABOR: 'DIA',
  TRANSPORT: 'VIAGEM',
  IRRIGATION: 'MÊS',
  TRACTOR: 'DIA',
  HARVESTER: 'HECTARE',
  IRRIGATION_SYSTEM: 'MÊS',
  TOOLS: 'DIA',
  STORAGE: 'MÊS',
  OTHER: 'UNIDADE',
}

function priceLabel(kind: string, category: string): string {
  if (kind === 'SERVICE') return 'VALOR DO SERVIÇO'
  if (kind === 'EQUIPMENT') return 'VALOR · LOCAÇÃO/VENDA'
  if (kind === 'DEMAND') return 'VALOR MÁXIMO QUE PAGO · OPCIONAL'
  const unit = UNIT_BY_CATEGORY[category] ?? 'UNIDADE'
  return `PREÇO POR ${unit}`
}

// ─── Types ────────────────────────────────────────────────────────────────────

type EditPhoto = {
  id: string
  previewUrl: string
  remoteUrl: string
  uploading?: boolean
  error?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

interface EditListingFormProps {
  listing: Listing
}

export function EditListingForm({ listing }: EditListingFormProps) {
  const router = useRouter()

  const [title, setTitle] = useState(listing.title)
  const [description, setDescription] = useState(listing.description)
  // listing.price is in BRL; PriceInput works in cents
  const [price, setPrice] = useState<number | null>(
    listing.price !== null ? Math.round(listing.price * 100) : null,
  )
  const [negotiable, setNegotiable] = useState(listing.negotiable)
  const [photos, setPhotos] = useState<EditPhoto[]>(
    [...listing.photos]
      .sort((a, b) => a.order - b.order)
      .map((p) => ({ id: p.id, previewUrl: p.url, remoteUrl: p.url })),
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const priceRequired = listing.kind !== 'DEMAND'
  const isValid =
    title.length >= 10 &&
    description.length >= 30 &&
    photos.length >= 1 &&
    photos.every((p) => !p.uploading && !p.error) &&
    (!priceRequired || (price !== null && price > 0))

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return
    const remaining = 8 - photos.length
    const toAdd = Array.from(files).slice(0, remaining)

    for (const file of toAdd) {
      const tempId = crypto.randomUUID()
      const previewUrl = URL.createObjectURL(file)
      setPhotos((prev) => [...prev, { id: tempId, previewUrl, remoteUrl: '', uploading: true }])

      try {
        const urls = await uploadImages([file], 'listing')
        const remoteUrl = urls[0]
        if (remoteUrl) {
          setPhotos((prev) =>
            prev.map((p) => (p.id === tempId ? { ...p, remoteUrl, uploading: false } : p)),
          )
        } else {
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === tempId ? { ...p, uploading: false, error: 'Upload falhou' } : p,
            ),
          )
        }
      } catch {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === tempId ? { ...p, uploading: false, error: 'Falha no upload' } : p,
          ),
        )
      }
    }
  }

  async function handleSave() {
    if (!isValid || submitting) return
    setSubmitting(true)
    setError(null)

    try {
      const body: Record<string, unknown> = {
        title,
        description,
        negotiable,
        photoUrls: photos.map((p) => p.remoteUrl).filter(Boolean),
      }
      if (price !== null) body['price'] = price / 100

      const res = await fetch(`/api/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } }
        throw new Error(json.error?.message ?? 'Erro ao salvar.')
      }

      // replace, not push: the form must leave the history stack so the back
      // arrow on the detail page cannot walk back into a submitted draft.
      // refresh() re-renders the Server Component so the saved values show up.
      router.replace(route(`/anuncio/${listing.id}`))
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado. Tente novamente.')
      setSubmitting(false)
    }
  }

  const catLabel = CATEGORY_LABELS[listing.category] ?? listing.category

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <WizardHeader
        title="Editar anúncio"
        onBack={() => router.push(route(`/anuncio/${listing.id}`))}
        rightSlot={
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!isValid || submitting}
            aria-label="Salvar"
            className={cn(
              'flex size-[48px] items-center justify-center rounded-full',
              isValid && !submitting
                ? 'bg-primary-subtle text-accent'
                : 'bg-muted text-muted-foreground',
            )}
          >
            <Save size={17} strokeWidth={1.8} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 pb-4 pt-3">
        {/* Summary */}
        <div className="bg-card border-border mb-5 flex items-center gap-2 rounded-[10px] border px-[14px] py-[10px]">
          <KindBadge kind={listing.kind} />
          <span className="text-fg-secondary truncate text-[13px]">{catLabel}</span>
          <StatusBadge status={listing.status} className="ml-auto flex-shrink-0" />
        </div>

        {/* Helper text */}
        <p className="text-fg-secondary mb-5 text-[12px] leading-relaxed">
          Alterar título, descrição ou categoria recalcula seus matches.
        </p>

        {/* Title */}
        <div className="mb-2 flex items-center justify-between">
          <SectionLabel>TÍTULO</SectionLabel>
          <span className="text-muted-foreground font-mono text-[10px]">{title.length}/120</span>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 120))}
          placeholder="Título do anúncio"
          className={cn(
            'bg-card mb-4 w-full rounded-[12px] border-[1.5px] px-4 py-[14px]',
            'text-foreground placeholder:text-muted-foreground text-[14px] outline-none',
            title.length >= 10 ? 'border-accent' : 'focus:border-accent border-border',
          )}
        />
        {title.length > 0 && title.length < 10 && (
          <p className="text-destructive -mt-3 mb-3 text-[11px]">Mínimo de 10 caracteres.</p>
        )}

        {/* Description */}
        <div className="mb-2 flex items-center justify-between">
          <SectionLabel>DESCRIÇÃO</SectionLabel>
          <span className="text-muted-foreground font-mono text-[10px]">
            {description.length}/2000
          </span>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
          placeholder="Descreva os detalhes, condições, quantidade disponível..."
          rows={5}
          className={cn(
            'bg-card mb-4 w-full resize-none rounded-[12px] border-[1.5px] px-4 py-[14px]',
            'text-foreground placeholder:text-muted-foreground text-[14px] leading-relaxed outline-none',
            description.length >= 30 ? 'border-accent' : 'focus:border-accent border-border',
          )}
        />
        {description.length > 0 && description.length < 30 && (
          <p className="text-destructive -mt-3 mb-3 text-[11px]">Mínimo de 30 caracteres.</p>
        )}

        {/* Price */}
        <SectionLabel className="mb-2">{priceLabel(listing.kind, listing.category)}</SectionLabel>
        <PriceInput value={price} onChange={setPrice} ariaLabel="Preço" className="mb-3" />

        {/* Negotiable */}
        <Toggle
          checked={negotiable}
          onCheckedChange={setNegotiable}
          label="Preço negociável"
          description="Compradores poderão fazer contra-proposta"
          className="mb-5"
        />

        {/* Photos */}
        <SectionLabel className="mb-3">FOTOS · {photos.length}/8</SectionLabel>
        <div className="mb-3 grid grid-cols-3 gap-2">
          {photos.map((photo, idx) => (
            <div
              key={photo.id}
              className={cn(
                'bg-muted relative overflow-hidden rounded-[10px]',
                idx === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square',
              )}
            >
              <img src={photo.previewUrl} alt="" className="h-full w-full object-cover" />
              {idx === 0 && (
                <span className="bg-cta-bg text-cta-fg absolute left-[6px] top-[6px] rounded-[4px] px-[6px] py-[2px] font-mono text-[9px] font-medium tracking-[0.3px]">
                  PRINCIPAL
                </span>
              )}
              {photo.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="text-[10px] text-white">Enviando…</span>
                </div>
              )}
              {photo.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="px-2 text-center text-[10px] text-white">{photo.error}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                aria-label="Remover foto"
                className="absolute right-[6px] top-[6px] flex size-[22px] items-center justify-center rounded-full bg-black/70 text-white"
              >
                <Trash2 size={12} strokeWidth={2} />
              </button>
            </div>
          ))}
          {photos.length < 8 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border-border bg-muted text-muted-foreground flex aspect-square items-center justify-center rounded-[10px] border border-dashed"
            >
              <Camera size={20} strokeWidth={1.5} />
            </button>
          )}
        </div>

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

        {error && <p className="text-destructive mt-2 text-[13px]">{error}</p>}
      </div>

      <BottomCTA>
        <Button
          variant={isValid && !submitting ? 'cta' : 'cta-disabled'}
          disabled={!isValid || submitting}
          onClick={() => void handleSave()}
          className="w-full"
        >
          {submitting ? 'Salvando…' : 'Salvar alterações'}
        </Button>
      </BottomCTA>
    </div>
  )
}
