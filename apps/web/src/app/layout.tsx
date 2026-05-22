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
        <Providers>
          {/* Bottom padding on mobile so content clears the fixed tab bar */}
          <div className="lg:contents [&>*]:pb-20 lg:[&>*]:pb-0">{children}</div>
          <BottomTabBar />
        </Providers>
      </body>
    </html>
  )
}
