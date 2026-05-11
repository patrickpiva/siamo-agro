'use client'

import { useState } from 'react'
import { ImageUpload, type ImageItem } from '@/components/image-upload'
import { uploadImages } from '@/lib/upload'
import { useWizardStore } from './use-wizard-store'

export function StepMedia() {
  const { kind, price, setMedia, setStep } = useWizardStore()

  const [localPrice, setLocalPrice] = useState(price)
  const [imageItems, setImageItems] = useState<ImageItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const priceRequired = kind !== 'DEMAND'
  const isValid = !priceRequired || localPrice === '' || Number(localPrice.replace(',', '.')) > 0

  async function handleNext() {
    if (!isValid || uploading) return
    setUploading(true)
    setUploadError(null)
    try {
      const pendingFiles = imageItems
        .filter((i) => i.status === 'pending' && i.file)
        .map((i) => i.file)

      let photoUrls: string[] = imageItems
        .filter((i) => i.status === 'done' && i.url)
        .map((i) => i.url!)

      if (pendingFiles.length > 0) {
        const uploaded = await uploadImages(pendingFiles, 'listing', '')
        photoUrls = [...photoUrls, ...uploaded]
      }

      setMedia({ price: localPrice, photoUrls })
      setStep(4)
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Erro ao fazer upload das imagens.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Preço e fotos</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Adicione o preço e fotos para atrair mais interessados.
        </p>
      </div>

      {/* Price */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="price">
          Preço (R$)
          {!priceRequired && (
            <span className="text-muted-foreground ml-1">— opcional para Demanda</span>
          )}
        </label>
        <input
          id="price"
          type="number"
          min="0"
          step="0.01"
          value={localPrice}
          onChange={(e) => setLocalPrice(e.target.value)}
          placeholder="0,00"
          className="border-border bg-background focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
        />
      </div>

      {/* Photos */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium">Fotos (até 8)</p>
        <ImageUpload maxImages={8} onChange={setImageItems} disabled={uploading} />
      </div>

      {uploadError && <p className="text-destructive text-sm">{uploadError}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => setStep(2)}
          disabled={uploading}
          className="border-border hover:bg-muted flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={() => void handleNext()}
          disabled={!isValid || uploading}
          className="bg-primary text-primary-foreground flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity disabled:opacity-50"
        >
          {uploading ? 'Enviando fotos…' : 'Continuar'}
        </button>
      </div>
    </div>
  )
}
