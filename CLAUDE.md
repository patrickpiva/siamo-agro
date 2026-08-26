# CLAUDE.md — Siamo

Guia de desenvolvimento do Siamo. Lido automaticamente em toda sessão.
Não apague seções; atualize-as quando houver mudanças de decisão.
Quando este arquivo e o código divergirem, **o código é a fonte da verdade** —
corrija o CLAUDE.md no mesmo PR que tocou o código.

---

## 1. VISÃO DO PRODUTO

Siamo é uma plataforma digital de marketplace B2B para o agronegócio brasileiro que conecta produtores rurais a prestadores de serviço (consultores agronômicos, operadores de máquinas, fornecedores de insumos). O diferencial está na reputação verificada dos prestadores, no sistema de matchmaking por localização/especialidade e na UX pensada para usuários com conectividade limitada no campo.

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
siamo-agro/
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
  - `@siamo/db` → `packages/db`
  - `@siamo/shared` → `packages/shared`
  - `@siamo/ui` → `packages/ui`
- Ordem de imports: node built-ins → third-party → internal (`@siamo/*`) → local (`@/`)

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

> **Armadilha — baseline defasado**: o passo 5 é fácil de esquecer. Em 2026-06-11 o
> baseline estava 3 migrations atrás e o `diff:inc` listava objetos já aplicados
> (ex.: `CREATE TABLE saved_listings`). Se o delta mostrar coisas que já existem no
> banco, **não aplique o diff** — re-sincronize o baseline e gere de novo.

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
- Parâmetros: `cursor` (ID do último item) e `limit` (padrão 20, máximo 50).
- Resposta inclui `meta.nextCursor` (null quando última página).
- Em `GET /listings` com `search`/geo, a ordenação primária é rank/distância — o
  keyset reconstrói as chaves do cursor com as MESMAS expressões de ordenação
  (`ListingsService.buildCursorCondition`); o cursor exposto continua sendo só o id.

### Busca textual (`GET /listings?search=`)

Sem acento por padrão: a expressão indexada é `listing_search_document(title, description)`
(migration `006_search_unaccent.sql`), que aplica `immutable_unaccent` antes do
`to_tsvector('portuguese', …)`. **Use sempre essa função no WHERE e no `ts_rank`** —
qualquer variação da expressão faz o planner ignorar o GIN e voltar a seq scan.

A busca tem uma escada de relaxamento (`ListingsService.resolveSearchTier`):

| Tier      | Query                                           | Quando               |
| --------- | ----------------------------------------------- | -------------------- |
| `exact`   | `websearch_to_tsquery` (AND de todos os termos) | padrão               |
| `partial` | a mesma tsquery com `&` trocado por `\|` (OR)   | o AND não achou nada |
| `fuzzy`   | `word_similarity` trigram sobre o título (`<%`) | nem o OR achou nada  |

O tier é decidido por probes `LIMIT 1` **antes** da query principal e **sem** a
condição de cursor — um resultado vazio na query paginada é ambíguo ("não há match"
vs "acabou a página"), e decidir sem o cursor mantém o tier estável entre páginas.
O tier escolhido volta em `meta.searchRelaxed`; a UI deve avisar que os resultados
são aproximados quando ele não for `exact`. Quando nenhum tier acha nada, volta
`exact` — para a tela dizer "sem resultados" em vez de "mostrando aproximados".

```typescript
type PaginationMeta = {
  nextCursor: string | null
  limit: number
  total?: number // apenas quando barato de calcular
}
```

### Autenticação

- OTP via WhatsApp → JWT **próprio** (`jsonwebtoken`), não Supabase Auth. Access token
  de 15 min no header `Authorization: Bearer <token>`.
- Refresh token opaco `<recordId>.<segredo>` (30 dias; bcrypt do segredo no banco):
  lookup por PK + 1 compare. Rotação a cada refresh com **grace window de 60s** —
  refreshes concorrentes do middleware não derrubam a sessão; reuso fora da janela
  revoga **todas** as sessões do usuário. Tokens legados (hex sem `.`) têm fallback
  até 2026-07-10 (`findRefreshToken` em `auth/service.ts`).
- `JWT_SECRET` é obrigatório em produção: API falha no boot, web lança
  `CONFIG_MISSING_ENV` — sem fallback silencioso (ver `apps/api/src/config.ts`).
