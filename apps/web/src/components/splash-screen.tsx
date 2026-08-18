'use client'

import { useEffect } from 'react'

export function SplashScreen() {
  useEffect(() => {
    const el = document.getElementById('siamo-splash')
    if (!el) return
    sessionStorage.setItem('siamo:launched', '1')
    el.setAttribute('data-dismissed', '')
    // Don't remove — React's fiber still references this node after SSR hydration.
    // Setting display:none after the fade keeps the DOM intact and React happy.
    const t = setTimeout(() => {
      el.style.display = 'none'
    }, 350)
    return () => clearTimeout(t)
  }, [])
  return null
}
