import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ListingMiniCard } from '@agrolink/ui'
import { Share2, Settings } from '@agrolink/ui/icons'
import { BackButton } from '@/components/layout/back-button'
import { prisma } from '@agrolink/db'
import { getServerSession } from '@/lib/server-auth'
import { ProfileHero } from '@/components/profile/profile-hero'
import { ReputationBreakdown } from '@/components/profile/reputation-breakdown'

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

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { id } = await params
  const profile = await getProfile(id)
  if (!profile) return { title: 'Perfil não encontrado — AgroLink' }
  return {
    title: `${profile.name} — AgroLink`,
    description: `Perfil de ${profile.name} no AgroLink. Nota ${profile.currentRating.toFixed(1)}.`,
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

async function ProfileContent({ id }: { id: string }) {
  const [profile, session] = await Promise.all([getProfile(id), getServerSession()])

  if (!profile) notFound()

  const isOwn = session?.userId === profile.userId

  const transactionCount = isOwn
    ? await prisma.transaction.count({
        where: {
          OR: [{ buyerId: session.userId }, { sellerId: session.userId }],
          status: 'COMPLETED',
        },
      })
    : 0

  return (
    <div className="bg-background flex flex-col pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <BackButton fallbackHref="/feed" />

        {isOwn ? (
          // Own profile: back left, actions right — edit is the bottom CTA
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
        ) : (
          // Public profile: centered title + right spacer to balance back button
          <>
            <span className="text-[15px] font-medium">Perfil</span>
            <div className="w-9" />
          </>
        )}
      </header>

      {/* Profile hero */}
      <ProfileHero
        name={profile.name}
        photo={profile.photo}
        profileType={profile.type}
        badge={profile.badge}
        currentRating={profile.currentRating}
        ratingCount={profile.ratingCount}
        location={profile.location}
        stats={{
          transactions: transactionCount,
          ratings: profile.ratingCount,
          responseTime: isOwn ? '< 2h' : '—',
        }}
        showEditOverlay={isOwn}
      />

      {/* Reputation breakdown */}
      {profile.ratingCount > 0 && (
        <div className="px-4 pb-4">
          <ReputationBreakdown
            reliability={profile.currentRating}
            communication={profile.currentRating}
            quality={profile.currentRating}
          />
        </div>
      )}

      {/* Listings */}
      <div className="pb-4">
        <p className="text-muted-foreground px-5 pb-3 pt-2 font-mono text-[11px] tracking-[0.4px]">
          {isOwn ? 'MEUS ANÚNCIOS ATIVOS' : `ANÚNCIOS ATIVOS · ${profile.listings.length}`}
        </p>
        {profile.listings.length === 0 ? (
          <p className="text-muted-foreground px-5 text-[13px]">
            {isOwn ? 'Nenhum anúncio ativo ainda.' : 'Nenhum anúncio ativo.'}
          </p>
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

      {/* Reviews */}
      <div className="border-border mx-5 mb-2 mt-2 border-t" />
      <div className="mb-2 px-5">
        <p className="text-muted-foreground font-mono text-[11px] tracking-[0.4px]">
          AVALIAÇÕES RECEBIDAS · {profile.ratingCount}
        </p>
      </div>
      {profile.ratingCount === 0 ? (
        <p className="text-muted-foreground px-5 pb-6 text-[13px]">Ainda sem avaliações.</p>
      ) : (
        <p className="text-muted-foreground px-5 pb-6 text-[13px]">
          Avaliações serão exibidas em breve.
        </p>
      )}

      {/* Fixed bottom CTA */}
      {isOwn ? (
        <div className="border-border bg-background fixed bottom-0 left-0 right-0 border-t px-5 pb-6 pt-4">
          <Link
            href="/perfil/editar"
            className="bg-cta-bg text-cta-fg block w-full rounded-[12px] py-[15px] text-center text-[15px] font-medium"
          >
            Editar meu perfil
          </Link>
        </div>
      ) : profile.listings[0] ? (
        <div className="border-border bg-background fixed bottom-0 left-0 right-0 border-t px-5 pb-6 pt-4">
          <Link
            href={`/anuncio/${profile.listings[0].id}/proposta`}
            className="bg-cta-bg text-cta-fg block w-full rounded-[12px] py-[15px] text-center text-[15px] font-medium"
          >
            Fazer proposta
          </Link>
        </div>
      ) : null}
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