- Fastify plugin `authenticate` injeta `request.user` em rotas protegidas.
- Nunca confie em dados do body para identificar o usuário autenticado — use `request.user.id`.
- Rate limit por IP (`@fastify/rate-limit` + `trustProxy: true`): `/auth/otp/request`
  5/15min, `/auth/otp/verify` 15/15min — 429 no envelope com code `RATE_LIMITED`.
  `/auth/refresh` **não** tem limite por IP: refreshes chegam pelos IPs de egress
  compartilhados da Vercel, um limite derrubaria usuários legítimos.

### Fluxo de sessão no web

- Cookies `httpOnly`: `access_token` (15 min) e `refresh_token` (30 dias).
- `middleware.ts` roda em toda rota: access token expirando em <30s → **silent
  refresh** contra `NEXT_PUBLIC_API_URL` e regrava os dois cookies; injeta
  `Authorization` nos requests de `/api/proxy/*`.
- O proxy (`app/api/proxy/[...path]`) injeta `Bearer` a partir do cookie e propaga
  `X-Forwarded-For` — sem isso o rate limit por IP da API enxergaria só a Vercel.

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

### Por que reads críticos via Prisma direto (Vercel→Supabase) em vez de proxy à API Railway?

**Decisão**: Server Components de páginas de leitura críticas (ex.: detalhe do anúncio) consultam o banco **direto via Prisma** (Vercel → Supabase), em vez de `fetch` → API Railway → Supabase.

**Contexto**: Após co-localizar a infra perto dos usuários (BR), as funções Vercel ficam em São Paulo (`gru1`) e o Supabase em São Paulo (`sa-east-1`). O Railway **não tem região no Brasil** (mais perto: US-East). Logo, um read via `Vercel(SP) → Railway(US-East) → Supabase(SP)` faz desvio cross-region (~240 ms+) para buscar dado que está ao lado da função Vercel. O detalhe do anúncio levava 2,6–6 s.

**Razões**: read co-localizado via Prisma direto custa ~2 ms; o detalhe do anúncio caiu para ~300 ms (~15×). `fetchListing` (em `apps/web/src/lib/api.ts`) e `getSellerReputation` (na página `anuncio/[id]`) agora são Prisma direto, espelhando `ListingsService.findById`/reputação da API.

**Consequência**: O Railway permanece para **escritas, auth e worker** (cross-region tolerável fora do caminho de navegação). Reads do **feed/matches** ainda passam por `client → /api/proxy → Railway` porque `FeedList` é Client Component (não pode usar Prisma direto) — removê-los exigiria Route Handlers na Vercel; **adiado**. Há agora **duas fontes** de lógica de leitura (API e web): ao mudar o shape de um listing, atualize **ambos** (`ListingsService.mapToDetail` ↔ `lib/api.ts` `fetchListing`).

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
| Imports relativos longos (`../../../lib/utils`)      | Aliases `@/lib/utils` ou `@siamo/shared`              |
| PRs grandes com múltiplos propósitos                 | Um PR = um propósito; quebre se necessário            |
| Editar arquivos gerados de `packages/ui` diretamente | Customize via `className` e CSS variables             |
| Commitar diretamente em `main`                       | Sempre via feature branch + PR                        |

---

## 11. ESTADO IMPLEMENTADO

> Atualizado: 2026-06-11 (sincronizado com o código na revisão de hardening). Leia esta seção **antes** de propor qualquer nova feature, endpoint ou refactor para evitar duplicação ou conflito com o que já existe.

### Branches

