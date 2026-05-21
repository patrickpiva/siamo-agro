import { Clock, Check } from '@agrolink/ui/icons'
import { CollectiveProgressBar } from '@agrolink/ui'
import { cn } from '@agrolink/ui'

export interface CollectiveCampaign {
  id: string
  title: string
  status: 'OPEN' | 'CLOSING' | 'COMPLETED' | 'CANCELLED'
  currentParticipants: number
  targetParticipants: number
  estimatedPricePerUnit: number
  unit: string
  discountPercent: number
  minQuantityPerProducer?: number
  myCommitment?: number
  closesAt: Date | string
  finalPricePerUnit?: number
}

const STATUS_BADGE: Record<CollectiveCampaign['status'], { label: string; className: string }> = {
  OPEN: {
    label: 'ABERTA',
    className:
      'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
  },
  CLOSING: {
    label: 'ENCERRANDO',
    className:
      'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800',
  },
  COMPLETED: {
    label: 'META ATINGIDA',
    className: 'bg-primary-subtle text-accent dark:text-primary border-primary dark:border-primary',
  },
  CANCELLED: {
    label: 'CANCELADA',
    className: 'bg-muted text-muted-foreground border-border',
  },
}

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatTimer(date: Date | string): string | null {
  const diff = new Date(date).getTime() - Date.now()
  if (diff <= 0) return null
  const totalH = Math.floor(diff / 3_600_000)
  const d = Math.floor(totalH / 24)
  const h = totalH % 24
  if (d > 0) return `${d}d ${h}h`
  return `${h}h`
}

export function CollectiveCard({ campaign }: { campaign: CollectiveCampaign }) {
  const badge = STATUS_BADGE[campaign.status]
  const pct = Math.round((campaign.currentParticipants / campaign.targetParticipants) * 100)
  const remaining = campaign.targetParticipants - campaign.currentParticipants
  const timer = formatTimer(campaign.closesAt)
  const isCompleted = campaign.status === 'COMPLETED'

  return (
    <div
      className={cn(
        'bg-card border-border mx-4 mb-3 rounded-[16px] border p-4',
        isCompleted && 'opacity-70',
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-[10px]">
        <p className="flex-1 text-[15px] font-medium leading-[1.3]">{campaign.title}</p>
        <span
          className={cn(
            'shrink-0 rounded-[4px] border px-2 py-[3px] font-mono text-[9px] font-medium',
            badge.className,
          )}
        >
          {badge.label}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-1 flex justify-between text-[11px]">
        <span className="text-muted-foreground">
          {campaign.currentParticipants} de {campaign.targetParticipants} participantes
        </span>
        <span className="text-accent dark:text-primary font-mono font-medium">
          {pct}%{!isCompleted && remaining > 0 && ` · faltam ${remaining}`}
        </span>
      </div>
      <CollectiveProgressBar
        current={campaign.currentParticipants}
        target={campaign.targetParticipants}
        className="mb-3"
      />

      {/* Stats */}
      <div className="flex flex-wrap gap-4">
        <Stat
          value={formatBRL(
            isCompleted
              ? (campaign.finalPricePerUnit ?? campaign.estimatedPricePerUnit)
              : campaign.estimatedPricePerUnit,
          )}
          label={`/ ${campaign.unit} ${isCompleted ? 'fechado' : 'estimado'}`}
        />
        <Stat value={`-${campaign.discountPercent}%`} label="vs individual" />
        {campaign.myCommitment != null ? (
          <Stat value={formatBRL(campaign.myCommitment)} label="seu compromisso" />
        ) : campaign.minQuantityPerProducer != null ? (
          <Stat
            value={`${campaign.minQuantityPerProducer} ${campaign.unit}`}
            label="min por produtor"
          />
        ) : null}
      </div>

      {/* Timer */}
      {isCompleted ? (
        <div className="text-success mt-[10px] flex items-center gap-[6px] text-[11px] font-medium">
          <Check size={14} strokeWidth={2} />
          <span>Fechado · entrega em breve</span>
        </div>
      ) : timer ? (
        <div className="text-muted-foreground mt-[10px] flex items-center gap-[6px] text-[11px]">
          <Clock size={14} strokeWidth={1.8} />
          <span>
            Encerra em <span className="text-warning font-mono font-medium">{timer}</span>
          </span>
        </div>
      ) : null}
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-mono text-[14px] font-medium">{value}</p>
      <p className="text-muted-foreground text-[10px]">{label}</p>
    </div>
  )
}
