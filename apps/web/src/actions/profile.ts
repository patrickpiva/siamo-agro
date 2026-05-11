'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@agrolink/db'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProfileType = 'PRODUCER' | 'PROVIDER'

export interface CreateProfileInput {
  userId: string
  profileType: ProfileType
  name: string
  bio?: string
  photoFile?: File
  location: {
    lat: number
    lng: number
    city: string
    state: string
  }
}

export type ActionResult<T> = { ok: true; data: T } | { ok: false; code: string; message: string }

// ─── createProfileAction ─────────────────────────────────────────────────────

export async function createProfileAction(
  input: CreateProfileInput,
): Promise<ActionResult<{ profileId: string }>> {
  try {
    // Usa upsert para lidar com o caso em que o usuário já possui perfil
    // (ex: re-execução do onboarding com o mesmo userId).
    const profile = await prisma.profile.upsert({
      where: { userId: input.userId },
      create: {
        userId: input.userId,
        type: input.profileType,
        name: input.name,
        bio: input.bio ?? null,
        location: {
          create: {
            latitude: input.location.lat,
            longitude: input.location.lng,
            city: input.location.city,
            state: input.location.state,
          },
        },
      },
      update: {
        type: input.profileType,
        name: input.name,
        bio: input.bio ?? null,
        location: {
          upsert: {
            create: {
              latitude: input.location.lat,
              longitude: input.location.lng,
              city: input.location.city,
              state: input.location.state,
            },
            update: {
              latitude: input.location.lat,
              longitude: input.location.lng,
              city: input.location.city,
              state: input.location.state,
            },
          },
        },
      },
    })

    return { ok: true, data: { profileId: profile.id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[createProfileAction]', message)
    return {
      ok: false,
      code: 'CREATE_PROFILE_ERROR',
      message: `Erro ao criar perfil: ${message}`,
    }
  }
}

// ─── uploadPhotoAction ────────────────────────────────────────────────────────
// TODO Sprint 2: substituir por upload real ao Supabase Storage

export async function uploadPhotoAction(
  _formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  await new Promise((r) => setTimeout(r, 600))
  return {
    ok: true,
    data: {
      url: `https://api.dicebear.com/9.x/initials/svg?seed=AgroLink&backgroundColor=1F5F3F&textColor=C6E845`,
    },
  }
}

// ─── updateProfileAction ──────────────────────────────────────────────────────
// TODO Sprint 2: substituir por PATCH /api/v1/profiles/:id

export async function updateProfileAction(
  profileId: string,
  input: Partial<Pick<CreateProfileInput, 'name' | 'bio' | 'location'>>,
): Promise<ActionResult<{ ok: boolean }>> {
  try {
    await prisma.profile.update({
      where: { id: profileId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.bio !== undefined && { bio: input.bio }),
        ...(input.location && {
          location: {
            upsert: {
              create: {
                latitude: input.location.lat,
                longitude: input.location.lng,
                city: input.location.city,
                state: input.location.state,
              },
              update: {
                latitude: input.location.lat,
                longitude: input.location.lng,
                city: input.location.city,
                state: input.location.state,
              },
            },
          },
        }),
      },
    })
    revalidatePath('/perfil')
    return { ok: true, data: { ok: true } }
  } catch (err) {
    console.error('[updateProfileAction]', err)
    return { ok: false, code: 'UPDATE_PROFILE_ERROR', message: 'Erro ao atualizar perfil.' }
  }
}
