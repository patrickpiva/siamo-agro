'use client'

import { useRef } from 'react'
import { Send, WifiOff } from 'lucide-react'
import { cn } from './lib/utils'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled?: boolean
  /** When true: shows offline notice and queues messages instead of sending directly */
  isOffline?: boolean
  maxLength?: number
  className?: string
}

export function ChatInput({
  onSend,
  disabled,
  isOffline,
  maxLength = 1000,
  className,
}: ChatInputProps) {
  const ref = useRef<HTMLInputElement>(null)

  function send() {
    const el = ref.current
    if (!el) return
    const text = el.value.trim()
    if (!text || disabled) return
    onSend(text)
    el.value = ''
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className={cn('border-border bg-card border-t', className)}>
      {isOffline && (
        <div className="offline-queue-notice flex items-center gap-[8px] px-4 py-[8px]">
          <WifiOff size={14} aria-hidden />
          <span className="text-[12px]">Mensagens enviadas serão entregues ao reconectar</span>
        </div>
      )}
      <div className="flex items-center gap-[10px] px-4 py-[10px]">
        <input
          ref={ref}
          type="text"
          disabled={disabled}
          maxLength={maxLength}
          onKeyDown={handleKeyDown}
          placeholder="Mensagem..."
          aria-label="Mensagem"
          style={{ paddingLeft: 20, paddingRight: 16 }}
          className={cn(
            'bg-muted h-10 flex-1 rounded-full text-[14px] outline-none',
            'placeholder:text-muted-foreground',
            disabled && 'opacity-50',
          )}
        />
        <button
          type="button"
          onClick={send}
          disabled={disabled}
          aria-label="Enviar mensagem"
          className={cn(
            'flex size-[40px] shrink-0 items-center justify-center rounded-full transition-opacity',
            'bg-foreground text-primary dark:bg-primary dark:text-foreground',
            disabled && 'opacity-40',
          )}
        >
          <Send size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
