import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

// Runtime caching is Serwist's defaultCache alone: network first for pages, RSC
// payloads and same-origin /api/* (including /api/proxy/*), with the cached copy
// served only when the network fails. Responses are kept up to 24h.
//
// Rules are matched in order and defaultCache ends with catch-alls, so any rule
// appended after it never runs. Custom rules must go BEFORE the spread. The
// per-route rules that used to sit after it were dead code; the caching redesign
// belongs to the offline phase of the native-apps roadmap.
//
// Cached responses include one user's private data (transactions, profile,
// notifications). They are wiped when the session ends or changes hands — see
// lib/device-data.ts.
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()
