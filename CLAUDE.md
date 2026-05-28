# CLAUDE.md — AgraIA

Guia de desenvolvimento do AgraIA. Lido automaticamente em toda sessão.
Não apague seções; atualize-as quando houver mudanças de decisão.

---

## 1. VISÃO DO PRODUTO

AgraIA é uma plataforma digital de marketplace B2B para o agronegócio brasileiro que conecta produtores rurais a prestadores de serviço (consultores agronômicos, operadores de máquinas, fornecedores de insumos). O diferencial está na reputação verificada dos prestadores, no sistema de matchmaking por localização/especialidade e na UX pensada para usuários com conectividade limitada no campo.

---

## 2. ARQUITETURA

**Stack**

| Camada    | Tecnologia                            |
| --------- | ------------------------------------- |
| Frontend  | Next.js 15, React 19, Tailwind CSS v4 |
| Backend   | Fastify 5, TypeScript                 |
| Banco     | Supabase (PostgreSQL) via Prisma 6    |
| Validação | Zod 3                                 |
| UI        | shadcn/ui + Radix UI (`packages/ui`)  |
| Monorepo  | pnpm workspaces + Turborepo           |
| Testes    | Vitest + Testing Library              |

**Estrutura de pastas**

```
agraia/
├── apps/
│   ├── web/          → Next.js 15 (porta 3000)
│   │   ├── app/      → App Router (Server Components por padrão)
│   │   ├── components/
│   │   └── lib/
│   └── api/          → Fastify 5 (porta 3001)
│       ├── routes/
│       ├── schemas/  → Zod schemas de request/response
│       └── plugins/
├── packages/
│   ├── db/           → Prisma schema, client, seed
│   ├── shared/       → Tipos, Zod validators, constantes BR
│   └── ui/           → Button, Card, Input, cn()
├── turbo.json
├── pnpm-workspace.yaml
└── CLAUDE.md
```

---

## 3. CONVENÇÕES DE CÓDIGO

### Nomenclatura

| Contexto          | Convenção   | Exemplo                       |
| ----------------- | ----------- | ----------------------------- |
| Arquivos/pastas   | kebab-case  | `user-profile.tsx`            |
| Componentes React | PascalCase  | `UserProfileCard`             |
| Funções/variáveis | camelCase   | `getUserById`, `isLoading`    |
| Constantes        | UPPER_SNAKE | `MAX_FILE_SIZE_MB`            |
| Tipos/Interfaces  | PascalCase  | `type ListingStatus`          |
| Enums Prisma      | PascalCase  | `UserRole`, `ServiceCategory` |

### Imports

- Paths absolutos sempre via alias — nunca `../../`:
  - `@/` → raiz de `apps/web/` e `apps/api/`
  - `@agraia/db` → `packages/db`
  - `@agraia/shared` → `packages/shared`
  - `@agraia/ui` → `packages/ui`
- Ordem de imports: node built-ins → third-party → internal (`@agraia/*`) → local (`@/`)

### Validação

- **Sempre Zod**. Nunca `if (!email.includes('@'))` nem validação manual.
- Schemas de validação ficam em `packages/shared/src/validators/` (reutilizados entre web e api).
- Input de usuário → parse com `.safeParse()`, trate o `error.format()`.
- Dados internos confiáveis → `.parse()` é aceitável.

### Erros

