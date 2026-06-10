import { describe, it, expect } from 'vitest'
import { isOwnedListingPhotoUrl } from './photo-ownership.js'

const SUPABASE_URL = 'https://abc123.supabase.co'
const USER = 'user_01'

function owned(path: string): string {
  return `${SUPABASE_URL}${path}`
}

describe('isOwnedListingPhotoUrl', () => {
  it('aceita foto no bucket de listings sob o prefixo do usuário', () => {
    const url = owned(`/storage/v1/object/public/listings/${USER}/foto.jpg`)
    expect(isOwnedListingPhotoUrl(url, USER, SUPABASE_URL)).toBe(true)
  })

  it('rejeita foto de outro usuário no mesmo bucket', () => {
    const url = owned('/storage/v1/object/public/listings/outro_user/foto.jpg')
    expect(isOwnedListingPhotoUrl(url, USER, SUPABASE_URL)).toBe(false)
  })

  it('rejeita host externo mesmo com o userId na URL (bypass por substring)', () => {
    expect(isOwnedListingPhotoUrl(`https://evil.com/?x=${USER}`, USER, SUPABASE_URL)).toBe(false)
    expect(
      isOwnedListingPhotoUrl(
        `https://evil.com/storage/v1/object/public/listings/${USER}/foto.jpg`,
        USER,
        SUPABASE_URL,
      ),
    ).toBe(false)
  })

  it('rejeita bucket diferente (profiles) mesmo sob o prefixo do usuário', () => {
    const url = owned(`/storage/v1/object/public/profiles/${USER}/avatar.jpg`)
    expect(isOwnedListingPhotoUrl(url, USER, SUPABASE_URL)).toBe(false)
  })

  it('rejeita prefixo de usuário forjado por path traversal de nome', () => {
    // "user_0" não pode validar fotos de "user_01" nem vice-versa
    const url = owned(`/storage/v1/object/public/listings/${USER}extra/foto.jpg`)
    expect(isOwnedListingPhotoUrl(url, USER, SUPABASE_URL)).toBe(false)
  })

  it('rejeita quando SUPABASE_URL não está configurada', () => {
    const url = owned(`/storage/v1/object/public/listings/${USER}/foto.jpg`)
    expect(isOwnedListingPhotoUrl(url, USER, undefined)).toBe(false)
  })

  it('rejeita URL malformada sem lançar', () => {
    expect(isOwnedListingPhotoUrl('not-a-url', USER, SUPABASE_URL)).toBe(false)
  })
})
