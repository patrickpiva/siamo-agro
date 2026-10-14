'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { syncSessionOwner } from '@/lib/device-data'

/**
 * Wipes the previous user's data from the device when the session changes hands.
 * `userId` comes from the root layout's server session, so it is re-evaluated on
 * every full load and after login/logout refreshes the layout.
 */
export function SessionOwnerSync({ userId }: { userId: string | null }) {
  const queryClient = useQueryClient()

  useEffect(() => {
    void syncSessionOwner(userId).then((wiped) => {
      if (wiped) queryClient.clear()
    })
  }, [userId, queryClient])

  return null
}