| Branch             | Deploy automático                 | Conteúdo                                 |
| ------------------ | --------------------------------- | ---------------------------------------- |
| `main`             | → Production (app.siamoagro.com)  | Sprints 0–3 + Design Hardening mergeados |
| `staging`          | → Staging (staging.siamoagro.com) | Integração pré-release; espelha `main`   |
| `feat/*` / `fix/*` | PR preview (Vercel)               | Features em desenvolvimento              |

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
| `/anuncio/[id]/proposta`          | ✅     | Fazer proposta (Client → POST /transactions)          |
| `/anuncio/[id]/propostas`         | ✅     | Propostas recebidas do anúncio (dono)                 |
| `/proposta/[id]`                  | ✅     | Detalhe da proposta                                   |
| `/proposta/[id]/enviada`          | ✅     | Confirmação pós-envio da proposta                     |
| `/notificacoes`                   | ✅     | Notificações com filter pills + grupos por dia        |
| `/transacoes`                     | ✅     | Transações com EmptyState                             |
| `/transacoes/[id]`                | ✅     | Detalhe da transação + chat                           |
| `/transacoes/[id]/concluir`       | ✅     | Confirmação de conclusão (dual-party)                 |
| `/transacoes/[id]/avaliar`        | ✅     | Avaliação pós-transação                               |
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
| GET    | `/listings`                    | ❌   | ✅ cursor-based, PostGIS, FTS         |
| GET    | `/listings/mine`               | ✅   | ✅ cursor-based                       |
| GET    | `/listings/:id`                | ❌   | ✅                                    |
| PATCH  | `/listings/:id`                | ✅   | ✅                                    |
| DELETE | `/listings/:id`                | ✅   | ✅ soft delete                        |
| POST   | `/listings/:id/pause`          | ✅   | ✅                                    |
| POST   | `/listings/:id/resume`         | ✅   | ✅                                    |
| GET    | `/listings/:id/matches`        | ✅   | ✅                                    |
| POST   | `/uploads/presigned`           | ✅   | ✅                                    |
| POST   | `/uploads/confirm`             | ✅   | ✅                                    |
| GET    | `/notifications`               | ✅   | ✅ cursor-based                       |
| PATCH  | `/notifications/:id/read`      | ✅   | ✅                                    |
| POST   | `/notifications/read-all`      | ✅   | ✅                                    |
| POST   | `/notifications/push`          | ✅   | ⚠️ stub — sem persistência            |
| POST   | `/transactions`                | ✅   | ✅ cria proposta (201)                |
| GET    | `/transactions`                | ✅   | ✅                                    |
| GET    | `/transactions/:id`            | ✅   | ✅                                    |
| POST   | `/transactions/:id/accept`     | ✅   | ✅                                    |
| POST   | `/transactions/:id/counter`    | ✅   | ✅ contraproposta                     |
| POST   | `/transactions/:id/start`      | ✅   | ✅ confirmação dual-party de início   |
| POST   | `/transactions/:id/complete`   | ✅   | ✅ confirmação dual-party de fim      |
| POST   | `/transactions/:id/cancel`     | ✅   | ✅ com motivo                         |
| POST   | `/transactions/:id/messages`   | ✅   | ✅                                    |
| POST   | `/transactions/:id/rating`     | ✅   | ✅ avaliação (módulo reputation)      |
| GET    | `/profiles/:id/reputation`     | ❌   | ✅ média ao vivo de ratings           |
| GET    | `/help/faq`                    | ❌   | ✅                                    |
| GET    | `/help/faq/search`             | ❌   | ✅ `?q=`                              |
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

> Fonte da verdade: `packages/ui/src/index.ts`. Os componentes vivem na **raiz de
> `src/`** (apenas `button`/`card` ficam em `src/components/`). Primitivos shadcn
> não listados abaixo (Input, Dialog, Tabs…) **não estão no index** — confirme antes
> de importar de `@siamo/ui`. BottomTabBar é componente do app, não do pacote.

**Base:** Button (variantes: cta, cta-disabled, ghost-muted), Card, `cn()`, `formatBRL()`, `getInitials()`

**Siamo:** ListingCard (`isCached?: boolean`) + ListingCardSkeleton, MatchScoreBadge, KindBadge, StatusBadge, SectionLabel, ProgressIndicator, BottomCTA, SelectCard, PhoneInput, OTPInput, AvatarUpload, ConsentCheckbox, FilterTabs, Fab, Toggle, PriceInput, SummaryBadge, ReviewCard, PriceBlock, StateBanner, ReputationSeal, ListingContextStrip, ProposalBlock, PriceProposalInput, QuantityStepper, ChatBubble, ChatInput (`isOffline?: boolean`), StarRating, MiniStarRating, RatingCategoryRow, SearchBar, SuggestionChip, RangeSlider, FilterChipGroup, CollectiveProgressBar, ListingMiniCard, NotificationIcon, SettingsRow, SettingsGroup, ConsentRow, PrivacyActionCard, ThemeSelector, FontSizeSlider

**Estados especiais:** EmptyState (`iconVariant: 'lime' | 'muted'`), ErrorScreen (`compact?: boolean`, `iconVariant: 'red' | 'amber' | 'blue'`)

