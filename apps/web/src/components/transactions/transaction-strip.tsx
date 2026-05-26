import Image from 'next/image'
import { cn, formatBRL } from '@agraia/ui'

interface TransactionStripProps {
  transactionId: string
  title: string
  valueCents: number
  thumbnail?: string | null
  className?: string
}

export function TransactionStrip({
  transactionId,
  title,
  valueCents,
  thumbnail,
  className,
}: TransactionStripProps) {
  return (
    <div
      className={cn(
        'bg-card border-border flex items-center gap-3 rounded-[10px] border px-[14px] py-[10px]',
        className,
      )}
    >
      <div className="relative size-9 shrink-0 overflow-hidden rounded-[6px] bg-[#D4B896] dark:bg-[#3d2817]">
        {thumbnail && (
          <Image src={thumbnail} alt={title} fill className="object-cover" sizes="36px" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground mb-[2px] font-mono text-[9px] tracking-[0.3px]">
          TRANSAÇÃO #{transactionId}
        </p>
        <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-medium">
          {title}
        </p>
      </div>
      <p className="text-accent dark:text-primary shrink-0 font-mono text-[12px] font-medium">
        {formatBRL(valueCents)}
      </p>
    </div>
  )
}
