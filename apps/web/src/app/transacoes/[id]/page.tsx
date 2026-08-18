import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { requireSession } from '@/lib/server-auth'
import { route } from '@/lib/route'
import { prisma } from '@siamo/db'
import { BackButton } from '@/components/layout/back-button'
import { ProposalBlock, StateBanner, ListingContextStrip, formatBRL } from '@siamo/ui'
import { MoreVertical } from '@siamo/ui/icons'
import { LazyChatView as ChatView } from '@/components/transactions/lazy-chat-view'
import {
  TransactionActionButton,
  CancelButton,
  CounterProposalPanel,
} from '@/components/transactions/transaction-actions'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getTransaction(id: string, userId: string) {
  const tx = await prisma.transaction.findUnique({
    where: { id },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          kind: true,
          price: true,
          photos: { select: { url: true, order: true }, orderBy: { order: 'asc' }, take: 1 },
        },
      },
      messages: { orderBy: { createdAt: 'asc' } },
      ratings: { where: { raterId: userId } },
      buyer: {
        select: {
          id: true,
          profile: { select: { id: true, name: true, photo: true, badge: true } },
        },
      },
      seller: {
        select: {
          id: true,
          profile: { select: { id: true, name: true, photo: true, badge: true } },
        },
      },
    },
  })
  return tx
}

const STATUS_LABEL: Record<string, string> = {
  PROPOSED: 'Proposta enviada',
  ACCEPTED: 'Proposta aceita',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
}

const BANNER_VARIANT: Record<string, 'proposed' | 'accepted' | 'in-progress' | 'completed'> = {
  PROPOSED: 'proposed',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'proposed', // fallback
}

