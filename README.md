# AgroLink

Plataforma digital de marketplace B2B que conecta **produtores rurais** a **prestadores de serviço** no agronegócio brasileiro — com reputação verificada, matchmaking por localização/especialidade e UX otimizada para conectividade limitada no campo.

---

## Stack

| Camada    | Tecnologia                                   |
| --------- | -------------------------------------------- |
| Frontend  | Next.js 15, React 19, Tailwind CSS v4        |
| Backend   | Fastify 5, TypeScript                        |
| Banco     | Supabase (PostgreSQL + PostGIS) via Prisma 6 |
| Validação | Zod 3                                        |
| UI        | shadcn/ui + Radix UI (`packages/ui`)         |
| Monorepo  | pnpm workspaces + Turborepo                  |
| Testes    | Vitest                                       |
| Workers   | BullMQ (matchmaking + reputação)             |
| Linting   | ESLint 9 (flat config) + Prettier 3          |
| Git hooks | Husky + lint-staged                          |

---

## Estrutura do monorepo

```
agrolink/
├── apps/
│   ├── web/          # Next.js 15 — App Router, Tailwind v4, TypeScript
│   │   ├── app/      # Rotas (Server Components por padrão)
│   │   ├── components/
│   │   └── lib/
│   └── api/          # Fastify 5 — API REST, TypeScript
│       └── src/
│           ├── modules/      # listings, transactions, reputation, me, …
│           └── workers/      # BullMQ: matchmaking, reputation
├── packages/
│   ├── db/           # Prisma schema + client (Supabase PostgreSQL)
│   ├── shared/       # Tipos, validadores Zod e constantes
│   └── ui/           # Componentes React reutilizáveis
├── migrations/       # SQL aplicado manualmente no Supabase
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Configuração inicial

### Pré-requisitos

- Node.js >= 20
- pnpm >= 9 — `npm install -g pnpm`
- Projeto criado no [Supabase](https://supabase.com) com extensão **PostGIS** habilitada

### Variáveis de ambiente

```bash
cp .env.example .env
```

| Variável                    | Onde encontrar                                                          |
| --------------------------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`              | Supabase → Settings → Database → Connection string (pooler, porta 6543) |
| `DIRECT_URL`                | Supabase → Settings → Database → Connection string (direct, porta 5432) |
| `SUPABASE_URL`              | Supabase → Settings → API → Project URL                                 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → Service role key                            |
| `SUPABASE_JWT_SECRET`       | Supabase → Settings → API → JWT Secret                                  |
| `REDIS_URL`                 | Redis local (`redis://localhost:6379`) ou Upstash                       |
| `API_URL`                   | URL da API Fastify — padrão `http://localhost:3001`                     |

### Instalação

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar git hooks
pnpm prepare

# 3. Gerar o Prisma Client
pnpm db:generate
```

### Banco de dados

> A conexão direta ao Supabase (`db.PROJECT.supabase.co:5432`) pode estar bloqueada em algumas redes. Por isso o projeto usa **diff entre arquivos de schema** em vez de `migrate dev`.

```bash
# Migração inicial (banco vazio → schema atual)
pnpm db:migrate:diff      # gera SQL completo → aplique no SQL Editor do Supabase

# Migração incremental (sprint a sprint)
pnpm db:migrate:diff:inc  # gera SQL delta entre schema.baseline.prisma → schema.prisma

# Após aplicar o SQL no Supabase, regenere o client
pnpm db:generate

# Popular o banco com dados de desenvolvimento
pnpm db:seed

# Inspecionar o banco visualmente
pnpm db:studio
```

---

## Desenvolvimento

```bash
# Iniciar web (:3000) e api (:3001) em paralelo
pnpm dev

# Apenas o frontend
pnpm --filter @agrolink/web dev

# Apenas a API
pnpm --filter @agrolink/api dev
```

---

## Testes, lint e build

```bash
pnpm test          # Vitest em todo o monorepo
pnpm test --watch  # modo watch

