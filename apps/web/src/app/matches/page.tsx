import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Route } from 'next'
import { getServerSession } from '@/lib/server-auth'
import { getUserActiveListings } from '@/lib/server-listings'
import { MatchesPageClient } from './matches-page-client'

export const metadata: Metadata = { title: 'Meus Matches — AgroLink' }

export default async function MatchesPage() {
  const session = await getServerSession()
  if (!session) redirect('/auth/login' as Route)

  const listings = await getUserActiveListings(session.userId)

  if (listings.length === 0) {
    return (
      <div className="bg-background min-h-screen">
        <header className="bg-background/95 border-border sticky top-0 z-20 border-b px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <Link href="/feed" className="text-muted-foreground hover:text-foreground text-sm">
              ← Feed
            </Link>
            <span className="font-semibold">Meus Matches</span>
          </div>
        </header>
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <span className="text-6xl">🌾</span>
          <p className="text-xl font-semibold">Nenhum anúncio ativo</p>
          <p className="text-muted-foreground max-w-xs text-sm">
            Crie um anúncio para começar a receber matches com outros produtores.
          </p>
          <Link
            href="/anuncio/novo"
            className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium"
          >
            Criar anúncio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background/95 border-border sticky top-0 z-20 border-b px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link href="/feed" className="text-muted-foreground hover:text-foreground text-sm">
            ← Feed
          </Link>
          <span className="font-semibold">Meus Matches</span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <MatchesPageClient listings={listings} />
      </div>
    </div>
  )
}
