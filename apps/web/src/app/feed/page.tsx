import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ListingCardSkeleton } from '@agrolink/ui'
import { FeedFilters } from '@/components/feed-filters'
import { FeedList } from '@/components/feed-list'
import { MatchesCarousel } from '@/components/matches-carousel'
import { getServerSession } from '@/lib/server-auth'
import { getUserActiveListings } from '@/lib/server-listings'

export const metadata: Metadata = { title: 'Feed de anúncios' }

interface FeedPageProps {
  searchParams: Promise<{
    kind?: string
    category?: string
    minPrice?: string
    maxPrice?: string
    search?: string
  }>
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const [filters, session] = await Promise.all([searchParams, getServerSession()])
  const userListings = session ? await getUserActiveListings(session.userId) : []

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-background/95 border-border sticky top-0 z-20 border-b px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <span className="text-lg font-bold">AgroLink</span>
          <Link
            href="/anuncio/novo"
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium"
          >
            + Anunciar
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        {/* Sidebar filters — desktop */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <Suspense fallback={<div className="bg-muted h-64 animate-pulse rounded-xl" />}>
            <FeedFilters initialFilters={filters} />
          </Suspense>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* Mobile filter strip */}
          <div className="lg:hidden">
            <Suspense fallback={null}>
              <FeedFilters initialFilters={filters} mobile />
            </Suspense>
          </div>

          {/* Matches carousel — only for authenticated users with active listings */}
          {userListings.length > 0 && <MatchesCarousel listings={userListings} />}

          {/* Listings */}
          <Suspense
            fallback={
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ListingCardSkeleton key={i} />
                ))}
              </div>
            }
          >
            <FeedList filters={filters} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
