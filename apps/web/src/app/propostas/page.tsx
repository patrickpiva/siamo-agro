import Link from 'next/link'
import type { Metadata } from 'next'
import { MessageSquare } from '@siamo/ui/icons'
import { ScreenHeader } from '@/components/layout/screen-header'

export const metadata: Metadata = { title: 'Minhas propostas — AgraIA' }

interface Props {
  searchParams: Promise<{ role?: string }>
}

export default async function PropostasPage({ searchParams }: Props) {
  const { role } = await searchParams
  const isSent = role === 'sent'

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <ScreenHeader
        backHref="/"
        title={
          <span className="text-[15px] font-medium">
            {isSent ? 'Propostas enviadas' : 'Minhas propostas'}
          </span>
        }
      />

      {/* Empty state */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 pb-16 text-center">
        <div className="bg-muted mb-5 flex size-[72px] items-center justify-center rounded-full">
          <MessageSquare size={28} strokeWidth={1.6} className="text-muted-foreground" />
        </div>
        <p className="mb-1 text-[16px] font-medium">
          {isSent ? 'Nenhuma proposta enviada' : 'Nenhuma proposta ainda'}
        </p>
        <p className="text-muted-foreground mb-6 text-[13px] leading-relaxed">
          {isSent
            ? 'Quando você fizer uma proposta em um anúncio, ela aparecerá aqui.'
            : 'Quando alguém fizer uma proposta nos seus anúncios, ela aparecerá aqui.'}
        </p>
        <Link
          href="/"
          className="bg-cta-bg text-cta-fg rounded-[12px] px-6 py-[13px] text-[14px] font-medium"
        >
          Explorar anúncios
        </Link>
      </div>
    </div>
  )
}
