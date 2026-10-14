'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from '@siamo/ui/icons'
import * as Dialog from '@radix-ui/react-dialog'
import { useQueryClient } from '@tanstack/react-query'
import { logoutAction } from '@/actions/auth'
import { clearUserDeviceData } from '@/lib/device-data'

export function LogoutButton() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleLogout() {
    setIsPending(true)
    // Session cookies are httpOnly: only the server can drop them, so this goes
    // through the server action (which also revokes the refresh token in the API).
    // The previous client-side document.cookie sweep was a no-op — the user stayed
    // logged in and the refresh token was never revoked.
    try {
      await logoutAction()
    } catch {
      // The action clears the cookies even on API failure; a transport error here
      // must not leave the sheet stuck on "Saindo…".
    }
    // Cookies only end the session on the server. The pages, API responses and
    // queued messages this user left on a possibly shared phone go here.
    await clearUserDeviceData()
    queryClient.clear()
    setOpen(false)
    router.replace('/')
    // Drops the RSC cache so nothing rendered for the old session survives.
    router.refresh()
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="bg-destructive/10 text-destructive flex w-full items-center justify-center gap-2 rounded-[14px] py-[15px] text-[15px] font-medium"
        >
          <LogOut size={18} strokeWidth={1.8} />
          Sair da conta
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          className="bg-card fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] p-6 pb-8 shadow-xl"
          aria-describedby="logout-desc"
        >
          <Dialog.Title className="mb-2 text-[17px] font-medium">Sair da conta?</Dialog.Title>
          <Dialog.Description id="logout-desc" className="text-muted-foreground mb-6 text-[14px]">
            Você precisará fazer login novamente para acessar o Siamo.
          </Dialog.Description>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground w-full rounded-[12px] py-[14px] text-[15px] font-medium disabled:opacity-60"
            >
              {isPending ? 'Saindo…' : 'Sair da conta'}
            </button>
            <Dialog.Close asChild>
              <button
                type="button"
                className="bg-muted text-foreground w-full rounded-[12px] py-[14px] text-[15px] font-medium"
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
