'use client'

import { useState } from 'react'
import { CATEGORIES } from '@agraia/shared'
import { useWizardStore } from './use-wizard-store'
import type { ListingKindKey } from '@agraia/shared'

export function StepDetails() {
  const { kind, category, title, description, setDetails, setStep } = useWizardStore()

  const [localCategory, setLocalCategory] = useState(category)
  const [localTitle, setLocalTitle] = useState(title)
  const [localDescription, setLocalDescription] = useState(description)

  const categories =
    kind in CATEGORIES
      ? Object.entries(CATEGORIES[kind as ListingKindKey] as Record<string, string>)
      : []

  const isValid = localCategory !== '' && localTitle.length >= 10 && localDescription.length >= 30

  function handleNext() {
    if (!isValid) return
    setDetails({ category: localCategory, title: localTitle, description: localDescription })
    setStep(3)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Detalhes do anúncio</h2>
        <p className="text-muted-foreground mt-1 text-sm">Preencha as informações principais.</p>
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="category">
          Categoria
        </label>
        <select
          id="category"
          value={localCategory}
          onChange={(e) => setLocalCategory(e.target.value)}
          className="border-border bg-background focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
        >
          <option value="">Selecione uma categoria</option>
          {categories.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="title">
          Título <span className="text-muted-foreground">({localTitle.length}/120)</span>
        </label>
        <input
          id="title"
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value.slice(0, 120))}
          placeholder="Ex: Soja em grão — safra 2024, disponível em caminhão"
          className="border-border bg-background focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
        />
        {localTitle.length > 0 && localTitle.length < 10 && (
          <p className="text-destructive text-xs">Mínimo de 10 caracteres.</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="description">
          Descrição <span className="text-muted-foreground">({localDescription.length}/2000)</span>
        </label>
        <textarea
          id="description"
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value.slice(0, 2000))}
          placeholder="Descreva os detalhes do produto, condições, quantidade disponível..."
          rows={5}
          className="border-border bg-background focus:ring-primary w-full resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
        />
        {localDescription.length > 0 && localDescription.length < 30 && (
          <p className="text-destructive text-xs">Mínimo de 30 caracteres.</p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="border-border hover:bg-muted flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!isValid}
          className="bg-primary text-primary-foreground flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
