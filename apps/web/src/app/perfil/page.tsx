import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server-auth'
import { prisma } from '@agraia/db'

// Resolves the current user's profile ID and redirects to /perfil/[id].
// Unauthenticated users are sent to /entrar.
export default async function PerfilRootPage() {
  const session = await getServerSession()
  if (!session) redirect('/entrar')

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  })

  if (!profile) redirect('/cadastro/perfil')

  // Own profile always lives at /meu-perfil so the bottom tab bar stays visible.
  redirect('/meu-perfil')
}
