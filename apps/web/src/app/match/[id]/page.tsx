import Link from 'next/link'
import type { Metadata } from 'next'
import { X, MapPin, Star, TrendingUp, Clock } from '@siamo/ui/icons'
import { BreakdownBar } from '@/components/matches/breakdown-bar'

export const metadata: Metadata = { title: 'Breakdown do match' }

interface BreakdownPageProps {
  params: Promise<{ id: string }>
}

export default async function MatchBreakdownPage({ params }: BreakdownPageProps) {
  const { id: _id } = await params

  // Mock data matching the design spec
  const breakdown = {
    total: 92,
    listing: { kind: 'OFERTA', title: 'Café arábica especial' },
    counterListing: { kind: 'DEMANDA', title: 'Procuro café — 50 sacas' },
    counterName: 'Celso',
    dimensions: {
      distance: {
        fill: 95,
        points: 38,
        detail: '7 km entre as propriedades · excelente proximidade',
      },
      reputation: {
        fill: 94,
        points: 33,
        detail: 'Celso: 4.7 (Prata, 28 transações) · João: 4.9 (Ouro, 62 transações)',
      },
      compatibility: {
        fill: 85,
        points: 17,
        detail: 'Categoria idêntica (Café) · demanda oferece R$ 1.900, acima da oferta',
      },
      responsiveness: {
        fill: 80,
        points: 4,
        detail: 'Celso responde em ~3h · João responde em ~2h',
      },
    },
  }

  return (
    <div className="bg-background flex min-h-screen flex-col pb-[80px]">
      {/* Sheet handle */}
      <div className="flex justify-center pb-1 pt-3">
        <div className="bg-border h-1 w-9 rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <Link
          href={`/anuncio/listing-1/matches`}
          className="bg-muted flex size-9 items-center justify-center rounded-full"
          aria-label="Fechar"
        >
          <X size={18} strokeWidth={1.8} />
        </Link>
        <span className="text-[15px] font-medium">Por que este match?</span>
        <div className="w-9" />
      </div>

      {/* Parties strip */}
      <div className="border-border bg-muted/50 flex items-center gap-[10px] border-b px-4 py-3">
        <div className="size-9 shrink-0 rounded-[8px] bg-[#D4B896] dark:bg-[#3d2817]" />
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground font-mono text-[9px]">{breakdown.listing.kind}</p>
          <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-medium">
            {breakdown.listing.title}
          </p>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className="text-accent dark:text-primary shrink-0"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
        <div className="size-9 shrink-0 rounded-[8px] bg-[#C8D4B8] dark:bg-[#2d4a2a]" />
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground font-mono text-[9px]">
            {breakdown.counterListing.kind}
          </p>
          <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-medium">
            {breakdown.counterListing.title}
          </p>
        </div>
      </div>

      {/* Breakdown content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Score total */}
        <div className="border-border mb-4 flex items-center justify-between border-b pb-4">
          <div>
            <p className="text-muted-foreground mb-1 font-mono text-[11px] tracking-[0.4px]">
              [SCORE TOTAL DO MATCH]
            </p>
            <p className="text-muted-foreground text-[12px]">
              Quanto melhor, maior prioridade no feed
            </p>
          </div>
          <p className="text-accent dark:text-primary font-mono text-[32px] font-medium leading-none">
            {breakdown.total}
          </p>
        </div>

        {/* 4 dimension bars */}
        <BreakdownBar
          icon={<MapPin size={14} strokeWidth={1.8} className="text-accent dark:text-primary" />}
          label="Distância"
          weight={40}
          points={breakdown.dimensions.distance.points}
          fill={breakdown.dimensions.distance.fill}
          detail={breakdown.dimensions.distance.detail}
          colorClass="distance"
        />
        <BreakdownBar
          icon={
            <Star
              size={14}
              fill="currentColor"
              strokeWidth={0}
              className="text-accent dark:text-primary"
            />
          }
          label="Reputação"
          weight={35}
          points={breakdown.dimensions.reputation.points}
          fill={breakdown.dimensions.reputation.fill}
          detail={breakdown.dimensions.reputation.detail}
          colorClass="reputation"
        />
        <BreakdownBar
          icon={
            <TrendingUp size={14} strokeWidth={1.8} className="text-accent dark:text-primary" />
          }
          label="Compatibilidade"
          weight={20}
          points={breakdown.dimensions.compatibility.points}
          fill={breakdown.dimensions.compatibility.fill}
          detail={breakdown.dimensions.compatibility.detail}
          colorClass="compatibility"
        />
        <BreakdownBar
          icon={<Clock size={14} strokeWidth={1.8} className="text-accent dark:text-primary" />}
          label="Responsividade"
          weight={5}
          points={breakdown.dimensions.responsiveness.points}
          fill={breakdown.dimensions.responsiveness.fill}
          detail={breakdown.dimensions.responsiveness.detail}
          colorClass="responsiveness"
        />
      </div>

      {/* CTA */}
      <div className="border-t px-5 py-4">
        <Link
          href={`/anuncio/listing-2`}
          className="bg-cta-bg text-cta-fg block w-full rounded-[12px] py-[15px] text-center text-[15px] font-medium transition-opacity active:opacity-80"
        >
          Fazer proposta para {breakdown.counterName}
        </Link>
      </div>
    </div>
  )
}
