# Skill: novo-modulo

Cria um novo módulo de domínio completo na API Fastify do AgroLink.
Use quando o usuário pedir para criar um módulo, feature ou domínio novo na API.

## Contexto do projeto

- API: Fastify 5 + TypeScript (NodeNext — imports precisam de extensão `.js`)
- ORM: Prisma via `@agrolink/db`
- Validação: Zod via `@agrolink/shared` (validators compartilhados) ou local
- Type provider: `fastify-type-provider-zod` (instale se não estiver em package.json)
- Testes: Vitest
- Ponto de entrada: `apps/api/src/app.ts`

---

## Passo 1 — Criar a estrutura de pastas

```
apps/api/src/modules/{nome}/
├── routes.ts
├── service.ts
├── schema.ts
├── errors.ts
└── {nome}.test.ts
```

---

## Passo 2 — errors.ts

Erros tipados do módulo. Nunca `throw new Error("string")`.

```typescript
import { AppError } from '@agrolink/shared'

export class {Nome}NotFoundError extends AppError {
  constructor(id: string) {
    super(`{Nome} not found: ${id}`, '{NOME}_NOT_FOUND', 404)
  }
}

export class {Nome}ConflictError extends AppError {
  constructor(field: string) {
    super(`{Nome} already exists: ${field}`, '{NOME}_CONFLICT', 409)
  }
}
```

> Adicionar um erro por caso de negócio. Não criar erros genéricos.

---

## Passo 3 — schema.ts

Schemas Zod de input e output. Um schema por endpoint.

```typescript
import { z } from 'zod'

// ─── Shared ───────────────────────────────────────────────────────────────────

export const {Nome}Schema = z.object({
  id: z.string().cuid(),
  // ... campos do modelo
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// ─── Create ───────────────────────────────────────────────────────────────────

export const Create{Nome}BodySchema = z.object({
  // campos obrigatórios e opcionais
})

export const Create{Nome}ResponseSchema = z.object({
  data: {Nome}Schema,
  error: z.null(),
})

// ─── List ─────────────────────────────────────────────────────────────────────

export const List{Nome}QuerySchema = z.object({
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const List{Nome}ResponseSchema = z.object({
  data: z.array({Nome}Schema),
  error: z.null(),
  meta: z.object({
    nextCursor: z.string().nullable(),
    limit: z.number(),
  }),
})

// ─── Error response (reutilizável) ────────────────────────────────────────────

export const ErrorResponseSchema = z.object({
  data: z.null(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
})

// ─── Tipos inferidos ──────────────────────────────────────────────────────────

export type {Nome} = z.infer<typeof {Nome}Schema>
export type Create{Nome}Body = z.infer<typeof Create{Nome}BodySchema>
```

---

## Passo 4 — service.ts

Lógica de negócio com prisma injetado. Sem lógica HTTP aqui.

```typescript
import type { PrismaClient } from '@agrolink/db'
import type { Create{Nome}Body } from './schema.js'
import { {Nome}NotFoundError, {Nome}ConflictError } from './errors.js'

export class {Nome}Service {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: Create{Nome}Body) {
    // Verificar conflito se necessário
    const existing = await this.prisma.{nome}.findUnique({
      where: { /* campo único */ },
    })
    if (existing) throw new {Nome}ConflictError(/* campo */)

    return this.prisma.{nome}.create({ data })
  }

  async list(cursor?: string, limit = 20) {
    const items = await this.prisma.{nome}.findMany({
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
    })

    const hasMore = items.length > limit
    const data = hasMore ? items.slice(0, limit) : items
    const nextCursor = hasMore ? (data.at(-1)?.id ?? null) : null

    return { data, meta: { nextCursor, limit } }
  }

  async findById(id: string) {
    const item = await this.prisma.{nome}.findUnique({ where: { id } })
    if (!item) throw new {Nome}NotFoundError(id)
    return item
  }
}
```

---

## Passo 5 — routes.ts

Handlers HTTP com type-provider-zod. Sem lógica de negócio aqui.

```typescript
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { prisma } from '@agrolink/db'
import { {Nome}Service } from './service.js'
import {
  Create{Nome}BodySchema,
  Create{Nome}ResponseSchema,
  List{Nome}QuerySchema,
  List{Nome}ResponseSchema,
  ErrorResponseSchema,
} from './schema.js'
import { AppError } from '@agrolink/shared'

const service = new {Nome}Service(prisma)

export const {nome}Routes: FastifyPluginAsyncZod = async (app) => {
  // POST /api/v1/{nomes}
  app.post('/', {
    schema: {
      body: Create{Nome}BodySchema,
      response: {
        201: Create{Nome}ResponseSchema,
        409: ErrorResponseSchema,
        422: ErrorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const item = await service.create(request.body)
      return reply.code(201).send({ data: item, error: null })
    },
  })

  // GET /api/v1/{nomes}
  app.get('/', {
    schema: {
      querystring: List{Nome}QuerySchema,
      response: { 200: List{Nome}ResponseSchema },
    },
    handler: async (request, reply) => {
      const { cursor, limit } = request.query
      const result = await service.list(cursor, limit)
      return reply.send({ ...result, error: null })
    },
  })
}
```

---

## Passo 6 — Registrar em app.ts

Adicionar o plugin com prefixo `/api/v1/{nomes}`:

```typescript
// apps/api/src/app.ts
import { {nome}Routes } from './modules/{nome}/routes.js'

// dentro de buildApp(), após os plugins existentes:
await app.register({nome}Routes, { prefix: '/api/v1/{nomes}' })
```

---

## Passo 7 — {nome}.test.ts

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { {Nome}Service } from './service.js'
import { {Nome}NotFoundError } from './errors.js'

// Mock do Prisma — nunca mockar o banco real
const mockPrisma = {
  {nome}: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  },
}

describe('{Nome}Service', () => {
  let service: {Nome}Service

  beforeEach(() => {
    vi.clearAllMocks()
    service = new {Nome}Service(mockPrisma as any)
  })

  describe('findById', () => {
    it('retorna o item quando existe', async () => {
      const item = { id: 'cuid123', createdAt: new Date(), updatedAt: new Date() }
      mockPrisma.{nome}.findUnique.mockResolvedValue(item)

      const result = await service.findById('cuid123')
      expect(result).toEqual(item)
    })

    it('lança {Nome}NotFoundError quando não existe', async () => {
      mockPrisma.{nome}.findUnique.mockResolvedValue(null)

      await expect(service.findById('inexistente')).rejects.toBeInstanceOf({Nome}NotFoundError)
    })
  })
})
```

---

## Checklist final

- [ ] Substituir todos os `{nome}` / `{Nome}` / `{NOME}` pelo nome real do módulo
- [ ] Campos do schema conferem com o modelo Prisma
- [ ] Nunca expor `passwordHash` ou dados sensíveis nos schemas de response
- [ ] Importações com extensão `.js` (NodeNext)
- [ ] Rota registrada em `app.ts` com o prefixo correto
- [ ] `pnpm typecheck` passa sem erros
