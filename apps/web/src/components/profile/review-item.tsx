import { MiniStarRating, formatBRL } from '@agrolink/ui'

interface ReviewItemProps {
  score: number
  comment: string | null
  reliability?: number | null
  communication?: number | null
  quality?: number | null
  raterName: string | null
  raterPhoto: string | null
  transactionKind: string
  transactionTitle: string
  transactionAmount: number
  createdAt: string
}

const KIND_LABEL: Record<string, string> = {
  OFFER: 'Oferta',
  DEMAND: 'Demanda',
  SERVICE: 'Serviço',
  EQUIPMENT: 'Equipamento',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function ReviewItem({
  score,
  comment,
  raterName,
  raterPhoto,
  transactionKind,
  transactionTitle,
  transactionAmount,
  createdAt,
}: ReviewItemProps) {
  const date = new Date(createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const initials = raterName ? getInitials(raterName) : '?'
  const displayName = raterName ?? 'Usuário'

  return (
    <div className="bg-card border-border mx-5 mb-[10px] rounded-[12px] border px-[14px] py-[14px]">
      {/* Top row: avatar + name/stars left, date right */}
      <div className="mb-[10px] flex items-start justify-between gap-3">
        <div className="flex items-center gap-[10px]">
          {/* Rater avatar */}
          <div
            className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full"
            style={{ background: '#c6e845' }}
          >
            {raterPhoto ? (
              <img src={raterPhoto} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span
                className="select-none text-[12px] font-semibold leading-none"
                style={{ color: '#1a2e0a' }}
              >
                {initials}
              </span>
            )}
          </div>

          {/* Name + stars */}
          <div className="flex flex-col gap-[4px]">
            <span className="text-foreground text-[13px] font-medium leading-none">
              {displayName}
            </span>
            <MiniStarRating value={score} readOnly />
          </div>
        </div>

        {/* Date */}
        <span className="text-muted-foreground shrink-0 font-mono text-[10px]">{date}</span>
      </div>

      {/* Comment */}
      {comment && (
        <p className="text-foreground/80 mb-[10px] text-[13px] leading-[1.55]">{comment}</p>
      )}

      {/* Transaction meta */}
      <p className="text-muted-foreground font-mono text-[11px]">
        {KIND_LABEL[transactionKind] ?? transactionKind} · {transactionTitle} ·{' '}
        {formatBRL(Math.round(transactionAmount * 100))}
      </p>
    </div>
  )
}
