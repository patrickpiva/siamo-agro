'use client'

import { ChevronDown } from '@agraia/ui/icons'

interface PendingAnchorProps {
  label: string
  /** id da seção-alvo abaixo da dobra para o scroll suave. */
  targetId: string
}

/**
 * Badge âmbar (não verde — não compete com as escolhas) que ancora a pendência
 * abaixo da dobra. Mitiga o risco da Direção B: pendência que o usuário não rola.
 * O pulse respeita prefers-reduced-motion (ver `.home-anchor-pulse` em globals.css).
 */
export function PendingAnchor({ label, targetId }: PendingAnchorProps) {
  return (
    <button
      type="button"
      onClick={() =>
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      aria-label={`Ir para: ${label}`}
      className="mx-4 mt-5 flex items-center gap-[11px] rounded-[14px] border border-[rgba(217,119,6,0.25)] bg-[rgba(217,119,6,0.08)] px-4 py-[13px] text-left dark:border-[rgba(234,179,8,0.28)] dark:bg-[rgba(234,179,8,0.1)]"
    >
      <span className="home-anchor-pulse size-[9px] shrink-0 rounded-full bg-[#D97706] dark:bg-[#EAB308]" />
      <span className="flex-1 text-[13px] font-medium text-[#92400E] dark:text-[#EAB308]">
        {label}
      </span>
      <ChevronDown
        size={18}
        strokeWidth={2.2}
        className="shrink-0 text-[#92400E] dark:text-[#EAB308]"
      />
    </button>
  )
}
