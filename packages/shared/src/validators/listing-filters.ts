import { z } from 'zod'
import { LISTING_KINDS } from './listing'

export const BADGE_TIERS = ['NONE', 'BRONZE', 'SILVER', 'GOLD'] as const
export type BadgeTierEnum = (typeof BADGE_TIERS)[number]

/**
 * Multi-value query params travel comma-separated: `?kind=OFFER,DEMAND`.
 *
 * Chosen over repeated params (`?kind=OFFER&kind=DEMAND`) because the web side
 * round-trips these through `URLSearchParams` / `useSearchParams`, where a
 * single `get()` per key is the natural read and repeated keys need `getAll()`
 * plumbing at every call site.
 *
 * A single value still parses to a one-element array, so `?kind=OFFER` keeps
 * working exactly as before this filter became multi-valued.
 */
function csvOf<T extends z.ZodTypeAny>(item: T) {
  return z
    .string()
    .transform((raw) =>
      raw
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0),
    )
    .pipe(z.array(item).min(1))
    .optional()
}

/** `?kind=OFFER,DEMAND` — unknown values are rejected with 422. */
export const listingKindsFilter = csvOf(z.enum(LISTING_KINDS))

/**
 * `?badge=GOLD,SILVER` — filters on the seller's reputation seal.
 * `NONE` is a real tier, not "no filter": omit the param to skip the filter.
 */
export const listingBadgesFilter = csvOf(z.enum(BADGE_TIERS))

/**
 * `?category=COFFEE,SOY` — deliberately NOT an enum.
 *
 * `listings.category` is a plain text column and the single-valued version of
 * this filter has always accepted arbitrary strings. Narrowing to an enum now
 * would turn a hand-edited URL from "empty result list" into a 422 error page,
 * which is a worse experience for a browsable, shareable search URL.
 */
export const listingCategoriesFilter = csvOf(z.string().min(1))

/**
 * `?minMatchScore=0.7` — on the SAME 0–1 scale as `match_scores.score` and the
 * `matchScore` field returned on each listing. The UI presents match as 0–100,
 * so it divides before sending; keeping the API on one scale avoids a second
 * unit of measure in the contract.
 *
 * Requires an authenticated request: a match score only exists relative to a
 * specific viewer's profile.
 */
export const listingMinMatchScoreFilter = z.coerce.number().min(0).max(1).optional()
