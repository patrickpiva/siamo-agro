-- ============================================================================
-- 001_postgis.sql — PostGIS + coluna geográfica de `locations` (setup canônico)
-- ----------------------------------------------------------------------------
-- Espelha o ambiente de PRODUÇÃO: PostGIS instalado no schema `extensions`
-- (recomendação Supabase — mantém `public` limpo e evita o falso-positivo
-- rls_disabled_in_public em `spatial_ref_sys`).
--
-- Aplicar UMA vez por ambiente novo, no SQL Editor do Supabase, logo após a
-- migração inicial do schema (ver CLAUDE.md §4).
--
-- O que faz:
--   1. instala PostGIS no schema `extensions`
--   2. adiciona `locations.geog geography(Point,4326)`
--   3. cria trigger que mantém `geog` sincronizado com latitude/longitude
--      ⚠️ sem o trigger, locations criadas/atualizadas pelo app (Prisma só
--      escreve latitude/longitude) ficam com geog = NULL e o matchmaking não
--      as enxerga — ver apps/api/src/workers/matchmaking/processor.ts
--   4. cria índice GiST usado por ST_DWithin / ST_Distance
--   5. backfill das linhas existentes
--
-- O app chama funções PostGIS sem qualificar (ST_DWithin, ST_MakePoint…); no
-- Supabase o schema `extensions` já está no search_path padrão, então as
-- chamadas bare resolvem. Esta migração qualifica explicitamente (`extensions.*`)
-- para ser robusta independente do search_path no momento da execução.
--
-- Idempotente.
-- ============================================================================

-- 1. PostGIS no schema extensions
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- 2. Coluna geográfica derivada de latitude/longitude
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS geog extensions.geography(Point, 4326);

-- 3. Função + trigger de sincronização (geog ← lng/lat)
CREATE OR REPLACE FUNCTION public.sync_location_geog()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.geog := extensions.ST_MakePoint(NEW.longitude, NEW.latitude)::extensions.geography;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_location_geog ON public.locations;
CREATE TRIGGER trg_sync_location_geog
  BEFORE INSERT OR UPDATE OF latitude, longitude ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_location_geog();

-- 4. Índice espacial GiST
CREATE INDEX IF NOT EXISTS idx_locations_geog
  ON public.locations USING GIST (geog);

-- 5. Backfill das linhas existentes
UPDATE public.locations
SET geog = extensions.ST_MakePoint(longitude, latitude)::extensions.geography
WHERE geog IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Verificação:
--   SELECT extname, n.nspname FROM pg_extension e
--   JOIN pg_namespace n ON n.oid = e.extnamespace WHERE extname = 'postgis';
--   -- esperado: extensions
--
--   SELECT count(*) FILTER (WHERE geog IS NOT NULL) AS com_geog, count(*) AS total
--   FROM public.locations;
-- ----------------------------------------------------------------------------
