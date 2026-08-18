import { prisma } from '@siamo/db'

export interface ActiveListing {
  id: string
  kind: string
  category: string
  title: string
}

export async function getUserActiveListings(userId: string): Promise<ActiveListing[]> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!profile) return []

  return prisma.listing.findMany({
    where: { profileId: profile.id, status: 'ACTIVE' },
    select: { id: true, kind: true, category: true, title: true },
    orderBy: { createdAt: 'desc' },
  })
}
