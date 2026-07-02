import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Bell, Search } from '@agraia/ui/icons'
import { getServerSession } from '@/lib/server-auth'
import { prisma } from '@agraia/db'
import { FeedTabs, type FeedTab } from '@/components/feed/feed-tabs'
import { FeedList } from '@/components/feed-list'
import { ListingCardSkeleton } from '@agraia/ui'

export const metadata: Metadata = { title: 'Explorar — AgraIA' }

interface ExplorarPageProps {
  searchParams: Promise<{
    tab?: string
    kind?: string
    category?: string
    minPrice?: string
    maxPrice?: string
    search?: string
    intent?: string
  }>
}

function formatDate(): string {
  return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()
}

export default async function ExplorarPage({ searchParams }: ExplorarPageProps) {
  const [params, session] = await Promise.all([searchParams, getServerSession()])

  // intent vem das escolhas da Home: buy → navegar ofertas; jobs → demandas (prestador)
  const kindFromIntent = params.intent === 'jobs' ? 'DEMAND' : undefined
  const activeTab = (params.tab ?? (params.intent ? 'recent' : 'matches')) as FeedTab
  const filters = {
    kind: params.kind ?? kindFromIntent,
    category: params.category,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    search: params.search,
  }

  let unreadCount = 0
  if (session) {
    unreadCount = await prisma.notification.count({
      where: { userId: session.userId, read: false },
    })
  }

  return (
    <div className="bg-background flex min-h-screen flex-col pb-[80px]">
      <header className="px-5 pb-0 pt-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground font-mono text-[11px]">
              [EXPLORAR · {formatDate()}]
            </p>
            <p className="text-[22px] font-medium">Oportunidades perto</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/notificacoes"
              aria-label="Notificações"
              className="bg-muted relative flex size-12 items-center justify-center rounded-full"
            >
              <Bell size={18} strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span className="border-background absolute right-[9px] top-[9px] size-2 rounded-full border-2 bg-red-500" />
              )}
            </Link>
            <Link
              href="/busca"
              aria-label="Buscar"
              className="bg-muted flex size-12 items-center justify-center rounded-full"
            >
              <Search size={18} strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </header>

      <Suspense fallback={null}>
        <FeedTabs activeTab={activeTab} />
      </Suspense>

      <main className="flex-1 pt-1">
        <Suspense
          fallback={
            <div className="space-y-3 px-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <FeedList filters={filters} activeTab={activeTab} />
        </Suspense>
      </main>
    </div>
  )
}
