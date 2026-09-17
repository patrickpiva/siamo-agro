'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { AlertCircle } from '@siamo/ui/icons'
import { route } from '@/lib/route'

interface CloseListingSheetProps {
  listingId: string
  /** Controlled open state. */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Where to go after a successful close. The detail page 404s on CLOSED. */
  redirectTo?: string
  /** Called after the API confirms, instead of navigating. */
  onClosed?: () => void
}

/**
 * Confirmation sheet for closing (encerrando) a listing.
 *
 * `DELETE /listings/:id` is a soft delete — it sets `status = 'CLOSED'`, keeping
 * the row, its photos and any transactions. The listing leaves the feed and its
 * detail page starts returning 404, and there is deliberately no way back: the
 * API's `resume()` would flip it to ACTIVE, but reopening a closed listing is
 * not a product affordance. Hence the one-way warning.
 */
export function CloseListingSheet({
  listingId,
  open,
  onOpenChange,
  redirectTo,
  onClosed,
}: CloseListingSheetProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClose() {
    setIsPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/proxy/listings/${listingId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: { message?: string }
        }
        setError(body.error?.message ?? 'Não foi possível encerrar o anúncio.')
        setIsPending(false)
        return
      }

      onOpenChange(false)

      if (onClosed) {
        onClosed()
      } else {
        // replace, not push: the detail page now 404s, so it must not stay in
        // the back stack.
        router.replace(route(redirectTo ?? '/anuncio/meus'))
      }
      router.refresh()
    } catch {
      setError('Sem conexão. Verifique sua internet e tente novamente.')
      setIsPending(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          className="bg-card fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] p-6 pb-8 shadow-xl"
          aria-describedby="close-listing-desc"
        >
          <Dialog.Title className="mb-2 text-[17px] font-medium">Encerrar anúncio?</Dialog.Title>
          <Dialog.Description id="close-listing-desc" className="text-muted-foreground text-[14px]">
            O anúncio sai do feed e deixa de receber propostas.
          </Dialog.Description>

          <div className="border-destructive/30 bg-destructive/10 mt-4 flex items-start gap-2 rounded-[10px] border px-3 py-2.5">
            <AlertCircle size={15} strokeWidth={2} className="text-destructive mt-0.5 shrink-0" />
            <p className="text-destructive text-[13px] leading-snug">
              Esta ação não pode ser desfeita. Para tirar o anúncio do ar temporariamente, use
              Pausar.
            </p>
          </div>

          {error && <p className="text-destructive mt-3 text-[13px]">{error}</p>}

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => void handleClose()}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground w-full rounded-[12px] py-[14px] text-[15px] font-medium disabled:opacity-60"
            >
              {isPending ? 'Encerrando…' : 'Encerrar anúncio'}
            </button>
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={isPending}
                className="bg-muted text-foreground w-full rounded-[12px] py-[14px] text-[15px] font-medium disabled:opacity-60"
              >
                Cancelar
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
