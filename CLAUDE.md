# CLAUDE.md — AgroLink

Guia de desenvolvimento do AgroLink. Lido automaticamente em toda sessão.
Não apague seções; atualize-as quando houver mudanças de decisão.

---

## 1. VISÃO DO PRODUTO

AgroLink é uma plataforma digital de marketplace B2B para o agronegócio brasileiro que conecta produtores rurais a prestadores de serviço (consultores agronômicos, operadores de máquinas, fornecedores de insumos). O diferencial está na reputação verificada dos prestadores, no sistema de matchmaking por localização/especialidade e na UX pensada para usuários com conectividade limitada no campo.

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
agrolink/
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
  - `@agrolink/db` → `packages/db`
  - `@agrolink/shared` → `packages/shared`
  - `@agrolink/ui` → `packages/ui`
- Ordem de imports: node built-ins → third-party → internal (`@agrolink/*`) → local (`@/`)

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
| Imports relativos longos (`../../../lib/utils`)      | Aliases `@/lib/utils` ou `@agrolink/shared`           |
| PRs grandes com múltiplos propósitos                 | Um PR = um propósito; quebre se necessário            |
| Editar arquivos gerados de `packages/ui` diretamente | Customize via `className` e CSS variables             |
| Commitar diretamente em `main`                       | Sempre via feature branch + PR                        |

---

## 11. ESTADO IMPLEMENTADO

> Atualizado: 2026-05-22. Leia esta seção **antes** de propor qualquer nova feature, endpoint ou refactor para evitar duplicação ou conflito com o que já existe.

### Branches

| Branch                  | Status             | Conteúdo                                 |
| ----------------------- | ------------------ | ---------------------------------------- |
| `main`                  | produção           | Sprints 0–3 + Design Hardening mergeados |
| `feat/design-hardening` | em desenvolvimento | Lote 5 + Lote 6 (estados especiais)      |

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

| Método | Rota                         | Auth | Status                     |
| ------ | ---------------------------- | ---- | -------------------------- |
| POST   | `/auth/otp/request`          | ❌   | ✅                         |
| POST   | `/auth/otp/verify`           | ❌   | ✅                         |
| POST   | `/auth/refresh`              | ❌   | ✅                         |
| POST   | `/auth/logout`               | ✅   | ✅                         |
| POST   | `/profiles`                  | ✅   | ✅                         |
| GET    | `/profiles/:id`              | ❌   | ✅                         |
| PATCH  | `/profiles/:id`              | ✅   | ✅                         |
| POST   | `/privacy/consent`           | ✅   | ✅ idempotente             |
| POST   | `/listings`                  | ✅   | ✅                         |
| GET    | `/listings`                  | ❌   | ✅ cursor-based, PostGIS   |
| GET    | `/listings/:id`              | ❌   | ✅                         |
| PATCH  | `/listings/:id`              | ✅   | ✅                         |
| DELETE | `/listings/:id`              | ✅   | ✅ soft delete             |
| POST   | `/listings/:id/pause`        | ✅   | ✅                         |
| POST   | `/listings/:id/resume`       | ✅   | ✅                         |
| GET    | `/listings/:id/matches`      | ✅   | ✅                         |
| POST   | `/uploads/presigned`         | ✅   | ✅                         |
| GET    | `/notifications`             | ✅   | ✅ cursor-based            |
| PATCH  | `/notifications/:id/read`    | ✅   | ✅                         |
| POST   | `/notifications/read-all`    | ✅   | ✅                         |
| POST   | `/notifications/push`        | ✅   | ⚠️ stub — sem persistência |
| GET    | `/transactions`              | ✅   | ✅                         |
| GET    | `/transactions/:id`          | ✅   | ✅                         |
| POST   | `/transactions/:id/messages` | ✅   | ✅                         |

Todos os endpoints têm proxy em `apps/web/src/app/api/proxy/*` que injeta `Authorization: Bearer` a partir do cookie `access_token`.

---

### `packages/ui` — componentes exportados

