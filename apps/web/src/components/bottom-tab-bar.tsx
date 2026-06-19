'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Plus, MessageCircle, User } from '@agraia/ui/icons'
import { cn } from '@agraia/ui'

const TABS = [
  { href: '/', label: 'INÍCIO', Icon: Home },
  { href: '/explorar', label: 'EXPLORAR', Icon: Search },
  { href: '/anuncio/novo', label: 'PUBLICAR', Icon: Plus, cta: true },
  { href: '/transacoes', label: 'NEGÓCIOS', Icon: MessageCircle },
  { href: '/meu-perfil', label: 'PERFIL', Icon: User },
] as const

export function BottomTabBar({ authenticated = false }: { authenticated?: boolean }) {
  const pathname = usePathname()

  const isHidden =
    // Home (/) mostra a nav só para autenticado; landing pública não.
    (pathname === '/' && !authenticated) ||
    pathname.startsWith('/entrar') ||
    pathname.startsWith('/cadastro') ||
    pathname.startsWith('/anuncio/') ||
    pathname.includes('/proposta') ||
    pathname.startsWith('/transacao') ||
    // Public profile pages — own profile lives at /meu-perfil; /perfil/[id] is a focused view
    pathname.startsWith('/perfil/')

  if (isHidden) return null

  return (
    <nav
      className={cn(
        'bg-background/95 border-border fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur',
        'pb-[env(safe-area-inset-bottom,0px)]',
      )}
      aria-label="Navegação principal"
      role="navigation"
    >
      <ul className="flex h-[64px] items-stretch">
        {TABS.map(({ href, label, Icon, ...rest }) => {
          const isCta = 'cta' in rest && rest.cta

          // PUBLICAR: botão elevado (lime/preto invertido), sem label — igual ao wireframe
          if (isCta) {
            return (
              <li key={href} className="flex flex-1 items-center justify-center">
                <Link
                  href={href}
                  aria-label={label}
                  className="bg-cta-bg text-cta-fg -mt-2 flex size-11 items-center justify-center rounded-[14px]"
                >
                  <Icon size={24} strokeWidth={2.5} />
                </Link>
              </li>
            )
          }

          const isActive =
            href === '/'
              ? pathname === '/'
              : href === '/meu-perfil'
                ? pathname === '/meu-perfil' || pathname.startsWith('/meu-perfil/')
                : pathname.startsWith(href)

          return (
            <li key={href} className="flex flex-1 items-stretch">
              <Link
                href={href}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-1 transition-colors',
                  isActive
                    ? 'text-accent dark:text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon size={20} strokeWidth={1.8} />
                <span className="font-mono text-[9px] leading-none tracking-[0.3px]">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