**Icons (`@siamo/ui/icons`):** Re-exports Lucide + SVG custom: CoffeeBean, Agronomist, Tractor, Soybean, Corn, Cattle, Harvester, Irrigation, Soil, Farm, Offer, Demand, Service, Equipment, WhatsAppLogo. Map `CATEGORY_ICONS`.

---

### Features especiais — Lote 6 (`feat/design-hardening`)

| Feature                   | Arquivo                                                                 | Notas                                                                                                                                                           |
| ------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Offline banner            | `components/offline-banner.tsx`                                         | Amber (offline) / azul pulsante (reconectando). Mount guard para evitar hydration mismatch.                                                                     |
| Offline queue             | `lib/offline-queue.ts`                                                  | localStorage `siamo:offline-queue`, max 3 retries, flush no reconnect                                                                                           |
| Online status hook        | `hooks/use-online-status.ts`                                            | Dispara `siamo:reconnected` custom event ao reconectar                                                                                                          |
| Service Worker            | `src/sw.ts`                                                             | Serwist v9. Desabilitado em dev. Handlers: StaleWhileRevalidate (listings/profiles), NetworkFirst (pages/notifications), NetworkOnly (transactions)             |
| PWA manifest              | `public/manifest.json`                                                  | Ícones SVG placeholder em `public/icons/` — PNGs ainda não gerados                                                                                              |
| PWA install sheet         | `hooks/use-pwa-install.ts` + `components/pwa-install-sheet.tsx`         | `beforeinstallprompt`, visitas ≥ 3, dismiss 7 dias                                                                                                              |
| Push permission modal     | `hooks/use-push-permission.ts` + `components/push-permission-modal.tsx` | Sessões ≥ 3, soft dismiss 7d, hard deny 30d                                                                                                                     |
| 404 / 500 / network error | `app/not-found.tsx`, `app/error.tsx`, `components/network-error.tsx`    | Usam ErrorScreen de `packages/ui`                                                                                                                               |
| Bookmark (salvar anúncio) | `components/listings/bookmark-button.tsx`                               | Optimistic toggle com `useTransition`; dispara `siamo:bookmark-toggled`; redireciona p/ `/entrar` se não autenticado                                            |
| Feed tab "Salvos"         | `components/feed-list.tsx`                                              | Refetch no evento `siamo:bookmark-toggled` (mesma página) e ao ativar a aba (back-navigation)                                                                   |
| Feed tab "Matches"        | `components/feed-list.tsx` + `GET /me/feed/matches`                     | `computing: true` → spinner com re-poll de 4s (teto 10); 401 → CTA de login; `matchScore` 0–1 convertido p/ 0–100 no `FeedCard`; `distanceKm` repassado ao card |
| Bell unread count         | `app/feed/page.tsx`                                                     | Query paralela no servidor (`Promise.all`); ponto vermelho renderizado somente quando `unreadCount > 0`                                                         |

---

### Padrões de UI consolidados (não alterar sem decisão explícita)

| Elemento            | Classes                                                            |
| ------------------- | ------------------------------------------------------------------ |
| Pills/tabs ativo    | `feed-tab-active font-medium min-h-0 min-w-0`                      |
| Pills/tabs inativo  | `bg-muted text-fg-secondary hover:text-foreground min-h-0 min-w-0` |
| Botão voltar        | `bg-muted flex size-12 items-center justify-center rounded-full`   |
| Ação primária (CTA) | `bg-cta-bg text-cta-fg`                                            |
| Seção label         | `font-mono text-[10px] tracking-[0.4px]` uppercase                 |
| Card de anúncio     | `ListingCard` de `@siamo/ui`                                       |

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

