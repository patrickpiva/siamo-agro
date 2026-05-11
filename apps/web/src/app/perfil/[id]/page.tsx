import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@agrolink/db'
import { ProfilePageClient } from '@/components/profile/ProfilePageClient'
import { ProfilePageSkeleton } from '@/components/profile/ProfilePageSkeleton'
import type { ProfileData } from '@/lib/profile-mock'

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

async function getProfile(id: string) {
  return prisma.profile.findUnique({
    where: { id },
    include: { location: true },
  })
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { id } = await params
  const profile = await getProfile(id)
  if (!profile) return { title: 'Perfil não encontrado' }
  return { title: profile.name }
}

async function ProfileContent({ id }: { id: string }) {
  const profile = await getProfile(id)
  if (!profile) notFound()

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

  return <ProfilePageClient profile={profileData} isOwn={false} />
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <ProfileContent id={id} />
    </Suspense>
  )
}
