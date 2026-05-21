import Image from 'next/image'
import { cn, formatBRL } from './lib/utils'

interface ListingContextStripProps {
  title: string
  kind: string
  price: number
  priceUnit?: string
  ownerLabel?: string
  thumbnail?: string | null
  className?: string
}

const KIND_LABEL: Record<string, string> = {
  OFFER: 'OFERTA',
  DEMAND: 'DEMANDA',
  SERVICE: 'SERVIÇO',
  EQUIPMENT: 'EQUIP.',
}

export function ListingContextStrip({
  title,
  kind,
  price,
  priceUnit,
  ownerLabel,
  thumbnail,
  className,
}: ListingContextStripProps) {
  const kindLabel = KIND_LABEL[kind] ?? kind
  return (
    <div
      className={cn(
        'bg-card border-border flex items-center gap-3 rounded-[12px] border px-[14px] py-3',
        className,
      )}
    >
      {/* Thumb */}
      <div className="relative size-[52px] shrink-0 overflow-hidden rounded-[8px] bg-[#D4B896] dark:bg-[#3d2817]">
        {thumbnail && (
          <Image src={thumbnail} alt={title} fill className="object-cover" sizes="52px" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <span className="bg-foreground text-primary mb-1 inline-block rounded-[3px] px-[6px] py-[2px] font-mono text-[9px] font-medium tracking-[0.3px]">
          {kindLabel}
        </span>
        <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium">
          {title}
        </p>
        <p className="text-accent dark:text-primary font-mono text-[12px] font-medium">
          {formatBRL(price)}
          {priceUnit && <span className="text-muted-foreground font-normal"> / {priceUnit}</span>}
          {ownerLabel && <span className="text-muted-foreground font-normal"> · {ownerLabel}</span>}
        </p>
      </div>
    </div>
  )
}
