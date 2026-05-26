'use client'

import { useEffect, useRef } from 'react'
import { WifiOff, Bell, Zap } from 'lucide-react'
import { usePWAInstall } from '@/hooks/use-pwa-install'
import { cn } from '@agraia/ui'

interface PWAInstallSheetProps {
  onClose: () => void
}

function PWAAppIcon() {
  return (
    <div
      className="flex size-[64px] shrink-0 items-center justify-center rounded-[18px]"
      style={{
        background: 'linear-gradient(135deg, #1F5F3F, #0f3020)',
        border: '0.5px solid rgba(198,232,69,0.25)',
      }}
    >
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#C6E845"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <ellipse cx="12" cy="12" rx="5" ry="8.5" />
        <path d="M12 4c-1.2 3-1.2 13 0 16" />
        <path d="M3 12h18" />
      </svg>
    </div>
  )
}

export function PWAInstallSheet({ onClose }: PWAInstallSheetProps) {
  const { triggerInstall, dismiss } = usePWAInstall()
  const firstFocusRef = useRef<HTMLButtonElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Focus trap + Escape to close
  useEffect(() => {
    firstFocusRef.current?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function handleInstall() {
    await triggerInstall()
    onClose()
  }

  function handleDismiss() {
    dismiss()
    onClose()
  }

  const benefits = [
    {
      icon: <WifiOff size={18} strokeWidth={1.8} />,
      text: 'Funciona offline — acesse seus dados mesmo sem internet no campo',
    },
    {
      icon: <Bell size={18} strokeWidth={1.8} />,
      text: 'Notificações instantâneas de propostas, matches e transações',
    },
    {
      icon: <Zap size={18} strokeWidth={1.8} />,
      text: 'Abre instantaneamente sem precisar do navegador',
    },
  ]

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" aria-hidden onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-sheet-title"
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[430px]',
          'bg-card border-border rounded-[24px_24px_0_0] border-t px-6 pb-8 pt-5',
        )}
      >
        {/* Handle */}
        <div className="bg-border mx-auto mb-5 h-[4px] w-9 rounded-full" aria-hidden />

        {/* App row */}
        <div className="mb-5 flex items-center gap-4">
          <PWAAppIcon />
          <div>
            <p id="pwa-sheet-title" className="text-[22px] font-medium">
              AgraIA
            </p>
            <p className="text-muted-foreground text-[13px]">Adicionar à tela inicial</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-5 flex flex-col gap-[10px]">
          {benefits.map((b) => (
            <div key={b.text} className="flex items-center gap-3">
              <div className="pwa-benefit-icon flex size-9 shrink-0 items-center justify-center rounded-[10px]">
                {b.icon}
              </div>
              <p className="text-muted-foreground text-[13px] leading-[1.4]">{b.text}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-[10px]">
          <button
            ref={firstFocusRef}
            type="button"
            onClick={() => void handleInstall()}
            className="bg-cta-bg text-cta-fg w-full rounded-[14px] py-4 text-[16px] font-semibold tracking-[-0.2px] transition-opacity active:opacity-80"
          >
            Instalar agora
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-muted-foreground min-h-0 w-full py-3 text-[14px] transition-opacity active:opacity-70"
          >
            Talvez depois
          </button>
        </div>
      </div>
    </>
  )
}