| Plataforma | Ambiente   | Serviço / Domínio                     | Notas                                            |
| ---------- | ---------- | ------------------------------------- | ------------------------------------------------ |
| Railway    | production | `api` → `api.siamoagro.com`           | Start: `node apps/api/dist/index.js`; Pro plan   |
| Railway    | production | `worker`                              | Start: `node apps/api/dist/worker.js`; sem porta |
| Railway    | production | Redis plugin                          | Injeta `REDIS_URL`                               |
| Railway    | staging    | `api` → `api-staging.siamoagro.com`   | Mesmo build, vars de staging                     |
| Railway    | staging    | `worker`                              | Idem, sem porta                                  |
| Railway    | staging    | Redis plugin                          | Redis isolado de produção                        |
| Vercel     | production | `app.siamoagro.com`                   | Branch `main`; root dir `apps/web`               |
| Vercel     | staging    | `staging.siamoagro.com`               | Branch `staging`; mesma config de build          |
| Supabase   | production | projeto `siamo-agro-production`       | Migrations manuais; ver §4                       |
| Supabase   | staging    | projeto `siamo-agro-staging`          | Cópia do schema; dados de teste                  |
| Namecheap  | —          | DNS autoritativo para `siamoagro.com` | Ver registros abaixo; **sem** proxy Cloudflare   |

**Região e cold starts (decisão de latência — 2026-06-04):**

- **Co-localização BR**: funções Vercel em **São Paulo (`gru1`)**; Supabase **staging e produção em São Paulo (`sa-east-1`)**. A produção foi **migrada de West US → São Paulo** (runbook executado via `pg_dump --data-only`; reaplicados `migrations/manual/001_postgis.sql` + `004_rls.sql` no projeto novo). Reads co-localizados caíram de ~120–180 ms para ~2 ms/query.
- **Railway permanece em US-East** (sem região no Brasil) → mantido **fora do caminho de leitura quente** (ver ADR §9 "reads via Prisma direto"). Atende escritas, auth e worker.
- **App Sleeping OFF**: `railway.toml` define `sleepApplication = false` + `numReplicas = 1` para a API. O **worker** é configurado no dashboard — confirmar App Sleeping OFF nos **dois serviços** e **ambos os ambientes**. Motivo: cold-starts de ~3,3 s no login e no primeiro carregamento de matches. Custo: serviços always-on cobram compute contínuo (aceitável em produção; trade-off em staging).

**Registros DNS (Namecheap):**

| Tipo  | Nome                                        | Destino                                               |
| ----- | ------------------------------------------- | ----------------------------------------------------- |
| CNAME | `app.siamoagro.com`                         | alvo do projeto na Vercel (`*.vercel-dns-*.com`)      |
| CNAME | `staging.siamoagro.com`                     | idem                                                  |
| CNAME | `api.siamoagro.com`                         | alvo do serviço `api` no Railway (`*.up.railway.app`) |
| CNAME | `api-staging.siamoagro.com`                 | idem (ambiente staging)                               |
| TXT   | `_railway-verify.api.siamoagro.com`         | token de verificação do Railway                       |
| TXT   | `_railway-verify.api-staging.siamoagro.com` | idem (ambiente staging)                               |

> Os valores exatos de destino e os tokens `_railway-verify` são **por domínio** e
> mudam a cada domínio adicionado — leia-os sempre no dashboard (Vercel → Settings →
> Domains; Railway → serviço → Settings → Networking) em vez de copiar daqui.
> Runbook completo do rebrand: `docs/plano-migracao-siamo.md` §3b.

---

### TODOs pendentes (não implementado ainda)

