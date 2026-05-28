'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from '@agraia/ui/icons'

interface OwnerActionsProps {
  listingId: string
  status: string
}

export function OwnerActions({ listingId, status }: OwnerActionsProps) {
  const router = useRouter()
  const [currentStatus, setCurrentStatus] = useState(status)
  const [isPending, startTransition] = useTransition()

  const isPaused = currentStatus === 'PAUSED'

  async function handlePauseResume() {
    const action = isPaused ? 'resume' : 'pause'

    // Optimistic toggle
    setCurrentStatus(isPaused ? 'ACTIVE' : 'PAUSED')

    startTransition(async () => {
      try {
        const res = await fetch(`/api/proxy/listings/${listingId}/${action}`, {
          method: 'POST',
          credentials: 'include',
        })
        if (!res.ok) {
          // Revert on API error
          setCurrentStatus(isPaused ? 'PAUSED' : 'ACTIVE')
          return
        }
        // Refresh server components (OwnerBanner status label, etc.)
        router.refresh()
      } catch {
        // Revert on network error
        setCurrentStatus(isPaused ? 'PAUSED' : 'ACTIVE')
      }
    })
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => void handlePauseResume()}
        className="bg-card border-border flex min-w-0 flex-[1] items-center justify-center rounded-[12px] border py-[13px] text-[13px] font-medium disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 size={15} className="animate-spin" />
        ) : isPaused ? (
          'Retomar'
        ) : (
          'Pausar'
        )}
      </button>
      <Link
        href={`/anuncio/${listingId}/propostas`}
        className="bg-cta-bg text-cta-fg flex min-w-0 flex-[2] items-center justify-center rounded-[12px] py-[13px] text-[15px] font-medium"
      >
        Ver todas as propostas
      </Link>
    </div>
  )
}
