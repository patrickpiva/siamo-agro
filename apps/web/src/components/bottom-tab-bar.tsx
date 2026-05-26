'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Plus, MessageCircle, User } from '@agrolink/ui/icons'
import { cn } from '@agrolink/ui'

const TABS = [
  { href: '/feed', label: 'FEED', Icon: Home },
  { href: '/busca', label: 'BUSCA', Icon: Search },
  { href: '/anuncio/novo', label: 'PUBLICAR', Icon: Plus, cta: true },
  { href: '/transacoes', label: 'NEGÓCIOS', Icon: MessageCircle },
  { href: '/perfil', label: 'PERFIL', Icon: User },
] as const

export function BottomTabBar() {
  const pathname = usePathname()

  const isHidden =
    pathname === '/' ||
    pathname.startsWith('/entrar') ||
    pathname.startsWith('/cadastro') ||
    pathname.startsWith('/anuncio/') ||
    pathname.includes('/proposta') ||
    pathname.startsWith('/transacao')

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
          const isActive =
            href === '/feed'
              ? pathname === '/feed'
              : href === '/perfil'
                ? pathname.startsWith('/perfil')
                : href === '/busca'
                  ? pathname.startsWith('/busca')
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
                <Icon size={isCta ? 24 : 20} strokeWidth={1.8} />
                <span className="font-mono text-[9px] leading-none tracking-[0.3px]">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
