'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProgressIndicator, BottomCTA, Button, KindBadge } from '@agraia/ui'
import { ReviewCard } from '@/components/listings/review-card'
import { WizardHeader } from '@/components/listings/wizard-header'
import { useListingDraftStore } from '@/stores/listing-draft'
import { getUserLocation } from '@/actions/profile'
import { route } from '@/lib/route'

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

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

export default function WizardStep5() {
  const router = useRouter()
  const {
    kind,
    category,
    title,
    description,
    price,
    priceUnit,
    negotiable,
    photos,
    isEditMode,
    editListingId,
    reset,
  } = useListingDraftStore()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<{ city: string; state: string } | null>(null)

  useEffect(() => {
    if (!submitting && (!kind || !category || !title)) router.replace('/anuncio/novo')
  }, [kind, category, title, router, submitting])

  useEffect(() => {
    getUserLocation()
      .then(setLocation)
      .catch(() => null)
  }, [])

  function handleClose() {
    if (!window.confirm('Descartar anúncio? Seu rascunho será perdido.')) return
    reset()
    router.push('/feed')
  }

  async function handlePublish() {
    setSubmitting(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        kind,
        category,
        title,
        description,
        negotiable,
        photoUrls: photos.map((p) => p.remoteUrl).filter(Boolean),
      }
      if (price !== null) body['price'] = price / 100

      const url = isEditMode && editListingId ? `/api/listings/${editListingId}` : '/api/listings'
      const method = isEditMode ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } }
        throw new Error(json.error?.message ?? 'Erro ao publicar.')
      }

      const json = (await res.json()) as { data: { id: string } }
      reset()

      if (isEditMode) {
        router.push(route(`/anuncio/${json.data.id}`))
      } else {
        router.push(`/anuncio/novo/sucesso?id=${json.data.id}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado. Tente novamente.')
      setSubmitting(false)
    }
  }

  if (!kind || !category) return null

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <WizardHeader
        title="Revisar"
        onBack={() => router.push('/anuncio/novo/fotos')}
        onClose={handleClose}
      />
      <ProgressIndicator current={5} total={5} />

      <div className="flex-1 overflow-y-auto px-5 pb-4 pt-1">
        <p className="text-fg-secondary mb-4 text-[13px] leading-relaxed">
          Confira antes de publicar. Você pode editar qualquer informação.
        </p>

        {/* Tipo e categoria */}
        <ReviewCard label="[TIPO E CATEGORIA]" className="mb-[10px]">
          <div className="flex items-center gap-2">
            <KindBadge kind={kind} />
            <span>{CATEGORY_LABELS[category] ?? category}</span>
          </div>
        </ReviewCard>

        {/* Título e descrição */}
        <ReviewCard label="[TÍTULO E DESCRIÇÃO]" className="mb-[10px]">
          <strong className="block text-[15px] font-semibold leading-snug">{title}</strong>
          <p className="text-muted-foreground mt-1.5 line-clamp-2 text-[12px] leading-relaxed">
            {description}
          </p>
        </ReviewCard>

        {/* Preço */}
        <ReviewCard label="[PREÇO]" className="mb-[10px]">
          <span className="text-accent font-mono text-[18px] font-medium">
            {price ? formatBRL(price) : '—'}
          </span>
          {priceUnit && (
            <span className="text-muted-foreground ml-1 text-[11px]">/ {priceUnit}</span>
          )}
          {negotiable && (
            <span className="text-muted-foreground ml-1 text-[11px]">· Negociável</span>
          )}
        </ReviewCard>

        {/* Fotos */}
        <ReviewCard label={`[FOTOS · ${photos.length}]`} className="mb-[10px]">
          <div className="flex flex-wrap gap-[6px]">
            {photos.slice(0, 4).map((p) => (
              <img
                key={p.id}
                src={p.remoteUrl ?? p.previewUrl}
                alt=""
                className="border-border size-[50px] rounded-[6px] border object-cover"
              />
            ))}
          </div>
        </ReviewCard>

        {/* Localização */}
        <ReviewCard label="[LOCALIZAÇÃO]" className="mb-[10px]">
          <p className="text-fg-secondary text-[12px]">
            {location ? `${location.city}, ${location.state} · do seu perfil` : 'Do seu perfil'}
          </p>
        </ReviewCard>

        {error && <p className="text-destructive mt-2 text-[13px]">{error}</p>}
      </div>

      <BottomCTA>
        <Button
          variant={submitting ? 'cta-disabled' : 'cta'}
          disabled={submitting}
          onClick={() => void handlePublish()}
          className="w-full"
        >
          {submitting ? 'Publicando…' : isEditMode ? 'Salvar alterações' : 'Publicar anúncio'}
        </Button>
      </BottomCTA>
    </div>
  )
}
