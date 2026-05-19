import { ChevronRight } from '@agrolink/ui/icons'
import type { Proposal } from '@/lib/api'

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface ProposalsListProps {
  proposals: Proposal[]
  listingId: string
}

export function ProposalsList({ proposals, listingId: _ }: ProposalsListProps) {
  if (proposals.length === 0) {
    return (
      <div className="px-4 py-3">
        <p className="text-muted-foreground text-[12px]">Nenhuma proposta ainda.</p>
      </div>
    )
  }

  return (
    <div className="px-4 pb-4">
      {proposals.map((p) => {
        const initials = p.profile.name
          .split(' ')
          .slice(0, 2)
          .map((w) => w[0])
          .join('')
          .toUpperCase()

        return (
          <div
            key={p.id}
            className="bg-card border-border mb-2 flex items-center gap-3 rounded-[10px] border p-3"
          >
            <div className="bg-primary text-primary-foreground flex size-9 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-medium">
              {p.profile.avatarUrl ? (
                <img
                  src={p.profile.avatarUrl}
                  alt={p.profile.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-[2px] truncate text-[13px] font-medium">{p.profile.name}</p>
              <p className="text-accent font-mono text-[12px] font-medium">
                {p.price !== null ? formatBRL(p.price) : '—'}
                {p.quantity !== null ? ` · ${p.quantity} un.` : ''}
              </p>
            </div>
            <ChevronRight
              size={16}
              strokeWidth={1.8}
              className="text-muted-foreground flex-shrink-0"
            />
          </div>
        )
      })}
    </div>
  )
}
