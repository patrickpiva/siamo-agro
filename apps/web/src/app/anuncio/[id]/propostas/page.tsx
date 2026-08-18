import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { requireSession } from '@/lib/server-auth'
import { route } from '@/lib/route'
import { prisma } from '@siamo/db'
import { BackButton } from '@/components/layout/back-button'
import { ChevronRight } from '@siamo/ui/icons'

export const metadata: Metadata = { title: 'Propostas recebidas — Siamo' }

interface PageProps {
  params: Promise<{ id: string }>
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'agora'
  if (h < 24) return `há ${h}h`
  const d = Math.floor(h / 24)
  return `há ${d}d`
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PROPOSED: { label: 'Aguardando', color: 'text-amber-600 dark:text-amber-400' },
  ACCEPTED: { label: 'Aceita', color: 'text-accent dark:text-primary' },
  IN_PROGRESS: { label: 'Andamento', color: 'text-blue-600 dark:text-blue-400' },
  COMPLETED: { label: 'Concluída', color: 'text-accent dark:text-primary' },
  CANCELLED: { label: 'Cancelada', color: 'text-muted-foreground' },
}

export default async function PropostasListPage({ params }: PageProps) {
  const session = await requireSession().catch(() => null)
  if (!session) redirect('/entrar')

  const { id: listingId } = await params

  // Verify listing exists and belongs to the session user
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, title: true, profile: { select: { userId: true } } },
  })

  if (!listing) notFound()
  if (listing.profile.userId !== session.userId) notFound()

  const transactions = await prisma.transaction.findMany({
    where: { listingId },
    include: {
      buyer: {
        select: { id: true, profile: { select: { name: true, photo: true } } },
      },
      messages: { orderBy: { createdAt: 'asc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="bg-background flex min-h-screen flex-col pb-[80px]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <BackButton fallbackHref={route(`/anuncio/${listingId}`)} />
        <span className="text-[15px] font-medium">Propostas recebidas</span>
        <div className="w-9" />
      </header>

      {/* Listing context */}
      <div className="border-border border-b px-5 pb-3">
        <p className="text-muted-foreground font-mono text-[10px] tracking-[0.4px]">[ANÚNCIO]</p>
        <p className="truncate text-[13px] font-medium">{listing.title}</p>
        <p className="text-muted-foreground font-mono text-[11px]">
          {transactions.length} proposta{transactions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* List */}
      {transactions.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
          <p className="text-foreground text-[15px] font-medium">Nenhuma proposta ainda</p>
          <p className="text-muted-foreground text-[13px] leading-relaxed">
            Quando alguém enviar uma proposta para este anúncio, ela aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-[#e8e8e0] px-4 pt-2 dark:divide-[rgba(255,255,255,0.06)]">
          {transactions.map((tx) => {
            const name = tx.buyer.profile?.name ?? '—'
            const amount = Number(tx.amount)
            const firstMsg = tx.messages[0]?.content ?? null
            const status = STATUS_LABEL[tx.status] ?? STATUS_LABEL['PROPOSED']!
            const initials = name
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0])
              .join('')
              .toUpperCase()

            return (
              <Link
                key={tx.id}
                href={`/transacoes/${tx.id}`}
                className="flex items-center gap-3 py-4 transition-opacity active:opacity-70"
              >
                {/* Avatar */}
                <div className="bg-muted flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-[13px] font-medium">
                  {tx.buyer.profile?.photo ? (
                    <img
                      src={tx.buyer.profile.photo}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                {/* Main info */}
                <div className="min-w-0 flex-1">
                  <div className="mb-[2px] flex items-baseline justify-between gap-2">
                    <p className="truncate text-[13px] font-medium">{name}</p>
                    <span className="text-muted-foreground shrink-0 font-mono text-[10px]">
                      {timeAgo(tx.createdAt)}
                    </span>
                  </div>
                  <p className="text-accent dark:text-primary font-mono text-[13px] font-bold">
                    {formatBRL(amount)}
                  </p>
                  {firstMsg && (
                    <p className="text-muted-foreground mt-[2px] truncate text-[12px]">
                      "{firstMsg}"
                    </p>
                  )}
                  <span
                    className={`mt-1 inline-block font-mono text-[10px] font-medium ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>

                <ChevronRight
                  size={16}
                  strokeWidth={1.8}
                  className="text-muted-foreground shrink-0"
                />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
