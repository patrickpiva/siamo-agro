'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark } from '@agrolink/ui/icons'
import { cn } from '@agrolink/ui'

interface BookmarkButtonProps {
  listingId: string
  initialSaved: boolean
  isAuthenticated: boolean
}

export function BookmarkButton({ listingId, initialSaved, isAuthenticated }: BookmarkButtonProps) {
  const router = useRouter()
  const [saved, setSaved] = useState(initialSaved)
  const [isPending, startTransition] = useTransition()

  async function handleToggle() {
    if (!isAuthenticated) {
      router.push('/entrar')
      return
    }

    // Optimistic update
    setSaved((prev) => !prev)

    startTransition(async () => {
      try {
        const res = await fetch(`/api/proxy/saved-listings/${listingId}`, {
          method: 'POST',
          credentials: 'include',
        })
        if (!res.ok) {
          // Revert on failure
          setSaved((prev) => !prev)
          return
        }
        const json = (await res.json()) as { data: { saved: boolean } }
        setSaved(json.data.saved)
        window.dispatchEvent(
          new CustomEvent('agrolink:bookmark-toggled', {
            detail: { listingId, saved: json.data.saved },
          }),
        )
      } catch {
        // Revert on error
        setSaved((prev) => !prev)
      }
    })
  }

  return (
    <button
      type="button"
      aria-label={saved ? 'Remover dos salvos' : 'Salvar anúncio'}
      aria-pressed={saved}
      onClick={() => void handleToggle()}
      disabled={isPending}
      className={cn(
        'bg-muted flex size-[48px] items-center justify-center rounded-full transition-colors',
        isPending && 'opacity-60',
      )}
    >
      <Bookmark
        size={17}
        strokeWidth={1.8}
        className={cn('transition-colors', saved ? 'text-primary fill-primary' : 'text-foreground')}
      />
    </button>
  )
}
