'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StarRating, RatingCategoryRow } from '@agraia/ui'

interface AvaliarFormProps {
  transactionId: string
}

export function AvaliarForm({ transactionId }: AvaliarFormProps) {
  const router = useRouter()

  const [score, setScore] = useState(0)
  const [reliability, setReliability] = useState(0)
  const [communication, setCommunication] = useState(0)
  const [quality, setQuality] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (score === 0) {
      setError('Selecione uma nota geral antes de publicar.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/proxy/transactions/${transactionId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          comment: comment.trim() || undefined,
          reliability: reliability || undefined,
          communication: communication || undefined,
          quality: quality || undefined,
        }),
      })
      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } }
        setError(json?.error?.message ?? 'Erro ao enviar avaliação.')
        setSubmitting(false)
        return
      }
      router.push('/')
    } catch {
      setError('Falha ao enviar. Verifique sua conexão.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-5 px-4 pb-44 pt-2">
        {/* Main star rating — centered, large stars */}
        <StarRating value={score} onChange={setScore} size={52} />

        {/* Sub-category rows */}
        <div className="flex flex-col gap-3">
          <RatingCategoryRow label="Confiabilidade" value={reliability} onChange={setReliability} />
          <RatingCategoryRow
            label="Comunicação"
            value={communication}
            onChange={setCommunication}
          />
          <RatingCategoryRow label="Qualidade do produto" value={quality} onChange={setQuality} />
        </div>

        {/* Comment */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-muted-foreground font-mono text-[11px] tracking-[0.4px]">
              [COMENTÁRIO · OPCIONAL]
            </p>
            <span className="text-muted-foreground font-mono text-[10px]">
              {comment.length}/280
            </span>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={280}
            placeholder="Descreva sua experiência..."
            rows={4}
            className="bg-card border-border placeholder:text-muted-foreground focus:border-accent dark:focus:border-primary w-full rounded-[12px] border px-4 py-[14px] text-[13px] leading-[1.5] outline-none"
          />
        </div>

        {error && (
          <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      {/* Sticky CTA — sits above the BottomTabBar (~64 px) */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-2 pt-3">
        <button
          type="button"
          disabled={submitting || score === 0}
          onClick={() => void handleSubmit()}
          className="bg-foreground text-primary dark:bg-primary dark:text-foreground w-full rounded-[14px] py-4 text-[16px] font-semibold disabled:opacity-40"
        >
          {submitting ? 'Publicando…' : 'Publicar avaliação'}
        </button>
      </div>
    </>
  )
}
