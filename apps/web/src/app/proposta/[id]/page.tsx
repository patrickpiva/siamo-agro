import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireSession } from '@/lib/server-auth'
import { route } from '@/lib/route'
import { prisma } from '@siamo/db'
import { StateBanner, ProposalBlock, ListingContextStrip } from '@siamo/ui'
import { ProposerCard } from '@/components/transactions/proposer-card'
import { ScreenHeader } from '@/components/layout/screen-header'
import { ProposalReviewActions } from '@/components/transactions/proposal-review-actions'

export const metadata: Metadata = { title: 'Nova proposta' }

interface PageProps {
  params: Promise<{ id: string }>
}

function memberYears(createdAt: Date): number {
  return Math.max(
    0,
    Math.floor((Date.now() - createdAt.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
  )
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export default async function PropostaReviewPage({ params }: PageProps) {
  const session = await requireSession().catch(() => null)
  if (!session) redirect('/entrar')

  const { id: txId } = await params

  const tx = await prisma.transaction.findUnique({
    where: { id: txId },
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
      buyer: {
        select: {
          id: true,
          profile: {
            select: {
              id: true,
              name: true,
              photo: true,
              badge: true,
              currentRating: true,
              ratingCount: true,
              createdAt: true,
            },
          },
        },
      },
      messages: { orderBy: { createdAt: 'asc' }, take: 1 },
    },
  })

  if (!tx) notFound()

  // Only the seller (listing owner) lands on this review page
  if (tx.sellerId !== session.userId) redirect(`/transacoes/${txId}`)

  // Only show for PROPOSED status
  if (tx.status !== 'PROPOSED') redirect(`/transacoes/${txId}`)

  const buyerProfile = tx.buyer.profile
  const buyerName = buyerProfile?.name ?? 'Comprador'

  // Completed transactions by this buyer
  const completedCount = await prisma.transaction.count({
    where: { buyerId: tx.buyerId, status: 'COMPLETED' },
  })

  const totalCents = Math.round(Number(tx.amount) * 100)
  const listingPriceCents = tx.listing.price ? Math.round(Number(tx.listing.price) * 100) : 0

  const firstMessage = tx.messages[0]?.content ?? undefined
  const badge = buyerProfile?.badge

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* Status banner */}
      <StateBanner variant="proposed">PROPOSTA PENDENTE</StateBanner>

      {/* Header */}
      <ScreenHeader backHref={route(`/anuncio/${tx.listing.id}`)} title="Nova proposta" />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3">
        {/* Proposer card */}
        <ProposerCard
          name={buyerName}
          initials={getInitials(buyerName)}
          reputationSeal={
            badge === 'GOLD' || badge === 'SILVER' || badge === 'BRONZE' ? badge : null
          }
          reputationScore={buyerProfile?.currentRating ?? 0}
          reviewCount={buyerProfile?.ratingCount ?? 0}
          transactionCount={completedCount}
          avgResponseHours={2}
          memberYears={buyerProfile?.createdAt ? memberYears(buyerProfile.createdAt) : 0}
          className="mb-4"
        />

        {/* Proposal block */}
        <ProposalBlock
          label="PROPOSTA RECEBIDA"
          priceCents={totalCents}
          message={firstMessage}
          className="mb-4"
        />

        {/* Listing context */}
        <ListingContextStrip
          title={tx.listing.title}
          kind={tx.listing.kind}
          price={listingPriceCents}
          priceUnit="un"
          ownerLabel="Seu anúncio"
          thumbnail={tx.listing.photos[0]?.url ?? null}
        />
      </div>

      {/* Action bar */}
      <ProposalReviewActions transactionId={txId} listingId={tx.listing.id} />
    </div>
  )
}
