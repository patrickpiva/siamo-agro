-- Security hardening for Supabase linter warnings
-- Run in Supabase SQL Editor.
--
-- NOT addressed here (known false positives):
--   • extension_in_public (postgis) — moving PostGIS out of public requires
--     DROP EXTENSION postgis CASCADE, which destroys all geography data.
--     Accepted as a known limitation for projects that use PostGIS on Supabase.

-- ─── 1. Pin search_path on sync_location_geog ────────────────────────────────
-- Prevents search_path injection attacks on our trigger function.
-- SECURITY INVOKER (default) + fixed search_path is the recommended pattern.

CREATE OR REPLACE FUNCTION public.sync_location_geog()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.geog := ST_MakePoint(NEW.longitude, NEW.latitude)::geography;
  RETURN NEW;
END;
$$;

-- ─── 2. Revoke anon/authenticated EXECUTE on PostGIS st_estimatedextent ──────
-- These are internal PostGIS functions exposed via PostgREST because PostGIS
-- lives in the public schema. AgraIA never calls them via REST — revoke access.

REVOKE EXECUTE
  ON FUNCTION public.st_estimatedextent(text, text)
  FROM anon, authenticated;

REVOKE EXECUTE
  ON FUNCTION public.st_estimatedextent(text, text, text)
  FROM anon, authenticated;

REVOKE EXECUTE
  ON FUNCTION public.st_estimatedextent(text, text, text, boolean)
  FROM anon, authenticated;