**Base:** Button (variantes: cta, cta-disabled, ghost-muted), Input, Label, Textarea, Badge, Avatar, Separator, Progress, Skeleton, Card, Sheet, Tabs, RadioGroup, Select, Checkbox, Dialog, Drawer, DropdownMenu, Switch, Tooltip

**AgroLink:** SearchBar, SuggestionChip, ListingCard (`isCached?: boolean`), ListingCardSkeleton, NotificationIcon, BottomCTA, BottomTabBar, SectionLabel, ProgressIndicator, SelectCard, PhoneInput, OTPInput, AvatarUpload, ConsentCheckbox, ChatInput (`isOffline?: boolean`)

**Estados especiais:** EmptyState (`iconVariant: 'lime' | 'muted'`), ErrorScreen (`compact?: boolean`, `iconVariant: 'red' | 'amber' | 'blue'`)

**Icons (`@agrolink/ui/icons`):** Re-exports Lucide + SVG custom: CoffeeBean, Agronomist, Tractor, Soybean, Corn, Cattle, Harvester, Irrigation, Soil, Farm, Offer, Demand, Service, Equipment, WhatsAppLogo. Map `CATEGORY_ICONS`.

---

### Features especiais — Lote 6 (`feat/design-hardening`)

| Feature                   | Arquivo                                                                 | Notas                                                                                                                                               |
| ------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Offline banner            | `components/offline-banner.tsx`                                         | Amber (offline) / azul pulsante (reconectando). Mount guard para evitar hydration mismatch.                                                         |
| Offline queue             | `lib/offline-queue.ts`                                                  | localStorage `agrolink:offline-queue`, max 3 retries, flush no reconnect                                                                            |
| Online status hook        | `hooks/use-online-status.ts`                                            | Dispara `agrolink:reconnected` custom event ao reconectar                                                                                           |
| Service Worker            | `src/sw.ts`                                                             | Serwist v9. Desabilitado em dev. Handlers: StaleWhileRevalidate (listings/profiles), NetworkFirst (pages/notifications), NetworkOnly (transactions) |
| PWA manifest              | `public/manifest.json`                                                  | Ícones SVG placeholder em `public/icons/` — PNGs ainda não gerados                                                                                  |
| PWA install sheet         | `hooks/use-pwa-install.ts` + `components/pwa-install-sheet.tsx`         | `beforeinstallprompt`, visitas ≥ 3, dismiss 7 dias                                                                                                  |
| Push permission modal     | `hooks/use-push-permission.ts` + `components/push-permission-modal.tsx` | Sessões ≥ 3, soft dismiss 7d, hard deny 30d                                                                                                         |
| 404 / 500 / network error | `app/not-found.tsx`, `app/error.tsx`, `components/network-error.tsx`    | Usam ErrorScreen de `packages/ui`                                                                                                                   |

---

### Padrões de UI consolidados (não alterar sem decisão explícita)

| Elemento            | Classes                                                            |
| ------------------- | ------------------------------------------------------------------ |
| Pills/tabs ativo    | `feed-tab-active font-medium min-h-0 min-w-0`                      |
| Pills/tabs inativo  | `bg-muted text-fg-secondary hover:text-foreground min-h-0 min-w-0` |
| Botão voltar        | `bg-muted flex size-12 items-center justify-center rounded-full`   |
| Ação primária (CTA) | `bg-cta-bg text-cta-fg`                                            |
| Seção label         | `font-mono text-[10px] tracking-[0.4px]` uppercase                 |
| Card de anúncio     | `ListingCard` de `@agrolink/ui`                                    |

---

### TODOs pendentes (não implementado ainda)

- [ ] Gerar `public/icons/icon-192.png` e `icon-512.png` via `npx sharp-cli`
- [ ] Gerar VAPID keys (`npx web-push generate-vapid-keys`) e adicionar ao `.env`
- [ ] Implementar persistência de push subscriptions na API (tabela `push_subscriptions` + `web-push` npm)
- [ ] Integrar `matches-calculating.tsx` com status real de job
- [ ] Testes E2E (`apps/web/e2e/special-states.spec.ts`) — criados, não rodados em CI ainda
