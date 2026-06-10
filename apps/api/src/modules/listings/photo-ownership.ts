const PUBLIC_STORAGE_PREFIX = '/storage/v1/object/public/'
const LISTING_PHOTO_BUCKET = 'listings'

/**
 * Uma foto pertence ao usuário quando aponta para o NOSSO Supabase Storage sob
 * o prefixo dele — os uploads presigned gravam em `listings/<userId>/<arquivo>`.
 * A checagem anterior por substring (`url.includes(userId)`) era forjável:
 * `https://evil.com/?x=<userId>` passava.
 */
export function isOwnedListingPhotoUrl(
  url: string,
  userId: string,
  supabaseUrl: string | undefined = process.env['SUPABASE_URL'],
): boolean {
  if (!supabaseUrl || !userId) return false

  let parsed: URL
  let base: URL
  try {
    parsed = new URL(url)
    base = new URL(supabaseUrl)
  } catch {
    return false
  }

  return (
    parsed.protocol === base.protocol &&
    parsed.host === base.host &&
    parsed.pathname.startsWith(
      `${PUBLIC_STORAGE_PREFIX}${LISTING_PHOTO_BUCKET}/${encodeURIComponent(userId)}/`,
    )
  )
}
