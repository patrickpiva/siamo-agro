# Skill: migration-prisma

Altera o schema Prisma e gera a migration SQL para aplicar no Supabase.
Use quando o usuário pedir para adicionar/alterar modelos, campos, índices ou relações.

## Restrição de rede — leia antes de qualquer coisa

A conexão direta ao Supabase (`db.PROJECT.supabase.co:5432`) está **bloqueada** na rede atual.
O Prisma não consegue introspectar o banco via pooler.
Por isso, **todas as migrations são geradas por diff de arquivos**, não de banco real.

---

## Fluxo — migração inicial (banco vazio)

Usar apenas na primeira vez ou em ambiente de teste limpo.

```bash
pnpm db:migrate:diff
# Gera SQL completo: from-empty → schema.prisma atual
# Copiar saída e colar no SQL Editor do Supabase
```

---

## Fluxo — migração incremental (padrão a partir da Sprint 1)

### Passo 1 — Criar baseline se ainda não existe

Se `packages/db/prisma/schema.baseline.prisma` não existe, criar com o conteúdo
exato do schema **atualmente aplicado no banco**. Este arquivo representa o estado real do banco.

### Passo 2 — Editar `schema.prisma`

Fazer as alterações no schema principal. Regras:

**Campos novos:**

```prisma
novocampo String? @map("novo_campo")           // nullable = não quebra produção
novoCampoObrigatorio String @map("campo") @default("") // default evita erro em linhas existentes
```

**Relações novas:**

```prisma
// Sempre com onDelete explícito
itemId String @map("item_id")
item   Item   @relation(fields: [itemId], references: [id], onDelete: Cascade)

@@index([itemId])  // índice em toda FK
```

**Enums novos:**

```prisma
enum NovoStatus {
  VALOR_A
  VALOR_B
}
```

> Enums em Postgres não aceitam remoção de valores sem DROP+CREATE. Só adicionar valores novos é seguro.

**Nunca remover campo com dados** sem um plano de migração de dados primeiro.

### Passo 3 — Gerar o SQL delta

```bash
pnpm db:migrate:diff:inc
# Compara schema.baseline.prisma → schema.prisma
# Imprime SQL no stdout
```

Revisar o SQL gerado antes de aplicar:

- Verificar se há `DROP COLUMN` inesperado
- Verificar se há `NOT NULL` sem `DEFAULT` em tabela com dados
- Conferir se os nomes de tabela/coluna estão em snake_case

### Passo 4 — Aplicar no Supabase

1. Abrir **Database → SQL Editor → New query** no painel do Supabase
2. Colar o SQL gerado
3. Executar e verificar ausência de erros

### Passo 5 — Se envolver PostGIS ou triggers

Criar arquivo SQL manual em `packages/db/prisma/migrations/manual/`:

```sql
-- 00N_descricao.sql
-- Seguir o padrão de 001_postgis.sql:
-- 1. Usar IF NOT EXISTS / IF EXISTS em todos os comandos
-- 2. Documentar como aplicar no cabeçalho
-- 3. Incluir exemplo de uso no rodapé
```

Aplicar no SQL Editor **depois** do SQL principal.

### Passo 6 — Atualizar baseline

Após confirmar que o SQL foi aplicado com sucesso:

```bash
# Copiar schema.prisma para schema.baseline.prisma
cp packages/db/prisma/schema.prisma packages/db/prisma/schema.baseline.prisma
```

Commitar ambos juntos no mesmo commit.

### Passo 7 — Regenerar o Prisma Client

```bash
pnpm db:generate
# Regenera @agraia/db com os novos tipos
```

Verificar que o TypeScript compila após a geração:

```bash
pnpm typecheck
```

### Passo 8 — Atualizar o seed se necessário

Se o novo campo/modelo precisa de dados de desenvolvimento, atualizar
`packages/db/prisma/seed.ts` para incluir os novos dados.

---

## Checklist

- [ ] `schema.baseline.prisma` existe e reflete o estado atual do banco
- [ ] SQL gerado por `pnpm db:migrate:diff:inc` revisado manualmente
- [ ] Nenhum `DROP COLUMN` ou `NOT NULL` sem `DEFAULT` em tabela com dados
- [ ] SQL aplicado no SQL Editor do Supabase sem erros
- [ ] SQL PostGIS manual aplicado em seguida (se necessário)
- [ ] `schema.baseline.prisma` atualizado para o novo estado
- [ ] `pnpm db:generate` executado
- [ ] `pnpm typecheck` passa
- [ ] Seed atualizado se necessário
- [ ] `schema.prisma` e `schema.baseline.prisma` commitados juntos

---

## Referências rápidas de Prisma

```prisma
// ID padrão
id String @id @default(cuid())

// Timestamps obrigatórios em toda tabela
createdAt DateTime @default(now()) @map("created_at")
updatedAt DateTime @updatedAt @map("updated_at")

// Convenção de mapeamento
campoNome String @map("campo_nome")   // camelCase → snake_case
@@map("nome_da_tabela")               // PascalCase → snake_case plural

// Decimal para dinheiro (nunca Float)
preco Decimal @map("preco") @db.Decimal(12, 2)
```
