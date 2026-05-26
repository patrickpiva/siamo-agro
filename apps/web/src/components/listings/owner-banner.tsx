import { Info } from '@agraia/ui/icons'

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'ATIVO',
  PAUSED: 'PAUSADO',
  CLOSED: 'ENCERRADO',
}

interface OwnerBannerProps {
  status: string
}

export function OwnerBanner({ status }: OwnerBannerProps) {
  const label = STATUS_LABELS[status] ?? status

  return (
    <div className="bg-primary-subtle border-primary text-accent mx-4 mt-3 flex items-center gap-2 rounded-[10px] border px-3 py-[10px] text-[12px]">
      <Info size={14} strokeWidth={2} className="flex-shrink-0" />
      <span>
        Este é o seu anúncio · <strong className="font-semibold">{label}</strong>
      </span>
    </div>
  )
}
