import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button, BottomCTA } from '@agraia/ui'
import { WhatsAppLogo } from '@agraia/ui/icons'
import { StatusBar } from '@/components/layout/status-bar'
import { getServerSession } from '@/lib/server-auth'
import { getHomeData } from '@/lib/home'
import { HomeScreen } from '@/components/home/home-screen'

export default async function RootPage() {
  const session = await getServerSession()

  // Autenticado: Home v2 (pergunta única). Sem perfil ainda → onboarding.
  if (session) {
    const data = await getHomeData(session.userId)
    if (!data) redirect('/cadastro/perfil')
    return <HomeScreen data={data} />
  }

  // Não autenticado: landing pública.
  return <Landing />
}

function Landing() {
  return (
    <main className="bg-background mx-auto flex min-h-screen max-w-[430px] flex-col">
      <StatusBar />

      {/* Logo */}
      <div className="px-6 pt-14 text-center">
        <span className="text-accent-forest dark:text-accent-lime font-mono text-2xl font-medium tracking-[-0.5px]">
          [AgraIA]
        </span>
      </div>

      {/* Hero + headline */}
      <div className="flex flex-1 flex-col justify-center px-6 pb-4">
        <HeroIllustration />

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
          <Link href="/sobre">Saiba mais sobre o AgraIA</Link>
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

      {/* Nó topo — CoffeeBean */}
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
        <path d="M4.05 19.95a11.24 8.585 135 0 0 15.9-15.9 11.24 8.585 135 0 0-15.9 15.9" />
        <path d="M19.8 4.2C20 14 4 10 4.2 19.8" />
      </g>

      {/* Nó esq — Farm */}
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
        <path d="M22 12H2l2-6 8-4 8 4Z" />
        <rect x="10" y="8" width="4" height="4" />
        <path d="m7 22 10-10v10L7 12Z" />
        <path d="M21 12v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8" />
      </g>

      {/* Nó dir — Tractor */}
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
        <path d="m10 11 11 .9a1 1 0 0 1 .8 1.1l-.665 4.158a1 1 0 0 1-.988.842H20" />
        <path d="M16 18h-5" />
        <path d="M18 5a1 1 0 0 0-1 1v5.573" />
        <path d="M3 4h8.129a1 1 0 0 1 .99.863L13 11.246" />
        <path d="M4 11V4" />
        <path d="M7 15h.01" />
        <path d="M8 10.1V4" />
        <circle cx="18" cy="18" r="2" />
        <circle cx="7" cy="15" r="5" />
      </g>
    </svg>
  )
}
