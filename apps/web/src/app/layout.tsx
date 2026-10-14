import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Providers } from './providers'
import { getServerSession } from '@/lib/server-auth'
import { BottomTabBar } from '@/components/bottom-tab-bar'
import { OfflineBanner } from '@/components/offline-banner'
import { SessionOwnerSync } from '@/components/session-owner-sync'
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Keyboard overlays content instead of compressing the layout — native-app behaviour.
  // Fixed bottom elements (tab bar, CTAs) stay in place; browser scrolls input into view.
  interactiveWidget: 'resizes-visual',
}

export const metadata: Metadata = {
  title: {
    default: 'Siamo',
    template: '%s | Siamo',
  },
  description: 'Conectando produtores rurais e prestadores de serviço no agronegócio brasileiro',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Siamo',
  },
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Nav global precisa saber se há sessão: na home (/) ela aparece para usuário
  // logado, mas a landing pública (mesmo /) não deve mostrar a barra.
  const session = await getServerSession()
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
        {/* Splash — shown only on the very first standalone PWA launch per session */}
        <div id="siamo-splash" aria-hidden="true">
          <span
            style={{ color: '#c6e845', fontFamily: 'monospace', fontSize: '22px', fontWeight: 500 }}
          >
            [Siamo]
          </span>
          <div className="splash-spinner" />
        </div>
        {/* Inline script: runs synchronously after the div is parsed, before React hydrates.
            Shows splash only when: standalone PWA mode + first visit of this session. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=window.matchMedia('(display-mode:standalone)').matches||navigator.standalone;if(s&&!sessionStorage.getItem('siamo:launched')){var el=document.getElementById('siamo-splash');if(el)el.style.display='flex';}}catch(e){}})();`,
          }}
        />
        <SplashScreen />
        <Providers>
          {/* Wipes the previous user's cached data when the session changes hands */}
          <SessionOwnerSync userId={session?.userId ?? null} />
          {/* Offline banner sits above all page content, below status bar */}
          <OfflineBanner />
          {/* Bottom padding on mobile so content clears the fixed tab bar */}
          <div className="lg:contents [&>*]:pb-20 lg:[&>*]:pb-0">{children}</div>
          <BottomTabBar authenticated={session !== null} />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
