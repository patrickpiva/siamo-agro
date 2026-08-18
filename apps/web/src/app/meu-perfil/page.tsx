import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ListingMiniCard } from '@siamo/ui'
import { Share2, Settings } from '@siamo/ui/icons'
import { getServerSession } from '@/lib/server-auth'
import { prisma } from '@siamo/db'
import { ProfileHero } from '@/components/profile/profile-hero'
import { ReputationBreakdown } from '@/components/profile/reputation-breakdown'
import { ReviewItem } from '@/components/profile/review-item'

// Own-profile route — renders directly so the URL stays at /meu-perfil.
// This keeps BottomTabBar visible (it hides on /perfil/* which is the public view).
// No back button: this is a main-nav destination, not a focused sub-screen.

export const metadata: Metadata = { title: 'Meu Perfil' }

const API_URL = process.env['API_URL'] ?? 'http://localhost:3001'

interface RecentRating {
  score: number
  comment: string | null
  reliability: number | null
  communication: number | null
  quality: number | null
  rater: { name: string | null; photo: string | null }
  transaction: { id: string; amount: number; kind: string; title: string }
  createdAt: string
}

interface ReputationData {
  currentRating: number
  ratingCount: number
  categoryAverages: {
    reliability: number | null
    communication: number | null
    quality: number | null
  }
  recentRatings: RecentRating[]
}

async function getReputation(profileId: string): Promise<ReputationData | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/profiles/${profileId}/reputation`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    const json = (await res.json()) as { data: ReputationData }
    return json.data
  } catch {
    return null
  }
}

async function OwnProfileContent({ userId }: { userId: string }) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      location: true,
      listings: {
        where: { status: 'ACTIVE' },
        include: { photos: { orderBy: { order: 'asc' }, take: 1 } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!profile) return null

  const [reputation, transactionCount] = await Promise.all([
    getReputation(profile.id),
    prisma.transaction.count({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
        status: 'COMPLETED',
      },
    }),
  ])

  const effectiveRatingCount = reputation?.ratingCount ?? profile.ratingCount
  const effectiveCurrentRating = reputation?.currentRating ?? profile.currentRating

  return (
    <div className="bg-background flex flex-col pb-48">
      {/* Header — no back button; main-nav destination */}
      <header className="bg-background/80 sticky top-0 z-10 flex items-center justify-between px-4 py-3 backdrop-blur-sm">
        <div className="w-12" />
        <span className="text-[15px] font-medium">Meu Perfil</span>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Compartilhar perfil"
            className="bg-muted flex size-12 items-center justify-center rounded-full"
          >
            <Share2 size={18} strokeWidth={1.8} />
          </button>
          <Link
            href="/configuracoes"
            aria-label="Configurações"
            className="bg-muted flex size-12 items-center justify-center rounded-full"
          >
            <Settings size={18} strokeWidth={1.8} />
          </Link>
        </div>
      </header>

      <ProfileHero
        name={profile.name}
        photo={profile.photo}
        profileType={profile.type}
        badge={profile.badge}
        currentRating={effectiveCurrentRating}
        ratingCount={effectiveRatingCount}
        location={profile.location}
        joinedAt={profile.createdAt}
        stats={{
          transactions: transactionCount,
          ratings: effectiveRatingCount,
          responseTime: '< 2h',
        }}
        showEditOverlay
      />

      {effectiveRatingCount > 0 && (
        <ReputationBreakdown
          reliability={reputation?.categoryAverages.reliability ?? effectiveCurrentRating}
          communication={reputation?.categoryAverages.communication ?? effectiveCurrentRating}
          quality={reputation?.categoryAverages.quality ?? effectiveCurrentRating}
        />
      )}

      <div className="pb-4">
        <p className="text-muted-foreground px-5 pb-3 pt-2 font-mono text-[11px] tracking-[0.4px]">
          [MEUS ANÚNCIOS ATIVOS]
        </p>
        {profile.listings.length === 0 ? (
          <p className="text-muted-foreground px-5 text-[13px]">Nenhum anúncio ativo ainda.</p>
        ) : (
          <div className="flex flex-col gap-3 px-4">
            {profile.listings.map((listing) => (
              <Link key={listing.id} href={`/anuncio/${listing.id}`}>
                <ListingMiniCard
                  listing={{
                    id: listing.id,
                    kind: listing.kind,
                    category: listing.category,
                    title: listing.title,
                    price: Number(listing.price ?? 0) * 100,
                    priceUnit: 'un',
                    thumbnail: listing.photos[0]?.url ?? null,
                    status: listing.status,
                  }}
                />
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="border-border mx-5 mb-3 mt-2 border-t" />
      <div className="mb-3 px-5">
        <p className="text-muted-foreground font-mono text-[11px] tracking-[0.4px]">
          [AVALIAÇÕES RECENTES] · {effectiveRatingCount}
        </p>
      </div>
      {effectiveRatingCount === 0 ? (
        <p className="text-muted-foreground px-5 pb-6 text-[13px]">Ainda sem avaliações.</p>
      ) : reputation?.recentRatings && reputation.recentRatings.length > 0 ? (
        <div className="pb-4">
          {reputation.recentRatings.map((r, i) => (
            <ReviewItem
              key={i}
              score={r.score}
              comment={r.comment}
              reliability={r.reliability}
              communication={r.communication}
              quality={r.quality}
              raterName={r.rater.name}
              raterPhoto={r.rater.photo}
              transactionKind={r.transaction.kind}
              transactionTitle={r.transaction.title}
              transactionAmount={r.transaction.amount}
              createdAt={r.createdAt}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground px-5 pb-6 text-[13px]">Ainda sem avaliações.</p>
      )}

      {/* "Editar meu perfil" CTA — floats above the tab bar */}
      <div className="border-border bg-background fixed bottom-[64px] left-0 right-0 border-t px-5 pb-4 pt-4">
        <Link
          href="/perfil/editar"
          className="bg-cta-bg text-cta-fg block w-full rounded-[12px] py-[15px] text-center text-[15px] font-medium"
        >
          Editar meu perfil
        </Link>
      </div>
    </div>
  )
}

function OwnProfileSkeleton() {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="w-12" />
        <div className="bg-muted h-4 w-24 animate-pulse rounded" />
        <div className="flex gap-2">
          <div className="bg-muted size-12 animate-pulse rounded-full" />
          <div className="bg-muted size-12 animate-pulse rounded-full" />
        </div>
      </div>
      <div className="flex flex-col items-center px-6 pb-5 pt-6">
        <div className="bg-muted mb-3 size-[88px] animate-pulse rounded-full" />
        <div className="bg-muted mb-2 h-10 w-24 animate-pulse rounded" />
        <div className="bg-muted mb-1 h-5 w-36 animate-pulse rounded" />
        <div className="bg-muted h-4 w-52 animate-pulse rounded" />
      </div>
    </div>
  )
}

export default async function MeuPerfilPage() {
  const session = await getServerSession()
  if (!session) redirect('/entrar')

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  })

  if (!profile) redirect('/cadastro/perfil')

  return (
    <Suspense fallback={<OwnProfileSkeleton />}>
      <OwnProfileContent userId={session.userId} />
    </Suspense>
  )
}
