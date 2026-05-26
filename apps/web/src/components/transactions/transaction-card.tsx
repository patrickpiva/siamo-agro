import Link from 'next/link'
import { formatBRL } from '@agrolink/ui'

type TxStatus = 'PROPOSED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

interface TransactionCardProps {
  id: string
  status: TxStatus
  listingTitle: string
  listingKind: string
  amount: number
  counterpartName: string
  counterpartPhoto: string | null
  isBuyer: boolean
  createdAt: string
}

const STATUS_LABEL: Record<TxStatus, string> = {
  PROPOSED: 'Proposta',
  ACCEPTED: 'Aceita',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
}

const STATUS_DOT: Record<TxStatus, string> = {
  PROPOSED: 'bg-yellow-400',
  ACCEPTED: 'bg-blue-400',
  IN_PROGRESS: 'bg-[#c6e845]',
  COMPLETED: 'bg-emerald-400',
  CANCELLED: 'bg-red-400',
}

const KIND_LABEL: Record<string, string> = {
  OFFER: 'Oferta',
  DEMAND: 'Demanda',
  SERVICE: 'Serviço',
  EQUIPMENT: 'Equipamento',
}

export function TransactionCard({
  id,
  status,
  listingTitle,
  listingKind,
  amount,
  counterpartName,
  isBuyer,
  createdAt,
}: TransactionCardProps) {
  const date = new Date(createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })

  return (
    <Link href={`/transacoes/${id}`}>
      <div className="border-border bg-card flex items-center gap-3 rounded-[14px] border px-4 py-3">
        {/* Status dot */}
        <div className="flex flex-col items-center gap-1">
          <div className={`size-2 rounded-full ${STATUS_DOT[status]}`} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-[10px] uppercase tracking-[0.4px]">
              {KIND_LABEL[listingKind] ?? listingKind}
            </span>
            <span className="text-muted-foreground text-[10px]">·</span>
            <span className="text-muted-foreground text-[10px]">{date}</span>
          </div>
          <p className="text-foreground truncate text-[13px] font-medium leading-snug">
            {listingTitle}
          </p>
          <p className="text-muted-foreground mt-0.5 text-[12px]">
            {isBuyer ? 'Para' : 'De'} {counterpartName}
          </p>
        </div>

        {/* Right */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-accent dark:text-primary font-mono text-[13px] font-medium">
            {formatBRL(Math.round(amount * 100))}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
              status === 'IN_PROGRESS'
                ? 'bg-[rgba(198,232,69,0.15)] text-[#7aa30f] dark:text-[#c6e845]'
                : status === 'COMPLETED'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                  : status === 'CANCELLED'
                    ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
                    : 'bg-muted text-muted-foreground'
            }`}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>
      </div>
    </Link>
  )
}
