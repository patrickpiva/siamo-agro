import { notFound, redirect } from 'next/navigation'
import { requireSession } from '@/lib/server-auth'
import { prisma } from '@agrolink/db'
import { BackButton } from '@/components/layout/back-button'
import { ListingContextStrip } from '@agrolink/ui'
import { Clock } from '@agrolink/ui/icons'
import { TransactionActionButton } from '@/components/transactions/transaction-actions'

interface PageProps {
  params: Promise<{ id: string }>
}

// ── Participant card (server-rendered) ────────────────────────────────────────

function ParticipantCard({
  name,
  photo,
  confirmed,
}: {
  name: string
  photo?: string | null
  confirmed: boolean
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div
      className={[
        'flex flex-col items-center gap-2 rounded-[14px] border px-3 py-4',
        confirmed
          ? 'border-[#c6e845] bg-[rgba(198,232,69,0.08)] dark:border-[rgba(198,232,69,0.3)] dark:bg-[rgba(198,232,69,0.06)]'
          : 'border-border bg-card',
      ].join(' ')}
    >
      {/* Avatar */}
      <div
        className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full"
        style={{ background: confirmed ? '#c6e845' : '#2d5a3d' }}
      >
        {photo ? (
          <img src={photo} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span
            className="text-[14px] font-semibold"
            style={{ color: confirmed ? '#1a2e0a' : '#ffffff' }}
          >
            {initials}
          </span>
        )}
      </div>

      {/* Name */}
      <p className="text-foreground w-full text-center text-[13px] font-semibold leading-tight">
        {name}
      </p>

      {/* Status */}
      {confirmed ? (
        <div className="flex items-center gap-1">
          <span className="text-accent dark:text-primary text-[12px] leading-none">✓</span>
          <span className="text-accent dark:text-primary font-mono text-[10px] tracking-[0.4px]">
            CONFIRMOU
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <Clock size={10} className="text-muted-foreground" />
          <span className="text-muted-foreground font-mono text-[10px] tracking-[0.4px]">
            AGUARDANDO
          </span>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ConcluirPage({ params }: PageProps) {
  const session = await requireSession().catch(() => null)
  if (!session) redirect('/entrar')

  const { id } = await params

  const tx = await prisma.transaction.findUnique({
    where: { id },
    include: {
      listing: {
        select: {
          title: true,
          kind: true,
          photos: { select: { url: true, order: true }, orderBy: { order: 'asc' }, take: 1 },
        },
      },
      buyer: { select: { id: true, profile: { select: { name: true, photo: true } } } },
      seller: { select: { id: true, profile: { select: { name: true, photo: true } } } },
    },
  })

  if (!tx) notFound()
  if (tx.buyerId !== session.userId && tx.sellerId !== session.userId) notFound()
  if (tx.status !== 'IN_PROGRESS') redirect(`/transacoes/${id}`)

  const isBuyer = tx.buyerId === session.userId
  const myConfirmed = isBuyer ? tx.buyerConfirmedEnd : tx.sellerConfirmedEnd
  const peerConfirmed = isBuyer ? tx.sellerConfirmedEnd : tx.buyerConfirmedEnd
  const amountCents = Math.round(Number(tx.amount) * 100)

  // Short TX reference for listing strip
  const shortId = `#TXN-${String(tx.shortId).padStart(4, '0')}`

  // Countdown timer
  const deadline =
    tx.completionFirstConfirmedAt != null
      ? new Date(tx.completionFirstConfirmedAt.getTime() + 72 * 60 * 60 * 1000)
      : null

  const remainingMs = deadline ? Math.max(0, deadline.getTime() - Date.now()) : 0
  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60))
  const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))

  // Who confirmed first and who is still waiting
  const buyerName = tx.buyer.profile?.name ?? 'Comprador'
  const sellerName = tx.seller.profile?.name ?? 'Vendedor'

  const confirmerName = tx.buyerConfirmedEnd ? buyerName : tx.sellerConfirmedEnd ? sellerName : null
  const waiterName = tx.buyerConfirmedEnd ? sellerName : tx.sellerConfirmedEnd ? buyerName : null

  const oneConfirmed = tx.buyerConfirmedEnd || tx.sellerConfirmedEnd

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <BackButton fallbackHref={`/transacoes/${id}`} />
        <span className="text-[15px] font-medium">Concluir transação</span>
        <div className="w-9" />
      </header>

      <div className="flex flex-1 flex-col gap-5 px-4 pb-44 pt-6">
        {/* Hero */}
        <div className="px-2 text-center">
          <h1 className="text-foreground text-[28px] font-semibold leading-tight">Tudo certo?</h1>
          <p className="text-muted-foreground mt-2 text-[14px] leading-[1.55]">
            Ambas as partes precisam confirmar que a transação foi concluída com sucesso para
            liberar as avaliações.
          </p>
        </div>

        {/* Confirmation cards */}
        <div className="grid grid-cols-2 gap-3">
          <ParticipantCard
            name={buyerName}
            photo={tx.buyer.profile?.photo}
            confirmed={tx.buyerConfirmedEnd}
          />
          <ParticipantCard
            name={sellerName}
            photo={tx.seller.profile?.photo}
            confirmed={tx.sellerConfirmedEnd}
          />
        </div>

        {/* Timer notice — shown after first confirmation */}
        {oneConfirmed && deadline && confirmerName && waiterName && (
          <div className="flex items-start gap-3 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-950/20">
            <Clock size={16} className="mt-[1px] shrink-0 text-amber-500" />
            <p className="text-foreground/80 text-[13px] leading-[1.55]">
              {confirmerName} já confirmou.{' '}
              <span className="text-foreground font-medium">{waiterName}</span> tem{' '}
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {remainingHours}h
              </span>{' '}
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {remainingMinutes}m
              </span>{' '}
              para confirmar. Após o prazo, a confirmação é automática.
            </p>
          </div>
        )}

        {/* Listing reference strip */}
        <ListingContextStrip
          title={tx.listing.title}
          kind={tx.listing.kind}
          price={amountCents}
          ownerLabel={shortId}
          thumbnail={tx.listing.photos[0]?.url ?? null}
        />
      </div>

      {/* Sticky CTA — sits above the BottomTabBar (~64 px) */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-2 pt-3">
        <TransactionActionButton
          transactionId={tx.id}
          action="complete"
          label="Confirmar conclusão"
          alreadyDone={myConfirmed}
          peerDone={peerConfirmed}
        />
      </div>
    </div>
  )
}
