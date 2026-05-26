'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from '@agraia/ui/icons'
import * as Dialog from '@radix-ui/react-dialog'

export function LogoutButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleLogout() {
    setIsPending(true)
    try {
      await fetch('/api/proxy/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: '' }),
      })
    } catch {
      // Best-effort logout
    }
    // Clear all client state and redirect
    document.cookie.split(';').forEach((c) => {
      const key = c.split('=')[0]?.trim()
      if (key) document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    })
    router.push('/')
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
            Você precisará fazer login novamente para acessar o AgraIA.
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
