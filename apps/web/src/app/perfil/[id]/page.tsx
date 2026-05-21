import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Button, getInitials } from '@agrolink/ui'
import { ScreenHeader } from '@/components/layout/screen-header'
import { prisma } from '@agrolink/db'
import { getServerSession } from '@/lib/server-auth'
import { ReputationHero } from '@/components/profile/reputation-hero'
import { ReputationBreakdown } from '@/components/profile/reputation-breakdown'
import { ProfileEditClient } from '@/components/profile/profile-edit-client'
import type { ProfileData } from '@/lib/profile-mock'

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

function getMemberYears(createdAt: Date): number {
  const years = new Date().getFullYear() - createdAt.getFullYear()
  return Math.max(1, years)
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
      <div className="flex flex-col items-center px-6 pb-5 pt-7">
        <div className="bg-muted mb-3 size-[88px] animate-pulse rounded-full" />
        <div className="bg-muted mb-2 h-10 w-24 animate-pulse rounded" />
        <div className="bg-muted mb-1 h-5 w-36 animate-pulse rounded" />
        <div className="bg-muted h-4 w-52 animate-pulse rounded" />
      </div>
      <div className="bg-muted mx-5 mb-5 h-[56px] animate-pulse rounded-[12px]" />
      <div className="mx-5 flex flex-col gap-3 px-0">
        <div className="bg-muted h-4 w-48 animate-pulse rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted h-[60px] w-full animate-pulse rounded-[12px]" />
        ))}
      </div>
    </div>
  )
}

async function ProfileContent({ id }: { id: string }) {
  const [profile, session] = await Promise.all([getProfile(id), getServerSession()])

  if (!profile) notFound()

  const isOwn = session?.userId === profile.userId
  const initials = getInitials(profile.name)
  const memberYears = getMemberYears(profile.createdAt)
  const seal = profile.badge === 'NONE' ? null : profile.badge
  const firstListing = profile.listings[0] ?? null

  const profileData: ProfileData = {
    id: profile.id,
    name: profile.name,
    type: profile.type,
    badge: profile.badge,
    bio: profile.bio ?? '',
    photoUrl: profile.photo ?? undefined,
    city: profile.location?.city ?? '',
    state: profile.location?.state ?? '',
    memberSince: profile.createdAt.toISOString().split('T')[0]!,
    rating: { score: profile.currentRating, count: profile.ratingCount },
    listings: profile.listings.map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      price:
        l.price != null
          ? `R$ ${Number(l.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : undefined,
      city: profile.location?.city ?? '',
      state: profile.location?.state ?? '',
      createdAt: l.createdAt.toISOString().split('T')[0]!,
    })),
    reviews: [],
    completedTransactions: 0,
  }

  return (
    <div className="bg-background flex min-h-screen flex-col pb-24">
      <ScreenHeader
        backHref="/feed"
        title={<span className="text-[15px] font-medium">{isOwn ? 'Meu perfil' : 'Perfil'}</span>}
        right={isOwn ? <ProfileEditClient profile={profileData} /> : undefined}
      />

      {/* Hero */}
      <ReputationHero
        name={profile.name}
        initials={initials}
        photoUrl={profile.photo ?? null}
        type={profile.type}
        city={profile.location?.city ?? '—'}
        state={profile.location?.state ?? '—'}
        memberYears={memberYears}
        score={profile.currentRating}
        seal={seal}
      />

      {/* Stats grid */}
      <div className="divide-border border-border bg-card mx-5 mb-5 grid grid-cols-3 divide-x rounded-[12px] border text-center">
        <div className="py-3">
          <p className="text-accent dark:text-primary font-mono text-[18px] font-medium">0</p>
          <p className="text-muted-foreground mt-[2px] text-[10px]">negociações</p>
        </div>
        <div className="py-3">
          <p className="text-accent dark:text-primary font-mono text-[18px] font-medium">
            {profile.ratingCount}
          </p>
          <p className="text-muted-foreground mt-[2px] text-[10px]">avaliações</p>
        </div>
        <div className="py-3">
          <p className="text-accent dark:text-primary font-mono text-[18px] font-medium">—</p>
          <p className="text-muted-foreground mt-[2px] text-[10px]">resp. média</p>
        </div>
      </div>

      {/* Reputation breakdown (only when there are ratings) */}
      {profile.ratingCount > 0 && (
        <ReputationBreakdown
          reliability={profile.currentRating}
          communication={profile.currentRating}
          quality={profile.currentRating}
        />
      )}

      {/* Active listings */}
      {profile.listings.length > 0 && (
        <>
          <div className="border-border mx-5 mb-4 mt-2 border-t" />
          <div className="mb-2 px-5">
            <p className="text-muted-foreground font-mono text-[11px] tracking-[0.4px]">
              [ANÚNCIOS ATIVOS · {profile.listings.length}]
            </p>
          </div>
          {profile.listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/anuncio/${listing.id}`}
              className="bg-card border-border mx-5 mb-[10px] flex items-start justify-between gap-3 rounded-[12px] border px-[14px] py-[14px] transition-opacity active:opacity-70"
            >
              <div className="min-w-0 flex-1">
                <p className="mb-[4px] text-[13px] font-medium">{listing.title}</p>
                <p className="text-muted-foreground line-clamp-2 text-[11px] leading-[1.4]">
                  {listing.description}
                </p>
              </div>
              {listing.price != null && (
                <p className="text-accent dark:text-primary shrink-0 font-mono text-[12px] font-medium">
                  {`R$ ${Number(listing.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </p>
              )}
            </Link>
          ))}
        </>
      )}

      {/* Reviews */}
      <div className="border-border mx-5 mb-2 mt-4 border-t" />
      <div className="mb-2 px-5">
        <p className="text-muted-foreground font-mono text-[11px] tracking-[0.4px]">
          [AVALIAÇÕES RECEBIDAS · {profile.ratingCount}]
        </p>
      </div>
      {profile.ratingCount === 0 ? (
        <p className="text-muted-foreground px-5 text-[13px]">Ainda sem avaliações.</p>
      ) : (
        // Sprint 4: query ratings via Transaction → buyer/seller relation
        <p className="text-muted-foreground px-5 text-[13px]">
          Avaliações serão exibidas em breve.
        </p>
      )}

      {/* CTA for other users' profiles */}
      {!isOwn && firstListing && (
        <div className="border-border bg-card fixed bottom-0 left-0 right-0 border-t px-5 pb-6 pt-4">
          <Button variant="cta" asChild>
            <Link href={`/anuncio/${firstListing.id}/proposta`}>Fazer proposta</Link>
          </Button>
        </div>
      )}
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
