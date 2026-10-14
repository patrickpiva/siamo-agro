import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  clearUserDeviceData,
  syncSessionOwner,
  SESSION_OWNER_KEY,
  DEVICE_DATA_VERSION_KEY,
  DEVICE_DATA_VERSION,
} from './device-data'

// ---------------------------------------------------------------------------
// Regression: logout only deleted the session cookies. The service worker kept
// the user's transactions, profile and notifications for 24h, and localStorage
// kept their unsent messages and recent searches — readable by the next person
// using the same phone. jsdom has no CacheStorage, so a Map-backed fake stands in.
// ---------------------------------------------------------------------------

const PRECACHE = 'serwist-precache-v2-https://app.siamoagro.com/'

/**
 * Node 25 ships a global localStorage without `clear` that shadows jsdom's, so the
 * suite installs its own (same approach as use-push-permission.test.tsx).
 */
function installLocalStorageStub() {
  const store = new Map<string, string>()
  const stub = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, String(v))
    },
    removeItem: (k: string) => {
      store.delete(k)
    },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size
    },
  }
  for (const target of new Set<object>([globalThis, window])) {
    Object.defineProperty(target, 'localStorage', {
      configurable: true,
      writable: true,
      value: stub,
    })
  }
}

function installFakeCaches(names: string[]): Set<string> {
  const store = new Set(names)
  Object.defineProperty(window, 'caches', {
    value: {
      keys: () => Promise.resolve([...store]),
      delete: (name: string) => Promise.resolve(store.delete(name)),
    },
    configurable: true,
  })
  return store
}

function seedUserData(owner: string | null) {
  localStorage.setItem('siamo:offline-queue', '[{"transactionId":"t1","content":"oi"}]')
  localStorage.setItem('siamo:recent-searches', '["soja"]')
  localStorage.setItem('theme', 'light')
  localStorage.setItem(DEVICE_DATA_VERSION_KEY, DEVICE_DATA_VERSION)
  if (owner) localStorage.setItem(SESSION_OWNER_KEY, owner)
}

describe('clearUserDeviceData', () => {
  let store: Set<string>

  beforeEach(() => {
    installLocalStorageStub()
    store = installFakeCaches([PRECACHE, 'apis', 'pages', 'pages-rsc', 'others'])
  })

  afterEach(() => {
    Reflect.deleteProperty(window, 'caches')
  })

  it('deletes runtime caches but keeps the shared precache', async () => {
    await clearUserDeviceData()
    expect([...store]).toEqual([PRECACHE])
  })

  it('removes per-user storage and keeps device preferences', async () => {
    seedUserData('user-a')
    await clearUserDeviceData()

    expect(localStorage.getItem('siamo:offline-queue')).toBeNull()
    expect(localStorage.getItem('siamo:recent-searches')).toBeNull()
    expect(localStorage.getItem(SESSION_OWNER_KEY)).toBeNull()
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('still clears storage when CacheStorage is unavailable', async () => {
    Reflect.deleteProperty(window, 'caches')
    seedUserData('user-a')

    await expect(clearUserDeviceData()).resolves.toBeUndefined()
    expect(localStorage.getItem('siamo:offline-queue')).toBeNull()
  })
})

describe('syncSessionOwner', () => {
  let store: Set<string>

  beforeEach(() => {
    installLocalStorageStub()
    store = installFakeCaches([PRECACHE, 'apis'])
  })

  afterEach(() => {
    Reflect.deleteProperty(window, 'caches')
  })

  it('wipes once on the first run, since legacy caches have no known owner', async () => {
    expect(await syncSessionOwner('user-a')).toBe(true)
    expect([...store]).toEqual([PRECACHE])
    expect(localStorage.getItem(SESSION_OWNER_KEY)).toBe('user-a')

    store.add('apis')
    expect(await syncSessionOwner('user-a')).toBe(false)
    expect(store.has('apis')).toBe(true)
  })

  it('keeps the data while the same user stays signed in', async () => {
    seedUserData('user-a')
    expect(await syncSessionOwner('user-a')).toBe(false)
    expect(store.has('apis')).toBe(true)
    expect(localStorage.getItem('siamo:offline-queue')).not.toBeNull()
  })

  it('wipes when a different user signs in on the device', async () => {
    seedUserData('user-a')
    expect(await syncSessionOwner('user-b')).toBe(true)
    expect(store.has('apis')).toBe(false)
    expect(localStorage.getItem('siamo:offline-queue')).toBeNull()
    expect(localStorage.getItem(SESSION_OWNER_KEY)).toBe('user-b')
  })

  it('wipes when the session ended without the logout button', async () => {
    seedUserData('user-a')
    expect(await syncSessionOwner(null)).toBe(true)
    expect(store.has('apis')).toBe(false)
    expect(localStorage.getItem(SESSION_OWNER_KEY)).toBeNull()
  })

  it('leaves an anonymous visitor alone', async () => {
    seedUserData(null)
    expect(await syncSessionOwner(null)).toBe(false)
    expect(store.has('apis')).toBe(true)
  })
})
