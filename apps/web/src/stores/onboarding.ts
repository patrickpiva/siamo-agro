import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type ProfileType = 'PRODUCER' | 'PROVIDER'

interface OnboardingLocation {
  latitude: number
  longitude: number
  city: string
  state: string
  cep?: string
  source: 'gps' | 'manual'
}

interface OnboardingConsents {
  terms: boolean
  privacy: boolean
  marketingWhatsapp: boolean
}

interface OnboardingState {
  // A2–A3
  phone: string | null
  phoneVerified: boolean
  otpExpiresAt: number | null
  otpAttempts: number

  // A4
  profileType: ProfileType | null

  // A5
  name: string
  propertyName?: string
  bio?: string

  // A6
  location: OnboardingLocation | null

  // A7
  avatarUrl?: string

  // A8
  consents: OnboardingConsents

  // Actions
  setPhone: (phone: string) => void
  setPhoneVerified: (verified: boolean) => void
  setOtpExpiry: (expiresAt: number) => void
  incrementOtpAttempts: () => void
  setProfileType: (type: ProfileType) => void
  setPersonalData: (data: { name: string; propertyName?: string; bio?: string }) => void
  setLocation: (location: OnboardingLocation) => void
  setAvatarUrl: (url: string) => void
  setConsents: (consents: Partial<OnboardingConsents>) => void
  reset: () => void
}

const initialState = {
  phone: null,
  phoneVerified: false,
  otpExpiresAt: null,
  otpAttempts: 0,
  profileType: null,
  name: '',
  propertyName: undefined,
  bio: undefined,
  location: null,
  avatarUrl: undefined,
  consents: {
    terms: false,
    privacy: false,
    marketingWhatsapp: false,
  },
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initialState,

      setPhone: (phone) => set({ phone, phoneVerified: false, otpAttempts: 0 }),
      setPhoneVerified: (phoneVerified) => set({ phoneVerified }),
      setOtpExpiry: (otpExpiresAt) => set({ otpExpiresAt }),
      incrementOtpAttempts: () => set((s) => ({ otpAttempts: s.otpAttempts + 1 })),
      setProfileType: (profileType) => set({ profileType }),
      setPersonalData: (data) => set(data),
      setLocation: (location) => set({ location }),
      setAvatarUrl: (avatarUrl) => set({ avatarUrl }),
      setConsents: (partial) => set((s) => ({ consents: { ...s.consents, ...partial } })),
      reset: () => set(initialState),
    }),
    {
      name: 'siamo:onboarding',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
