-- Migration: add saved_listings table
-- Apply via Supabase SQL Editor, then run: pnpm db:generate

CREATE TABLE "saved_listings" (
    "id"         TEXT        NOT NULL,
    "user_id"    TEXT        NOT NULL,
    "listing_id" TEXT        NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "saved_listings_pkey" PRIMARY KEY ("id")
);

-- Unique: one save per user per listing
CREATE UNIQUE INDEX "saved_listings_user_id_listing_id_key"
    ON "saved_listings"("user_id", "listing_id");

-- Query indexes
CREATE INDEX "saved_listings_user_id_idx"    ON "saved_listings"("user_id");

-- Foreign keys
ALTER TABLE "saved_listings"
    ADD CONSTRAINT "saved_listings_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "saved_listings"
    ADD CONSTRAINT "saved_listings_listing_id_fkey"
        FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
