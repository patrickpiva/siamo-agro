'use client'

import { useState } from 'react'
import { Trash2 } from '@siamo/ui/icons'
import { CloseListingSheet } from '@/components/listings/close-listing-sheet'

interface ListingOwnerMenuProps {
  listingId: string
  status: string
}

/**
 * The "Mais opções" control in the listing detail header.
 *
 * Until now this button existed with no `onClick` at all, which left closing a
 * listing unreachable: `DELETE /listings/:id` worked server-side, but the only
 * UI that called it lived in a duplicate `owner-actions.tsx` that nothing
 * imported. Encerrar lives here rather than next to Pausar so a destructive,
 * irreversible action is never one stray tap away from a reversible one.
 */
export function ListingOwnerMenu({ listingId, status }: ListingOwnerMenuProps) {
  const [open, setOpen] = useState(false)

  // A CLOSED listing already 404s on this page; nothing left to close.
  const canClose = status !== 'CLOSED'

  return (
    <>
      {/* Trash, not a kebab: the sheet behind it does exactly one thing, and a
          "mais opções" affordance reads as a menu of several. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!canClose}
        aria-label="Encerrar anúncio"
        className="bg-muted flex size-[48px] items-center justify-center rounded-full disabled:opacity-50"
      >
        <Trash2 size={17} strokeWidth={1.8} />
      </button>

      <CloseListingSheet listingId={listingId} open={open} onOpenChange={setOpen} />
    </>
  )
}
