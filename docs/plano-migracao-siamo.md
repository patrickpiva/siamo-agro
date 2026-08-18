# Plano de Migração de Marca — AgraIA → Siamo

> **Status (2026-08-18)**
>
> | Item                                               | Estado                           |
> | -------------------------------------------------- | -------------------------------- |
> | PR 0 — prep (plano, script, limpeza)               | ✅ mergeado (#31)                |
> | PR 1 — rename interno `@agraia/*` → `@siamo/*`     | ✅ commitado — confirmar merge   |
> | PR 2 — marca user-facing                           | ⬜ pendente                      |
> | PR 3 — docs                                        | ⬜ pendente                      |
> | Domínio siamoagro.com (Namecheap) + DNS            | ✅ feito                         |
> | Vercel — domínios                                  | ✅ feito                         |
> | Railway — domínios                                 | ✅ feito                         |
> | Repo GitHub → `patrickpiva/siamo-agro`             | ✅ feito (antecipado da Fase 3)  |
> | Supabase — nome dos projetos                       | ✅ feito (antecipado da Fase 3)  |
> | Twilio/Meta — display name + novo Content Template | ⚠️ **caminho crítico — status?** |
> | Ícones Siamo (SVG + PNG 192/512)                   | ⬜ pendente                      |
> | Env vars apontando p/ siamoagro.com                | ⬜ só após PR 2 validado         |
> | Remover domínios/DNS de agra.ia.br                 | ⬜ último passo                  |

> Criado em 2026-08-07. Decisões de branding aprovadas pelos stakeholders.
> Auditoria feita por leitura dirigida dos arquivos-chave (o grep completo de
> verificação está na §7 — rodar antes de abrir cada PR).

---

## 1. Decisões aprovadas

| Decisão              | Valor                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------- |
| Nome de exibição     | **Siamo** em todos os pontos visíveis (títulos, manifest, splash, mensagens WhatsApp)       |
| Domínio principal    | **siamoagro.com**                                                                           |
| Estrutura de domínio | Espelha a atual: `app.` / `staging.` / `api.` / `api-staging.` `siamoagro.com`              |
| Escopo interno       | **Rename completo**: `@agraia/*` → `@siamo/*`, storage keys, cache names, eventos, repo     |
| Repositório GitHub   | Renomear `agraia` → `siamoagro` (ghcr.io acompanha automaticamente via `github.repository`) |
| agra.ia.br           | **Corte definitivo** — sem período de redirect (consequências na §5)                        |

---

## 2. Inventário de referências (auditoria)

### 2.1 User-facing (obrigatório mudar)

| Referência                                       | Arquivo                                                                     | O que muda                                           |
| ------------------------------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------- |
| `title: 'AgraIA'` + template `%s \| AgraIA`      | `apps/web/src/app/layout.tsx`                                               | → `Siamo` / `%s \| Siamo`                            |
| `appleWebApp.title: 'AgraIA'`                    | `apps/web/src/app/layout.tsx`                                               | → `Siamo`                                            |
| Splash `[AgraIA]` + id `agraia-splash`           | `apps/web/src/app/layout.tsx` + `splash-screen.tsx`                         | → `[Siamo]` + id `siamo-splash`                      |
| `name`/`short_name: "AgraIA"`                    | `apps/web/public/manifest.json`                                             | → `Siamo`                                            |
| Ícones PWA (`icon.svg`, PNGs placeholder)        | `apps/web/public/icons/`                                                    | Novo logo Siamo (PNGs 192/512 já eram TODO pendente) |
| Strings de marca em páginas                      | landing `/`, `/sobre`, `/termos`, `/privacidade`, `/ajuda`, onboarding LGPD | Enumerar via grep (§7)                               |
| Copy das mensagens WhatsApp (OTP + notify-match) | adapter Twilio em `apps/api` (localizar via grep)                           | → "Siamo"                                            |
| E-mail `suporte@agra.ia.br` (`VAPID_SUBJECT`)    | `.env.example` + envs nos provedores                                        | → `suporte@siamoagro.com` (criar a caixa antes)      |

### 2.2 Identificadores internos (rename completo aprovado)

| Referência                                                                           | Onde                                                                                                                                       |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Pacotes: `agraia` (root), `@agraia/web\|api\|db\|shared\|ui`                         | 6× `package.json` + `workspace:*` deps + **todos os imports**                                                                              |
| Aliases e configs que citam `@agraia/*`                                              | tsconfigs, `next.config.ts` (`transpilePackages`, `optimizePackageImports`), eslint, `turbo.json`, scripts do root (`--filter @agraia/db`) |
| `pnpm-lock.yaml`                                                                     | Regenerado com `pnpm install` após rename                                                                                                  |
| `localStorage` `agraia:offline-queue`                                                | `apps/web/src/lib/offline-queue.ts`                                                                                                        |
| `sessionStorage` `agraia:launched`                                                   | `layout.tsx` (script inline) + `splash-screen.tsx`                                                                                         |
| Eventos `agraia:reconnected`, `agraia:bookmark-toggled`                              | `hooks/use-online-status.ts`, `components/listings/bookmark-button.tsx`, `components/feed-list.tsx`                                        |
| Cache names SW: `agraia-api-listings`, `-profiles`, `-notifications`, `agraia-pages` | `apps/web/src/sw.ts`                                                                                                                       |
| Pasta local do repo `~/Documents/GitHub/agraia`                                      | Renomear junto com o repo GitHub                                                                                                           |

### 2.3 Infra e integrações externas

| Item                                                  | Estado atual                                                                   | Ação                                                                                                                                                                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DNS                                                   | registro.br (autoritativo de `agra.ia.br`)                                     | `siamoagro.com` é `.com` — registrar/gerenciar em registrador próprio (registro.br só opera `.br`)                                                                                                         |
| Vercel                                                | `app.agra.ia.br`, `staging.agra.ia.br`                                         | Adicionar `app.` e `staging.siamoagro.com` (CNAMEs `*.vercel-dns-017.com`)                                                                                                                                 |
| Railway                                               | `api.agra.ia.br`, `api-staging.agra.ia.br` + TXT `_railway-verify`             | Adicionar `api.` e `api-staging.siamoagro.com` + novos TXT de verificação                                                                                                                                  |
| Env vars (Vercel + Railway, prod/staging/**preview**) | `NEXT_PUBLIC_APP_URL`, `API_URL` apontam p/ agra.ia.br                         | Trocar para os novos domínios (CORS da API deriva de `NEXT_PUBLIC_APP_URL`)                                                                                                                                |
| Twilio / WhatsApp Business                            | Display name do sender + Content Template (`TWILIO_CONTENT_SID`) citam a marca | Renomear display name (revisão da Meta) + criar novos templates → novos SIDs. **Caminho crítico: lead time de aprovação**                                                                                  |
| ghcr.io                                               | `ghcr.io/<repo>/api` via `github.repository`                                   | Acompanha o rename do repo automaticamente; imagens antigas ficam órfãs (ok)                                                                                                                               |
| GitHub repo                                           | `agraia`                                                                       | Renomear → `siamoagro`; reconectar/validar integrações Vercel e Railway (ambas seguem o redirect do GitHub, mas verificar webhooks)                                                                        |
| Supabase                                              | Projetos `agraia-production` / `agraia-staging`                                | **Renomear projetos** → `siamoagro-production` / `siamoagro-staging` (cosmético, sem downtime). **Não** criar projetos novos: URLs `*.supabase.co` não carregam a marca e migrar refs exigiria mover dados |
| Banco de dados                                        | Schema sem marca (tabelas snake_case genéricas)                                | **Nenhuma ação**                                                                                                                                                                                           |

### 2.4 Documentação

- `CLAUDE.md` — título, visão do produto, tabelas de deploy/DNS, §13 contas demo, exemplos `@agraia/*`
- `README.md` — título, estrutura, comandos `--filter @agraia/*`
- `docs/especificacao-tecnica-sistema.md` e `docs/anexo-a-lacunas-tecnicas.md`
- `.env.example` — cabeçalho + `VAPID_SUBJECT`
- Comentários em `migrations/manual/*.sql` (se houver — grep)

### 2.5 Não afetado

Schema Prisma, dados no banco, `JWT_SECRET`/sessões (mas ver §5 sobre cookies), storage do Supabase, seed (telefones demo), Redis.

### 2.6 Confirmado pelo grep completo (rodado em 2026-08-07)

Itens adicionais que a auditoria por leitura não tinha coberto:

| Item                                                                                                                                                        | Classificação                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`rename.sh` (raiz)**                                                                                                                                      | 🎁 Playbook do rename anterior (AgroLink → AgraIA). Adaptar para Siamo — mesma estratégia de sed em ordem específico→genérico + lockfile + typecheck + build + grep de verificação |
| `packages/shared/src/constants/index.ts`                                                                                                                    | `APP_NAME = 'AgraIA'` + `APP_DESCRIPTION` — constante central, rename barato                                                                                                       |
| `apps/api/src/integrations/whatsapp/templates.ts`                                                                                                           | Só o template `otp` cita a marca; os outros 8 são neutros → escopo Meta menor                                                                                                      |
| `apps/api/src/adapters/whatsapp/` (twilio.ts, evolution.ts)                                                                                                 | **Código morto** — substituído por `integrations/whatsapp/`. Remover em PR separado antes do rename (menos arquivos para tocar)                                                    |
| `Dockerfile`                                                                                                                                                | `--filter @agraia/api` — coberto pelo rename de escopo                                                                                                                             |
| `.claude/launch.json`                                                                                                                                       | `--filter @agraia/web\|api` — coberto pelo rename de escopo                                                                                                                        |
| `.claude/skills/*/SKILL.md` (5 skills)                                                                                                                      | Exemplos citam `@agraia/*` — incluir no PR de docs                                                                                                                                 |
| `.claude/settings.local.json`                                                                                                                               | Paths/permissões locais — ajustar após rename da pasta                                                                                                                             |
| `migrations/manual/seed_data.sql`, `004_enable_rls.sql`, `005_security_fixes.sql`                                                                           | Histórico de SQL já aplicado — **não reaplicar**; atualizar apenas se `seed_data.sql` tiver a marca em VALORES (re-seed de staging), comentários podem ficar                       |
| `docs/roteiro-testes-e2e.html`, `screenshots-jornada-light/journey-map.json`, `apps/web/scripts/capture-journey.mjs`, `apps/web/e2e/special-states.spec.ts` | Docs/tooling — PR de docs                                                                                                                                                          |
| `apps/web/public/sw.js`, `apps/web/tsconfig.tsbuildinfo`                                                                                                    | Artefatos de build — regenerados automaticamente, não editar à mão                                                                                                                 |
| `.claude/worktrees/pedantic-curie-e3ad1b/`                                                                                                                  | Worktree antigo abandonado — limpar antes do rename para não poluir o grep                                                                                                         |
| ~170 arquivos web/api restantes                                                                                                                             | Apenas imports `@agraia/*` — mecânico, coberto pelo sed do script                                                                                                                  |

---

## 2b. Checklist por provedor (console/dashboard)

Todos os provedores são atualizados — identidade, conexões e variáveis. Nada fica com o nome antigo:

| Provedor                   | O que atualizar no console                                                                                                                                                                                                                  | Fase  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| **Vercel**                 | Nome do projeto → `siamoagro-web`; domínios novos (prod + staging); env vars `NEXT_PUBLIC_APP_URL`/`API_URL` em Production/Preview/Development; reconexão com o repo renomeado                                                              | 1 e 3 |
| **Railway**                | Nome do projeto e dos serviços (`api`, `worker` podem ficar, projeto → `siamoagro`); domínios custom + TXT verify; env vars nos DOIS serviços e DOIS ambientes; GitHub integration pós-rename; confirmar App Sleeping OFF segue configurado | 1 e 3 |
| **Supabase**               | Renomear projetos → `siamoagro-production` / `siamoagro-staging` (Settings → General). Sem migração de ref/dados. Conferir se algum bucket de Storage carrega a marca no nome                                                               | 3     |
| **GitHub**                 | Repo `agraia` → `siamoagro`; descrição/About com novo nome e URL; ghcr.io acompanha; conferir badges/links no README                                                                                                                        | 3     |
| **Twilio/Meta**            | Display name do WhatsApp Business → "Siamo"; novos Content Templates (OTP cita a marca) → novos `TWILIO_CONTENT_SID` nas envs do Railway                                                                                                    | 0     |
| **registro.br**            | Remover os CNAMEs/TXTs de `agra.ia.br` (corte definitivo); avaliar liberar o domínio na renovação                                                                                                                                           | 3     |
| **Registrador .com**       | Registrar `siamoagro.com` + zona DNS (4 CNAMEs + TXTs Railway)                                                                                                                                                                              | 0/1   |
| **Redis (Railway plugin)** | Nada — `REDIS_URL` é injetada e não carrega marca                                                                                                                                                                                           | —     |
| **Nominatim/ViaCEP**       | Conferir se o client envia `User-Agent`/`Referer` com a marca (política do Nominatim exige identificação do app) — atualizar se sim                                                                                                         | 2     |

## 3. Fases de migração

### Fase 0 — Pré-requisitos externos (começar JÁ — maior lead time)

1. Registrar `siamoagro.com` + configurar zona DNS.
2. Criar caixa `suporte@siamoagro.com`.
3. Twilio: renomear display name do WhatsApp Business e submeter novos Content
   Templates com "Siamo" → aguardar aprovação da Meta → novos `TWILIO_CONTENT_SID`.
4. Assets de marca: novo `icon.svg` + gerar `icon-192.png`/`icon-512.png`
   (resolve o TODO pendente de PNGs junto).

### Fase 1 — Infra em dual-run (sem tocar em código)

1. Vercel: adicionar `app.siamoagro.com` (prod) e `staging.siamoagro.com` (staging).
2. Railway: adicionar `api.siamoagro.com` e `api-staging.siamoagro.com` + TXT de verificação.
3. DNS: criar os 4 CNAMEs + TXTs. Ambos os domínios respondem em paralelo nesta fase.
4. **Ainda não** trocar env vars — o app continua se identificando pelos domínios antigos.

### Fase 2 — Código (3 PRs, um propósito cada, via `staging`)

**PR 0 — `chore/remove-dead-whatsapp-adapters`** (preparação)

- Remover `apps/api/src/adapters/whatsapp/` (código morto, substituído por `integrations/whatsapp/`).
- Limpar worktree abandonado `.claude/worktrees/pedantic-curie-e3ad1b/`.

**PR 1 — `chore/rebrand-siamo-internals`** (mecânico, sem mudança visível)

- Adaptar `rename.sh` (playbook do rename AgroLink → AgraIA que já funcionou neste repo):
  sed em ordem específico → genérico: `@agraia/` → `@siamo/`, `agraia:` → `siamo:`,
  `agraia-` → `siamo-` (splash id + cache names SW), `AgraIA` → `Siamo`,
  `agra.ia.br` → `siamoagro.com`, `agraia` → `siamoagro` (root package/repo refs).
- Cobre: package.json ×6, imports, tsconfigs, next.config, eslint, Dockerfile, `.claude/launch.json`, scripts do root.
- `pnpm install` para regenerar o lockfile; `pnpm typecheck && pnpm test && pnpm build` como gate.

**PR 2 — `feat/rebrand-siamo-brand`** (visível ao usuário)

- `layout.tsx` metadata + splash, `manifest.json`, ícones novos.
- Strings de marca nas páginas (landing, sobre, termos, privacidade, ajuda, consentimento LGPD).
- Copy WhatsApp (OTP + notify-match) + troca dos `TWILIO_CONTENT_SID` (staging primeiro).

**PR 3 — `docs/rebrand-siamo`**

- CLAUDE.md, README.md, docs/, `.env.example` (`VAPID_SUBJECT`).

### Fase 3 — Cutover

1. Validar em staging (`staging.siamoagro.com` + env vars de staging já trocadas):
   login OTP real, feed/matches, proposta+chat, instalação PWA, fila offline, push prompt.
2. Merge `staging` → `main`.
3. Trocar env vars de **produção** (`NEXT_PUBLIC_APP_URL`, `API_URL` — Vercel prod/preview + Railway api/worker).
4. Renomear repo GitHub `agraia` → `siamoagro`; confirmar que CI (ghcr push) e os
   deploys Vercel/Railway seguem funcionando; renomear a pasta local.
5. Remover domínios antigos da Vercel/Railway e apagar os registros DNS de
   `agra.ia.br` (corte definitivo aprovado).

### Fase 4 — Pós-migração

- Monitorar erros (Vercel Analytics, logs Railway) por 1 semana.
- Atualizar memória do projeto / CLAUDE.md §11 com o novo estado.

---

## 3b. Runbook detalhado — Domínio, Vercel e Railway

> Regra de ouro da ordem: **adicione o domínio no provedor primeiro** (Vercel/Railway
> mostram o valor exato do CNAME/TXT), **depois** crie o registro no DNS.

### Domínio (siamoagro.com)

1. **[Fase 0]** Registrar `siamoagro.com` em um registrador de `.com` (Cloudflare
   Registrar, Namecheap etc.). Se usar Cloudflare como DNS: registros em modo
   **DNS only** (nuvem cinza) — o setup atual é sem proxy e os certs da Vercel e
   do Railway são emitidos via verificação direta.
2. **[Fase 1]** Criar os registros conforme os valores mostrados pelos provedores:

   | Tipo  | Nome                            | Valor                                            |
   | ----- | ------------------------------- | ------------------------------------------------ |
   | CNAME | `app.siamoagro.com`             | alvo mostrado pela Vercel (`*.vercel-dns-*.com`) |
   | CNAME | `staging.siamoagro.com`         | idem                                             |
   | CNAME | `api.siamoagro.com`             | alvo mostrado pelo Railway (`*.up.railway.app`)  |
   | CNAME | `api-staging.siamoagro.com`     | idem                                             |
   | TXT   | `_railway-verify.api.…`         | valor mostrado pelo Railway                      |
   | TXT   | `_railway-verify.api-staging.…` | valor mostrado pelo Railway                      |
   | A     | `siamoagro.com` (apex)          | `76.76.21.21` (Vercel) — redirect p/ app         |
   | CNAME | `www.siamoagro.com`             | `cname.vercel-dns.com` — redirect p/ app         |

3. Verificar propagação: `dig +short app.siamoagro.com` etc.; certs aparecem como
   emitidos nos dashboards.
4. **[Fase 3]** Apagar no registro.br os 4 CNAMEs + 2 TXTs de `agra.ia.br`.

### Vercel

1. **[Fase 1]** Projeto web → Settings → Domains → **Add** `app.siamoagro.com`,
   atribuído ao branch de produção (`main`). Copiar o CNAME mostrado → DNS → esperar
   "Valid Configuration" + certificado.
2. **Add** `staging.siamoagro.com` atribuído ao branch `staging`.
3. **Add** `siamoagro.com` e `www.siamoagro.com` com **Redirect** para
   `app.siamoagro.com` (308).
4. Ambos os domínios (novo e antigo) servem em paralelo — nada de env vars ainda.
5. **[Fase 3]** Settings → Environment Variables:
   - `NEXT_PUBLIC_APP_URL` — Production: `https://app.siamoagro.com`; Preview
     (escopo branch `staging`): `https://staging.siamoagro.com`
   - `API_URL` — Production: `https://api.siamoagro.com`; Preview (branch
     `staging`): `https://api-staging.siamoagro.com`
   - `JWT_SECRET` e demais: **não mexer**
6. **Redeploy** (env var só vale em novo deploy).
7. Após o rename do repo GitHub: Settings → Git — confirmar que o projeto aponta
   para `siamoagro`; se webhook quebrar, disconnect/reconnect.
8. Settings → General → renomear projeto (`siamoagro-web`) — muda a URL
   `*.vercel.app` default, sem impacto.
9. Remover `app.agra.ia.br` e `staging.agra.ia.br` do projeto.

### Railway

1. **[Fase 1]** Ambiente **production** → serviço `api` → Settings → Networking →
   **Custom Domain** → `api.siamoagro.com`. Copiar CNAME (+ TXT `_railway-verify`)
   → DNS → esperar cert.
2. Ambiente **staging** → serviço `api` → `api-staging.siamoagro.com`, idem.
3. Worker não tem domínio — nada a fazer na Fase 1.
4. **[Fase 3]** Variáveis — nos **DOIS serviços** (api E worker), nos **DOIS
   ambientes**: `NEXT_PUBLIC_APP_URL` → novo domínio do app (controla CORS da API e
   links das notificações WhatsApp). Aceitar o redeploy que o Railway propõe.
5. `TWILIO_CONTENT_SID` → novo SID (api + worker) quando o template Meta for aprovado.
6. Após o rename do repo GitHub: conferir em cada serviço Settings → Source que os
   deploys continuam disparando (fazer um push trivial ou checar webhooks) —
   reconectar se necessário.
7. Confirmar **App Sleeping OFF** nos dois serviços, dois ambientes (não deveria
   mudar, mas é barato conferir).
8. Renomear o projeto no dashboard (cosmético).
9. Remover `api.agra.ia.br` e `api-staging.agra.ia.br` dos serviços.

### Smoke test pós-cutover

```bash
curl -sI https://api.siamoagro.com/health | head -1
curl -sI https://app.siamoagro.com | head -1
curl -sI https://siamoagro.com | head -3          # 308 → app.
```

Login OTP real + criação de anúncio + proposta no app novo; conferir headers de
CORS respondendo para `https://app.siamoagro.com`.

## 4. Ordem de dependência (resumo)

```
Fase 0 (Twilio/DNS/assets)  ──┐
Fase 1 (domínios dual-run)  ──┼──►  Fase 2 (PRs em staging)  ──►  Fase 3 (cutover)  ──►  Fase 4
                              │      PR1 → PR2 → PR3
Aprovação Meta (templates) ───┘      (PR2 depende da Fase 0.3)
```

---

## 5. Riscos e efeitos colaterais aceitos

| Risco                                                                                                      | Severidade | Mitigação / status                                                    |
| ---------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------- |
| **PWAs instalados quebram** no corte de agra.ia.br (origin morre; sem redirect não há migração automática) | Alta       | **Aceito pelos stakeholders — sem comunicação prévia necessária**     |
| Links/bookmarks antigos morrem (SEO, materiais impressos, conversas)                                       | Média      | Aceito pelos stakeholders                                             |
| Sessões: cookies são por host — todos os usuários deslogados no novo domínio                               | Baixa      | Inevitável em troca de domínio; OTP de re-login é rápido              |
| Perda da fila offline e caches locais (rename das keys `agraia:*`)                                         | Baixa      | Aceito na decisão de rename completo                                  |
| Templates WhatsApp: enviar com template antigo após rebrand (marca errada) ou novo template reprovado      | Média      | Fase 0 primeiro; staging valida antes do cutover                      |
| Rename do repo: webhook Vercel/Railway órfão                                                               | Média      | Verificar deploys imediatamente após rename; reconectar se necessário |
| Baseline do Prisma **não** é afetado (rename não toca schema)                                              | —          | Nenhuma migration necessária                                          |
| Memória do Claude Code é indexada pelo path da pasta — renomear a pasta local zera a memória do projeto    | Baixa      | Copiar `~/.claude/projects/-...-agraia/memory/` para o novo path      |

---

## 6. O que NÃO fazer

- Não criar projetos Supabase novos (migração de dados desnecessária) — apenas renomear os existentes no dashboard.
- Não tocar no schema Prisma nem gerar migration — o banco não tem a marca.
- Não fazer um PR único gigante — são 3 PRs (internals / brand / docs).
- Não trocar env vars de produção antes do staging validado.
- Não apagar o DNS antigo antes do passo 3.5 (domínios novos verificados e ativos).

---

## 7. Verificação de completude

Rodar antes de cada PR e como gate final (deve retornar vazio ao fim da Fase 3,
exceto histórico em `docs/plano-migracao-siamo.md`):

```bash
grep -rinE "agraia|agra\.ia\.br" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=.turbo --exclude-dir=.git --exclude=pnpm-lock.yaml -l
```

> Grep completo rodado em 2026-08-07 — inventário consolidado na §2.6.
> Re-rodar como gate ao fim de cada PR da Fase 2 e no fechamento da Fase 3.
