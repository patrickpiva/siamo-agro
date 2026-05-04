import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'AgroLink',
    template: '%s | AgroLink',
  },
  description: 'Conectando produtores rurais e prestadores de serviço no agronegócio brasileiro',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
