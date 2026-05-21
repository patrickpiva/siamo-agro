'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type ListingKind = 'OFFER' | 'DEMAND' | 'SERVICE' | 'EQUIPMENT'

export type PendingPhoto = {
  id: string
  file?: File
  previewUrl: string
  remoteKey?: string
  remoteUrl?: string
  uploadProgress?: number
  uploadError?: string
}

type ListingDraftState = {
  kind: ListingKind | null
  category: string | null
  title: string
  description: string
  price: number | null // centavos
  priceUnit: string
  negotiable: boolean
  photos: PendingPhoto[]
  draftId: string
  startedAt: number
  lastTouchedAt: number
  isEditMode: boolean
  editListingId: string | null
}

type ListingDraftActions = {
  setKind: (kind: ListingKind) => void
  setCategory: (category: string) => void
  setTitle: (title: string) => void
  setDescription: (description: string) => void
  setPrice: (price: number | null) => void
  setPriceUnit: (unit: string) => void
  setNegotiable: (negotiable: boolean) => void
  addPhoto: (photo: Omit<PendingPhoto, 'id'> & { id?: string }) => void
  removePhoto: (id: string) => void
  reorderPhotos: (fromIndex: number, toIndex: number) => void
  updatePhotoProgress: (id: string, progress: number) => void
  setPhotoUploaded: (id: string, remoteKey: string, remoteUrl: string) => void
  setPhotoError: (id: string, error: string) => void
  hydrateForEdit: (listing: {
    id: string
    kind: ListingKind
    category: string
    title: string
    description: string
    price: number | null
    negotiable: boolean
    photos: { url: string; key?: string }[]
  }) => void
  reset: () => void
}

function genId(): string {
  return typeof crypto !== 'undefined'
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const INITIAL: ListingDraftState = {
  kind: null,
  category: null,
  title: '',
  description: '',
  price: null,
  priceUnit: '',
  negotiable: false,
  photos: [],
  draftId: genId(),
  startedAt: Date.now(),
  lastTouchedAt: Date.now(),
  isEditMode: false,
  editListingId: null,
}

export const useListingDraftStore = create<ListingDraftState & ListingDraftActions>()(
  persist(
    (set) => ({
      ...INITIAL,

      setKind: (kind) => set({ kind, category: null, lastTouchedAt: Date.now() }),

      setCategory: (category) => set({ category, lastTouchedAt: Date.now() }),

      setTitle: (title) => set({ title, lastTouchedAt: Date.now() }),

      setDescription: (description) => set({ description, lastTouchedAt: Date.now() }),

      setPrice: (price) => set({ price, lastTouchedAt: Date.now() }),

      setPriceUnit: (priceUnit) => set({ priceUnit, lastTouchedAt: Date.now() }),

      setNegotiable: (negotiable) => set({ negotiable, lastTouchedAt: Date.now() }),

      addPhoto: (photo) => {
        const id = photo.id ?? genId()
        set((s) => ({
          photos: [...s.photos, { ...photo, id }],
          lastTouchedAt: Date.now(),
        }))
      },

      removePhoto: (id) =>
        set((s) => ({
          photos: s.photos.filter((p) => p.id !== id),
          lastTouchedAt: Date.now(),
        })),

      reorderPhotos: (fromIndex, toIndex) =>
        set((s) => {
          const photos = [...s.photos]
          const [removed] = photos.splice(fromIndex, 1)
          if (removed) photos.splice(toIndex, 0, removed)
          return { photos, lastTouchedAt: Date.now() }
        }),

      updatePhotoProgress: (id, progress) =>
        set((s) => ({
          photos: s.photos.map((p) => (p.id === id ? { ...p, uploadProgress: progress } : p)),
        })),

      setPhotoUploaded: (id, remoteKey, remoteUrl) =>
        set((s) => ({
          photos: s.photos.map((p) =>
            p.id === id
              ? { ...p, remoteKey, remoteUrl, uploadProgress: 100, uploadError: undefined }
              : p,
          ),
          lastTouchedAt: Date.now(),
        })),

      setPhotoError: (id, error) =>
        set((s) => ({
          photos: s.photos.map((p) =>
            p.id === id ? { ...p, uploadError: error, uploadProgress: undefined } : p,
          ),
        })),

      hydrateForEdit: (listing) =>
        set({
          ...INITIAL,
          draftId: genId(),
          startedAt: Date.now(),
          lastTouchedAt: Date.now(),
          isEditMode: true,
          editListingId: listing.id,
          kind: listing.kind,
          category: listing.category,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          negotiable: listing.negotiable,
          photos: listing.photos.map((p, i) => ({
            id: `existing-${i}`,
            previewUrl: p.url,
            remoteKey: p.key,
            remoteUrl: p.url,
            uploadProgress: 100,
          })),
        }),

      reset: () =>
        set({
          ...INITIAL,
          draftId: genId(),
          startedAt: Date.now(),
          lastTouchedAt: Date.now(),
        }),
    }),
    {
      name: 'agrolink:listing-draft',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? sessionStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      ),
      partialize: (state) => ({
        ...state,
        photos: state.photos.map((p) => ({ ...p, file: undefined })),
      }),
    },
  ),
)
