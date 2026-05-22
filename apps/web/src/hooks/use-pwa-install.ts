'use client'

import { useState, useEffect } from 'react'
import { dismissInstallPrompt } from '@/lib/pwa'

// BeforeInstallPromptEvent is not in the standard TS lib
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWAInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)')
    setIsInstalled(mq.matches)

    const mqHandler = (e: MediaQueryListEvent) => setIsInstalled(e.matches)
    mq.addEventListener('change', mqHandler)

    const handler = (e: Event) => {
      e.preventDefault()
      setPromptEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      mq.removeEventListener('change', mqHandler)
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  async function triggerInstall() {
    if (!promptEvent) return
    await promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    setPromptEvent(null)
  }

  function dismiss() {
    dismissInstallPrompt()
    setPromptEvent(null)
  }

  return {
    canInstall: !!promptEvent && !isInstalled,
    triggerInstall,
    dismiss,
  }
}
