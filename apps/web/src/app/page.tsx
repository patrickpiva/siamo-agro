import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button, BottomCTA } from '@agrolink/ui'
import { WhatsAppLogo } from '@agrolink/ui/icons'
import { StatusBar } from '@/components/layout/status-bar'
import { getServerSession } from '@/lib/server-auth'

export default async function LandingPage() {
  const session = await getServerSession()
  if (session) redirect('/feed')
  return (
    <main className="bg-background mx-auto flex min-h-screen max-w-[430px] flex-col">
      <StatusBar />

      {/* Logo */}
      <div className="px-6 pt-14 text-center">
        <span className="text-accent-forest dark:text-accent-lime font-mono text-2xl font-medium tracking-[-0.5px]">
          [AgroLink]
        </span>
      </div>

      {/* Hero + headline */}
      <div className="flex flex-1 flex-col justify-center px-6 pb-4">
        {/* Ilustração */}
        <HeroIllustration />

        {/* Headline */}
        <h1 className="mb-3 text-[30px] font-medium leading-[1.15] tracking-[-0.5px]">
          Conecte-se a{' '}
          <em className="text-accent-forest dark:text-accent-lime font-mono not-italic">
            quem planta
          </em>
          , encontre{' '}
          <em className="text-accent-forest dark:text-accent-lime font-mono not-italic">
            quem colhe
          </em>
          .
        </h1>
        <p className="text-fg-secondary text-sm leading-relaxed">
          Marketplace inteligente para o agronegócio brasileiro. Produtores, prestadores e
          cooperativas em um só lugar.
        </p>
      </div>

      {/* CTAs */}
      <BottomCTA borderless>
        <Button variant="cta" icon={<WhatsAppLogo size={18} />} asChild>
          <Link href="/entrar">Entrar com WhatsApp</Link>
        </Button>
        <Button variant="ghost-muted" asChild>
          <Link href="/sobre">Saiba mais sobre o AgroLink</Link>
        </Button>
      </BottomCTA>
    </main>
  )
}

function HeroIllustration() {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto mb-8" aria-hidden="true">
      {/* Círculo de fundo — primary-subtle (light) / bg-surface (dark) */}
      <circle
        cx="100"
        cy="100"
        r="96"
        className="fill-primary-subtle dark:fill-bg-surface stroke-accent-lime/30"
        strokeWidth="0.5"
      />

      {/* Linhas de conexão tracejadas — accent-forest (light) / accent-lime (dark) */}
      <line
        x1="100"
        y1="56"
        x2="56"
        y2="138"
        className="stroke-accent-forest/50 dark:stroke-accent-lime/35"
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      <line
        x1="100"
        y1="56"
        x2="144"
        y2="138"
        className="stroke-accent-forest/50 dark:stroke-accent-lime/35"
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      <line
        x1="56"
        y1="138"
        x2="144"
        y2="138"
        className="stroke-accent-forest/50 dark:stroke-accent-lime/35"
        strokeWidth="1"
        strokeDasharray="2 3"
      />

      {/* Nó topo — CoffeeBean: white bg (light) / lime-tint (dark) */}
      <circle
        cx="100"
        cy="56"
        r="26"
        className="dark:fill-accent-lime/12 stroke-accent-forest/50 dark:stroke-accent-lime/50 fill-white"
        strokeWidth="0.5"
      />
      <g
        transform="translate(88 44)"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-accent-forest dark:text-accent-lime"
      >
        <ellipse cx="12" cy="12" rx="5" ry="8.5" />
        <path d="M12 4c-1.2 3-1.2 13 0 16" />
      </g>

      {/* Nó esq — Tractor */}
      <circle
        cx="56"
        cy="138"
        r="26"
        className="dark:fill-accent-lime/12 stroke-accent-forest/50 dark:stroke-accent-lime/50 fill-white"
        strokeWidth="0.5"
      />
      <g
        transform="translate(44 126)"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-accent-forest dark:text-accent-lime"
      >
        <circle cx="7" cy="17" r="3" />
        <circle cx="7" cy="17" r="0.8" fill="currentColor" stroke="none" />
        <circle cx="17" cy="17" r="2.2" />
        <circle cx="17" cy="17" r="0.6" fill="currentColor" stroke="none" />
        <path d="M2 14h4V9h5l3 5h5v3" />
        <path d="M11 9V6h2v3" />
      </g>

      {/* Nó dir — Cattle */}
      <circle
        cx="144"
        cy="138"
        r="26"
        className="dark:fill-accent-lime/12 stroke-accent-forest/50 dark:stroke-accent-lime/50 fill-white"
        strokeWidth="0.5"
      />
      <g
        transform="translate(132 126)"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-accent-forest dark:text-accent-lime"
      >
        <path d="M5 8c0-2 1-3 3-3l1.5 2.5L12 6l2.5 1.5L16 5c2 0 3 1 3 3v3c0 4-3 7-7 7s-7-3-7-7V8z" />
        <circle cx="9.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="14.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
        <path d="M10.5 15.5c.4.6 1 1 1.5 1s1.1-.4 1.5-1" />
      </g>
    </svg>
  )
}
