import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@agrolink/db'
import { getUserIdFromCookie } from '@/lib/session'
import { ProfilePageClient } from '@/components/profile/ProfilePageClient'
import { ProfilePageSkeleton } from '@/components/profile/ProfilePageSkeleton'
import type { ProfileData } from '@/lib/profile-mock'

export const metadata: Metadata = {
  title: 'Meu Perfil',
}

async function OwnProfileContent() {
  const userId = await getUserIdFromCookie()
  if (!userId) redirect('/entrar')

  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { location: true },
  })

  if (!profile) redirect('/cadastro/perfil')

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
    listings: [],
    reviews: [],
    completedTransactions: 0,
  }

  return <ProfilePageClient profile={profileData} isOwn />
}

export default function MeuPerfilPage() {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <OwnProfileContent />
    </Suspense>
  )
}
