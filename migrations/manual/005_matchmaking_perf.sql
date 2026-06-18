-- ============================================================================
-- 005_matchmaking_perf.sql — integridade de match_scores + índices de busca/feed
-- ----------------------------------------------------------------------------
-- MOTIVO:
--   1. match_scores não tinha UNIQUE (listing_id, candidate_profile_id):
--      recomputos concorrentes (worker com concurrency 10, jobs duplicados)
--      podiam persistir pares duplicados — o feed de matches mostraria o mesmo
--      anúncio repetido.
--   2. A busca full-text computava to_tsvector por linha em seq scan a cada
--      request de /listings?search=... — índice GIN resolve.
--   3. O feed pagina por (status, created_at DESC, id DESC) sem índice composto.
--   4. notifications_user_id_idx é prefixo de notifications_user_id_read_idx
--      (redundante); match_scores_listing_id_idx fica coberto pela nova UNIQUE.
--
-- COMO APLICAR:
--   1. Supabase → projeto STAGING → SQL Editor → cole este arquivo → Run
--   2. Rode as queries de verificação no final
--   3. Teste busca e feed de matches em staging
--   4. Repita no projeto de PRODUÇÃO
--
-- Idempotente: rodar novamente não causa erro.
-- ============================================================================

-- ── 1. Dedup de match_scores (mantém o registro mais recente de cada par) ────
DELETE FROM public.match_scores ms
USING public.match_scores dup
WHERE ms.listing_id = dup.listing_id
  AND ms.candidate_profile_id = dup.candidate_profile_id
  AND (ms.computed_at < dup.computed_at
       OR (ms.computed_at = dup.computed_at AND ms.id < dup.id));

-- ── 2. UNIQUE (listing_id, candidate_profile_id) ─────────────────────────────
-- Nome segue o padrão do Prisma para @@unique([listingId, candidateProfileId])
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'match_scores_listing_id_candidate_profile_id_key'
  ) THEN
    ALTER TABLE public.match_scores
      ADD CONSTRAINT match_scores_listing_id_candidate_profile_id_key
      UNIQUE (listing_id, candidate_profile_id);
  END IF;
END $$;

-- ── 3. Índice GIN para busca full-text em português ──────────────────────────
-- NÃO declarado no schema.prisma (índice de expressão — mesmo caso do geog em
-- 001_postgis.sql). Sem CONCURRENTLY: o SQL Editor roda em transação e as
-- tabelas ainda são pequenas (lock breve).
CREATE INDEX IF NOT EXISTS listings_search_portuguese_idx
  ON public.listings
  USING GIN (to_tsvector('portuguese', title || ' ' || description));

-- ── 4. Índice composto do keyset do feed ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS listings_status_created_at_id_idx
  ON public.listings (status, created_at DESC, id DESC);

-- ── 5. Índices redundantes ───────────────────────────────────────────────────
DROP INDEX IF EXISTS public.notifications_user_id_idx;     -- prefixo de (user_id, read)
DROP INDEX IF EXISTS public.match_scores_listing_id_idx;   -- prefixo da UNIQUE nova

-- ----------------------------------------------------------------------------
-- Verificação
-- ----------------------------------------------------------------------------
-- 1. Não pode haver pares duplicados (deve retornar 0 linhas):
-- SELECT listing_id, candidate_profile_id, COUNT(*)
-- FROM public.match_scores GROUP BY 1, 2 HAVING COUNT(*) > 1;
--
-- 2. Constraint e índices novos presentes:
-- SELECT conname FROM pg_constraint WHERE conrelid = 'public.match_scores'::regclass;
-- SELECT indexname FROM pg_indexes
-- WHERE tablename IN ('listings', 'notifications', 'match_scores') ORDER BY 1;
--
-- 3. Busca usando o GIN (plano deve mostrar Bitmap Index Scan no índice novo):
-- EXPLAIN ANALYZE SELECT id FROM public.listings
-- WHERE to_tsvector('portuguese', title || ' ' || description)
--       @@ plainto_tsquery('portuguese', 'café');
