import Link from 'next/link'
import { ChevronRight } from '@agraia/ui/icons'

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 24) return `há ${h}h`
  return `há ${Math.floor(h / 24)}d`
}

export interface TxProposal {
  id: string
  amount: { toNumber(): number } | number
  createdAt: Date
  buyer: {
    id: string
    profile: { name: string; photo: string | null } | null
  }
  messages: { content: string }[]
}

interface ProposalsListProps {
  proposals: TxProposal[]
  listingId: string
}

export function ProposalsList({ proposals, listingId: _ }: ProposalsListProps) {
  if (proposals.length === 0) {
    return <p className="text-muted-foreground py-2 text-[12px]">Nenhuma proposta ainda.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {proposals.map((p) => {
        const name = p.buyer.profile?.name ?? '—'
        const initials = name
          .split(' ')
          .slice(0, 2)
          .map((w) => w[0])
          .join('')
          .toUpperCase()
        const amount = typeof p.amount === 'number' ? p.amount : p.amount.toNumber()
        const firstMsg = p.messages[0]?.content ?? null

        return (
          <Link
            key={p.id}
            href={`/transacoes/${p.id}`}
            className="bg-card border-border flex items-center gap-3 rounded-[10px] border p-3 transition-opacity active:opacity-70"
          >
            {/* Avatar */}
            <div className="bg-muted text-foreground flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-[12px] font-medium">
              {p.buyer.profile?.photo ? (
                <img
                  src={p.buyer.profile.photo}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="mb-[2px] truncate text-[13px] font-medium">{name}</p>
              <p className="text-accent dark:text-primary font-mono text-[12px] font-medium">
                {formatBRL(amount)}
              </p>
              {firstMsg && (
                <p className="text-muted-foreground mt-[2px] truncate text-[11px]">"{firstMsg}"</p>
              )}
            </div>

            {/* Time + chevron */}
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-muted-foreground font-mono text-[10px]">
                {timeAgo(p.createdAt.toISOString())}
              </span>
              <ChevronRight size={14} strokeWidth={1.8} className="text-muted-foreground" />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
