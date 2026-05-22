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
  const ref = useRef<HTMLTextAreaElement>(null)

  function autoResize() {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 80)}px`
  }

  function send() {
    const el = ref.current
    if (!el) return
    const text = el.value.trim()
    if (!text || disabled) return
    onSend(text)
    el.value = ''
    el.style.height = 'auto'
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
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
      <div className="flex items-end gap-[10px] px-4 py-[10px]">
        <textarea
          ref={ref}
          disabled={disabled}
          maxLength={maxLength}
          onInput={autoResize}
          onKeyDown={handleKeyDown}
          placeholder="Mensagem..."
          aria-label="Mensagem"
          aria-keyshortcuts="Enter"
          rows={1}
          className={cn(
            'bg-muted flex-1 resize-none rounded-[20px] px-[14px] py-[10px] text-[14px] leading-[1.4] outline-none',
            'border-border border',
            'placeholder:text-muted-foreground',
            'max-h-[80px] min-h-[40px]',
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
