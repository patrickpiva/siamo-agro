import type { Route } from 'next'

/**
 * Typed route helper — casts a dynamic string to Next.js Route type.
 *
 * Necessary because template literals have type `string` while `router.push()`
 * and `Link href` require `Route` when `typedRoutes: true` is enabled.
 *
 * Uses a function overload so the implementation body returns `string` (no
 * type assertion needed) while callers receive `Route`. This keeps ESLint
 * clean in both contexts: locally where `.next/types` exists and Route is the
 * generated union, and in CI where it hasn't been built and Route = string.
 */
export function route(path: string): Route
export function route(path: string): string {
  return path
}