pnpm typecheck     # tsc --noEmit em todos os pacotes
pnpm lint          # ESLint (reporte)
pnpm lint:fix      # ESLint com correção automática

pnpm build         # build de produção (Turborepo resolve dependências)
```

---

## Features implementadas

### Autenticação

- OTP via WhatsApp (Supabase Auth)
- JWT com refresh token em cookie `httpOnly`

### Onboarding

- Wizard de 5 etapas: tipo de perfil → dados → localização (GPS + Nominatim/ViaCEP) → foto (presigned upload) → consentimento LGPD

### Anúncios

- Criação em wizard 4 passos (kind → detalhes → mídia → revisão)
- CRUD completo com soft delete, pause/resume
- Busca com filtros e geolocalização (PostGIS)
- Salvar/dessalvar anúncios (toggle + feed de salvos)

### Matchmaking

- Score composto: distância (40%) + compatibilidade (25%) + reputação (20%) + responsividade (15%)
- Processamento assíncrono via BullMQ
- Feed de matches com estado `computing` na primeira visita

### Transações

- Fluxo completo: proposta → aceite → andamento → conclusão
- Chat em tempo real via Supabase Realtime
- Presença online com Supabase Presence
- Timer de 72h para confirmação de conclusão

### Reputação

- Algoritmo ponderado por valor da transação e decaimento temporal
- Badges BRONZE / SILVER / GOLD com critérios verificáveis
- Recompute assíncrono via BullMQ após cada avaliação

### PWA & Offline

- Service Worker (Serwist v9) com estratégias por rota
- Fila offline com retry automático no reconect
- Banner de status de conexão
- Push notifications (estrutura pronta, persistência pendente)

---

## Modelo de dados (resumido)

```
User
 └── Profile  →  localização (PostGIS), badge, rating
      ├── Listing    →  OFFER | DEMAND | SERVICE | EQUIPMENT
      │    └── MatchScore    →  par (listing, candidateProfile), score 0–1
      ├── Transaction →  proposta → ACCEPTED → IN_PROGRESS → COMPLETED
      │    ├── TransactionMessage
      │    └── Rating         →  score 1–5, reliability, communication, quality
      └── SavedListing
```

---

## API — endpoints principais (`/api/v1`)

| Módulo         | Endpoints                                                        |
| -------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Auth           | `POST /auth/otp/request` · `/verify` · `/refresh` · `/logout`    |
| Profiles       | `POST /profiles` · `GET /profiles/:id` · `PATCH /profiles/:id`   |
| Listings       | CRUD + `/pause` · `/resume` · `/matches`                         |
| Transactions   | `GET /transactions` · `GET /:id` · `POST /:id/messages`          |
| Reputation     | `POST /ratings` (via transação) · `GET /profiles/:id/reputation` |
| Saved listings | `POST                                                            | GET /saved-listings`·`GET /saved-listings/:listingId`                                         |
| Me             | `GET                                                             | PATCH /me`·`GET /me/feed/matches` · preferências · consentimentos · LGPD export · soft delete |
| Notifications  | `GET /notifications` · `/read` · `/read-all`                     |
| Uploads        | `POST /uploads/presigned`                                        |

Todos os endpoints de escrita exigem `Authorization: Bearer <token>`. O frontend usa um proxy em `/api/proxy/*` que injeta o token do cookie `access_token`.

---

## Convenções

- Commits: [Conventional Commits](https://www.conventionalcommits.org/pt-br/)
- Branches: `feat/`, `fix/`, `chore/`, `docs/`
- Erros: classes tipadas (`AppError`) — nunca `throw new Error("string")`
- Imports: aliases `@/` (apps) e `@agrolink/*` (packages) — sem `../../`
- Pre-commit: ESLint + Prettier rodam automaticamente via Husky

Consulte o [CLAUDE.md](./CLAUDE.md) para decisões arquiteturais detalhadas, convenções de código e estado completo de implementação.
