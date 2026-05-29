import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Providers } from './providers'
import { BottomTabBar } from '@/components/bottom-tab-bar'
import { OfflineBanner } from '@/components/offline-banner'
import { SplashScreen } from '@/components/splash-screen'
import { Analytics } from '@vercel/analytics/next'
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
    default: 'AgraIA',
    template: '%s | AgraIA',
  },
  description: 'Conectando produtores rurais e prestadores de serviço no agronegócio brasileiro',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AgraIA',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        {/* Apply saved theme before first paint to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'dark';var r=t==='system'?(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):t;document.documentElement.classList.toggle('dark',r==='dark');document.documentElement.classList.toggle('light',r==='light');var f=localStorage.getItem('font-size');if(f==='small')document.documentElement.style.fontSize='14px';else if(f==='large')document.documentElement.style.fontSize='18px';if(localStorage.getItem('reduce-motion')==='true')document.documentElement.classList.add('reduce-motion');if(localStorage.getItem('high-contrast')==='true')document.documentElement.classList.add('high-contrast');}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable}`}>
        {/* Splash — hidden in browser; visible via @media (display-mode: standalone) */}
        <div id="agraia-splash" aria-hidden="true">
          <span
            style={{ color: '#c6e845', fontFamily: 'monospace', fontSize: '22px', fontWeight: 500 }}
          >
            [AgraIA]
          </span>
          <div className="splash-spinner" />
        </div>
        <SplashScreen />
        <Providers>
          {/* Offline banner sits above all page content, below status bar */}
          <OfflineBanner />
          {/* Bottom padding on mobile so content clears the fixed tab bar */}
          <div className="lg:contents [&>*]:pb-20 lg:[&>*]:pb-0">{children}</div>
          <BottomTabBar />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
