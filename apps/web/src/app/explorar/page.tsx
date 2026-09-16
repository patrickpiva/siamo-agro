import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Bell } from '@siamo/ui/icons'
import { getServerSession } from '@/lib/server-auth'
import { prisma } from '@siamo/db'
import { ScreenHeader } from '@/components/layout/screen-header'
import { FeedTabs, type FeedTab } from '@/components/feed/feed-tabs'
import { FeedList } from '@/components/feed-list'
import { SearchControls } from '@/components/explorar/search-controls'
import { ListingCardSkeleton } from '@siamo/ui'

// Sem sufixo de marca: o template do layout raiz já aplica "%s | Siamo"
export const metadata: Metadata = { title: 'Explorar' }

interface ExplorarPageProps {
  searchParams: Promise<{
    tab?: string
    kind?: string
    category?: string
    badge?: string
    minPrice?: string
    maxPrice?: string
    radiusKm?: string
    minMatchScore?: string
    search?: string
    intent?: string
  }>
}

export default async function ExplorarPage({ searchParams }: ExplorarPageProps) {
  const [params, session] = await Promise.all([searchParams, getServerSession()])

  // intent vem das escolhas da Home: buy → navegar ofertas; jobs → demandas (prestador)
  const kindFromIntent = params.intent === 'jobs' ? 'DEMAND' : undefined
  // A search or filter in the URL implies the query-backed feed: the matches and
  // saved tabs come from different endpoints and would silently ignore them.
  const hasQueryParams = Boolean(
    params.search ??
    params.kind ??
    params.category ??
    params.badge ??
    params.minPrice ??
    params.maxPrice ??
    params.radiusKm ??
    params.minMatchScore,
  )
  const defaultTab = params.intent || hasQueryParams ? 'recent' : 'matches'
  const activeTab = (params.tab ?? defaultTab) as FeedTab

  const filters = {
    kind: params.kind ?? kindFromIntent,
    category: params.category,
    badge: params.badge,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    radiusKm: params.radiusKm,
    minMatchScore: params.minMatchScore,
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
      <ScreenHeader
        title="Explorar"
        right={
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
        }
      />

      {/* Search moved inline from /busca: results render in the same FeedList
          below instead of on a separate route. */}
      <Suspense fallback={null}>
        <SearchControls />
      </Suspense>

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
