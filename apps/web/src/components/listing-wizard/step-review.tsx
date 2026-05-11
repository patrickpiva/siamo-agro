'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { CATEGORIES } from '@agrolink/shared'
import { useWizardStore } from './use-wizard-store'
import type { ListingKindKey } from '@agrolink/shared'

const KIND_LABELS: Record<string, string> = {
  OFFER: 'Oferta',
  DEMAND: 'Demanda',
  SERVICE: 'Serviço',
  EQUIPMENT: 'Equipamento',
}

function formatBRL(value: string): string {
  const num = parseFloat(value.replace(',', '.'))
  if (isNaN(num)) return '—'
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function StepReview() {
  const router = useRouter()
  const {
    kind,
    category,
    title,
    description,
    price,
    photoUrls,
    isEditMode,
    listingId,
    setStep,
    reset,
  } = useWizardStore()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categoryLabel =
    kind in CATEGORIES
      ? ((CATEGORIES[kind as ListingKindKey] as Record<string, string>)[category] ?? category)
      : category

  async function handlePublish() {
    setSubmitting(true)
    setError(null)
    try {
      const body = {
        kind,
        category,
        title,
        description,
        price: price ? parseFloat(price.replace(',', '.')) : null,
        photoUrls,
      }

      const url = isEditMode && listingId ? `/api/listings/${listingId}` : '/api/listings'
      const method = isEditMode ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } }
        throw new Error(json.error?.message ?? 'Erro ao publicar anúncio.')
      }

      const json = (await res.json()) as { data: { id: string } }
      reset()
      router.push(`/anuncio/${json.data.id}` as Route)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado.')
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Revisão do anúncio</h2>
        <p className="text-muted-foreground mt-1 text-sm">Confira tudo antes de publicar.</p>
      </div>

      <dl className="border-border space-y-3 rounded-xl border p-4 text-sm">
        <Row label="Tipo" value={KIND_LABELS[kind] ?? kind} />
        <Row label="Categoria" value={categoryLabel} />
        <Row label="Título" value={title} />
        <Row label="Descrição" value={description} />
        <Row label="Preço" value={price ? formatBRL(price) : 'Não informado'} />
        <Row label="Fotos" value={`${photoUrls.length} foto(s)`} />
      </dl>

      {photoUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photoUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              className="border-border h-16 w-16 rounded-lg border object-cover"
            />
          ))}
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => setStep(3)}
          disabled={submitting}
          className="border-border hover:bg-muted flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={() => void handlePublish()}
          disabled={submitting}
          className="bg-primary text-primary-foreground flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity disabled:opacity-50"
        >
          {submitting ? 'Publicando…' : isEditMode ? 'Salvar alterações' : 'Publicar anúncio'}
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="text-muted-foreground w-24 shrink-0">{label}</dt>
      <dd className="break-words font-medium">{value}</dd>
    </div>
  )
}
