import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getServerSession } from '@/lib/server-auth'
import { getUserActiveListings } from '@/lib/server-listings'
import { MobileNavBar } from '@/components/mobile-nav-bar'
import { MatchesPageClient } from './matches-page-client'

export const metadata: Metadata = { title: 'Meus Matches — AgraIA' }

export default async function MatchesPage() {
  const session = await getServerSession()
  if (!session) redirect('/entrar')

  const listings = await getUserActiveListings(session.userId)

  if (listings.length === 0) {
    return (
      <div className="bg-background min-h-screen">
        <MobileNavBar title="Meus Matches" />
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <span className="text-5xl">🌾</span>
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
      <MobileNavBar title="Meus Matches" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <MatchesPageClient listings={listings} />
      </div>
    </div>
  )
}
