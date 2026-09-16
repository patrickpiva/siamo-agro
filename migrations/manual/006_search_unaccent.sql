-- ============================================================================
-- 006_search_unaccent.sql — accent-insensitive search + fuzzy fallback
-- ----------------------------------------------------------------------------
-- WHY:
--   Search on /listings?search= was accent-sensitive. Measured on staging
--   (2026-08-25), against the SAME 19 active rows in the database:
--
--     search=agronômica  → 1 result       search=agronomica  → 0
--     search=hortaliças  → 1 result       search=hortalicas  → 0
--     search=veterinário → 1 result       search=veterinario → 0
--
--   Users in the field type on a phone keyboard, without accents. Today they
--   get "no results" for listings that do exist.
--
--   Two smaller problems on the same path:
--     - plainto_tsquery requires ALL terms (AND): "soja milho" returned 1
--       result while "soja" alone returned 5.
--     - a typo zeroes the search out: "colheitadera" → 0.
--
-- WHAT THIS DOES:
--   1. installs `unaccent` and `pg_trgm` into the `extensions` schema (as 001 does)
--   2. creates `immutable_unaccent()` — IMMUTABLE wrapper, required to index
--   3. creates `listing_search_document()` — the listing's canonical tsvector
--   4. creates a GIN index over that document (replaces the one from 005)
--   5. creates a trigram GIN index on the title, for the typo fallback
--
-- ⚠️ ABOUT `immutable_unaccent`:
--   `extensions.unaccent(text)` is STABLE, not IMMUTABLE — the dictionary can be
--   reloaded at runtime, so Postgres refuses to use it in an index. The wrapper
--   below uses the 2-argument form, pinning the dictionary explicitly, and
--   declares IMMUTABLE. This is the canonical workaround, but it is a PROMISE:
--   if the server's `unaccent.rules` file changes, the indexes become
--   inconsistent and need a REINDEX. In practice that only happens on a Postgres
--   major upgrade — add REINDEX to the Supabase upgrade runbook.
--
-- HOW TO APPLY:
--   1. Supabase → STAGING project → SQL Editor → paste this file → Run
--   2. Run the verification queries at the bottom
--   3. Test accent-free search on staging (`agronomica` must find 1)
--   4. Repeat on the PRODUCTION project
--
-- Idempotent: re-running causes no error.
-- ============================================================================

-- ── 1. Extensions in the `extensions` schema ────────────────────────────────
-- Same reasoning as PostGIS in 001: keeps `public` clean and avoids the
-- rls_disabled_in_public false positive from the Supabase linter.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm  WITH SCHEMA extensions;

-- ── 2. Indexable unaccent ───────────────────────────────────────────────────
-- The 2-argument form (regdictionary, text) is what allows marking it IMMUTABLE.
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE STRICT PARALLEL SAFE
AS $$
  SELECT extensions.unaccent('extensions.unaccent'::regdictionary, $1)
$$;

-- ── 3. Canonical search document for a listing ──────────────────────────────
-- SINGLE source of the indexed expression. The service calls this same function
-- in both the WHERE clause and ts_rank — if the two ever diverge, the index
-- stops being used and search falls back to a seq scan computing to_tsvector
-- row by row.
-- COALESCE instead of STRICT: a NULL description would null out the whole
-- document and the listing would vanish from search entirely.
CREATE OR REPLACE FUNCTION public.listing_search_document(title text, description text)
RETURNS tsvector
LANGUAGE sql
IMMUTABLE PARALLEL SAFE
AS $$
  SELECT to_tsvector(
    'portuguese',
    public.immutable_unaccent(COALESCE(title, '') || ' ' || COALESCE(description, ''))
  )
$$;

-- ── 4. Full-text search GIN index (accent-insensitive) ──────────────────────
-- Created BEFORE dropping the old one, so there is no window without an index.
-- No CONCURRENTLY: the SQL Editor runs inside a transaction and the table is
-- still small (brief lock).
CREATE INDEX IF NOT EXISTS listings_search_unaccent_idx
  ON public.listings
  USING GIN (public.listing_search_document(title, description));

-- Superseded by the index above (this one was accent-sensitive).
DROP INDEX IF EXISTS public.listings_search_portuguese_idx;

-- ── 5. Title trigram index (typo fallback) ──────────────────────────────────
-- Supports the pg_trgm operators % , <% and %>. The service uses `<%`
-- (word_similarity): it compares the search term against the BEST-matching word
-- in the title rather than the whole title — "colheitadera" against
-- "Colheitadeira Case IH 8120 — locação por safra" scores far too low on the
-- full title, but scores high in word_similarity against the word
-- "Colheitadeira".
CREATE INDEX IF NOT EXISTS listings_title_trgm_idx
  ON public.listings
  USING GIN (public.immutable_unaccent(title) extensions.gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- Verification
-- ----------------------------------------------------------------------------
-- 1. Extensions in the right schema (expected: `extensions` for both):
-- SELECT e.extname, n.nspname FROM pg_extension e
-- JOIN pg_namespace n ON n.oid = e.extnamespace
-- WHERE e.extname IN ('unaccent', 'pg_trgm');
--
-- 2. Indexes present (expected: listings_search_unaccent_idx and
--    listings_title_trgm_idx; listings_search_portuguese_idx ABSENT):
-- SELECT indexname FROM pg_indexes WHERE tablename = 'listings' ORDER BY 1;
--
-- 3. Accents no longer matter (both columns must return the SAME count):
-- SELECT
--   count(*) FILTER (WHERE public.listing_search_document(title, description)
--     @@ websearch_to_tsquery('portuguese', public.immutable_unaccent('agronômica'))) AS with_accent,
--   count(*) FILTER (WHERE public.listing_search_document(title, description)
--     @@ websearch_to_tsquery('portuguese', public.immutable_unaccent('agronomica'))) AS without_accent
-- FROM public.listings WHERE status = 'ACTIVE';
--
-- 4. Search uses the new GIN (the plan must show a Bitmap Index Scan on
--    listings_search_unaccent_idx, not a Seq Scan):
-- EXPLAIN ANALYZE SELECT id FROM public.listings
-- WHERE public.listing_search_document(title, description)
--       @@ websearch_to_tsquery('portuguese', public.immutable_unaccent('agronomica'));
--
-- 5. Typo fallback (must find the colheitadeira):
-- SELECT title FROM public.listings
-- WHERE public.immutable_unaccent('colheitadera') <% public.immutable_unaccent(title);
-- ----------------------------------------------------------------------------
