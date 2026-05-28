import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from '@agraia/ui/icons'
import { getServerSession } from '@/lib/server-auth'
import { prisma } from '@agraia/db'
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
      <header className="flex items-center justify-between px-4 py-3">
        <Link
          href="/meu-perfil"
          aria-label="Voltar"
          className="bg-muted flex size-12 items-center justify-center rounded-full"
        >
          <ArrowLeft size={18} strokeWidth={1.8} />
        </Link>
        <p className="text-[15px] font-medium">Editar perfil</p>
        <div className="w-12" />
      </header>

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
