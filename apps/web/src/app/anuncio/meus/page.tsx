import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from '@siamo/ui/icons'
import { getServerSession } from '@/lib/server-auth'
import { fetchMyListings } from '@/lib/api'
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
      <div className="flex items-center gap-3 px-4 py-3">
        <Link
          href="/"
          aria-label="Voltar"
          className="bg-muted flex size-9 flex-shrink-0 items-center justify-center rounded-full"
        >
          <ArrowLeft size={18} strokeWidth={1.8} />
        </Link>
        <h1 className="text-[18px] font-medium">Meus anúncios</h1>
      </div>

      {/* Count summary */}
      <p className="text-fg-secondary px-5 pb-3 text-[12px]">
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
