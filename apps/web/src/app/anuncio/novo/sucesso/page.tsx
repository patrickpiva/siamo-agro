import { Suspense } from 'react'
import Link from 'next/link'
import { Check } from '@siamo/ui/icons'
import { fetchListing } from '@/lib/api'
import { ShareButton } from '@/components/listings/share-button'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const UNIT_BY_CATEGORY: Record<string, string> = {
  COFFEE: 'saca',
  SOY: 'saca',
  CORN: 'saca',
  GRAINS: 'saca',
  LIVESTOCK: 'cabeça',
  DAIRY: 'litro',
  FRUITS: 'kg',
  VEGETABLES: 'kg',
  AGRONOMY: 'hora',
  VETERINARY: 'consulta',
  CONSULTING: 'hora',
  MECHANICS: 'hora',
  LABOR: 'dia',
  TRANSPORT: 'viagem',
  IRRIGATION: 'mês',
  TRACTOR: 'dia',
  HARVESTER: 'hectare',
  IRRIGATION_SYSTEM: 'mês',
  TOOLS: 'dia',
  STORAGE: 'mês',
  OTHER: 'unidade',
}

// ─── Content ──────────────────────────────────────────────────────────────────

async function SuccessContent({ id }: { id: string }) {
  const listing = await fetchListing(id)
  const unit = listing ? (UNIT_BY_CATEGORY[listing.category] ?? 'unidade') : 'unidade'
  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-[200px]">
        {/* Hero */}
        <div className="flex flex-col items-center px-6 pb-6 pt-[44px] text-center">
          <div className="bg-primary-subtle border-accent text-accent mb-5 flex size-[88px] items-center justify-center rounded-full border-2">
            <Check size={44} strokeWidth={2.5} />
          </div>
          <h1 className="mb-[6px] text-[24px] font-medium">Anúncio publicado!</h1>
          <p className="text-fg-secondary max-w-[280px] text-[14px] leading-relaxed">
            Seu anúncio já está visível para produtores da região. Estamos buscando matches.
          </p>
        </div>

        {/* Preview card */}
        {listing && (
          <div className="bg-card border-border mx-5 mb-4 overflow-hidden rounded-[14px] border">
            <div className="bg-muted relative h-[120px]">
              {listing.photos[0] && (
                <img src={listing.photos[0].url} alt="" className="h-full w-full object-cover" />
              )}
              <span className="bg-cta-bg text-cta-fg absolute left-2 top-2 rounded-[4px] px-[6px] py-[2px] font-mono text-[9px] font-medium tracking-[0.3px]">
                {listing.kind}
              </span>
            </div>
            <div className="px-[14px] py-[10px]">
              <p className="mb-[4px] text-[14px] font-medium leading-snug">{listing.title}</p>
              {listing.price !== null && (
                <p className="text-accent font-mono text-[13px] font-medium">
                  {formatBRL(listing.price)}
                  <span className="text-fg-secondary font-normal"> / {unit}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Metric grid */}
        <div className="mx-5 grid grid-cols-2 gap-2">
          <div className="bg-primary-subtle border-primary rounded-[10px] border p-3">
            <p className="text-accent font-mono text-[20px] font-medium">~12</p>
            <p className="text-fg-secondary mt-[2px] text-[10px] leading-snug">
              matches potenciais na sua região
            </p>
          </div>
          <div className="bg-primary-subtle border-primary rounded-[10px] border p-3">
            <p className="text-accent font-mono text-[20px] font-medium">~30s</p>
            <p className="text-fg-secondary mt-[2px] text-[10px] leading-snug">
              tempo estimado para primeiros resultados
            </p>
          </div>
        </div>
      </div>

      {/* ── Fixed CTA bar — sits above the BottomTabBar (~64 px) ─────────── */}
      <div className="border-border bg-card fixed bottom-16 left-0 right-0 flex flex-col gap-2 border-t px-5 pb-4 pt-4">
        <Link
          href={`/anuncio/${id}`}
          className="bg-cta-bg text-cta-fg flex w-full items-center justify-center rounded-[12px] py-[15px] text-[15px] font-medium"
        >
          Ver meu anúncio
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <ShareButton
            title={listing?.title ?? 'Anúncio no Siamo'}
            url={`${appUrl}/anuncio/${id}`}
          />
          <Link
            href="/explorar"
            className="bg-card border-border flex items-center justify-center rounded-[12px] border py-3 text-[13px] font-medium"
          >
            Voltar ao feed
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SuccessPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          <span className="text-muted-foreground text-[14px]">Carregando…</span>
        </div>
      }
    >
      <SuccessContentWrapper searchParams={searchParams} />
    </Suspense>
  )
}

async function SuccessContentWrapper({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams
  if (!id) return <p className="text-muted-foreground p-8 text-center">Anúncio não encontrado.</p>
  return <SuccessContent id={id} />
}
