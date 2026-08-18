import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getServerSession } from '@/lib/server-auth'
import { fetchListing } from '@/lib/api'
import { EditListingForm } from '@/components/listings/edit-listing-form'

export const metadata: Metadata = { title: 'Editar anúncio · Siamo' }

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [session, listing] = await Promise.all([getServerSession(), fetchListing(id)])

  if (!session) redirect('/entrar')
  if (!listing) notFound()
  if (session.userId !== listing.profile.userId) notFound()

  return <EditListingForm listing={listing} />
}
