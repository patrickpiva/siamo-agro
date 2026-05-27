import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server-auth'
import { prisma } from '@agraia/db'

// Own-profile route — resolves the current user's profile ID and renders the
// shared profile page.  Public profiles are at /perfil/[id].
//
// Keeping these routes separate lets BottomTabBar show the PERFIL tab as active
// on /meu-perfil while hiding the bar entirely on /perfil/[id] (focused view).

export default async function MeuPerfilPage() {
  const session = await getServerSession()
  if (!session) redirect('/entrar')

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  })

  if (!profile) redirect('/cadastro/perfil')

  redirect(`/perfil/${profile.id}`)
}
