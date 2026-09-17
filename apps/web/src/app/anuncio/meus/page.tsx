import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getServerSession } from '@/lib/server-auth'
import { fetchMyListings } from '@/lib/api'
import { ScreenHeader } from '@/components/layout/screen-header'
import { MyListingsView } from '@/components/listings/my-listings-view'

export const metadata: Metadata = { title: 'Meus anúncios' }

const STATUS_MAP: Record<string, string | undefined> = {
  active: 'ACTIVE',
  paused: 'PAUSED',
  closed: 'CLOSED',
}

export default async function MyListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const [session, { status: rawStatus }] = await Promise.all([getServerSession(), searchParams])

  if (!session) redirect('/entrar')

  const statusFilter = rawStatus ? STATUS_MAP[rawStatus] : undefined
  const { data: listings } = await fetchMyListings({ status: statusFilter })

  const activeTab = rawStatus && STATUS_MAP[rawStatus] ? rawStatus : 'all'

  return (
    <div className="bg-background flex min-h-screen flex-col pb-24">
      {/* Header */}
      <ScreenHeader backHref="/meu-perfil" title="Meus anúncios" />

      {/* Count summary */}
      <p className="text-fg-secondary px-4 pb-1 text-[12px]">
        {listings.length === 0
          ? 'Nenhum anúncio'
          : `${listings.length} anúncio${listings.length === 1 ? '' : 's'}`}
        {statusFilter
          ? ` ${rawStatus === 'active' ? 'ativo' : rawStatus === 'paused' ? 'pausado' : 'encerrado'}${listings.length === 1 ? '' : 's'}`
          : ''}
      </p>

      <MyListingsView listings={listings} activeTab={activeTab} />
    </div>
  )
}
