'use client'

import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { ArrowLeft } from '@agraia/ui/icons'
import { cn } from '@agraia/ui'

interface BackButtonProps {
  fallbackHref?: string
  className?: string
}

/**
 * Navigates back in browser history.
 * Falls back to `fallbackHref` (default: "/feed") when there's no history entry
 * (e.g. the user opened the page directly via URL).
 */
export function BackButton({ fallbackHref = '/feed', className }: BackButtonProps) {
  const router = useRouter()

  function handleBack() {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref as Route<string>)
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Voltar"
      className={cn('bg-muted flex size-12 items-center justify-center rounded-full', className)}
    >
      <ArrowLeft size={18} strokeWidth={1.8} />
    </button>
  )
}