- [x] Configurar serviços no Railway (API + Worker + Redis) e Vercel — concluído 2026-05-28
- [x] Gerar `public/icons/icon-192.png` e `icon-512.png` — existem e servem 200 em produção
- [ ] Substituir a arte dos ícones pelo logo Siamo — hoje é um globo lime genérico (placeholder neutro, sem marca antiga)
- [ ] Gerar VAPID keys (`npx web-push generate-vapid-keys`) e adicionar ao `.env`
- [ ] Implementar persistência de push subscriptions na API (tabela `push_subscriptions` + `web-push` npm)
- [x] RLS: `migrations/manual/004_rls.sql` — RLS habilitado nas 14 tabelas públicas; aplicado em staging e produção (2026-06-02)
- [x] PostGIS: `migrations/manual/001_postgis.sql` — setup canônico (extensão no schema `extensions`, coluna `geog`, trigger de sync, índice GiST). Produção já está nesse padrão.
- [ ] Alinhar staging ao PostGIS de produção (schema `extensions`) — one-off em `migrations/manual/oneoff_staging_postgis_to_extensions.sql` (opcional; o app funciona com PostGIS em `public` também)
- [x] Matchmaking: `migrations/manual/005_matchmaking_perf.sql` — UNIQUE de `match_scores`, índice GIN de busca FTS (português), índice keyset do feed, drop de índices redundantes; aplicada em staging e produção (2026-06-11)
- [ ] Busca sem acento: `migrations/manual/006_search_unaccent.sql` — `unaccent` + `pg_trgm` no schema `extensions`, `immutable_unaccent()`, `listing_search_document()`, GIN sem acento (substitui o de 005) e GIN trigram do título. **Aplicada em staging (2026-08-25); falta produção.** ⚠️ Aplicar ANTES do deploy da API: o código novo chama essas funções, e o código antigo perde o índice que ela dropa
- [ ] Remover o fallback de refresh token legado (`findRefreshToken` em `apps/api/src/modules/auth/service.ts`) após **2026-07-10** — o TTL de 30 dias esgota os tokens antigos
- [ ] Job de expurgo físico 30 dias após `DELETE /me` (LGPD) — hoje só marca `status: DELETED`; anúncios do usuário continuam ativos no feed e não há purge implementado
- [ ] Decidir o CTA de WhatsApp no detalhe do anúncio — `wa.me/?text=` sem telefone abre o share picker, não conversa com o vendedor
- [ ] Unificar `API_URL` vs `NEXT_PUBLIC_API_URL` (mesmo backend, dois nomes — proxy/SSR usa um, middleware usa o outro)
- [ ] Cron de limpeza de `otp_codes` e `refresh_tokens` expirados (crescimento de tabela sem bound)
- [ ] Testes E2E (`apps/web/e2e/special-states.spec.ts`) — criados, não rodados em CI ainda

---

## 12. ALGORITMO DE MATCHMAKING

> Implementado em `apps/api/src/modules/matchmaking/algorithm.ts` (funções puras) e
> `apps/api/src/workers/matchmaking/processor.ts` (pipeline do worker).
> Persistência: score ≥ **0.20** (`MIN_SCORE`). Notificação: score ≥ **0.70** (`HIGH_SCORE_THRESHOLD`).

---

### Fórmula geral

```
score_final =
  0.40 × distScore   +
  0.35 × repScore    +
  0.20 × compatScore +
  0.05 × respScore
```

Pesos ajustáveis por env — `MATCH_WEIGHT_DISTANCE`, `MATCH_WEIGHT_REPUTATION`,
`MATCH_WEIGHT_COMPATIBILITY`, `MATCH_WEIGHT_RESPONSIVENESS` — e precisam somar 1.0;
caso contrário caem nos defaults (warn único no log do worker). Todos os sub-scores
são normalizados para **[0, 1]**; o resultado vai em `match_scores.score`.

---

### Sub-scores

#### Distância — peso 0.40

Decaimento **logarítmico** até `MATCH_MAX_DISTANCE_KM` (default **200 km**), via Haversine:

```ts
distScore = Math.max(0, 1 - Math.log(1 + d) / Math.log(1 + 200))
```

Atenção: o raio de **busca** de candidatos é 500 km (processor) — entre 200 e 500 km
o `distScore` é 0, mas o par ainda pode pontuar nos demais componentes.

#### Reputação — peso 0.35

Lida **ao vivo** via LEFT JOIN em `ratings` na query de candidatos — nunca dos campos
desnormalizados `profile.current_rating`/`rating_count`:

```ts
base = avgRating / 5
coldStart = ratingCount < 3 ? ratingCount / 3 : 1 // 1 avaliação 5★ não supera veterano
repScore = clamp01(base * coldStart + badgeBonus) // GOLD +0.10 · SILVER +0.05
```

#### Compatibilidade — peso 0.20

Avaliada par-a-par entre o anúncio-alvo e os anúncios **ATIVOS** do candidato; vale o
**melhor par** (não a média). Base pela matriz de kind:

| alvo \ candidato | OFFER | DEMAND | SERVICE | EQUIPMENT |
| ---------------- | ----- | ------ | ------- | --------- |
| OFFER            | 0.0   | 0.7    | 0.4     | 0.4       |
| DEMAND           | 0.7   | 0.0    | 0.7     | 0.7       |
| SERVICE          | 0.4   | 0.7    | 0.0     | 0.4       |
| EQUIPMENT        | 0.4   | 0.7    | 0.4     | 0.0       |

Base 0 (mesmo kind) zera o par — bônus de categoria não resgata concorrentes.
Bônus: mesma `category` **+0.30**; mesmo cluster **+0.15**; sem cluster em comum +0.
Categorias em inglês (fonte: `packages/shared/src/validators/listing.ts`):

