'use client'

import { useState } from 'react'
import { ProfileHeader } from './ProfileHeader'
import { ProfileTabs } from './ProfileTabs'
import { EditProfileSheet } from './EditProfileSheet'
import { Separator } from '@/components/ui/separator'
import type { ProfileData } from '@/lib/profile-mock'

interface ProfilePageClientProps {
  profile: ProfileData
  isOwn?: boolean
}

export function ProfilePageClient({ profile, isOwn }: ProfilePageClientProps) {
  const [editOpen, setEditOpen] = useState(false)

  return (
    <div className="flex min-h-svh flex-col">
      <ProfileHeader profile={profile} isOwn={isOwn} onEditClick={() => setEditOpen(true)} />
      <Separator />
      <ProfileTabs profile={profile} isOwn={isOwn} />

      {isOwn && <EditProfileSheet open={editOpen} onOpenChange={setEditOpen} profile={profile} />}
    </div>
  )
}
