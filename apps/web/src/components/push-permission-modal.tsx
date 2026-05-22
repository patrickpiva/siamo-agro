'use client'

import { useEffect, useRef } from 'react'
import { Bell, Send, Star, CheckCircle } from 'lucide-react'
import { usePushPermission } from '@/hooks/use-push-permission'
import { cn } from '@agrolink/ui'

interface PushPermissionModalProps {
  onClose: () => void
}

const EXAMPLES = [
  {
    icon: <Send size={16} strokeWidth={2} />,
    iconClass: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    title: 'Nova proposta recebida',
    detail: 'Celso Aguiar fez uma oferta de R$ 1.750/saca',
  },
  {
    icon: <Star size={16} strokeWidth={2} className="fill-current" />,
    iconClass: 'bg-primary-subtle text-accent dark:text-primary',
    title: 'Match encontrado',
    detail: '3 demandas por café perto de você',
  },
  {
    icon: <CheckCircle size={16} strokeWidth={2} />,
    iconClass: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400',
    title: 'Transação concluída',
    detail: 'Avalie sua experiência com Marta',
  },
]

export function PushPermissionModal({ onClose }: PushPermissionModalProps) {
  const { requestPermission } = usePushPermission()
  const firstFocusRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    firstFocusRef.current?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      // Escape → soft dismiss (same as "Agora não")
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function handleAllow() {
    await requestPermission()
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60" aria-hidden />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="push-modal-title"
        aria-describedby="push-modal-desc"
        className={cn(
          'fixed inset-x-6 top-1/2 z-50 mx-auto max-w-[380px] -translate-y-1/2',
          'bg-card border-border rounded-[24px] border px-6 pb-6 pt-8',
          'shadow-[0_20px_40px_rgba(0,0,0,0.25)]',
        )}
      >
        {/* Bell ring */}
        <div className="push-icon-ring mx-auto mb-5 flex size-[80px] items-center justify-center rounded-full">
          <Bell size={36} strokeWidth={1.5} />
        </div>

        <p id="push-modal-title" className="mb-[10px] text-center text-[20px] font-medium">
          Ative as notificações
        </p>
        <p
          id="push-modal-desc"
          className="text-muted-foreground mb-6 text-center text-[13px] leading-[1.6]"
        >
          Receba alertas imediatos sobre o que importa para o seu negócio
        </p>

        {/* Examples */}
        <div className="push-examples-bg mb-6 flex flex-col gap-[10px] rounded-[12px] p-[14px]">
          {EXAMPLES.map((ex) => (
            <div key={ex.title} className="flex items-start gap-[10px]">
              <div
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-[8px]',
                  ex.iconClass,
                )}
              >
                {ex.icon}
              </div>
              <p className="text-muted-foreground text-[12px] leading-[1.4]">
                <strong className="text-foreground font-medium">{ex.title}</strong>
                {' · '}
                {ex.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-[10px]">
          <button
            ref={firstFocusRef}
            type="button"
            onClick={() => void handleAllow()}
            className="bg-cta-bg text-cta-fg w-full rounded-[12px] py-[15px] text-[15px] font-medium transition-opacity active:opacity-80"
          >
            Permitir notificações
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground min-h-0 w-full py-3 text-[14px] transition-opacity active:opacity-70"
          >
            Agora não
          </button>
        </div>
      </div>
    </>
  )
}
