import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Bell, Search } from '@agrolink/ui/icons'
import { getServerSession } from '@/lib/server-auth'
import { prisma } from '@agrolink/db'
import { FeedTabs } from '@/components/feed/feed-tabs'
import { FeedList } from '@/components/feed-list'
import { ListingCardSkeleton } from '@agrolink/ui'

export const metadata: Metadata = { title: 'Feed — AgroLink' }

type FeedTab = 'matches' | 'recent' | 'region' | 'saved'

interface FeedPageProps {
  searchParams: Promise<{
    tab?: string
    kind?: string
    category?: string
    minPrice?: string
    maxPrice?: string
    search?: string
  }>
}

function getDayGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function formatDate(): string {
  return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const [params, session] = await Promise.all([searchParams, getServerSession()])

  const activeTab = (params.tab ?? 'matches') as FeedTab
  const filters = {
    kind: params.kind,
    category: params.category,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    search: params.search,
  }

  const greeting = getDayGreeting()

  let firstName = 'Visitante'
  let unreadCount = 0
  if (session) {
    const [profile, notifCount] = await Promise.all([
      prisma.profile.findUnique({
        where: { userId: session.userId },
        select: { name: true },
      }),
      prisma.notification.count({
        where: { userId: session.userId, read: false },
      }),
    ])
    firstName = profile?.name.split(' ')[0] ?? 'Visitante'
    unreadCount = notifCount
  }

  return (
    <div className="bg-background flex min-h-screen flex-col pb-[80px]">
      {/* Header */}
      <header className="px-5 pb-0 pt-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground font-mono text-[11px]">
              [SEU FEED · {formatDate()}]
            </p>
            <p className="text-[22px] font-medium">
              {greeting}, {firstName}
            </p>
          </div>
          <div className="flex gap-2">
            {/* Bell with notification dot — links to notification center */}
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
            {/* Search shortcut */}
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

      {/* Tabs */}
      <Suspense fallback={null}>
        <FeedTabs activeTab={activeTab} />
      </Suspense>

      {/* Feed list */}
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
