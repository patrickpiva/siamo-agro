import Link from 'next/link'
import { Send, ChevronRight } from '@siamo/ui/icons'
import type { PendingProposal } from '@/lib/home-state'

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function timeAgo(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (h < 1) return 'agora'
  if (h < 24) return `há ${h}h`
  return `há ${Math.floor(h / 24)}d`
}

/** Card detalhado da proposta a responder (alvo da PendingAnchor). */
export function PendingCard({ proposal }: { proposal: PendingProposal }) {
  return (
    <Link
      href={`/transacoes/${proposal.transactionId}`}
      className="mx-4 mb-3 flex items-center gap-[14px] rounded-[18px] border border-[#c6e845] bg-gradient-to-br from-[#F0F7D9] to-[#FAFCF0] px-[18px] py-4 dark:border-[rgba(198,232,69,0.28)] dark:from-[rgba(198,232,69,0.12)] dark:to-[rgba(198,232,69,0.03)]"
    >
      <div className="bg-cta-bg text-cta-fg flex size-[46px] shrink-0 items-center justify-center rounded-[13px]">
        <Send size={22} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-accent dark:text-primary mb-[3px] font-mono text-[11px] font-semibold tracking-[0.3px]">
          PROPOSTA RECEBIDA
        </p>
        <p className="text-[15px] font-medium leading-[1.3]">
          {proposal.buyerName} fez uma proposta
        </p>
        <p className="text-muted-foreground truncate text-[12px]">
          {formatBRL(proposal.amount)} · {proposal.listingTitle} · {timeAgo(proposal.createdAt)}
        </p>
      </div>
      <ChevronRight
        size={22}
        strokeWidth={2.2}
        className="text-accent dark:text-primary shrink-0"
      />
    </Link>
  )
}
