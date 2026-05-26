import { Star } from '@agraia/ui/icons'
import { ReputationSeal } from '@agraia/ui'
import { cn } from '@agraia/ui'

interface ProposerCardProps {
  name: string
  initials: string
  reputationSeal?: 'GOLD' | 'SILVER' | 'BRONZE' | null
  reputationScore: number
  reviewCount: number
  transactionCount: number
  avgResponseHours: number
  memberYears: number
  className?: string
}

export function ProposerCard({
  name,
  initials,
  reputationSeal,
  reputationScore,
  reviewCount,
  transactionCount,
  avgResponseHours,
  memberYears,
  className,
}: ProposerCardProps) {
  return (
    <div className={cn('bg-card border-border rounded-[14px] border px-4 py-[14px]', className)}>
      {/* Top row */}
      <div className="mb-[14px] flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#C6E845] text-[14px] font-medium text-[#0A0A0A]">
          {initials}
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[14px] font-medium">{name}</span>
            {reputationSeal && <ReputationSeal tier={reputationSeal} />}
          </div>
          <div className="text-muted-foreground flex items-center gap-[6px] text-[11px]">
            <Star
              size={11}
              fill="currentColor"
              strokeWidth={0}
              className="text-accent dark:text-primary"
            />
            <span>
              {reputationScore.toFixed(1)} · {reviewCount} avaliações · {transactionCount}{' '}
              transações
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="border-border grid grid-cols-3 gap-[10px] border-t pt-3">
        <div>
          <p className="font-mono text-[14px] font-medium">{transactionCount}</p>
          <p className="text-muted-foreground text-[10px] leading-[1.3]">transações concluídas</p>
        </div>
        <div>
          <p className="font-mono text-[14px] font-medium">~{avgResponseHours}h</p>
          <p className="text-muted-foreground text-[10px] leading-[1.3]">resposta média</p>
        </div>
        <div>
          <p className="font-mono text-[14px] font-medium">
            {memberYears} {memberYears === 1 ? 'ano' : 'anos'}
          </p>
          <p className="text-muted-foreground text-[10px] leading-[1.3]">no AgraIA</p>
        </div>
      </div>
    </div>
  )
}
