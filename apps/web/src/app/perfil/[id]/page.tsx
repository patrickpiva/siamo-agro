import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ListingMiniCard } from '@siamo/ui'
import { BackButton } from '@/components/layout/back-button'
import { prisma } from '@siamo/db'
import { ProfileHero } from '@/components/profile/profile-hero'
import { ReputationBreakdown } from '@/components/profile/reputation-breakdown'
import { ReviewItem } from '@/components/profile/review-item'

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

async function getProfile(id: string) {
  return prisma.profile.findUnique({
    where: { id },
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
}

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

const API_URL = process.env['API_URL'] ?? 'http://localhost:3001'

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

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { id } = await params
  const profile = await getProfile(id)
  if (!profile) return { title: 'Perfil não encontrado — AgraIA' }
  return {
    title: `${profile.name} — AgraIA`,
    description: `Perfil de ${profile.name} no AgraIA. Nota ${profile.currentRating.toFixed(1)}.`,
  }
}

function ProfileSkeleton() {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="bg-muted size-9 animate-pulse rounded-full" />
        <div className="bg-muted h-4 w-16 animate-pulse rounded" />
        <div className="w-9" />
      </div>
      <div className="flex flex-col items-center px-6 pb-5 pt-6">
        <div className="bg-muted mb-3 size-[88px] animate-pulse rounded-full" />
        <div className="bg-muted mb-2 h-10 w-24 animate-pulse rounded" />
        <div className="bg-muted mb-1 h-5 w-36 animate-pulse rounded" />
        <div className="bg-muted h-4 w-52 animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-3 gap-2 px-5 pb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted h-[56px] animate-pulse rounded-[10px]" />
        ))}
      </div>
      <div className="mx-5 flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted h-[72px] animate-pulse rounded-[12px]" />
        ))}
      </div>
    </div>
  )
}

// /perfil/[id] is always the public/focused view — tab bar is hidden here.
// Own profile lives at /meu-perfil where the tab bar stays visible.
async function ProfileContent({ id }: { id: string }) {
  const profile = await getProfile(id)
  if (!profile) notFound()

  const reputation = await getReputation(profile.id)

  const effectiveRatingCount = reputation?.ratingCount ?? profile.ratingCount
  const effectiveCurrentRating = reputation?.currentRating ?? profile.currentRating

  const transactionCount = await prisma.transaction.count({
    where: {
      OR: [{ buyerId: profile.userId }, { sellerId: profile.userId }],
      status: 'COMPLETED',
    },
  })

  return (
    <div className="bg-background flex flex-col pb-36">
      {/* Header — always back button + centered title */}
      <header className="bg-background/80 sticky top-0 z-10 flex items-center justify-between px-4 py-3 backdrop-blur-sm">
        <BackButton fallbackHref="/" />
        <span className="text-[15px] font-medium">Perfil</span>
        <div className="w-12" />
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
          responseTime: '—',
        }}
        showEditOverlay={false}
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
          {`[ANÚNCIOS ATIVOS · ${profile.listings.length}]`}
        </p>
        {profile.listings.length === 0 ? (
          <p className="text-muted-foreground px-5 text-[13px]">Nenhum anúncio ativo.</p>
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

      {/* CTA — no tab bar here, sits at bottom-0 */}
      <div className="border-border bg-background fixed bottom-0 left-0 right-0 border-t px-5 pb-6 pt-4">
        <Link
          href={`/busca?sellerId=${profile.userId}`}
          className="bg-cta-bg text-cta-fg block w-full rounded-[12px] py-[15px] text-center text-[15px] font-medium"
        >
          Ver anúncios de {profile.name.split(' ')[0]}
        </Link>
      </div>
    </div>
  )
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent id={id} />
    </Suspense>
  )
}
