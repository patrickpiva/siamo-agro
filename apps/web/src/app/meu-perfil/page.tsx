import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { getServerSession } from '@/lib/server-auth'
import { prisma } from '@agrolink/db'

export default async function MeuPerfilPage() {
  const session = await getServerSession()
  if (!session) redirect('/entrar')

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  })

  if (!profile) redirect('/auth/entrar' as Route)

  redirect(`/perfil/${profile.id}` as Route)
}
