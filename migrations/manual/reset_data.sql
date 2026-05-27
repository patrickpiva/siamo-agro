-- Reset all data (keep schema intact)
-- Run in Supabase SQL Editor before re-seeding.
-- Truncates all tables and resets the short_id sequence on transactions.

TRUNCATE TABLE
  match_scores,
  saved_listings,
  notifications,
  notification_preferences,
  ratings,
  transaction_messages,
  transactions,
  listing_photos,
  listings,
  locations,
  profiles,
  otp_codes,
  refresh_tokens,
  users
RESTART IDENTITY CASCADE;
