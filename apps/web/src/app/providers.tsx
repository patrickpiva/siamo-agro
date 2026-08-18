'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/lib/theme'
import { PWAInstallSheet } from '@/components/pwa-install-sheet'
import { PushPermissionModal } from '@/components/push-permission-modal'
import { usePWAInstall } from '@/hooks/use-pwa-install'
import { usePushPermission } from '@/hooks/use-push-permission'
import { shouldShowInstallPrompt, recordVisit } from '@/lib/pwa'

// ─── PWA install controller ───────────────────────────────────────────────────

function PWAInstallController() {
  const { canInstall, triggerInstall, dismiss } = usePWAInstall()
  const [showSheet, setShowSheet] = useState(false)

  useEffect(() => {
    recordVisit()
    if (canInstall && shouldShowInstallPrompt()) {
      setShowSheet(true)
    }
  }, [canInstall])

  if (!showSheet) return null
  return (
    <PWAInstallSheet
      onClose={() => setShowSheet(false)}
      onInstall={triggerInstall}
      onDismiss={dismiss}
    />
  )
}

// ─── Push permission controller ──────────────────────────────────────────────

function PushPermissionController() {
  const { shouldShowModal, dismissModal } = usePushPermission()

  if (!shouldShowModal) return null
  return <PushPermissionModal onClose={dismissModal} />
}

// ─── Providers ────────────────────────────────────────────────────────────────

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      }),
  )

  // Invalidate feed queries when the device reconnects
  useEffect(() => {
    function handleReconnected() {
      void queryClient.invalidateQueries({ queryKey: ['listings'] })
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
    window.addEventListener('siamo:reconnected', handleReconnected)
    return () => window.removeEventListener('siamo:reconnected', handleReconnected)
  }, [queryClient])

  const pathname = usePathname()
  // Skip PWA/push controllers during the signup funnel: they register listeners
  // and effects on mount, and prompting a brand-new user mid-onboarding is poor UX.
  const inOnboarding =
    pathname === '/' || pathname.startsWith('/entrar') || pathname.startsWith('/cadastro')

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
        {!inOnboarding && <PWAInstallController />}
        {!inOnboarding && <PushPermissionController />}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
