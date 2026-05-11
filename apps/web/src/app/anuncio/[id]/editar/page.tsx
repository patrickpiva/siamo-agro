import { notFound, redirect } from 'next/navigation'
import type { Route } from 'next'
import { getServerSession } from '@/lib/server-auth'
import { fetchListing } from '@/lib/api'
import { WizardShell } from '@/components/listing-wizard/wizard-shell'

export const metadata = { title: 'Editar anúncio' }

export default async function EditarAnuncioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [session, listing] = await Promise.all([getServerSession(), fetchListing(id)])

  if (!session) redirect('/entrar')
  if (!listing) notFound()
  if (listing.profile.userId !== session.userId) redirect(`/anuncio/${id}` as Route)

  return <WizardShell initialListing={listing} />
}
