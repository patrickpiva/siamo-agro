# Skill: novo-endpoint

Adiciona um endpoint a um módulo existente da API AgraIA.
Use quando o módulo já existe e o usuário quer acrescentar uma rota nova.

## Antes de começar

1. Identificar o módulo: `apps/api/src/modules/{nome}/`
2. Ler `schema.ts`, `service.ts` e `routes.ts` do módulo para entender os padrões já estabelecidos
3. Confirmar se o endpoint segue REST puro ou é uma ação (`/publish`, `/cancel`)

---

## Passo 1 — Definir o schema em schema.ts

Adicionar os schemas de input e output **sem alterar schemas existentes**.

```typescript
// ─── {Ação} ───────────────────────────────────────────────────────────────────

export const {Acao}{Nome}ParamsSchema = z.object({
  id: z.string().cuid(),
})

export const {Acao}{Nome}BodySchema = z.object({
  // campos obrigatórios primeiro, opcionais depois
  campo: z.string().min(1).max(255),
  campOpcional: z.number().positive().optional(),
})

export const {Acao}{Nome}ResponseSchema = z.object({
  data: {Nome}Schema,  // reutilizar schema de response já existente
  error: z.null(),
})
```

### Regras de schema

- `z.string()` sem `.min(1)` aceita string vazia — sempre especificar
- Datas vêm do Prisma como `Date`, mas o JSON serializa para string — usar `z.string().datetime()` no response
- **Nunca** incluir `passwordHash`, `code` (OTP) ou qualquer dado sensível no schema de response
- Para paginação: cursor-based com `cursor?: string` e `limit: number` (default 20, max 100)
- Campos de enum Prisma: `z.enum(['ACTIVE', 'PAUSED', 'CLOSED'])` — manter em sync com o schema

---

## Passo 2 — Implementar a lógica em service.ts

Adicionar método na classe `{Nome}Service`. Sem lógica HTTP (sem `reply`, sem `request`).

```typescript
async {acao}(id: string, data: {Acao}{Nome}Body, actorId: string) {
  // 1. Buscar o recurso (lança NotFoundError se não existir)
  const item = await this.findById(id)

  // 2. Verificar autorização no service (não no handler)
  if (item.ownerId !== actorId) {
    throw new {Nome}ForbiddenError(id)
  }

  // 3. Verificar pré-condições de negócio
  if (item.status !== 'ACTIVE') {
    throw new {Nome}InvalidStateError(item.status)
  }

  // 4. Executar a mutação
  return this.prisma.{nome}.update({
    where: { id },
    data: { ...data, updatedAt: new Date() },
  })
}
```

### Regras de service

- Autorização e pré-condições **sempre** no service, nunca no handler
- `actorId` vem de `request.user.id` (injetado pelo plugin authenticate) — nunca do body
- Usar `this.findById()` existente para reutilizar o `NotFoundError`
- Transações Prisma (`this.prisma.$transaction`) quando há múltiplas escritas

---

## Passo 3 — Adicionar o handler em routes.ts

```typescript
// {MÉTODO} /api/v1/{nomes}/:id/{acao}
app.{método}('/:id/{acao}', {
  schema: {
    params: {Acao}{Nome}ParamsSchema,
    body: {Acao}{Nome}BodySchema,       // omitir se GET ou DELETE
    response: {
      200: {Acao}{Nome}ResponseSchema,
      400: ErrorResponseSchema,         // validação de negócio
      403: ErrorResponseSchema,         // autorização
      404: ErrorResponseSchema,         // not found
      422: ErrorResponseSchema,         // validação de input (automático pelo zod)
    },
  },
  onRequest: [app.authenticate],        // adicionar se rota protegida
  handler: async (request, reply) => {
    const { id } = request.params
    const result = await service.{acao}(id, request.body, request.user.id)
    return reply.send({ data: result, error: null })
  },
})
```

### Método HTTP correto

| Operação            | Método           | Código de sucesso |
| ------------------- | ---------------- | ----------------- |
| Criar recurso       | POST             | 201               |
| Ler/listar          | GET              | 200               |
| Substituir completo | PUT              | 200               |
| Atualizar parcial   | PATCH            | 200               |
| Deletar             | DELETE           | 204 (sem body)    |
| Ação/transição      | POST sub-recurso | 200               |

---

## Passo 4 — Testes em {nome}.test.ts

Adicionar ao arquivo de testes existente. Mínimo: **happy path + 2 casos de erro**.

```typescript
describe('{acao}', () => {
  it('executa com sucesso quando condições são atendidas', async () => {
    const item = { id: 'cuid', ownerId: 'user1', status: 'ACTIVE', /* ... */ }
    mockPrisma.{nome}.findUnique.mockResolvedValue(item)
    mockPrisma.{nome}.update.mockResolvedValue({ ...item, /* mudanças */ })

    const result = await service.{acao}('cuid', { campo: 'valor' }, 'user1')
    expect(result).toMatchObject({ /* campos esperados */ })
    expect(mockPrisma.{nome}.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'cuid' } })
    )
  })

  it('lança NotFoundError quando ID não existe', async () => {
    mockPrisma.{nome}.findUnique.mockResolvedValue(null)
    await expect(service.{acao}('inexistente', {}, 'user1'))
      .rejects.toBeInstanceOf({Nome}NotFoundError)
  })

  it('lança ForbiddenError quando ator não é o dono', async () => {
    mockPrisma.{nome}.findUnique.mockResolvedValue({ id: 'cuid', ownerId: 'outro' })
    await expect(service.{acao}('cuid', {}, 'user1'))
      .rejects.toBeInstanceOf({Nome}ForbiddenError)
  })
})
```

---

## Checklist

- [ ] Schema de response **não expõe** `passwordHash`, `code` nem campos internos
- [ ] Autorização verificada no service com o `actorId` de `request.user.id`
- [ ] Método HTTP correto para a semântica da operação
- [ ] Status codes corretos na declaração do schema de response
- [ ] Testes: happy path + mínimo 2 erros (not found, forbidden ou invalid state)
- [ ] `pnpm typecheck` passa
- [ ] `pnpm test` passa
