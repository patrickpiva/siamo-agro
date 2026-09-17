'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus } from '@siamo/ui/icons'
import { FilterTabs, type FilterTab } from '@siamo/ui'
import { MyListingCard } from '@/components/listings/my-listing-card'
import { CloseListingSheet } from '@/components/listings/close-listing-sheet'
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
  // Which listing the "mais opções" sheet is open for. One sheet for the whole
  // list rather than one per card.
  const [closingId, setClosingId] = useState<string | null>(null)

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
      {/* No className override: the component's own px-4/pt-3 is what matches
          the pills on /explorar. */}
      <FilterTabs tabs={TABS} value={activeTab as StatusTab} onChange={handleTabChange} />

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
                onCloseListing={(e) => {
                  // The card is wrapped in a Link — without these the tap would
                  // navigate to the detail page instead of opening the sheet.
                  e.preventDefault()
                  e.stopPropagation()
                  // Already closed: nothing left to encerrar.
                  if (listing.status !== 'CLOSED') setClosingId(listing.id)
                }}
              />
            </Link>
          ))}
        </div>
      )}

      {closingId && (
        <CloseListingSheet
          listingId={closingId}
          open
          onOpenChange={(next) => {
            if (!next) setClosingId(null)
          }}
          // Stay on the list and let the server components re-render, rather
          // than navigating away from a page the user is working through.
          onClosed={() => setClosingId(null)}
        />
      )}

      {/* No FAB here: the tab bar's PUBLICAR button already covers "novo anúncio"
          on this route, and duplicating it puts two primary actions on screen. */}
    </>
  )
}
