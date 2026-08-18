import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from '@siamo/ui/icons'
import { MatchItem } from '@/components/matches/match-item'
import type { MatchItemData } from '@/components/matches/match-item'

export const metadata: Metadata = { title: 'Matches do anúncio — Siamo' }

// Mock data matching the design spec
const MOCK_MATCHES: MatchItemData[] = [
  {
    id: 'match-1',
    counterListing: {
      id: 'listing-2',
      title: 'Procuro café arábica — 50 sacas min',
      price: 190000,
      kind: 'DEMAND',
      category: 'COFFEE',
    },
    score: 92,
    distanceKm: 7,
    reasonLabel: 'Demanda compatível · preço acima do seu',
    reasonTier: 'positive',
    owner: { name: 'Celso Aguiar', reputationSeal: 'SILVER' },
  },
  {
    id: 'match-2',
    counterListing: {
      id: 'listing-3',
      title: 'Compra coletiva café — 12 produtores',
      price: 175000,
      kind: 'DEMAND',
      category: 'COFFEE',
    },
    score: 85,
    distanceKm: 11,
    reasonLabel: 'Categoria idêntica · volume compatível',
    reasonTier: 'positive',
    owner: { name: 'Grupo de compra', reputationSeal: null },
  },
  {
    id: 'match-3',
    counterListing: {
      id: 'listing-4',
      title: 'Torrefadora busca café especial — MG/RJ',
      price: 210000,
      kind: 'DEMAND',
      category: 'COFFEE',
    },
    score: 71,
    distanceKm: 32,
    reasonLabel: 'Distância maior · preço bem acima',
    reasonTier: 'neutral',
    owner: { name: 'CafeBr Torr.', reputationSeal: 'GOLD' },
  },
]

interface MatchesPageProps {
  params: Promise<{ id: string }>
}

export default async function ListingMatchesPage({ params }: MatchesPageProps) {
  const { id } = await params

  return (
    <div className="bg-background flex min-h-screen flex-col pb-[80px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          href={`/anuncio/${id}`}
          className="bg-muted flex size-9 items-center justify-center rounded-full"
          aria-label="Voltar"
        >
          <ArrowLeft size={18} strokeWidth={1.8} />
        </Link>
        <span className="text-[15px] font-medium">Matches</span>
        <div className="w-9" />
      </div>

      {/* Listing context strip */}
      <div className="mx-4 mb-3">
        <div className="bg-card border-border flex items-center gap-3 rounded-[12px] border px-[14px] py-[10px]">
          <div className="size-11 shrink-0 rounded-[8px] bg-[#D4B896] dark:bg-[#3d2817]" />
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground mb-[2px] font-mono text-[9px]">SEU ANÚNCIO</p>
            <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium">
              Café arábica especial — safra 2025
            </p>
          </div>
          <p className="text-accent dark:text-primary shrink-0 font-mono text-[12px] font-medium">
            {MOCK_MATCHES.length} matches
          </p>
        </div>
      </div>

      <p className="text-muted-foreground mb-3 px-5 text-[12px]">
        Ordenados por score. Clique para ver detalhes e contatar.
      </p>

      {/* Match list */}
      <div className="flex-1">
        {MOCK_MATCHES.map((match) => (
          <MatchItem key={match.id} match={match} />
        ))}
      </div>
    </div>
  )
}
