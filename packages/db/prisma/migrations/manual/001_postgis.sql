-- =============================================================================
-- 001_postgis.sql — Extensão PostGIS + coluna geográfica em locations
--
-- COMO APLICAR:
--   1. Gere o schema base com o Prisma (via migrate diff + SQL Editor)
--   2. Copie este arquivo inteiro e execute no SQL Editor do Supabase
--      (Database → SQL Editor → New query)
--   3. Esta migration é idempotente: pode ser re-executada sem efeitos colaterais
--
-- POR QUE MANUAL:
--   O Prisma não suporta o tipo `geography` do PostGIS nem triggers.
--   A coluna `geog` é invisível ao Prisma — ele usa latitude/longitude normalmente.
--   O trigger garante que `geog` nunca fique fora de sincronia.
-- =============================================================================

-- 1. Ativa a extensão PostGIS ─────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Adiciona coluna geográfica ───────────────────────────────────────────────

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS geog geography(Point, 4326);

-- 3. Popula geog para linhas já existentes ────────────────────────────────────

UPDATE locations
SET geog = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE geog IS NULL;

-- 4. Índice GIST para consultas geoespaciais ───────────────────────────────────
-- Habilita ST_DWithin e ST_Distance eficientes (busca por raio, ordenação por distância)

CREATE INDEX IF NOT EXISTS idx_locations_geog ON locations USING GIST (geog);

-- 5. Função de sincronização ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION sync_location_geog()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geog = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger: dispara em INSERT e UPDATE de lat/lng ───────────────────────────

DROP TRIGGER IF EXISTS trg_sync_location_geog ON locations;

CREATE TRIGGER trg_sync_location_geog
  BEFORE INSERT OR UPDATE OF latitude, longitude
  ON locations
  FOR EACH ROW
  EXECUTE FUNCTION sync_location_geog();

-- 7. CHECK constraint no score de ratings ─────────────────────────────────────
-- Prisma não suporta CHECK constraints — aplicado aqui

ALTER TABLE ratings
  DROP CONSTRAINT IF EXISTS chk_rating_score;

ALTER TABLE ratings
  ADD CONSTRAINT chk_rating_score CHECK (score >= 1 AND score <= 5);

-- =============================================================================
-- EXEMPLO DE USO — busca listings em raio de 50 km a partir de um ponto
-- =============================================================================
--
-- SELECT l.id, l.title, ST_Distance(loc.geog, ref.geog) / 1000 AS distance_km
-- FROM listings l
-- JOIN profiles p ON l.profile_id = p.id
-- JOIN locations loc ON p.id = loc.profile_id
-- CROSS JOIN (
--   SELECT ST_SetSRID(ST_MakePoint(-47.9292, -15.7801), 4326)::geography AS geog
-- ) ref
-- WHERE ST_DWithin(loc.geog, ref.geog, 50000)   -- 50.000 metros = 50 km
--   AND l.status = 'ACTIVE'
-- ORDER BY distance_km;
-- =============================================================================
