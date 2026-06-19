import Link from 'next/link'
import type { Route } from 'next'
import { MessageCircle, ChevronRight } from '@agraia/ui/icons'

/** Card de ajuda (WhatsApp) exibido no primeiro acesso. */
export function HelpCard({ href = '/ajuda' }: { href?: Route }) {
  return (
    <Link
      href={href}
      className="mx-4 mb-[18px] mt-[14px] flex items-center gap-3 rounded-[16px] border border-[rgba(22,163,74,0.18)] bg-[rgba(22,163,74,0.05)] px-4 py-[14px] dark:border-[rgba(34,197,94,0.18)] dark:bg-[rgba(34,197,94,0.06)]"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-[rgba(22,163,74,0.1)] text-[#16A34A] dark:bg-[rgba(34,197,94,0.12)] dark:text-[#22C55E]">
        <MessageCircle size={20} strokeWidth={1.8} />
      </div>
      <div className="flex-1">
        <p className="text-[14px] font-medium">Precisa de ajuda?</p>
        <p className="text-muted-foreground text-[12px]">Fale com a gente pelo WhatsApp</p>
      </div>
      <ChevronRight
        size={18}
        strokeWidth={2}
        className="shrink-0 text-[#16A34A] dark:text-[#22C55E]"
      />
    </Link>
  )
}
