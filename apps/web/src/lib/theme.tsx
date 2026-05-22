'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'dark' | 'light' | 'system'
export type FontSize = 'small' | 'normal' | 'large'

const FONT_SCALE: Record<FontSize, string> = {
  small: '14px',
  normal: '16px',
  large: '18px',
}

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  resolvedTheme: 'dark' | 'light'
  fontSize: FontSize
  setFontSize: (s: FontSize) => void
  reduceMotion: boolean
  setReduceMotion: (v: boolean) => void
  highContrast: boolean
  setHighContrast: (v: boolean) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
  resolvedTheme: 'dark',
  fontSize: 'normal',
  setFontSize: () => {},
  reduceMotion: false,
  setReduceMotion: () => {},
  highContrast: false,
  setHighContrast: () => {},
})

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme
  const html = document.documentElement
  if (resolved === 'dark') {
    html.classList.add('dark')
    html.classList.remove('light')
  } else {
    html.classList.add('light')
    html.classList.remove('dark')
  }
  return resolved
}

function applyFontSize(size: FontSize) {
  document.documentElement.style.setProperty('font-size', FONT_SCALE[size])
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark')
  const [fontSize, setFontSizeState] = useState<FontSize>('normal')
  const [reduceMotion, setReduceMotionState] = useState(false)
  const [highContrast, setHighContrastState] = useState(false)

  // Load persisted preferences on mount
  useEffect(() => {
    const saved = (localStorage.getItem('theme') ?? 'dark') as Theme
    const savedFont = (localStorage.getItem('font-size') ?? 'normal') as FontSize
    const savedMotion = localStorage.getItem('reduce-motion') === 'true'
    const savedContrast = localStorage.getItem('high-contrast') === 'true'

    setThemeState(saved)
    setFontSizeState(savedFont)
    setReduceMotionState(savedMotion)
    setHighContrastState(savedContrast)

    const resolved = applyTheme(saved)
    setResolvedTheme(resolved)
    applyFontSize(savedFont)

    if (savedMotion) document.documentElement.classList.add('reduce-motion')
    if (savedContrast) document.documentElement.classList.add('high-contrast')
  }, [])

  // System theme change listener
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setResolvedTheme(applyTheme('system'))
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  function setTheme(t: Theme) {
    setThemeState(t)
    localStorage.setItem('theme', t)
    setResolvedTheme(applyTheme(t))
  }

  function setFontSize(s: FontSize) {
    setFontSizeState(s)
    localStorage.setItem('font-size', s)
    applyFontSize(s)
  }

  function setReduceMotion(v: boolean) {
    setReduceMotionState(v)
    localStorage.setItem('reduce-motion', String(v))
    document.documentElement.classList.toggle('reduce-motion', v)
  }

  function setHighContrast(v: boolean) {
    setHighContrastState(v)
    localStorage.setItem('high-contrast', String(v))
    document.documentElement.classList.toggle('high-contrast', v)
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme,
        fontSize,
        setFontSize,
        reduceMotion,
        setReduceMotion,
        highContrast,
        setHighContrast,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
