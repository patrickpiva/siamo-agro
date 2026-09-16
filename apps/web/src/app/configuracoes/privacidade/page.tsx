'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Eye, Trash2 } from '@siamo/ui/icons'
import { SettingsGroup, ConsentRow, PrivacyActionCard } from '@siamo/ui'
import { ScreenHeader } from '@/components/layout/screen-header'
import * as Dialog from '@radix-ui/react-dialog'

interface Consents {
  termsAcceptedAt: string | null
  privacyAcceptedAt: string | null
  marketingOptIn: boolean
  marketingOptInAt: string | null
}

export default function PrivacidadePage() {
  const router = useRouter()
  const [consents, setConsents] = useState<Consents | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetch('/api/proxy/me/consents', { credentials: 'include' })
      .then((r) => r.json())
      .then((json: { data: { consents: Consents } }) => setConsents(json.data.consents))
      .catch(() => {})
  }, [])

  async function handleMarketingToggle(v: boolean) {
    setConsents((prev) => (prev ? { ...prev, marketingOptIn: v } : prev))
    await fetch('/api/proxy/me/consents', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketingOptIn: v }),
    })
  }

  async function handleDataExport() {
    await fetch('/api/proxy/me/data-export', { method: 'POST', credentials: 'include' })
    setExportOpen(true)
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'EXCLUIR') return
    setIsDeleting(true)
    try {
      await fetch('/api/proxy/me', { method: 'DELETE', credentials: 'include' })
      // Clear cookies and redirect
      document.cookie.split(';').forEach((c) => {
        const key = c.split('=')[0]?.trim()
        if (key) document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      })
      router.push('/')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="bg-background min-h-screen pb-[80px]">
      <ScreenHeader backHref="/configuracoes" title="Privacidade e LGPD" />

      {/* Consents */}
      <SettingsGroup label="CONSENTIMENTOS ATIVOS">
        <div className="px-4">
          <ConsentRow
            title="Termos de uso"
            description="Aceite dos termos de uso da plataforma"
            acceptedAt={consents?.termsAcceptedAt}
            revocable={false}
          />
          <ConsentRow
            title="Política de privacidade"
            description="Aceite da política de tratamento de dados"
            acceptedAt={consents?.privacyAcceptedAt}
            revocable={false}
          />
          <ConsentRow
            title="Comunicações de marketing"
            description="Dicas, tendências e novidades do Siamo por WhatsApp"
            acceptedAt={consents?.marketingOptInAt}
            revocable
            currentValue={consents?.marketingOptIn ?? false}
            onToggle={(v) => void handleMarketingToggle(v)}
          />
        </div>
      </SettingsGroup>

      {/* Seus dados */}
      <div className="mb-2">
        <p className="text-muted-foreground px-5 pb-2 pt-3 font-mono text-[11px] tracking-[0.4px]">
          SEUS DADOS
        </p>
        <div className="space-y-2 px-4">
          <PrivacyActionCard
            icon={<Download size={20} strokeWidth={1.8} />}
            title="Exportar meus dados"
            description="Receba um arquivo com todos os seus dados pessoais em até 15 dias úteis."
            actionLabel="Solicitar exportação"
            onAction={() => void handleDataExport()}
          />
          <PrivacyActionCard
            icon={<Eye size={20} strokeWidth={1.8} />}
            title="Visibilidade do perfil"
            description="Controle quais informações ficam visíveis para outros usuários."
            actionLabel="Gerenciar visibilidade"
            onAction={() => {}}
          />
        </div>
      </div>

      {/* Danger zone */}
      <div className="mb-2">
        <p className="text-muted-foreground px-5 pb-2 pt-3 font-mono text-[11px] tracking-[0.4px]">
          ZONA DE PERIGO
        </p>
        <div className="px-4">
          <PrivacyActionCard
            icon={<Trash2 size={20} strokeWidth={1.8} />}
            title="Excluir minha conta"
            description="Seus dados serão removidos permanentemente em até 30 dias conforme a LGPD."
            actionLabel="Excluir conta"
            onAction={() => setDeleteOpen(true)}
            variant="danger"
          />
        </div>
      </div>

      {/* Export confirmation dialog */}
      <Dialog.Root open={exportOpen} onOpenChange={setExportOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content
            className="bg-card fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] p-6 pb-8"
            aria-describedby="export-desc"
          >
            <Dialog.Title className="mb-2 text-[17px] font-medium">
              Solicitação enviada
            </Dialog.Title>
            <Dialog.Description id="export-desc" className="text-muted-foreground mb-6 text-[14px]">
              Você receberá um e-mail com seus dados em até 15 dias úteis, conforme previsto no Art.
              19 da LGPD.
            </Dialog.Description>
            <Dialog.Close asChild>
              <button
                type="button"
                className="bg-cta-bg text-cta-fg w-full rounded-[12px] py-[14px] text-[15px] font-medium"
              >
                Entendido
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete confirmation dialog */}
      <Dialog.Root
        open={deleteOpen}
        onOpenChange={(v) => {
          setDeleteOpen(v)
          if (!v) setDeleteConfirm('')
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content
            className="bg-card fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] p-6 pb-8"
            aria-describedby="delete-desc"
          >
            <Dialog.Title className="text-destructive mb-2 text-[17px] font-medium">
              Excluir conta permanentemente?
            </Dialog.Title>
            <Dialog.Description id="delete-desc" className="text-muted-foreground mb-2 text-[13px]">
              Ao excluir, todos os seus dados serão removidos em até 30 dias conforme a LGPD.
            </Dialog.Description>
            <p className="text-muted-foreground mb-4 text-[13px]">
              Anúncios ativos e transações em andamento serão encerrados.
            </p>

            <label className="text-muted-foreground mb-2 block font-mono text-[11px] tracking-[0.4px]">
              DIGITE "EXCLUIR" PARA CONFIRMAR
            </label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value.toUpperCase())}
              aria-required="true"
              placeholder="EXCLUIR"
              className="bg-muted border-border text-foreground focus:border-destructive mb-4 w-full rounded-[12px] border px-4 py-[12px] font-mono text-[14px] outline-none"
            />

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => void handleDeleteAccount()}
                disabled={deleteConfirm !== 'EXCLUIR' || isDeleting}
                className="bg-destructive text-destructive-foreground w-full rounded-[12px] py-[14px] text-[15px] font-medium disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo…' : 'Excluir minha conta'}
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
    </div>
  )
}
