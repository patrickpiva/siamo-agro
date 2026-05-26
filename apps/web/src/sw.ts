import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import {
  Serwist,
  StaleWhileRevalidate,
  NetworkFirst,
  NetworkOnly,
  CacheFirst,
  ExpirationPlugin,
} from 'serwist'

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Static assets — cache-first via defaultCache (JS, CSS, images, fonts)
    ...defaultCache,

    // Feed + listings — serve cache instantly, refresh in background
    {
      matcher: ({ url }) =>
        url.pathname.startsWith('/api/v1/listings') ||
        url.pathname.startsWith('/api/proxy/listings'),
      handler: new StaleWhileRevalidate({
        cacheName: 'agraia-api-listings',
        plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 6 * 3600 })],
      }),
    },

    // User profiles — serve cache, refresh in background
    {
      matcher: ({ url }) =>
        url.pathname.startsWith('/api/v1/profiles') ||
        url.pathname.startsWith('/api/proxy/profiles'),
      handler: new StaleWhileRevalidate({
        cacheName: 'agraia-api-profiles',
        plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 6 * 3600 })],
      }),
    },

    // Notifications — network first, fall back to cache if offline
    {
      matcher: ({ url }) =>
        url.pathname.startsWith('/api/v1/notifications') ||
        url.pathname.startsWith('/api/proxy/notifications'),
      handler: new NetworkFirst({
        cacheName: 'agraia-api-notifications',
        plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 3600 })],
        networkTimeoutSeconds: 5,
      }),
    },

    // Transactions + proposals — never serve stale financial data
    {
      matcher: ({ url }) =>
        url.pathname.startsWith('/api/v1/transactions') ||
        url.pathname.startsWith('/api/v1/proposals') ||
        url.pathname.startsWith('/api/proxy/transactions') ||
        url.pathname.startsWith('/api/proxy/proposals'),
      handler: new NetworkOnly(),
    },

    // App pages — network first, fall back to cache (offline navigation)
    {
      matcher: ({ request }) => request.mode === 'navigate',
      handler: new NetworkFirst({
        cacheName: 'agraia-pages',
        plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 24 * 3600 })],
        networkTimeoutSeconds: 5,
      }),
    },
  ],
})

serwist.addEventListeners()

// Suppress unused import warning — CacheFirst is re-exported for completeness
void CacheFirst
