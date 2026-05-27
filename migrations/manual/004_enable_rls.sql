-- Enable Row Level Security on all public tables
--
-- AgraIA accesses the database exclusively via Fastify + Prisma.
-- The DATABASE_URL connects as the postgres/service role, which has BYPASSRLS
-- privilege and is unaffected by these policies.
--
-- Enabling RLS without permissive policies blocks direct PostgREST access
-- (anon / authenticated roles) while leaving the Fastify API fully functional.
--
-- Run in Supabase SQL Editor.

-- ─── Application tables ───────────────────────────────────────────────────────
ALTER TABLE users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations                ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_photos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_scores             ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens           ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_listings           ENABLE ROW LEVEL SECURITY;

-- ─── PostGIS system table ─────────────────────────────────────────────────────
-- spatial_ref_sys is owned by the PostGIS extension; we cannot enable RLS on it.
-- The Supabase linter flags it as a known false positive — no action needed.
