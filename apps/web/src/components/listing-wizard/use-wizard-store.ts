'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Listing } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export type WizardStep = 1 | 2 | 3 | 4

export interface WizardDraft {
  kind: string
  category: string
  title: string
  description: string
  price: string
  photoUrls: string[]
}

interface WizardState extends WizardDraft {
  step: WizardStep
  isEditMode: boolean
  listingId: string | null
}

interface WizardActions {
  setStep: (step: WizardStep) => void
  setKind: (kind: string) => void
  setDetails: (fields: { category: string; title: string; description: string }) => void
  setMedia: (fields: { price: string; photoUrls: string[] }) => void
  preload: (listing: Listing) => void
  reset: () => void
}

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL: WizardState = {
  step: 1,
  kind: '',
  category: '',
  title: '',
  description: '',
  price: '',
  photoUrls: [],
  isEditMode: false,
  listingId: null,
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useWizardStore = create<WizardState & WizardActions>()(
  persist(
    (set) => ({
      ...INITIAL,

      setStep: (step) => set({ step }),
      setKind: (kind) => set({ kind, category: '' }),
      setDetails: (fields) => set(fields),
      setMedia: (fields) => set(fields),

      preload: (listing) =>
        set({
          ...INITIAL,
          isEditMode: true,
          listingId: listing.id,
          kind: listing.kind,
          category: listing.category,
          title: listing.title,
          description: listing.description,
          price: listing.price != null ? String(listing.price) : '',
          photoUrls: listing.photos.map((p) => p.url),
          step: 1,
        }),

      reset: () => set(INITIAL),
    }),
    {
      name: 'wizard-draft',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? sessionStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      ),
    },
  ),
)
