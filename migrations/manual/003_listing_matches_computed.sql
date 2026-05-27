-- Add matches_computed_at to listings
-- Tracks when the matchmaking worker last ran for a listing.
-- Used by GET /me/feed/matches to distinguish "computing" from "no results".
-- Run in Supabase SQL Editor.

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS matches_computed_at TIMESTAMPTZ;
