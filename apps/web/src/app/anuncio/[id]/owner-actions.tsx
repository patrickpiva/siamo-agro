'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface OwnerActionsProps {
  listingId: string
  status: string
}

export function OwnerActions({ listingId, status }: OwnerActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handlePause() {
    setLoading('pause')
    await fetch(`/api/listings/${listingId}/pause`, { method: 'POST' })
    router.refresh()
    setLoading(null)
  }

  async function handleClose() {
    if (!confirm('Encerrar este anúncio? Esta ação não pode ser desfeita.')) return
    setLoading('close')
    await fetch(`/api/listings/${listingId}`, { method: 'DELETE' })
    router.push('/')
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/anuncio/${listingId}/editar`}
        className="border-border hover:bg-muted rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
      >
        Editar
      </Link>
      <button
        type="button"
        onClick={() => void handlePause()}
        disabled={loading !== null}
        className="border-border hover:bg-muted rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {status === 'PAUSED' ? 'Reativar' : 'Pausar'}
      </button>
      <button
        type="button"
        onClick={() => void handleClose()}
        disabled={loading !== null}
        className="border-destructive text-destructive hover:bg-destructive/10 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
      >
        Encerrar
      </button>
    </div>
  )
}