| Cluster         | Categorias                             |
| --------------- | -------------------------------------- |
| GRAINS          | COFFEE, CORN, SOY, GRAINS              |
| LIVESTOCK       | LIVESTOCK, DAIRY                       |
| HORTICULTURE    | FRUITS, VEGETABLES                     |
| AGRO_SERVICES   | AGRONOMY, VETERINARY, CONSULTING       |
| MECHANICAL      | MECHANICS, TRACTOR, HARVESTER          |
| INFRASTRUCTURE  | IRRIGATION, IRRIGATION_SYSTEM, STORAGE |
| LABOR_TRANSPORT | LABOR, TRANSPORT                       |

Categorias fora do mapa (TOOLS, OTHER…) caem no cluster `OTHER`, que nunca ganha bônus.

#### Responsividade — peso 0.05

Tempo médio entre a criação da transação e a **primeira mensagem do próprio vendedor**
(só transações ACCEPTED/IN_PROGRESS/COMPLETED — mensagem do comprador não conta).
Função degrau:

| Média de resposta | respScore          |
| ----------------- | ------------------ |
| < 1h              | 1.0                |
| < 6h              | 0.7                |
| < 24h             | 0.4                |
| ≥ 24h             | 0.1                |
| sem histórico     | 0.5 (prior neutro) |

---

### Busca de candidatos (PostGIS)

Executada em `processor.ts` via query raw: até **500 candidatos** (`MAX_CANDIDATES`)
em raio de **500 km**, ordenados por distância, com rating ao vivo agregado, excluindo
o dono e exigindo ≥1 anúncio ativo:

```sql
SELECT p.id, p.user_id, p.badge, loc.latitude, loc.longitude,
       ST_Distance(loc.geog, ST_MakePoint(:lng, :lat)::geography) / 1000.0 AS distance_km,
       COALESCE(r_agg.avg_score, 0) AS current_rating,
       COALESCE(r_agg.cnt, 0)       AS rating_count
FROM profiles p
JOIN locations loc ON loc.profile_id = p.id
LEFT JOIN (
  SELECT ratee_id, AVG(score)::float AS avg_score, COUNT(*)::int AS cnt
  FROM ratings GROUP BY ratee_id
) r_agg ON r_agg.ratee_id = p.user_id
WHERE p.id != :ownerProfileId
  AND loc.geog IS NOT NULL
  AND ST_DWithin(loc.geog, ST_MakePoint(:lng, :lat)::geography, 500000)
  AND EXISTS (SELECT 1 FROM listings l WHERE l.profile_id = p.id AND l.status = 'ACTIVE')
ORDER BY ST_Distance(loc.geog, ST_MakePoint(:lng, :lat)::geography)
LIMIT 500
```

Scores computados em lotes de 50 (`BATCH_SIZE`); persistem os **top 50** (`TOP_MATCHES`)
com score ≥ 0.20.

---

### Persistência

`@@unique([listingId, candidateProfileId])` em `match_scores` (migration 005) garante
uma linha por par. O processor faz **delete + recreate** em transação por listing —
não upsert. Recomputo concorrente do mesmo listing é evitado pelo dedup de job
(jobId) e, no pior caso, barra na constraint única (o retry do BullMQ resolve).

---

### Ciclo de vida dos jobs (BullMQ)

| Evento                                                   | Job disparado                                                                                                                                                                   | Efeito                                                                |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `POST /listings` (criação)                               | `compute-matches` (sem dedup), disparado UMA vez dentro de `ListingsService.create`                                                                                             | Descobre candidatos imediatamente                                     |
| `PATCH /listings/:id` mudando título/descrição/categoria | `compute-matches` (sem dedup)                                                                                                                                                   | Recomputa o matching do anúncio editado                               |
| `GET /me/feed/matches` vazio + usuário tem listing ativo | `compute-matches` p/ listings próprios sem `matchesComputedAt` **e** até 30 vizinhos com `matches_computed_at IS NULL` — ambos `{ dedupe: true }` (jobId `compute:<listingId>`) | Popula o feed na primeira visita sem thundering herd                  |
| `compute-matches` termina com pares ≥ 0.70               | `notify-match` para o **dono do anúncio**                                                                                                                                       | WhatsApp 1×/dia por dono (jobId `notify-match:<userId>:<YYYY-MM-DD>`) |
| `notify-match` enfileirado fora de 08:00–20:00 BRT       | delay até a próxima janela comercial                                                                                                                                            | `msUntilNextBusinessHours()` no enqueue — sem `throw` nem retry loop  |

