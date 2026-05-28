import { notFound, redirect } from 'next/navigation'
import type { Route } from 'next'
import { requireSession } from '@/lib/server-auth'
import { prisma } from '@agraia/db'
import { formatBRL } from '@agraia/ui'
import { BackButton } from '@/components/layout/back-button'
import { AvaliarForm } from './avaliar-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AvaliarPage({ params }: PageProps) {
  const session = await requireSession().catch(() => null)
  if (!session) redirect('/entrar')

  const { id } = await params

  const tx = await prisma.transaction.findUnique({
    where: { id },
    include: {
      listing: { select: { title: true } },
      buyer: {
        select: { id: true, profile: { select: { name: true, photo: true } } },
      },
      seller: {
        select: { id: true, profile: { select: { name: true, photo: true } } },
      },
      ratings: { where: { raterId: session.userId } },
    },
  })

  if (!tx) notFound()
  if (tx.buyerId !== session.userId && tx.sellerId !== session.userId) notFound()
  if (tx.status !== 'COMPLETED') redirect(`/transacoes/${id}`)
  // Already rated — go back to transaction detail
  if (tx.ratings.length > 0) redirect(`/transacoes/${id}`)

  const isBuyer = tx.buyerId === session.userId
  const counterpartProfile = isBuyer ? tx.seller.profile : tx.buyer.profile
  const counterpartName = counterpartProfile?.name ?? '—'

  const amountCents = Math.round(Number(tx.amount) * 100)

  const initials = counterpartName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* Compact completed status bar */}
      <div className="flex shrink-0 items-center gap-2 bg-emerald-50 px-4 py-[7px] dark:bg-emerald-950/30">
        <div className="size-[6px] shrink-0 rounded-full bg-emerald-500" />
        <p className="truncate font-mono text-[11px] tracking-[0.3px] text-emerald-700 dark:text-emerald-400">
          CONCLUÍDA · {tx.listing.title} — {formatBRL(amountCents)}
        </p>
      </div>

      {/* Page header */}
      <header className="flex items-center justify-between px-4 py-3">
        <BackButton fallbackHref={`/transacoes/${id}` as Route} />
        <span className="text-[15px] font-medium">Avaliar negociação</span>
        <div className="w-9" />
      </header>

      {/* Avatar + heading */}
      <div className="flex flex-col items-center px-6 pb-4 pt-4 text-center">
        <div
          className="mb-4 flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full"
          style={{ background: '#c6e845' }}
        >
          {counterpartProfile?.photo ? (
            <img
              src={counterpartProfile.photo}
              alt={counterpartName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[24px] font-semibold" style={{ color: '#1a2e0a' }}>
              {initials}
            </span>
          )}
        </div>

        <h1 className="text-foreground text-[22px] font-semibold leading-tight">
          Avaliar {counterpartName}
        </h1>
        <p className="text-muted-foreground mt-1 text-[14px]">Como foi negociar com ele?</p>
      </div>

      {/* Interactive rating form */}
      <AvaliarForm transactionId={id} />
    </div>
  )
}