- **Nunca** `throw new Error("string genérica")`.
- Use classes de erro tipadas:

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404)
  }
}
```

- No Fastify, erros `AppError` são capturados pelo `errorHandler` global e retornam `{ data: null, error: { code, message } }`.

### TypeScript

- `strict: true` em todos os tsconfigs. **`any` é proibido** — use `unknown` e faça narrowing.
- Prefira `type` a `interface` (exceto quando precisar de `extends` múltiplos ou declaration merging).
- Sem `as Type` exceto em boundaries de I/O já validados por Zod.

### Server Components (Next.js)

- **Server Components por padrão**. Adicione `"use client"` apenas quando necessário:
  - hooks de estado (`useState`, `useEffect`, `useReducer`)
  - event handlers interativos
  - APIs de browser (`window`, `localStorage`)
- Nunca coloque lógica de fetch dentro de Client Components — passe dados como props.
- Formulários usam Server Actions (`"use server"`) + revalidação via `revalidatePath`.

---

## 4. CONVENÇÕES DE BANCO DE DADOS

### IDs

```prisma
id String @id @default(cuid())
```

- `cuid()` em todas as tabelas. Nunca `autoincrement()` nem UUIDs.

### Nomenclatura no schema

```prisma
model UserProfile {
  id        String   @id @default(cuid())
  userId    String   @unique @map("user_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("user_profiles")
}
```

- Colunas no banco: **snake_case** (`user_id`, `created_at`)
- Campos no Prisma Client: **camelCase** (`userId`, `createdAt`) via `@map`
- Tabelas no banco: **snake_case plural** via `@@map`

### Timestamps obrigatórios

Todas as tabelas devem ter:

```prisma
createdAt DateTime @default(now()) @map("created_at")
updatedAt DateTime @updatedAt @map("updated_at")
```

### Migrations

- **Nunca** `prisma db push` em produção ou staging.
- Fluxo de migration — **migração inicial** (banco vazio):
  1. `pnpm db:migrate:diff` → gera SQL completo (from-empty), imprime no stdout
  2. Revise o SQL, copie e aplique no SQL Editor do Supabase
  3. Aplique `migrations/manual/001_postgis.sql` logo em seguida
  4. Commite o schema atualizado

- Fluxo de migration — **incrementais** (sprint a sprint):
  1. Copie `schema.prisma` atual para `schema.baseline.prisma` (snapshot do estado aplicado)
  2. Faça as alterações em `schema.prisma`
  3. `pnpm db:migrate:diff:inc` → gera SQL delta entre baseline e o novo schema
  4. Revise, copie e aplique no SQL Editor do Supabase
  5. Atualize `schema.baseline.prisma` para o novo estado e commite ambos

> **Restrição de rede**: conexão direta ao Supabase (`db.PROJECT.supabase.co:5432`) está bloqueada. O schema engine do Prisma não consegue introspectar pelo pooler. Por isso o diff compara **dois arquivos de schema** — sem necessidade de conexão ao banco.

### Relações

- Deleção em cascata explícita com `onDelete: Cascade` onde faz sentido.
- Foreign keys sempre com índice implícito do Prisma (gerado automaticamente).

---

## 5. CONVENÇÕES DE API

### Roteamento

- Prefixo obrigatório: `/api/v1`
- Recursos no plural: `/api/v1/listings`, `/api/v1/users`
- Ações não-CRUD como sub-recursos: `/api/v1/listings/:id/publish`

### Formato de resposta

```typescript
// Sucesso
{ data: T, error: null, meta?: PaginationMeta }

// Erro
{ data: null, error: { code: string, message: string, details?: unknown } }
```

Nunca retorne a entidade diretamente na raiz. Sempre dentro de `data`.

### Status codes HTTP

| Situação                        | Code |
| ------------------------------- | ---- |
| Criação bem-sucedida            | 201  |
| Sucesso sem corpo               | 204  |
| Validação falhou                | 422  |
| Não autenticado                 | 401  |
| Sem permissão                   | 403  |
| Recurso não encontrado          | 404  |
| Conflito (e.g. email duplicado) | 409  |
| Erro interno                    | 500  |

### Paginação

- **Cursor-based** para todas as listagens (não offset).
- Parâmetros: `cursor` (ID do último item) e `limit` (padrão 20, máximo 100).
- Resposta inclui `meta.nextCursor` (null quando última página).

```typescript
type PaginationMeta = {
  nextCursor: string | null
  limit: number
  total?: number // apenas quando barato de calcular
}
```

### Autenticação

- JWT via Supabase Auth. Token no header `Authorization: Bearer <token>`.
- Fastify plugin `authenticate` injeta `request.user` em rotas protegidas.
- Nunca confie em dados do body para identificar o usuário autenticado — use `request.user.id`.

---

## 6. CONVENÇÕES DE UI

### Responsividade

- **Mobile-first**. Estilos base são para mobile; use `md:`, `lg:` para ampliar.
- Touch targets mínimos de **48×48px** em todos os elementos interativos.
- Testar em viewport 375px (iPhone SE) como baseline.

### Componentes

- Componentes reutilizáveis ficam em `packages/ui/src/components/`.
- Componentes de página/feature ficam em `apps/web/app/` ou `apps/web/components/`.
- shadcn/ui é a base — customize via `className` e CSS variables, nunca edite os arquivos gerados em `components/ui/` diretamente (são regeneráveis).

### Tokens de cor

- **Nunca** hex direto no JSX ou CSS.
- Use CSS variables do tema shadcn:

```css
/* correto */
background-color: hsl(var(--background));
color: hsl(var(--foreground));
border-color: hsl(var(--border));

/* proibido */
background-color: #ffffff;
color: #111827;
```

- Cores de marca definidas como CSS variables em `apps/web/app/globals.css`.

### Tipografia

- **Sans**: `Inter` (texto geral, UI)
- **Mono/destaque**: `JetBrains Mono` (código, números financeiros, IDs)
- Tamanhos via classes Tailwind (`text-sm`, `text-base`, `text-lg`) — nunca `font-size` inline.

### Formulários

- React Hook Form + Zod (via `@hookform/resolvers/zod`).
- Feedback de erro inline abaixo do campo, nunca somente em toast.
- Estado de loading com `disabled` + spinner no botão de submit.

---

## 7. WORKFLOW DE DESENVOLVIMENTO

### Branches

```
main              → produção (protegida)
feature/nome      → novas features
fix/nome          → bugfixes
chore/nome        → manutenção, deps, config
```

- Sempre criar a partir de `main` atualizado.
- Nunca commitar diretamente em `main`.

### Commits semânticos

```
feat: adiciona filtro por categoria em listagens
fix: corrige validação de CNPJ no cadastro
chore: atualiza dependências do pacote ui
refactor: extrai lógica de auth para hook useAuth
docs: atualiza README com instruções de setup
test: adiciona cobertura para UserService
```

### Pull Requests

- **Um propósito por PR** — se ficou grande, quebre.
- Título segue o formato do commit semântico.
- Descreva o "por quê", não o "o quê" (o diff já mostra o quê).
- Features críticas exigem testes antes do merge: **auth, matchmaking, reputação**.

### Testes

- Vitest para unit e integration.
- Testing Library para componentes React.
- Nomes de arquivos: `user.service.test.ts`, `UserCard.test.tsx`.
- Testes ficam junto ao arquivo testado (co-located), não em pasta `__tests__` separada.

---

## 8. COMANDOS FREQUENTES

```bash
# Desenvolvimento
pnpm dev              # Inicia web (:3000) e api (:3001) em paralelo
pnpm build            # Build de produção de todos os apps
pnpm lint             # ESLint em todo o monorepo
pnpm typecheck        # tsc --noEmit em todos os pacotes
pnpm test             # Vitest em todo o monorepo
pnpm test --watch     # Vitest em modo watch

# Banco de dados
pnpm db:generate       # prisma generate (regenera o client)
pnpm db:migrate:diff      # Gera SQL completo: vazio → schema.prisma (migração inicial)
pnpm db:migrate:diff:inc  # Gera SQL delta: schema.baseline.prisma → schema.prisma (incrementais)
pnpm db:migrate:deploy # Aplica migrations versionadas (produção)
pnpm db:seed           # Popula banco com dados de desenvolvimento
pnpm db:studio         # Abre Prisma Studio (visualização local)

# UI
pnpm ui:add <comp>    # Adiciona componente shadcn ao packages/ui
```

---

## 9. DECISÕES ARQUITETURAIS (ADRs)

### Por que Fastify em vez de NestJS?

**Decisão**: Fastify 5 como framework de API.

**Contexto**: NestJS oferece estrutura opinada e decorators, mas traz overhead de abstrações e curva de aprendizado para o time. Para um MVP com equipe pequena, precisávamos de simplicidade e performance.

**Razões**: Fastify é 2–3× mais rápido que Express/NestJS em benchmarks reais; o sistema de plugins é composable sem magia de IoC; TypeScript first-class sem decorators experimentais; ecossistema menor mas mais coeso.

**Consequência**: Menos scaffolding automático — estrutura de pastas e injeção de dependência são responsabilidade do time.

---

### Por que Supabase em vez de AWS no MVP?

**Decisão**: Supabase como backend-as-a-service para auth, banco e storage.

**Contexto**: AWS oferece mais controle e escala, mas exige configuração extensa (VPC, RDS, Cognito, S3, IAM) que atrasaria o MVP em semanas.

**Razões**: Supabase entrega PostgreSQL gerenciado + Auth + Storage + Row Level Security em minutos; custo previsível no free tier durante o MVP; migração para PostgreSQL gerenciado próprio é viável no futuro sem reescrever queries.

**Consequência**: Dependência de vendor para auth e storage. Aceitável no MVP; revisar pós-PMF.

---

### Por que shadcn/ui em vez de Tailwind puro?

**Decisão**: shadcn/ui como base de componentes.

**Contexto**: Tailwind puro exigiria construir cada componente do zero (Select, Dialog, Combobox, DatePicker). Bibliotecas como MUI ou Chakra impõem design system próprio difícil de customizar.

**Razões**: shadcn/ui são componentes que você **possui** (código copiado, não dependência de runtime); construídos sobre Radix UI (acessibilidade garantida); totalmente customizáveis via CSS variables; sem conflito com Tailwind.

**Consequência**: Componentes gerados precisam ser mantidos pelo time. Não atualize via `shadcn add` sem revisar o diff.

---

## 10. O QUE NÃO FAZER

| Proibido                                             | Alternativa correta                                   |
| ---------------------------------------------------- | ----------------------------------------------------- |
| `any` no TypeScript                                  | `unknown` + type narrowing ou Zod inference           |
| Validação manual de input (`if (!x.includes...)`)    | Sempre Zod `.safeParse()`                             |
| `throw new Error("string")` sem código/tipo          | Classes de erro tipadas (`AppError`, `NotFoundError`) |
| `localStorage` para dados sensíveis (token, PII)     | Cookies `httpOnly` gerenciados pelo servidor          |
| Commitar `.env`, `.env.local`, secrets               | `.env.example` com valores fictícios; secrets em CI   |
| `prisma db push` em produção                         | `migrate diff` → SQL Editor do Supabase               |
| Hex direto em componentes (`#fff`, `#333`)           | CSS variables do tema (`hsl(var(--background))`)      |
| `"use client"` desnecessário em Server Components    | Mantenha no servidor; desça só o que precisa          |
| Imports relativos longos (`../../../lib/utils`)      | Aliases `@/lib/utils` ou `@agraia/shared`             |
| PRs grandes com múltiplos propósitos                 | Um PR = um propósito; quebre se necessário            |
| Editar arquivos gerados de `packages/ui` diretamente | Customize via `className` e CSS variables             |
| Commitar diretamente em `main`                       | Sempre via feature branch + PR                        |

---

## 11. ESTADO IMPLEMENTADO

> Atualizado: 2026-05-28. Leia esta seção **antes** de propor qualquer nova feature, endpoint ou refactor para evitar duplicação ou conflito com o que já existe.

### Branches

| Branch             | Deploy automático              | Conteúdo                                 |
| ------------------ | ------------------------------ | ---------------------------------------- |
| `main`             | → Production (app.agra.ia.br)  | Sprints 0–3 + Design Hardening mergeados |
| `staging`          | → Staging (staging.agra.ia.br) | Integração pré-release; espelha `main`   |
| `feat/*` / `fix/*` | PR preview (Vercel)            | Features em desenvolvimento              |

---

### Rotas web implementadas (`apps/web/src/app/`)

| Rota                              | Status | Observação                                            |
| --------------------------------- | ------ | ----------------------------------------------------- |
| `/`                               | ✅     | Landing page                                          |
| `/entrar`                         | ✅     | Auth — input WhatsApp                                 |
| `/entrar/codigo`                  | ✅     | Auth — OTP                                            |
| `/cadastro/perfil`                | ✅     | Onboarding — tipo (produtor/prestador)                |
| `/cadastro/dados`                 | ✅     | Onboarding — nome/propriedade/bio                     |
| `/cadastro/localizacao`           | ✅     | Onboarding — GPS + Nominatim/ViaCEP                   |
| `/cadastro/foto`                  | ✅     | Onboarding — upload avatar presigned                  |
| `/cadastro/consentimento`         | ✅     | Onboarding — LGPD consent + cria perfil               |
| `/cadastro/pronto`                | ✅     | Onboarding — success                                  |
| `/feed`                           | ✅     | Feed com filter tabs (matches/recentes/região/salvos) |
| `/busca`                          | ✅     | Busca com FilterSheet + ResultItem + EmptyState       |
| `/anuncio/novo`                   | ✅     | Wizard 4 passos (kind → detalhes → mídia → revisão)   |
| `/anuncio/[id]`                   | ✅     | Detalhe do anúncio (Server Component)                 |
| `/anuncio/[id]/editar`            | ✅     | Edição de anúncio                                     |
| `/notificacoes`                   | ✅     | Notificações com filter pills + grupos por dia        |
| `/transacoes`                     | ✅     | Transações com EmptyState                             |
| `/perfil`                         | ✅     | Perfil próprio                                        |
| `/perfil/[id]`                    | ✅     | Perfil público                                        |
| `/negocios`                       | ✅     | Negócios                                              |
| `/configuracoes`                  | ✅     | Configurações                                         |
| `/ajuda`                          | ✅     | Ajuda                                                 |
| `/termos` `/privacidade` `/sobre` | ✅     | Stubs legais                                          |
| `error.tsx`                       | ✅     | Erro 500 (ErrorScreen amber)                          |
| `not-found.tsx`                   | ✅     | 404 (ErrorScreen red)                                 |

---

### API endpoints (`apps/api` — prefixo `/api/v1`)

| Método | Rota                           | Auth | Status                                |
| ------ | ------------------------------ | ---- | ------------------------------------- |
| POST   | `/auth/otp/request`            | ❌   | ✅                                    |
| POST   | `/auth/otp/verify`             | ❌   | ✅                                    |
| POST   | `/auth/refresh`                | ❌   | ✅                                    |
| POST   | `/auth/logout`                 | ✅   | ✅                                    |
| POST   | `/profiles`                    | ✅   | ✅                                    |
| GET    | `/profiles/:id`                | ❌   | ✅                                    |
| PATCH  | `/profiles/:id`                | ✅   | ✅                                    |
| POST   | `/privacy/consent`             | ✅   | ✅ idempotente                        |
| POST   | `/listings`                    | ✅   | ✅                                    |
| GET    | `/listings`                    | ❌   | ✅ cursor-based, PostGIS              |
| GET    | `/listings/:id`                | ❌   | ✅                                    |
| PATCH  | `/listings/:id`                | ✅   | ✅                                    |
| DELETE | `/listings/:id`                | ✅   | ✅ soft delete                        |
| POST   | `/listings/:id/pause`          | ✅   | ✅                                    |
| POST   | `/listings/:id/resume`         | ✅   | ✅                                    |
| GET    | `/listings/:id/matches`        | ✅   | ✅                                    |
| POST   | `/uploads/presigned`           | ✅   | ✅                                    |
| GET    | `/notifications`               | ✅   | ✅ cursor-based                       |
| PATCH  | `/notifications/:id/read`      | ✅   | ✅                                    |
| POST   | `/notifications/read-all`      | ✅   | ✅                                    |
| POST   | `/notifications/push`          | ✅   | ⚠️ stub — sem persistência            |
| GET    | `/transactions`                | ✅   | ✅                                    |
| GET    | `/transactions/:id`            | ✅   | ✅                                    |
| POST   | `/transactions/:id/messages`   | ✅   | ✅                                    |
| GET    | `/me`                          | ✅   | ✅                                    |
| PATCH  | `/me`                          | ✅   | ✅                                    |
| GET    | `/me/feed/matches`             | ✅   | ✅ cursor-based; retorna `computing`  |
| GET    | `/me/notification-preferences` | ✅   | ✅                                    |
| PATCH  | `/me/notification-preferences` | ✅   | ✅                                    |
| GET    | `/me/consents`                 | ✅   | ✅                                    |
| PATCH  | `/me/consents`                 | ✅   | ✅                                    |
| POST   | `/me/data-export`              | ✅   | ✅ LGPD — audit trail via notificação |
| DELETE | `/me`                          | ✅   | ✅ soft delete; remoção física em 30d |
| POST   | `/saved-listings/:listingId`   | ✅   | ✅ toggle — salva ou desalva          |
| GET    | `/saved-listings/:listingId`   | ✅   | ✅ status de salvamento do anúncio    |
| GET    | `/saved-listings`              | ✅   | ✅ cursor-based                       |

Todos os endpoints têm proxy em `apps/web/src/app/api/proxy/*` que injeta `Authorization: Bearer` a partir do cookie `access_token`.

---

### `packages/ui` — componentes exportados

**Base:** Button (variantes: cta, cta-disabled, ghost-muted), Input, Label, Textarea, Badge, Avatar, Separator, Progress, Skeleton, Card, Sheet, Tabs, RadioGroup, Select, Checkbox, Dialog, Drawer, DropdownMenu, Switch, Tooltip

**AgraIA:** SearchBar, SuggestionChip, ListingCard (`isCached?: boolean`), ListingCardSkeleton, NotificationIcon, BottomCTA, BottomTabBar, SectionLabel, ProgressIndicator, SelectCard, PhoneInput, OTPInput, AvatarUpload, ConsentCheckbox, ChatInput (`isOffline?: boolean`)

**Estados especiais:** EmptyState (`iconVariant: 'lime' | 'muted'`), ErrorScreen (`compact?: boolean`, `iconVariant: 'red' | 'amber' | 'blue'`)

**Icons (`@agraia/ui/icons`):** Re-exports Lucide + SVG custom: CoffeeBean, Agronomist, Tractor, Soybean, Corn, Cattle, Harvester, Irrigation, Soil, Farm, Offer, Demand, Service, Equipment, WhatsAppLogo. Map `CATEGORY_ICONS`.

---

### Features especiais — Lote 6 (`feat/design-hardening`)

| Feature                   | Arquivo                                                                 | Notas                                                                                                                                               |
| ------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Offline banner            | `components/offline-banner.tsx`                                         | Amber (offline) / azul pulsante (reconectando). Mount guard para evitar hydration mismatch.                                                         |
| Offline queue             | `lib/offline-queue.ts`                                                  | localStorage `agraia:offline-queue`, max 3 retries, flush no reconnect                                                                              |
| Online status hook        | `hooks/use-online-status.ts`                                            | Dispara `agraia:reconnected` custom event ao reconectar                                                                                             |
| Service Worker            | `src/sw.ts`                                                             | Serwist v9. Desabilitado em dev. Handlers: StaleWhileRevalidate (listings/profiles), NetworkFirst (pages/notifications), NetworkOnly (transactions) |
| PWA manifest              | `public/manifest.json`                                                  | Ícones SVG placeholder em `public/icons/` — PNGs ainda não gerados                                                                                  |
| PWA install sheet         | `hooks/use-pwa-install.ts` + `components/pwa-install-sheet.tsx`         | `beforeinstallprompt`, visitas ≥ 3, dismiss 7 dias                                                                                                  |
| Push permission modal     | `hooks/use-push-permission.ts` + `components/push-permission-modal.tsx` | Sessões ≥ 3, soft dismiss 7d, hard deny 30d                                                                                                         |
| 404 / 500 / network error | `app/not-found.tsx`, `app/error.tsx`, `components/network-error.tsx`    | Usam ErrorScreen de `packages/ui`                                                                                                                   |
| Bookmark (salvar anúncio) | `components/listings/bookmark-button.tsx`                               | Optimistic toggle com `useTransition`; dispara `agraia:bookmark-toggled`; redireciona p/ `/entrar` se não autenticado                               |
| Feed tab "Salvos"         | `components/feed-list.tsx`                                              | Refetch no evento `agraia:bookmark-toggled` (mesma página) e ao ativar a aba (back-navigation)                                                      |
| Feed tab "Matches"        | `components/feed-list.tsx` + `GET /me/feed/matches`                     | `computing: true` exibe spinner; `matchScore` 0–1 convertido p/ 0–100 no `FeedCard`; `distanceKm` repassado ao card                                 |
| Bell unread count         | `app/feed/page.tsx`                                                     | Query paralela no servidor (`Promise.all`); ponto vermelho renderizado somente quando `unreadCount > 0`                                             |

---

### Padrões de UI consolidados (não alterar sem decisão explícita)

| Elemento            | Classes                                                            |
| ------------------- | ------------------------------------------------------------------ |
| Pills/tabs ativo    | `feed-tab-active font-medium min-h-0 min-w-0`                      |
| Pills/tabs inativo  | `bg-muted text-fg-secondary hover:text-foreground min-h-0 min-w-0` |
| Botão voltar        | `bg-muted flex size-12 items-center justify-center rounded-full`   |
| Ação primária (CTA) | `bg-cta-bg text-cta-fg`                                            |
| Seção label         | `font-mono text-[10px] tracking-[0.4px]` uppercase                 |
| Card de anúncio     | `ListingCard` de `@agraia/ui`                                      |

---

### Infraestrutura de deploy

| Arquivo                         | Finalidade                                                       |
| ------------------------------- | ---------------------------------------------------------------- |
| `railway.toml`                  | Build config Railway (Dockerfile) + start command do serviço API |
| `.github/workflows/ci.yml`      | CI — lint + typecheck + test em todo PR para `main`              |
| `.github/workflows/deploy.yml`  | CD — build image Docker, push ghcr.io, trigger Railway redeploy  |
| `apps/api/src/index.ts`         | Entry point **API** — HTTP Fastify apenas (sem worker)           |
| `apps/api/src/worker.ts`        | Entry point **Worker** — BullMQ apenas (sem HTTP)                |
| `apps/api/package.json` scripts | `start` → `index.js` · `start:worker` → `worker.js`              |

**Plataformas e ambientes:**

| Plataforma  | Ambiente   | Serviço / Domínio                  | Notas                                            |
| ----------- | ---------- | ---------------------------------- | ------------------------------------------------ |
| Railway     | production | `api` → `api.agra.ia.br`           | Start: `node apps/api/dist/index.js`; Pro plan   |
| Railway     | production | `worker`                           | Start: `node apps/api/dist/worker.js`; sem porta |
| Railway     | production | Redis plugin                       | Injeta `REDIS_URL`                               |
| Railway     | staging    | `api` → `api-staging.agra.ia.br`   | Mesmo build, vars de staging                     |
| Railway     | staging    | `worker`                           | Idem, sem porta                                  |
| Railway     | staging    | Redis plugin                       | Redis isolado de produção                        |
| Vercel      | production | `app.agra.ia.br`                   | Branch `main`; root dir `apps/web`               |
| Vercel      | staging    | `staging.agra.ia.br`               | Branch `staging`; mesma config de build          |
| Supabase    | production | projeto `agraia-production`        | Migrations manuais; ver §4                       |
| Supabase    | staging    | projeto `agraia-staging`           | Cópia do schema; dados de teste                  |
| registro.br | —          | DNS autoritativo para `agra.ia.br` | Ver registros abaixo; **sem** proxy Cloudflare   |

**Registros DNS (registro.br):**

| Tipo  | Nome                                     | Destino                                                                           |
| ----- | ---------------------------------------- | --------------------------------------------------------------------------------- |
| CNAME | `app.agra.ia.br`                         | `8f75f4d91770dccf.vercel-dns-017.com`                                             |
| CNAME | `staging.agra.ia.br`                     | `8f75f4d91770dccf.vercel-dns-017.com`                                             |
| CNAME | `api.agra.ia.br`                         | `csyynwdg.up.railway.app`                                                         |
| CNAME | `api-staging.agra.ia.br`                 | `qx1cmaqd.up.railway.app`                                                         |
| TXT   | `_railway-verify.api.agra.ia.br`         | `railway-verify=f80b10bd5cf310d8764572e4cbe0cd28cd784cf52f0952a52db22f031e226730` |
| TXT   | `_railway-verify.api-staging.agra.ia.br` | `railway-verify=5d1c706826d6167cef729148d9b8883f6735e8055c36181d1166b40466f7e37d` |

---

### TODOs pendentes (não implementado ainda)

- [x] Configurar serviços no Railway (API + Worker + Redis) e Vercel — concluído 2026-05-28
- [ ] Gerar `public/icons/icon-192.png` e `icon-512.png` via `npx sharp-cli`
- [ ] Gerar VAPID keys (`npx web-push generate-vapid-keys`) e adicionar ao `.env`
- [ ] Implementar persistência de push subscriptions na API (tabela `push_subscriptions` + `web-push` npm)
- [ ] Escrever e aplicar migrations manuais para RLS policies e segurança (matchmaking, RLS, security) — 003, 004, 005 ainda não existem como arquivos
- [ ] Testes E2E (`apps/web/e2e/special-states.spec.ts`) — criados, não rodados em CI ainda

---

## 12. ALGORITMO DE MATCHMAKING

> Implementado em `apps/api/src/modules/matchmaking/algorithm.ts` e `apps/api/src/workers/matchmaking/processor.ts`.
> Score mínimo para persistência: **0.20**. Pares abaixo disso são descartados silenciosamente.

---

### Fórmula geral

```
score_final =
  0.40 × distScore  +
  0.25 × compatScore +
  0.20 × repScore    +
  0.15 × respScore
```

Todos os sub-scores são normalizados para **[0, 1]**. O resultado final também fica em [0, 1] e é armazenado em `match_scores.score`.

---

### Sub-scores

#### Distância — peso 0.40

Decaimento **logarítmico** até `MAX_DISTANCE_KM = 500`:

```ts
distScore = Math.max(0, 1 - Math.log(1 + d) / Math.log(1 + 500))
```

Penaliza distâncias longas de forma mais suave do que o decaimento linear anterior e valoriza mais os matches de curta distância.

#### Compatibilidade — peso 0.25

Avaliada par-a-par entre os anúncios ativos do candidato e o anúncio-alvo. Condições:

1. **`kind` complementar** (OFFER ↔ DEMAND): obrigatório — bônus 0 se ambos forem iguais.
2. **Bônus de categoria**:

| Condição                       | Bônus |
| ------------------------------ | ----- |
| Mesma `category` (exact match) | +0.30 |
| Mesma categoria cluster        | +0.15 |
| Sem cluster em comum           | +0.00 |

**Clusters de categoria:**

| Cluster         | Categorias                                        |
| --------------- | ------------------------------------------------- |
| GRAINS          | SOJA, MILHO, ARROZ, TRIGO, FEIJAO                 |
| LIVESTOCK       | GADO, SUINOS, AVES, LEITE, PESCA                  |
| HORTICULTURE    | FRUTAS, LEGUMES, CAFE, CANA, ALGODAO, HORTIFRUTI  |
| AGRO_SERVICES   | AGRONOMIA, VETERINARIA, CONSULTORIA, CERTIFICACAO |
| MECHANICAL      | MAQUINAS, IMPLEMENTOS, PECAS, MANUTENCAO          |
| INFRASTRUCTURE  | IRRIGACAO, ARMAZENAMENTO, ENERGIA, CONSTRUCAO     |
| LABOR_TRANSPORT | MAO_DE_OBRA, TRANSPORTE, LOGISTICA                |

O `compatScore` final é a **média dos pares** candidato–alvo, tomando o par de maior bônus de categoria.

#### Reputação — peso 0.20

Lida **ao vivo** via LEFT JOIN na query PostGIS — nunca do campo desnormalizado `profile.current_rating`:

```ts
repScore = avgRating / 5.0 // AVG(ratings.score) do candidato
repScore = 0.5 // prior neutro quando sem avaliações
```

#### Responsividade — peso 0.15

Tempo médio de resposta em transações ativas (query em `transactions` + `transaction_messages`):

```ts
respScore = Math.max(0, 1 - avgResponseHours / 72)
respScore = 0.5 // prior neutro quando sem histórico
```

---

### Busca de candidatos (PostGIS)

Executada em `processor.ts` via query SQL raw. Seleciona todos os perfis em raio de 500 km com anúncios ativos que **não pertencem ao dono** do anúncio-alvo:

```sql
SELECT
  p.id, p.user_id AS "userId", p.name, p.badge,
  ST_Distance(target_geo, p_geo)::float / 1000 AS distance_km,
  r_agg.avg_score,
  r_agg.cnt
FROM profiles p
JOIN locations loc ON loc.profile_id = p.id
LEFT JOIN (
  SELECT ratee_id,
         AVG(score)::float AS avg_score,
         COUNT(*)::int     AS cnt
  FROM   ratings
  GROUP BY ratee_id
) r_agg ON r_agg.ratee_id = p.user_id
WHERE p.id != :ownerProfileId
  AND ST_DWithin(
        loc.coordinates::geography,
        ST_MakePoint(:lng, :lat)::geography,
        500000   -- metros
      )
```

---

### Persistência

Resultado salvo via upsert em `match_scores`. A recomputação sobrescreve o score anterior para o mesmo par `(listingId, candidateProfileId)`:

```prisma
model MatchScore {
  id                 String  @id @default(cuid())
  listingId          String
  candidateProfileId String
  score              Float
  distanceKm         Float?

  @@unique([listingId, candidateProfileId])
}
```

---

### Ciclo de vida dos jobs (BullMQ)

| Evento                                                        | Job disparado                             | Efeito                                                           |
| ------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| `POST /listings` (criação de anúncio)                         | `compute-matches` para o novo listing     | Descobre candidatos imediatamente                                |
| `GET /me/feed/matches` sem scores + usuário tem listing ativo | `compute-matches` para cada listing ativo | Popula o feed "Matches para mim" na primeira visita              |
| `compute-matches` finaliza com score ≥ 0.20                   | `notify-match` por par                    | Notificação push/WhatsApp ao perfil candidato                    |
| `notify-match` enfileirado fora do horário comercial BRT      | delay automático até 08:00–20:00 BRT      | Evita notificações em madrugada sem esgotar tentativas do BullMQ |

O delay é calculado em `msUntilNextBusinessHours()` em `queue.ts` e aplicado como `delay` no job — sem `throw` nem retry loop.

---

### Frontend — fluxo de dados

1. `FeedList` com `activeTab === 'matches'` chama `fetchMatchesPage()` → `GET /api/proxy/me/feed/matches`.
2. `toFeedCardData()` converte `matchScore` de float 0–1 para inteiro 0–100 antes de passar ao `FeedCard`.
3. Se `computing: true` (primeira visita sem scores), exibe spinner animado em vez de `EmptyState`.
4. `distanceKm` é repassado diretamente ao `FeedCard` para exibição de distância.

---

## 13. CONTAS DEMO

> Implementado em `apps/api/src/modules/auth/service.ts` — métodos `isDemoPhone()`, `demoOtp` e `issueSessionForPhone()`.

### Problema resolvido

O fluxo de autenticação do AgraIA usa OTP via WhatsApp (Twilio). Em ambientes de desenvolvimento, QA e demonstrações não é desejável enviar mensagens reais — seja por custo, dependência de conectividade ou por expor números de telefone reais de testadores.

### Solução

Duas variáveis de ambiente definem um conjunto de contas que ignoram completamente o fluxo de OTP normal:

```
DEMO_PHONES="+5511999990001,+5511999990002,+5511999990003"
DEMO_OTP="123456"
```

Quando um número listado em `DEMO_PHONES` solicita OTP:

- Nenhuma entrada é criada na tabela `otp_codes`
- Nenhuma mensagem é enviada via WhatsApp
- O rate limit é ignorado
- A API retorna `{ expiresIn: 300 }` normalmente (o cliente não percebe diferença)

Quando esse número verifica o OTP:

- Se o código enviado bate com `DEMO_OTP` → sessão emitida normalmente (access token + refresh token)
- Se o código não bate → `OTP_INVALID` (mesmo comportamento do fluxo real)
- Se `DEMO_OTP` estiver vazio → bypass desabilitado, mesmo para números listados

### Usuários seed correspondentes

| Telefone       | ID no banco |
| -------------- | ----------- |
| +5511999990001 | user-a-seed |
| +5511999990002 | user-b-seed |
| +5511999990003 | user-c-seed |

Esses usuários são criados pelo seed (`pnpm db:seed`). O lookup é por telefone, então o ID customizado não causa conflito com o fluxo de `findOrCreate`.

### Segurança

- Se `DEMO_PHONES` não está definido (ou é string vazia), o bypass está **completamente desativado** — sem fallback, sem código condicional por ambiente
- `DEMO_OTP` deve ser tratado como senha: não commitar o valor real, rotacionar periodicamente em produção
- Os logs diferenciam logins demo: `[auth] Login demo para user <id>` vs `[auth] Login bem-sucedido para user <id>`
- Em produção, usar um código não-óbvio (não `123456`) e restringir acesso à variável ao time de produto/QA

### Como ativar por ambiente

| Ambiente    | `DEMO_PHONES`         | `DEMO_OTP`               |
| ----------- | --------------------- | ------------------------ |
| Local (dev) | todos os três números | `123456`                 |
| Staging     | todos os três números | valor forte              |
| Produção    | todos os três números | valor forte, rotacionado |

Definir as variáveis no painel do Railway (API service) ou no `.env` local. Nunca commitar valores reais.
