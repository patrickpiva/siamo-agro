# AgroLink

Plataforma digital que conecta **produtores rurais** e **prestadores de serviço** no agronegócio brasileiro.

---

## Estrutura do Monorepo

```
agrolink/
├── apps/
│   ├── web/          # Next.js 15 — App Router, Tailwind v4, TypeScript
│   └── api/          # Fastify 5 — API REST, TypeScript
├── packages/
│   ├── db/           # Prisma schema + client (Supabase PostgreSQL)
│   ├── shared/       # Tipos, validadores Zod e constantes compartilhados
│   └── ui/           # Componentes React reutilizáveis (base shadcn/ui)
├── package.json      # Raiz do monorepo (pnpm workspaces + Turborepo)
├── pnpm-workspace.yaml
└── turbo.json
```

## Stack

| Camada        | Tecnologia                            |
| ------------- | ------------------------------------- |
| Frontend      | Next.js 15, React 19, Tailwind CSS v4 |
| Backend       | Fastify 5, TypeScript                 |
| Banco         | Supabase (PostgreSQL) via Prisma 6    |
| Validação     | Zod 3                                 |
| UI Primitivos | shadcn/ui + Radix UI                  |
| Monorepo      | pnpm workspaces + Turborepo           |
| Testes        | Vitest + Testing Library              |
| Linting       | ESLint 9 (flat config) + Prettier 3   |
| Git hooks     | Husky + lint-staged                   |

---

## Configuração inicial

### Pré-requisitos

- Node.js >= 20
- pnpm >= 9 — `npm install -g pnpm`
- Conta no [Supabase](https://supabase.com) com um projeto criado

### Variáveis de ambiente

```bash
cp .env.example .env
```

Preencha no `.env`:

| Variável       | Onde encontrar                                              |
| -------------- | ----------------------------------------------------------- |
| `DATABASE_URL` | Supabase → Settings → Database → Connection string (pooler) |
| `DIRECT_URL`   | Supabase → Settings → Database → Connection string (direct) |

> **Dica:** A `DATABASE_URL` usa o PgBouncer (porta 6543) para queries. A `DIRECT_URL` usa conexão direta (porta 5432) — obrigatória para o Prisma Migrate.

### Instalação

Execute os comandos **nesta ordem**:

```bash
# 1. Instalar todas as dependências do monorepo
pnpm install

# 2. Configurar os git hooks (Husky)
pnpm prepare

# 3. Gerar o Prisma Client a partir do schema
pnpm --filter @agrolink/db run db:generate

# 4a. Desenvolvimento — empurrar o schema direto para o banco (sem migration)
pnpm --filter @agrolink/db run db:push

# 4b. Produção / time — criar e aplicar migrations versionadas (use no lugar de 4a)
pnpm --filter @agrolink/db run db:migrate

# 5. (Opcional) Popular o banco com dados iniciais
pnpm --filter @agrolink/db run db:seed
```

---

## Desenvolvimento

```bash
# Iniciar todos os apps em paralelo (web :3000 + api :3001)
pnpm dev

# Apenas o frontend
pnpm --filter @agrolink/web dev

# Apenas a API
pnpm --filter @agrolink/api dev

# Abrir o Prisma Studio (inspecionar o banco visualmente)
pnpm --filter @agrolink/db run db:studio
```

## Testes

```bash
# Rodar todos os testes
pnpm test

# Testes de um pacote específico
pnpm --filter @agrolink/shared test
pnpm --filter @agrolink/api test

# Modo watch
pnpm --filter @agrolink/shared test:watch
```

## Qualidade de código

```bash
# Type-check em todos os packages
pnpm typecheck

# Lint (apenas reporte)
pnpm lint

# Lint com correção automática
pnpm lint:fix

# Formatar todos os arquivos
pnpm format
```

## Build

```bash
# Build completo (Turborepo resolve a ordem de dependências automaticamente)
pnpm build
```

---

## Pacotes internos

### `@agrolink/shared`

Código compartilhado entre `web` e `api`:

- **`src/types`** — Interfaces TypeScript (`User`, `Listing`, `ApiResponse`…)
- **`src/validators`** — Schemas Zod para validação de input
- **`src/constants`** — Estados brasileiros, categorias de serviço, constantes da app

### `@agrolink/db`

Camada de acesso ao banco (Supabase):

- **`prisma/schema.prisma`** — Modelos: `User`, `ProducerProfile`, `ProviderProfile`, `Listing`
- **`src/index.ts`** — Singleton do `PrismaClient` + re-export dos tipos gerados
- Configurado com `url` (pooler) e `directUrl` (direct) para compatibilidade total com Supabase

### `@agrolink/ui`

Biblioteca de componentes React:

- Base **shadcn/ui** com Radix UI Primitives
- `Button` e `Card` já incluídos
- Utilitário `cn()` (clsx + tailwind-merge)

---

## Adicionando componentes shadcn/ui

```bash
# A partir da raiz do monorepo
pnpx shadcn@latest add input --cwd packages/ui
pnpx shadcn@latest add dialog --cwd packages/ui
```

---

## Modelo de dados

```
User (PRODUCER | PROVIDER | ADMIN)
 ├── ProducerProfile  →  fazenda, estado, culturas
 └── ProviderProfile  →  empresa, serviços, estados atendidos
      └── Listing     →  anúncio de serviço (categoria, preço, status)
```

---

## Convenções

- Commits: [Conventional Commits](https://www.conventionalcommits.org/pt-br/)
- Branches: `feat/`, `fix/`, `chore/`, `docs/`
- Pre-commit: ESLint + Prettier rodam automaticamente via Husky
