import type { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Entrar',
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background min-h-svh">
      {/* Logo */}
      <header className="flex items-center px-6 py-4">
        <span className="text-foreground font-mono text-xl font-bold tracking-tight">
          Agro<span className="text-primary">Link</span>
        </span>
      </header>

      {children}
    </div>
  )
}
