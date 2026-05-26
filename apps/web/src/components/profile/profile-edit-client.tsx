'use client'

import { useState } from 'react'
import { Pencil } from '@agraia/ui/icons'
import { EditProfileSheet } from './EditProfileSheet'
import type { ProfileData } from '@/lib/profile-mock'

interface ProfileEditClientProps {
  profile: ProfileData
}

export function ProfileEditClient({ profile }: ProfileEditClientProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-muted flex size-9 items-center justify-center rounded-full"
        aria-label="Editar perfil"
      >
        <Pencil size={18} strokeWidth={1.8} />
      </button>
      <EditProfileSheet open={open} onOpenChange={setOpen} profile={profile} />
    </>
  )
}
