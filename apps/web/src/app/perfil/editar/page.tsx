import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getServerSession } from '@/lib/server-auth'
import { prisma } from '@siamo/db'
import { ScreenHeader } from '@/components/layout/screen-header'
import { ProfileEditForm } from '@/components/profile/profile-edit-form'

export const metadata: Metadata = { title: 'Editar Perfil' }

export default async function EditarPerfilPage() {
  const session = await getServerSession()
  if (!session) redirect('/entrar')

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
    include: { location: true },
  })

  if (!profile) redirect('/cadastro/perfil')

  return (
    <div className="bg-background flex min-h-screen flex-col pb-[80px]">
      {/* Header */}
      <ScreenHeader backHref="/meu-perfil" title="Editar perfil" />

      <ProfileEditForm
        initialValues={{
          name: profile.name,
          propertyName: profile.propertyName,
          bio: profile.bio,
          photo: profile.photo,
        }}
        profileType={profile.type}
        location={profile.location}
      />
    </div>
  )
}
