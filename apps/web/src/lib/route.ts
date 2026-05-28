import type { Route } from 'next'

/**
 * Typed route helper — casts a dynamic string to Next.js Route type.
 *
 * Necessary because template literals have type `string` while `router.push()`
 * and `Link href` require `Route` when `typedRoutes: true` is enabled.
 *
 * Uses `as unknown as Route` internally to avoid the
 * `@typescript-eslint/no-unnecessary-type-assertion` lint error that fires when
 * ESLint runs without `.next/types` generated (where `Route` collapses to
 * `string`, making a direct `as Route` assertion look redundant).
 */
export function route(path: string): Route {
  return path as unknown as Route
}
