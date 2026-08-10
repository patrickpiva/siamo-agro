import Link from 'next/link'
import { Button, BottomCTA } from '@siamo/ui'
import { Check, Plus, Search, User, ChevronRight } from '@siamo/ui/icons'
import { StatusBar } from '@/components/layout/status-bar'

const NEXT_STEPS = [
  {
    icon: <Plus size={22} strokeWidth={1.8} />,
    title: 'Publicar meu primeiro anúncio',
    description: 'Ofereça produção, serviços ou equipamentos',
    href: '/anuncio/novo' as const,
  },
  {
    icon: <Search size={22} strokeWidth={1.8} />,
    title: 'Explorar anúncios próximos',
    description: 'Veja o que produtores da sua região oferecem',
    href: '/' as const,
  },
  {
    icon: <User size={22} strokeWidth={1.8} />,
    title: 'Completar meu perfil',
    description: 'Aumente sua reputação adicionando mais detalhes',
    href: '/perfil' as const,
  },
]

interface PageProps {
  searchParams: Promise<{ nome?: string }>
}

export default async function CadastroProntoPage({ searchParams }: PageProps) {
  const { nome } = await searchParams
  const firstName = nome ? decodeURIComponent(nome) : null

  return (
    <main className="bg-background mx-auto flex min-h-screen max-w-[430px] flex-col">
      <StatusBar />

      <div className="flex-1 px-5">
        {/* Check circle */}
        <div className="bg-primary-subtle border-accent-forest dark:border-accent-lime mx-auto mb-8 mt-12 flex h-28 w-28 items-center justify-center rounded-full border-2">
          <Check size={52} strokeWidth={2} className="text-accent-forest dark:text-accent-lime" />
        </div>

        {/* Title */}
        <h1 className="mb-3 text-center text-[28px] font-semibold leading-tight tracking-[-0.5px]">
          {firstName ? (
            <>
              Bem-vindo,{' '}
              <span className="text-accent-forest dark:text-accent-lime">{firstName}</span>
            </>
          ) : (
            'Bem-vindo ao AgraIA'
          )}
        </h1>

        {/* Subtitle */}
        <p className="text-fg-secondary mb-8 text-center text-sm leading-relaxed">
          Seu cadastro foi criado com sucesso. Por onde quer começar?
        </p>

        {/* Next steps */}
        <div className="flex flex-col gap-3">
          {NEXT_STEPS.map((step) => (
            <Link
              key={step.href}
              href={step.href}
              className="rounded-card bg-bg-surface border-border hover:bg-bg-elevated flex items-center gap-4 border p-4 transition-colors"
            >
              <div className="bg-primary-subtle dark:bg-accent-lime/10 text-accent-forest dark:text-accent-lime flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[14px]">
                {step.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-[15px] font-semibold leading-tight">{step.title}</p>
                <p className="text-muted-foreground text-[13px] leading-snug">{step.description}</p>
              </div>
              <ChevronRight
                size={18}
                strokeWidth={1.8}
                className="text-muted-foreground flex-shrink-0"
              />
            </Link>
          ))}
        </div>
      </div>

      <BottomCTA>
        <Button variant="cta" asChild>
          <Link href="/">Explorar AgraIA</Link>
        </Button>
      </BottomCTA>
    </main>
  )
}
