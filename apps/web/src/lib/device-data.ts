/**
 * Per-user data kept on the device, and the rules for wiping it.
 *
 * Phones are often shared on farms. The service worker keeps a user's pages and
 * API responses (transactions, profile, notifications) for offline use, and
 * localStorage holds their unsent messages and recent searches. All of it must
 * go when that user's session ends or a different user signs in on the device.
 *
 * Device preferences (theme, font size, install/push prompt counters) are not
 * personal data and survive the wipe on purpose.
 */

/** Last user whose data may be on this device. A cuid, not sensitive. */
export const SESSION_OWNER_KEY = 'siamo:session-owner'

/**
 * Bumped when a new wipe must run once on every device. Version 1 covers the
 * caches written before this module existed, whose owner is unknown.
 */
export const DEVICE_DATA_VERSION_KEY = 'siamo:device-data-version'
export const DEVICE_DATA_VERSION = '1'

/** localStorage keys holding one user's data. */
export const USER_STORAGE_KEYS = [
  'siamo:offline-queue',
  'siamo:recent-searches',
  SESSION_OWNER_KEY,
] as const

/**
 * The precache holds build assets (JS, CSS, the app shell) shared by every user.
 * Deleting it would only break offline start-up until the next install.
 */
function isSharedCache(name: string): boolean {
  return name.includes('precache')
}

/** Removes every runtime cache and every per-user localStorage key. */
export async function clearUserDeviceData(): Promise<void> {
  if (typeof window === 'undefined') return

  for (const key of USER_STORAGE_KEYS) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // Storage blocked (private mode) — nothing was persisted there either
    }
  }

  if (!('caches' in window)) return
  try {
    const names = await window.caches.keys()
    await Promise.all(names.filter((n) => !isSharedCache(n)).map((n) => window.caches.delete(n)))
  } catch {
    // CacheStorage unavailable (insecure context, storage blocked) — nothing to clear
  }
}

function readItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage blocked — the next load simply re-evaluates ownership
  }
}

/**
 * Reconciles the device with the session the server sees.
 *
 * - First run of this version → wipe once (legacy caches have no known owner).
 * - Signed in as a different user than the stored owner → wipe.
 * - No session but an owner is stored → the session ended without the logout
 *   button (refresh token expired or revoked, cookies cleared) → wipe.
 *
 * Returns true when a wipe ran, so the caller can drop in-memory caches too.
 */
export async function syncSessionOwner(userId: string | null): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const owner = readItem(SESSION_OWNER_KEY)
  const isFirstRun = readItem(DEVICE_DATA_VERSION_KEY) !== DEVICE_DATA_VERSION
  const ownerChanged = owner !== null && owner !== userId
  const shouldWipe = isFirstRun || ownerChanged

  if (shouldWipe) await clearUserDeviceData()

  writeItem(DEVICE_DATA_VERSION_KEY, DEVICE_DATA_VERSION)
  if (userId) writeItem(SESSION_OWNER_KEY, userId)

  return shouldWipe
}
