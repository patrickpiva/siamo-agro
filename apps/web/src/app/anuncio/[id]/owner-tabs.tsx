'use client'

import { useState } from 'react'
import { OwnerActions } from './owner-actions'
import { ListingMatchesTab } from '@/components/listing-matches-tab'

interface OwnerTabsProps {
  listingId: string
  status: string
}

type Tab = 'actions' | 'matches'

export function OwnerTabs({ listingId, status }: OwnerTabsProps) {
  const [tab, setTab] = useState<Tab>('actions')

  return (
    <div className="space-y-4">
      {/* Tab strip */}
      <div className="border-border flex gap-1 border-b">
        <button
          type="button"
          onClick={() => setTab('actions')}
          className={[
            'px-4 py-2 text-sm font-medium transition-colors',
            tab === 'actions'
              ? 'border-primary text-primary border-b-2'
              : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
        >
          Gerenciar
        </button>
        <button
          type="button"
          onClick={() => setTab('matches')}
          className={[
            'px-4 py-2 text-sm font-medium transition-colors',
            tab === 'matches'
              ? 'border-primary text-primary border-b-2'
              : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
        >
          Matches
        </button>
      </div>

      {tab === 'actions' && <OwnerActions listingId={listingId} status={status} />}
      {tab === 'matches' && <ListingMatchesTab listingId={listingId} />}
    </div>
  )
}
