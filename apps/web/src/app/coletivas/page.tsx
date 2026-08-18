import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, Plus } from '@siamo/ui/icons'
import { CollectiveCard } from '@/components/collective/collective-card'
import type { CollectiveCampaign } from '@/components/collective/collective-card'
import { cn } from '@siamo/ui'

export const metadata: Metadata = { title: 'Compras coletivas — Siamo' }

// Mock data matching the design spec
const MOCK_CAMPAIGNS: CollectiveCampaign[] = [
  {
    id: 'camp-1',
    title: 'Sementes de café clonal — 1.000 mudas',
    status: 'CLOSING',
    currentParticipants: 12,
    targetParticipants: 15,
    estimatedPricePerUnit: 420,
    unit: 'muda',
    discountPercent: 22,
    myCommitment: 420,
    closesAt: new Date(Date.now() + 38 * 3_600_000), // 1d 14h
  },
  {
    id: 'camp-2',
    title: 'Fertilizante NPK 04-14-08 — compra em grupo',
    status: 'OPEN',
    currentParticipants: 7,
    targetParticipants: 20,
    estimatedPricePerUnit: 82,
    unit: 'saca',
    discountPercent: 15,
    minQuantityPerProducer: 10,
    closesAt: new Date(Date.now() + 152 * 3_600_000), // 6d 8h
  },
  {
    id: 'camp-3',
    title: 'Agrotóxico foliar biológico — lote piloto',
    status: 'COMPLETED',
    currentParticipants: 20,
    targetParticipants: 20,
    estimatedPricePerUnit: 148,
    unit: 'litro',
    discountPercent: 31,
    finalPricePerUnit: 148,
    closesAt: new Date(Date.now() - 24 * 3_600_000),
  },
]

const TABS = [
  { label: 'Disponíveis', value: 'available' },
  { label: 'Participando', value: 'joined' },
  { label: 'Concluídas', value: 'completed' },
]

interface ColetivPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function ColetivosPage({ searchParams }: ColetivPageProps) {
  const { tab = 'available' } = await searchParams

  return (
    <div className="bg-background flex min-h-screen flex-col pb-[80px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="bg-muted flex size-12 items-center justify-center rounded-full"
          aria-label="Voltar"
        >
          <ArrowLeft size={18} strokeWidth={1.8} />
        </Link>
        <span className="text-[15px] font-medium">Compras coletivas</span>
        <Link
          href={'/coletivas/nova'}
          className="bg-muted flex size-12 items-center justify-center rounded-full"
          aria-label="Criar campanha"
        >
          <Plus size={18} strokeWidth={1.8} className="text-accent dark:text-primary" />
        </Link>
      </div>

      {/* Info banner */}
      <div className="border-primary bg-primary-subtle mx-4 mb-3 rounded-[10px] border-[0.5px] px-3 py-[10px] text-[12px] leading-[1.5]">
        <span className="text-accent dark:text-primary font-medium">O que são?</span>{' '}
        <span className="text-fg-secondary">
          Grupos de produtores que compram juntos para conseguir preços de atacado e descontos por
          volume.
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map(({ label, value }) => (
          <Link
            key={value}
            href={`/coletivas?tab=${value}`}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-full px-[14px] py-[7px] text-[12px] transition-colors',
              tab === value
                ? 'feed-tab-active font-medium'
                : 'bg-muted text-fg-secondary hover:text-foreground',
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Campaign list */}
      <div className="flex-1">
        {MOCK_CAMPAIGNS.map((campaign) => (
          <CollectiveCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </div>
  )
}