Jobs com `attempts: 3` + backoff exponencial. Completados ficam retidos por 1h —
que é também a janela efetiva do dedup por jobId (um recompute via feed do mesmo
listing só re-enfileira depois disso).

---

### Frontend — fluxo de dados

1. `FeedList` com `activeTab === 'matches'` chama `fetchMatchesPage()` → `GET /api/proxy/me/feed/matches`.
2. `toFeedCardData()` converte `matchScore` de float 0–1 para inteiro 0–100 antes de passar ao `FeedCard`.
3. `computing: true` (primeira visita sem scores) → spinner + **re-poll a cada 4s**
   com teto de 10 tentativas (`refetchInterval` no TanStack Query).
4. 401 → `EmptyState` com CTA de login (`/entrar`) — a aba é autenticada; antes
   mostrava "Sem matches ainda" enganosamente.
5. `distanceKm` é repassado diretamente ao `FeedCard` para exibição de distância.

---

## 13. CONTAS DEMO

> Implementado em `apps/api/src/modules/auth/service.ts` — métodos `isDemoPhone()`, `demoOtp` e `issueSessionForPhone()`.

### Problema resolvido

O fluxo de autenticação do Siamo usa OTP via WhatsApp (Twilio). Em ambientes de desenvolvimento, QA e demonstrações não é desejável enviar mensagens reais — seja por custo, dependência de conectividade ou por expor números de telefone reais de testadores.

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

---

## 14. VARIÁVEIS DE AMBIENTE

> Referência de **quem lê o quê**. As que afetam build cache estão listadas em `turbo.json`.
> Nos provedores: configurar em Railway (api + worker), Vercel (web — **incluindo o
> ambiente Preview**, ver nota do `JWT_SECRET`) e CI conforme o processo.

| Variável                                                            | Processo                 | Obrigatória                  | Notas                                                                                                                                                                            |
| ------------------------------------------------------------------- | ------------------------ | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` / `DIRECT_URL`                                       | api, worker, web (SSR)   | sim                          | Pooler (PgBouncer) nas queries; direta só para tooling do Prisma                                                                                                                 |
| `JWT_SECRET`                                                        | api, web                 | **sim em produção**          | Sem fallback: API falha no boot, web lança `CONFIG_MISSING_ENV`. Habilitar também no **Preview** da Vercel — build de preview roda com `NODE_ENV=production`                     |
| `REDIS_URL`                                                         | worker (sim), api (não)  | só no worker                 | Sem ela a API loga warn e ignora jobs; o worker se recusa a subir                                                                                                                |
| `API_URL`                                                           | web (proxy + SSR fetch)  | não (default localhost:3001) | Railway em produção/staging                                                                                                                                                      |
| `NEXT_PUBLIC_API_URL`                                               | web (middleware refresh) | não (default localhost:3001) | ⚠ duplica `API_URL` — unificação está nos TODOs                                                                                                                                  |
| `NEXT_PUBLIC_APP_URL`                                               | api, worker              | não                          | CORS da API + links nas notificações WhatsApp                                                                                                                                    |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`                        | api                      | p/ uploads                   | Também usada na validação de propriedade de fotos (`photo-ownership.ts`)                                                                                                         |
| `DEMO_PHONES` / `DEMO_OTP`                                          | api                      | não                          | §13 — bypass de OTP para contas demo; vazio = desativado                                                                                                                         |
| `MATCH_WEIGHT_*` / `MATCH_MAX_DISTANCE_KM`                          | api, worker              | não                          | §12 — tuning do matchmaking sem deploy (requer restart do processo)                                                                                                              |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM` | api, worker              | não (modo stub)              | Sem elas o adapter loga e não envia mensagens reais                                                                                                                              |
| `TWILIO_CONTENT_SID_OTP`                                            | api                      | **sim em produção**          | Content SID (HX…) do template `siamo_otp` aprovado pela Meta. Vazio = Body livre, que só entrega no sandbox. Nome exato lido em `twilio.adapter.ts` — não é `TWILIO_CONTENT_SID` |
