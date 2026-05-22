const VISITS_KEY = 'agrolink:visits'
const DISMISSED_KEY = 'agrolink:pwa-dismissed-at'
const DISMISS_TTL_MS = 7 * 24 * 3600 * 1000 // 7 days

export function recordVisit(): void {
  if (typeof window === 'undefined') return
  const visits = parseInt(localStorage.getItem(VISITS_KEY) ?? '0', 10)
  localStorage.setItem(VISITS_KEY, String(visits + 1))
}

export function shouldShowInstallPrompt(): boolean {
  if (typeof window === 'undefined') return false

  const isInstalled = window.matchMedia('(display-mode: standalone)').matches
  if (isInstalled) return false

  const visits = parseInt(localStorage.getItem(VISITS_KEY) ?? '0', 10)
  if (visits < 3) return false

  const dismissedAt = localStorage.getItem(DISMISSED_KEY)
  if (dismissedAt) {
    const elapsed = Date.now() - parseInt(dismissedAt, 10)
    if (elapsed < DISMISS_TTL_MS) return false
  }

  return true
}

export function dismissInstallPrompt(): void {
  localStorage.setItem(DISMISSED_KEY, String(Date.now()))
}