export default async function TransacaoDetailPage({ params }: PageProps) {
  const session = await requireSession().catch(() => null)
  if (!session) redirect('/entrar')

  const { id } = await params
  const tx = await getTransaction(id, session.userId)

  if (!tx) notFound()

  // Authorization: only buyer or seller may view
  if (tx.buyerId !== session.userId && tx.sellerId !== session.userId) {
    notFound()
  }

  const isBuyer = tx.buyerId === session.userId

  // Seller reviewing a pending proposal → dedicated review page
  if (!isBuyer && tx.status === 'PROPOSED') {
    redirect(`/proposta/${id}`)
  }
  const counterpart = isBuyer ? tx.seller : tx.buyer
  const counterpartProfile = counterpart.profile

  const amountCents = Math.round(Number(tx.amount) * 100)

  // First message is the proposal message
  const firstMessage = tx.messages[0]

  // Has current user already rated this transaction?
  const hasRated = tx.ratings.length > 0

  // 72h timer (show if completionFirstConfirmedAt is set and tx is IN_PROGRESS)
  const deadline =
    tx.completionFirstConfirmedAt != null
      ? new Date(tx.completionFirstConfirmedAt.getTime() + 72 * 60 * 60 * 1000)
      : null

  // ── IN_PROGRESS: full-screen chat layout ─────────────────────────────────────
  if (tx.status === 'IN_PROGRESS') {
    const initials = (counterpartProfile?.name ?? '—')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')

    const systemEventDate = tx.updatedAt
      .toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
      .replace(/(\S+)$/, (m) => m.charAt(0).toUpperCase() + m.slice(1))

    const systemEventLabel = isBuyer
      ? `[PROPOSTA ACEITA] · ${counterpartProfile?.name ?? '—'} aceitou sua proposta`
      : '[PROPOSTA ACEITA] · Você aceitou a proposta'

    return (
      <div className="bg-background flex h-dvh flex-col overflow-hidden">
        {/* ── Compact status bar ───────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center gap-2 bg-amber-50 px-4 py-[7px] dark:bg-amber-950/30">
          <div className="size-[6px] shrink-0 rounded-full bg-amber-500" />
          <p className="truncate font-mono text-[11px] tracking-[0.3px] text-amber-700 dark:text-amber-400">
            EM ANDAMENTO · {counterpartProfile?.name ?? '—'} · {formatBRL(amountCents)}
          </p>
        </div>

        {/* ── Chat header ──────────────────────────────────────────────────── */}
        <header className="border-border flex shrink-0 items-center gap-3 border-b px-4 py-3">
          <BackButton fallbackHref="/transacoes" />

          {/* Counterpart avatar */}
          <div className="bg-accent relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
            {counterpartProfile?.photo ? (
              <img
                src={counterpartProfile.photo}
                alt={counterpartProfile.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[13px] font-semibold text-white">{initials}</span>
            )}
          </div>

          {/* Name + online status */}
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-[15px] font-semibold leading-tight">
              {counterpartProfile?.name ?? '—'}
            </p>
            <p className="text-muted-foreground text-[12px] leading-tight">
              online agora {/* TODO: real-time via Supabase Presence */}
            </p>
          </div>

          {/* Options menu */}
          <button
            type="button"
            aria-label="Mais opções"
            className="bg-muted flex size-9 items-center justify-center rounded-full"
          >
            <MoreVertical size={18} strokeWidth={1.8} />
          </button>
        </header>

        {/* ── Transaction card ─────────────────────────────────────────────── */}
        <div className="shrink-0 px-4 pb-2 pt-3">
          <ListingContextStrip
            title={tx.listing.title}
            kind={tx.listing.kind}
            price={amountCents}
            thumbnail={tx.listing.photos[0]?.url ?? null}
          />
        </div>

        {/* ── Chat (fills remaining height) ────────────────────────────────── */}
        <ChatView
          transactionId={tx.id}
          currentUserId={session.userId}
          initialMessages={tx.messages.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            content: m.content,
            createdAt: m.createdAt.toISOString(),
          }))}
          counterpart={{
            id: counterpart.id,
            name: counterpartProfile?.name ?? '—',
            photo: counterpartProfile?.photo ?? null,
            badge: counterpartProfile?.badge ?? 'NONE',
          }}
          showOnlineStrip={false}
          systemEvent={{ label: systemEventLabel, date: systemEventDate }}
          completionHref={route(`/transacoes/${tx.id}/concluir`)}
        />
      </div>
    )
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-3">
        <BackButton fallbackHref="/transacoes" />
        <span className="text-[15px] font-medium">Negociação</span>
        <div className="w-9" />
      </header>

      {/* ── Status banner ───────────────────────────────────────────────────────── */}
      {tx.status !== 'CANCELLED' ? (
        <StateBanner variant={BANNER_VARIANT[tx.status] ?? 'proposed'}>
          {STATUS_LABEL[tx.status] ?? tx.status}
          {deadline && (
            <span className="text-muted-foreground ml-auto font-mono text-[10px]">
              Prazo:{' '}
              {deadline.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </StateBanner>
      ) : (
        <div className="bg-red-50 px-4 py-2 text-[12px] font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400">
          Cancelada
          {tx.cancellationReason && ` · ${tx.cancellationReason.replace('_', ' ').toLowerCase()}`}
        </div>
      )}

      {/* ── Listing context strip ───────────────────────────────────────────────── */}
      <div className="px-4 pb-3 pt-4">
        <ListingContextStrip
          title={tx.listing.title}
          kind={tx.listing.kind}
          price={tx.listing.price ? Math.round(Number(tx.listing.price) * 100) : 0}
          priceUnit="un"
          ownerLabel={counterpartProfile?.name ?? '—'}
          thumbnail={tx.listing.photos[0]?.url ?? null}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          STATE-SPECIFIC VIEWS
          ══════════════════════════════════════════════════════════════════════ */}

      {/* ── E2: PROPOSED — buyer waiting ─────────────────────────────────────── */}
      {tx.status === 'PROPOSED' && isBuyer && (
        <div className="flex flex-1 flex-col gap-4 px-4 pb-8">
          <ProposalBlock
            label="SUA PROPOSTA"
            priceCents={amountCents}
            message={firstMessage?.content}
          />
          <div className="rounded-[12px] border border-[#d8d8d0] bg-[#f5f5f0] px-4 py-3 dark:border-[rgba(255,255,255,0.1)] dark:bg-[rgba(255,255,255,0.04)]">
            <p className="text-muted-foreground text-[13px] leading-[1.5]">
              Aguardando resposta de{' '}
              <strong className="text-foreground">{counterpartProfile?.name ?? '—'}</strong>. Você
              receberá uma notificação assim que a proposta for aceita ou respondida.
            </p>
          </div>
          <CancelButton transactionId={tx.id} />
        </div>
      )}

      {/* ── E3: PROPOSED — seller reviewing ──────────────────────────────────── */}
      {tx.status === 'PROPOSED' && !isBuyer && (
        <div className="flex flex-1 flex-col gap-4 px-4 pb-8">
          {/* Buyer info */}
          <div className="flex items-center gap-3">
            <div className="bg-muted size-10 overflow-hidden rounded-full">
              {counterpartProfile?.photo ? (
                <img
                  src={counterpartProfile.photo}
                  alt={counterpartProfile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[16px] font-medium">
                  {counterpartProfile?.name?.[0] ?? '?'}
                </div>
              )}
            </div>
            <div>
              <p className="text-foreground text-[14px] font-medium">
                {counterpartProfile?.name ?? '—'}
              </p>
              <p className="text-muted-foreground text-[12px]">quer fazer negócio</p>
            </div>
          </div>

          <ProposalBlock
            label="PROPOSTA RECEBIDA"
            priceCents={amountCents}
            message={firstMessage?.content}
          />

          {/* Actions */}
          <TransactionActionButton transactionId={tx.id} action="accept" label="Aceitar proposta" />
          <CounterProposalPanel transactionId={tx.id} />
          <CancelButton transactionId={tx.id} />
        </div>
      )}

      {/* ── ACCEPTED: waiting for both to confirm start ───────────────────────── */}
      {tx.status === 'ACCEPTED' && (
        <div className="flex flex-1 flex-col gap-4 px-4 pb-8">
          <ProposalBlock label="VALOR ACORDADO" priceCents={amountCents} />

          <p className="text-muted-foreground text-[13px] leading-[1.5]">
            Proposta aceita! Ambas as partes precisam confirmar o início do serviço para avançar.
          </p>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between rounded-[10px] border border-[#e0e0d8] bg-white/60 px-3 py-2.5 dark:border-[rgba(255,255,255,0.08)] dark:bg-[rgba(255,255,255,0.04)]">
              <span className="text-foreground/70 text-[12px]">
                {tx.buyer.profile?.name ?? 'Comprador'}
              </span>
              <span
                className={`font-mono text-[11px] ${tx.buyerConfirmedStart ? 'text-accent dark:text-primary' : 'text-muted-foreground'}`}
              >
                {tx.buyerConfirmedStart ? '✓ Confirmado' : 'Pendente'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-[10px] border border-[#e0e0d8] bg-white/60 px-3 py-2.5 dark:border-[rgba(255,255,255,0.08)] dark:bg-[rgba(255,255,255,0.04)]">
              <span className="text-foreground/70 text-[12px]">
                {tx.seller.profile?.name ?? 'Vendedor'}
              </span>
              <span
                className={`font-mono text-[11px] ${tx.sellerConfirmedStart ? 'text-accent dark:text-primary' : 'text-muted-foreground'}`}
              >
                {tx.sellerConfirmedStart ? '✓ Confirmado' : 'Pendente'}
              </span>
            </div>
          </div>

          <TransactionActionButton
            transactionId={tx.id}
            action="start"
            label="Confirmar início"
            alreadyDone={isBuyer ? tx.buyerConfirmedStart : tx.sellerConfirmedStart}
            peerDone={isBuyer ? tx.sellerConfirmedStart : tx.buyerConfirmedStart}
          />
          <CancelButton transactionId={tx.id} />
        </div>
      )}

      {/* ── COMPLETED ─────────────────────────────────────────────────────────── */}
      {tx.status === 'COMPLETED' && (
        <div className="flex flex-1 flex-col gap-4 px-4 pb-8">
          <ProposalBlock label="VALOR FINAL" priceCents={amountCents} />

          {/* Read-only messages */}
          {tx.messages.length > 0 && (
            <div className="border-border rounded-[14px] border">
              <p className="text-muted-foreground px-4 py-2 font-mono text-[10px] tracking-[0.4px]">
                HISTÓRICO DE MENSAGENS · {tx.messages.length}
              </p>
              <ChatView
                transactionId={tx.id}
                currentUserId={session.userId}
                initialMessages={tx.messages.map((m) => ({
                  id: m.id,
                  senderId: m.senderId,
                  content: m.content,
                  createdAt: m.createdAt.toISOString(),
                }))}
                readOnly
                counterpart={{
                  id: counterpart.id,
                  name: counterpartProfile?.name ?? '—',
                  photo: counterpartProfile?.photo ?? null,
                  badge: counterpartProfile?.badge ?? 'NONE',
                }}
              />
            </div>
          )}

          {/* Rate CTA */}
          {!hasRated ? (
            <Link href={`/transacoes/${tx.id}/avaliar`}>
              <button
                type="button"
                className="bg-cta-bg text-cta-fg w-full rounded-[12px] py-4 text-[15px] font-medium"
              >
                Avaliar {counterpartProfile?.name ?? 'contraparte'}
              </button>
            </Link>
          ) : (
            <div className="rounded-[12px] border border-[#c6e845] bg-[#f0f7d9] px-4 py-3 text-center dark:border-[rgba(198,232,69,0.2)] dark:bg-[rgba(198,232,69,0.06)]">
              <p className="text-accent dark:text-primary text-[13px] font-medium">
                ✓ Avaliação enviada
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── CANCELLED ─────────────────────────────────────────────────────────── */}
      {tx.status === 'CANCELLED' && (
        <div className="flex flex-1 flex-col gap-4 px-4 pb-8">
          <ProposalBlock label="VALOR DA PROPOSTA" priceCents={amountCents} />
          <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">
            <p className="text-[13px] leading-[1.5] text-red-700 dark:text-red-400">
              Esta transação foi cancelada.
              {tx.cancellationReason && (
                <>
                  {' '}
                  Motivo: <strong>{tx.cancellationReason.replace(/_/g, ' ').toLowerCase()}</strong>.
                </>
              )}
            </p>
          </div>
          <Link
            href="/busca"
            className="bg-muted text-foreground block w-full rounded-[12px] py-3 text-center text-[14px] font-medium"
          >
            Explorar outros anúncios
          </Link>
        </div>
      )}
    </div>
  )
}
