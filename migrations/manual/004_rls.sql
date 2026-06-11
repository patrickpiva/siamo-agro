-- ============================================================================
-- 004_rls.sql — Habilita Row-Level Security (RLS) em todas as tabelas públicas
-- ----------------------------------------------------------------------------
-- MOTIVO (alerta de segurança Supabase: "rls_disabled_in_public"):
--   Com RLS desabilitado, qualquer pessoa com a anon key (que é pública e vai
--   embutida no browser) pode LER, EDITAR e EXCLUIR todos os dados via PostgREST:
--   https://<project>.supabase.co/rest/v1/<tabela>
--
-- POR QUE É SEGURO HABILITAR:
--   A aplicação NÃO acessa dados via PostgREST/anon. Todo acesso a tabelas é
--   feito pelo Prisma, conectado com a role `postgres` (atributo BYPASSRLS).
--   `@supabase/supabase-js` é usado apenas para Storage e Auth — nunca para
--   ler/escrever tabelas. Logo, habilitar RLS:
--     • fecha o buraco  → anon/authenticated ficam em negação por padrão
--     • não quebra o app → Prisma (postgres/service_role) ignora RLS
--   Não são necessárias policies: sem policy = sem acesso para anon/authenticated.
--
-- COMO APLICAR:
--   1. Supabase → projeto STAGING → SQL Editor → cole este arquivo → Run
--   2. Rode a query de verificação no final (rowsecurity deve ser `true` em todas)
--   3. Teste o app em staging (login, feed, anúncio, transação) — deve seguir igual
--   4. Repita no projeto de PRODUÇÃO (mesmo schema → mesma vulnerabilidade)
--
-- Idempotente: rodar novamente não causa erro.
-- ============================================================================

ALTER TABLE public.users                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_photos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_scores              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_listings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences  ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- (Opcional) Hardening extra: revoga grants padrão do PostgREST nas roles
-- públicas. Com RLS já habilitado a negação ocorre de qualquer forma; este
-- REVOKE é defesa em profundidade. Descomente se quiser aplicar.
-- ----------------------------------------------------------------------------
-- REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- ----------------------------------------------------------------------------
-- Verificação — deve retornar rowsecurity = true para as 14 tabelas do app.
-- ----------------------------------------------------------------------------
-- SELECT tablename, rowsecurity
-- FROM   pg_tables
-- WHERE  schemaname = 'public'
-- ORDER  BY tablename;

-- NOTA sobre `spatial_ref_sys`: essa tabela é criada pela extensão PostGIS e
-- pertence ao supabase_admin. Não tente habilitar RLS nela (dá erro de permissão)
-- — o aviso do linter para ela é um falso-positivo conhecido e seguro de ignorar.
