'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Sparkles, CirclePlus, User } from 'lucide-react'
import { cn } from '@agrolink/ui'

const TABS = [
  { href: '/feed', label: 'Início', Icon: Home, cta: false },
  { href: '/matches', label: 'Matches', Icon: Sparkles, cta: false },
  { href: '/anuncio/novo', label: 'Anunciar', Icon: CirclePlus, cta: true },
  { href: '/meu-perfil', label: 'Perfil', Icon: User, cta: false },
] as const

export function BottomTabBar() {
  const pathname = usePathname()

  // Hide on auth/onboarding pages, listing wizard, and edit routes
  const isHidden =
    pathname === '/' ||
    pathname.startsWith('/entrar') ||
    pathname.startsWith('/cadastro') ||
    pathname === '/anuncio/novo' ||
    pathname.includes('/editar')

  if (isHidden) return null

  return (
    <nav
      className={cn(
        'bg-background/95 border-border fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur',
        'lg:hidden', // desktop has its own nav in the feed header
        // iOS safe area
        'pb-[env(safe-area-inset-bottom,0px)]',
      )}
      aria-label="Navegação principal"
    >
      <ul className="flex h-16 items-stretch">
        {TABS.map(({ href, label, Icon, cta }) => {
          const isActive =
            href === '/feed'
              ? pathname === '/feed' || pathname === '/'
              : href === '/meu-perfil'
                ? pathname.startsWith('/meu-perfil') || pathname.startsWith('/perfil')
                : pathname.startsWith(href)

          if (cta) {
            return (
              <li key={href} className="flex flex-1 items-center justify-center">
                <Link
                  href={href}
                  aria-label={label}
                  className={cn(
                    'bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-transform active:scale-95',
                  )}
                >
                  <Icon size={26} strokeWidth={1.75} />
                </Link>
              </li>
            )
          }

          return (
            <li key={href} className="flex flex-1 items-stretch">
              <Link
                href={href}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-1 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon size={22} strokeWidth={isActive ? 2 : 1.75} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
