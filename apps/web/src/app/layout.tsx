import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Providers } from './providers'
import { BottomTabBar } from '@/components/bottom-tab-bar'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '700'],
})

export const metadata: Metadata = {
  title: {
    default: 'AgroLink',
    template: '%s | AgroLink',
  },
  description: 'Conectando produtores rurais e prestadores de serviço no agronegócio brasileiro',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <Providers>
          {/* Bottom padding on mobile so content clears the fixed tab bar */}
          <div className="lg:contents [&>*]:pb-20 lg:[&>*]:pb-0">{children}</div>
          <BottomTabBar />
        </Providers>
      </body>
    </html>
  )
}
