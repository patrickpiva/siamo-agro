# Skill: qa-feature

Checklist de qualidade antes de abrir um PR no Siamo.
Executar **na ordem** — cada etapa é um gate. Não pular para a próxima se a atual falhar.

---

## Gate 1 — Tipos

```bash
pnpm typecheck
```

**Critério de aceite:** zero erros. Sem `any` explícito, sem `@ts-ignore`, sem `as` desnecessário.

Erros comuns e causas:

- `Type X is not assignable to Y` → provavelmente enum Prisma vs. string literal
- `Property does not exist` → campo novo no schema que ainda não foi gerado (`pnpm db:generate`)
- `Cannot find module` → import sem extensão `.js` na API (NodeNext obriga)

---

## Gate 2 — Lint

```bash
pnpm lint
```

**Critério de aceite:** zero erros, zero warnings não intencionais.

Verificar manualmente:

- Sem `console.log` (usar `app.log.info()` na API, sem logs no frontend)
- Sem `TODO` sem issue vinculada no formato `// TODO(#123): descrição`
- Sem imports não utilizados
- Sem variáveis declaradas e não usadas

---

## Gate 3 — Testes

```bash
pnpm test
```

**Critério de aceite:** todos passam. Cobertura não é obrigatória em todo PR, mas os seguintes módulos exigem testes antes do merge:

| Módulo                                    | Por quê                                         |
| ----------------------------------------- | ----------------------------------------------- |
| Auth (OTP, JWT, sessão)                   | Segurança — falha aqui é crítica                |
| Matchmaking                               | Algoritmo central do produto                    |
| Reputação / Rating                        | Cálculo de badge afeta confiança do marketplace |
| Transações (criação, transição de status) | Fluxo financeiro                                |

Para outros módulos: pelo menos happy path + erros de not found e forbidden.

---

## Gate 4 — Build

```bash
pnpm build
```

**Critério de aceite:** sem erros de compilação em `apps/web` e `apps/api`.

Verificar no output:

- `apps/web`: Next.js não reporta erros de hidratação ou missing exports
- `apps/api`: `tsc` compila sem erros em `dist/`

---

## Gate 5 — Teste manual no navegador

Executar `pnpm dev` e percorrer o fluxo modificado manualmente.

### Golden path

- [ ] O fluxo principal funciona do início ao fim sem erro
- [ ] Dados aparecem corretamente (sem `undefined`, `[object Object]`, NaN)
- [ ] Estados de loading e erro são exibidos corretamente
- [ ] Formulários validam corretamente e mostram erros inline

### Edge cases

- [ ] O que acontece com dados vazios / lista vazia?
- [ ] O que acontece com texto muito longo?
- [ ] O que acontece se o usuário clicar duas vezes no CTA (double submit)?
- [ ] O que acontece se a API retorna erro 500?

### Regressão

- [ ] Verificar que as telas adjacentes ao que foi modificado ainda funcionam

---

## Gate 6 — Acessibilidade

```bash
# Abrir a feature no Chrome e rodar Lighthouse
# DevTools → Lighthouse → Categories: Accessibility → Analyze
```

**Critério de aceite:** score ≥ 95.

Verificar manualmente (Lighthouse não detecta tudo):

- [ ] Navegar **apenas por teclado** pelo fluxo (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Esc`)
- [ ] Foco visível em todos os elementos interativos (nunca `outline: none` sem alternativa)
- [ ] Imagens com `alt` descritivo ou `alt=""` se decorativas
- [ ] Botões com labels descritivos (não apenas ícones sem texto)
- [ ] Formulários com `<label>` associado a cada `<input>`
- [ ] Mensagens de erro anunciadas para screen readers (`role="alert"` ou `aria-live`)

---

## Gate 7 — Mobile (375px)

```bash
# Chrome DevTools → Toggle device toolbar → iPhone SE (375x667)
```

**Critério de aceite:** sem overflow horizontal, sem texto cortado, touch targets ≥ 48px.

- [ ] Nenhum elemento causa scroll horizontal
- [ ] Texto legível sem zoom (mínimo 14px em body, 12px em labels)
- [ ] Botões e links clicáveis com dedo — mínimo 48×48px de área de toque
- [ ] Formulários não causam zoom automático do iOS (inputs com `font-size ≥ 16px`)
- [ ] Testar com sol forte simulado: DevTools → Rendering → Emulate CSS media feature → prefers-color-scheme: light

---

## Gate 8 — Código limpo

Verificação final linha a linha no diff (`git diff main`):

- [ ] Sem `console.log`, `console.error`, `debugger`
- [ ] Sem `any` em TypeScript
- [ ] Sem comentários que explicam **o quê** o código faz (nomes devem ser auto-explicativos)
- [ ] Sem imports não utilizados
- [ ] Sem arquivos de debug ou teste temporário commitados (`.test.ts.bak`, `debug.ts`, etc.)
- [ ] Variáveis de ambiente novas adicionadas ao `.env.example` com valor fictício
- [ ] `TODO` sem issue vinculada convertido em issue ou removido

---

## Abrindo o PR

Título: seguir convenção de commit semântico

```
feat: adiciona matchmaking por geolocalização
fix: corrige cálculo de badge após transação cancelada
```

Body mínimo:

```markdown
## O que muda

- [bullet point do que foi implementado]

## Como testar

1. Passo para reproduzir o fluxo
2. Resultado esperado

## Checklist qa-feature

- [x] typecheck
- [x] lint
- [x] tests
- [x] build
- [x] manual (375px + teclado)
- [x] a11y ≥ 95
```
