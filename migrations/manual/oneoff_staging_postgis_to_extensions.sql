-- ============================================================================
-- ONE-OFF (somente STAGING) — Move PostGIS de `public` para `extensions`
-- ----------------------------------------------------------------------------
-- NÃO faz parte da sequência canônica de migrations. Produção já está correta
-- (PostGIS em `extensions`). Este script existe só para alinhar STAGING e
-- eliminar o drift + o aviso do linter em public.spatial_ref_sys.
--
-- PostGIS não suporta `ALTER EXTENSION ... SET SCHEMA`, então o único caminho
-- é drop + recreate.
--
-- ⚠️  DESTRUTIVO porém SEGURO: remove a coluna derivada `geog` e a extensão,
--     depois recria tudo em `extensions` e RECONSTRÓI `geog` a partir de
--     latitude/longitude (que permanecem intactas). Nenhum dado de usuário é
--     perdido — só a coluna derivada é recalculada.
--
-- ANTES DE RODAR:
--   • rode só em STAGING, em janela de baixo tráfego
--   • PRÉ-CHECK de dependências (deve listar essencialmente locations.geog):
--       SELECT classid::regclass AS tipo, objid::regclass AS objeto
--       FROM   pg_depend
--       WHERE  refobjid = (SELECT oid FROM pg_extension WHERE extname = 'postgis')
--         AND  deptype = 'n';
--   • se `DROP EXTENSION` falhar por permissão (a extensão pode pertencer a
--     supabase_admin), NÃO insista — o app funciona igual com PostGIS em public;
--     nesse caso apenas reconheça o aviso de spatial_ref_sys no Security Advisor.
-- ============================================================================

-- 1. Remove a coluna derivada (CASCADE remove o índice GiST associado)
ALTER TABLE public.locations DROP COLUMN IF EXISTS geog CASCADE;

-- 2. Remove trigger/função de sync, se existirem
DROP TRIGGER IF EXISTS trg_sync_location_geog ON public.locations;
DROP FUNCTION IF EXISTS public.sync_location_geog();

-- 3. Remove PostGIS do schema public
DROP EXTENSION IF EXISTS postgis CASCADE;

-- 4. Reinstala em `extensions` e recria tudo (idêntico ao 001_postgis.sql)
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS geog extensions.geography(Point, 4326);

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

CREATE INDEX IF NOT EXISTS idx_locations_geog
  ON public.locations USING GIST (geog);

UPDATE public.locations
SET geog = extensions.ST_MakePoint(longitude, latitude)::extensions.geography
WHERE geog IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Verificação (esperado: schema = extensions; com_geog = total):
--   SELECT extname, n.nspname FROM pg_extension e
--   JOIN pg_namespace n ON n.oid = e.extnamespace WHERE extname = 'postgis';
--   SELECT count(*) FILTER (WHERE geog IS NOT NULL) AS com_geog, count(*) AS total
--   FROM public.locations;
-- Depois: rode um matchmaking de teste e confirme que candidatos aparecem.
-- ----------------------------------------------------------------------------
