'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus } from '@agrolink/ui/icons'
import { FilterTabs, FAB, type FilterTab } from '@agrolink/ui'
import { MyListingCard } from '@/components/listings/my-listing-card'
import type { Listing } from '@/lib/api'

type StatusTab = 'all' | 'active' | 'paused' | 'closed'

const TABS: FilterTab<StatusTab>[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'paused', label: 'Pausados' },
  { value: 'closed', label: 'Encerrados' },
]

interface MyListingsViewProps {
  listings: Listing[]
  activeTab: string
}

export function MyListingsView({ listings, activeTab }: MyListingsViewProps) {
  const router = useRouter()

  function handleTabChange(value: StatusTab) {
    if (value === 'all') {
      router.push('/anuncio/meus')
    } else {
      router.push(`/anuncio/meus?status=${value}`)
    }
  }

  return (
    <>
      {/* Filter tabs */}
      <FilterTabs
        tabs={TABS}
        value={activeTab as StatusTab}
        onChange={handleTabChange}
        className="pt-1"
      />

      {/* Listing list */}
      {listings.length === 0 ? (
        <div className="flex flex-col items-center px-5 pt-12 text-center">
          <div className="bg-muted text-muted-foreground mb-4 flex size-16 items-center justify-center rounded-full">
            <Plus size={28} strokeWidth={1.5} />
          </div>
          <p className="mb-1 text-[16px] font-medium">Nenhum anúncio aqui</p>
          <p className="text-fg-secondary mb-6 max-w-xs text-[13px] leading-relaxed">
            Crie seu primeiro anúncio para começar a receber propostas.
          </p>
          <Link
            href="/anuncio/novo"
            className="bg-cta-bg text-cta-fg rounded-[12px] px-6 py-[13px] text-[14px] font-medium"
          >
            Criar anúncio
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-4">
          {listings.map((listing) => (
            <Link key={listing.id} href={`/anuncio/${listing.id}`} className="block">
              <MyListingCard
                listing={listing}
                onMore={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              />
            </Link>
          ))}
        </div>
      )}

      {/* FAB */}
      <FAB aria-label="Criar novo anúncio" onClick={() => router.push('/anuncio/novo')}>
        <Plus size={24} strokeWidth={2} />
      </FAB>
    </>
  )
}
