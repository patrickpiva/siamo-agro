'use client'

import { useEffect } from 'react'

export function SplashScreen() {
  useEffect(() => {
    const el = document.getElementById('agraia-splash')
    if (!el) return
    el.setAttribute('data-dismissed', '')
    const t = setTimeout(() => el.remove(), 350)
    return () => clearTimeout(t)
  }, [])
  return null
}
