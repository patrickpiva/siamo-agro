'use client'

import { useState, useEffect } from 'react'

const SESSION_KEY = 'agrolink:session-count'
const DISMISSED_KEY = 'agrolink:push-dismissed-at'
const DENIED_KEY = 'agrolink:push-denied-at'
const SOFT_TTL_MS = 7 * 24 * 3600 * 1000 // 7 days
const HARD_TTL_MS = 30 * 24 * 3600 * 1000 // 30 days

function recordSession(): number {
  const count = parseInt(localStorage.getItem(SESSION_KEY) ?? '0', 10) + 1
  localStorage.setItem(SESSION_KEY, String(count))
  return count
}

function shouldShow(): boolean {
  if (typeof window === 'undefined') return false
  if (Notification.permission === 'granted') return false
  if (Notification.permission === 'denied') return false

  const deniedAt = localStorage.getItem(DENIED_KEY)
  if (deniedAt && Date.now() - parseInt(deniedAt, 10) < HARD_TTL_MS) return false

  const dismissedAt = localStorage.getItem(DISMISSED_KEY)
  if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < SOFT_TTL_MS) return false

  const sessions = parseInt(localStorage.getItem(SESSION_KEY) ?? '0', 10)
  return sessions >= 3
}

export function usePushPermission() {
  const [shouldShowModal, setShouldShowModal] = useState(false)

  useEffect(() => {
    const sessions = recordSession()
    if (sessions >= 3) {
      setShouldShowModal(shouldShow())
    }
  }, [])

  /** Called from settings page to manually trigger the modal */
  function requestFromSettings() {
    setShouldShowModal(shouldShow())
  }

  function dismissModal() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    setShouldShowModal(false)
  }

  async function requestPermission(): Promise<NotificationPermission> {
    const permission = await Notification.requestPermission()

    if (permission === 'granted') {
      await registerPushSubscription()
    } else if (permission === 'denied') {
      localStorage.setItem(DENIED_KEY, String(Date.now()))
    }

    setShouldShowModal(false)
    return permission
  }

  return { shouldShowModal, requestPermission, dismissModal, requestFromSettings }
}

async function registerPushSubscription(): Promise<void> {
  const vapidKey = process.env['NEXT_PUBLIC_VAPID_KEY']
  if (!vapidKey) {
    console.warn('[push] NEXT_PUBLIC_VAPID_KEY not set — skipping subscription')
    return
  }

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  })

  await fetch('/api/proxy/notifications/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription.toJSON()),
  })
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}
