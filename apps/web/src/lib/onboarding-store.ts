import { useState, useEffect } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProfileType = 'PRODUCER' | 'PROVIDER'

export interface OnboardingLocation {
  lat: number
  lng: number
  city: string
  state: string
}

export interface OnboardingState {
  // Auth
  phone: string | null
  userId: string | null

  // Profile
  profileType: ProfileType | null
  name: string
  bio: string
  photoPreviewUrl: string | null // data URL — File não é serializável

  // Location
  location: OnboardingLocation | null

  // Actions
  setPhone: (phone: string) => void
  setAuth: (userId: string) => void
  setProfileType: (type: ProfileType) => void
  setProfile: (name: string, bio: string, photoPreviewUrl?: string | null) => void
  setLocation: (location: OnboardingLocation) => void
  reset: () => void
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState = {
  phone: null,
  userId: null,
  profileType: null,
  name: '',
  bio: '',
  photoPreviewUrl: null,
  location: null,
}

// ─── Hydration state (para SSR-safe access) ───────────────────────────────────

let _hasHydrated = false

export function useHasHydrated() {
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    if (_hasHydrated) {
      setHasHydrated(true)
    } else {
      const unsub = useOnboardingStore.persist.onFinishHydration(() => {
        _hasHydrated = true
        setHasHydrated(true)
      })
      return unsub
    }
  }, [])

  return hasHydrated
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initialState,

      setPhone: (phone) => set({ phone }),
      setAuth: (userId) => set({ userId }),
      setProfileType: (profileType) => set({ profileType }),
      setProfile: (name, bio, photoPreviewUrl = null) => set({ name, bio, photoPreviewUrl }),
      setLocation: (location) => set({ location }),
      reset: () => set(initialState),
    }),
    {
      name: 'agrolink-onboarding',
      onRehydrateStorage: () => () => {
        _hasHydrated = true
      },
      storage: createJSONStorage(() => {
        // sessionStorage: limpo ao fechar a aba, não persiste entre sessões
        if (typeof window === 'undefined') {
          // SSR: storage fake que não faz nada
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          }
        }
        return sessionStorage
      }),
      // Não persiste as actions, só o estado
      partialize: (state) => ({
        phone: state.phone,
        userId: state.userId,
        profileType: state.profileType,
        name: state.name,
        bio: state.bio,
        photoPreviewUrl: state.photoPreviewUrl,
        location: state.location,
      }),
    },
  ),
)
