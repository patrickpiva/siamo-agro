'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MobileNavBarProps {
  title?: string
}

export function MobileNavBar({ title }: MobileNavBarProps) {
  const router = useRouter()
  // Forward is only meaningful after the user has navigated back at least once
  const [wentBack, setWentBack] = useState(false)
  const canGoBack = typeof window !== 'undefined' && window.history.length > 1

  function handleBack() {
    setWentBack(true)
    router.back()
  }

  function handleForward() {
    window.history.forward()
    // After going forward once, if we're at the tip again, hide the button
    setWentBack(false)
  }

  return (
    <header className="bg-background/95 border-border sticky top-0 z-20 flex h-12 items-center gap-1 border-b px-1 backdrop-blur">
      {/* Back */}
      <button
        type="button"
        onClick={handleBack}
        disabled={!canGoBack}
        aria-label="Voltar"
        className="text-foreground hover:bg-muted disabled:text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft size={22} strokeWidth={2.5} />
      </button>

      {/* Title */}
      <span className="min-w-0 flex-1 truncate px-1 text-center text-sm font-semibold">
        {title}
      </span>

      {/* Forward — only rendered after user went back */}
      {wentBack ? (
        <button
          type="button"
          onClick={handleForward}
          aria-label="Avançar"
          className="text-foreground hover:bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors"
        >
          <ChevronRight size={22} strokeWidth={2.5} />
        </button>
      ) : (
        // Spacer to keep title centered when forward button is hidden
        <span className="h-10 w-10 shrink-0" aria-hidden />
      )}
    </header>
  )
}
