# Skill: novo-componente

Cria um componente React para o app web do AgraIA.
Use quando o usuário pedir para criar um componente, widget ou elemento de UI.

## Antes de começar — decisão crítica

Perguntar (ou inferir pelo contexto):

1. **Onde vive?**
   - Reutilizável entre features → `packages/ui/src/components/{Nome}.tsx`
   - Específico de uma feature → `apps/web/src/components/{feature}/{Nome}.tsx`
   - Específico de uma page → co-locado em `apps/web/src/app/{rota}/`

2. **Server ou Client Component?**
   - **Server Component** (padrão): sem hooks de estado, sem event handlers diretos, sem APIs de browser
   - **Client Component** (`"use client"`): precisa de `useState`, `useEffect`, `useReducer`, event handlers interativos, `window`/`localStorage`
   - Regra: descer `"use client"` o mais baixo possível na árvore

3. **Tem variantes?** → usar `cva`
4. **Recebe `ref`?** → usar `forwardRef`

---

## Passo 1 — Server Component simples

```typescript
// Sem "use client" — Server Component por padrão

import { cn } from '@agraia/ui'

interface {Nome}Props {
  // Props tipadas com interface, não type
  children: React.ReactNode
  className?: string
  // campos obrigatórios antes dos opcionais
}

export function {Nome}({ children, className }: {Nome}Props) {
  return (
    <div className={cn('/* classes base */', className)}>
      {children}
    </div>
  )
}
```

---

## Passo 2 — Client Component

```typescript
'use client'

import { useState } from 'react'
import { cn } from '@agraia/ui'

interface {Nome}Props {
  defaultValue?: string
  onChange?: (value: string) => void
  className?: string
}

export function {Nome}({ defaultValue = '', onChange, className }: {Nome}Props) {
  const [value, setValue] = useState(defaultValue)

  function handleChange(next: string) {
    setValue(next)
    onChange?.(next)
  }

  return (
    <div className={cn('/* classes base */', className)}>
      {/* implementação */}
    </div>
  )
}
```

---

## Passo 3 — Componente com variantes (cva)

Usar quando há mais de 2 variações visuais (tamanho, aparência, estado).

```typescript
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@agraia/ui'

const {nome}Variants = cva(
  // classes base — sempre aplicadas
  'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        accent:  'bg-accent text-accent-foreground hover:bg-accent/90',
        outline: 'border border-border bg-background hover:bg-muted',
        ghost:   'hover:bg-muted hover:text-foreground',
      },
      size: {
        sm: 'h-9 px-3 text-sm rounded-md',
        md: 'h-12 px-5 text-sm rounded-xl',   // min 48px touch target
        lg: 'h-14 px-8 text-base rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

interface {Nome}Props
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof {nome}Variants> {
  isLoading?: boolean
}

export function {Nome}({ variant, size, isLoading, className, children, disabled, ...props }: {Nome}Props) {
  return (
    <button
      className={cn({nome}Variants({ variant, size }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <span className="animate-spin">⟳</span> : children}
    </button>
  )
}
```

---

## Passo 4 — Componente com forwardRef

Usar quando o componente é um elemento de formulário ou precisa expor o DOM node.

```typescript
import { forwardRef } from 'react'
import { cn } from '@agraia/ui'

interface {Nome}Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const {Nome} = forwardRef<HTMLInputElement, {Nome}Props>(
  function {Nome}({ label, error, className, ...props }, ref) {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-sm font-medium text-foreground">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full min-h-[var(--tap-target)] rounded-xl border border-input bg-background px-4 text-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            error && 'border-destructive focus-visible:ring-destructive',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    )
  }
)

{Nome}.displayName = '{Nome}'
```

---

## Passo 5 — Exportar

**Se em `packages/ui`:** adicionar ao `packages/ui/src/index.ts`

```typescript
export { {Nome} } from './components/{Nome}.js'
```

**Se em `apps/web`:** importar diretamente com alias `@/components/...`

---

## Passo 6 — Teste (quando há lógica)

Criar `{Nome}.test.tsx` co-locado. Testar componentes com lógica de estado, não puramente visuais.

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { {Nome} } from './{Nome}'

describe('{Nome}', () => {
  it('renderiza com conteúdo correto', () => {
    render(<{Nome}>Texto</{Nome}>)
    expect(screen.getByText('Texto')).toBeInTheDocument()
  })

  it('chama onChange quando o valor muda', () => {
    const onChange = vi.fn()
    render(<{Nome} onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'novo' } })
    expect(onChange).toHaveBeenCalledWith('novo')
  })

  it('desabilita interação quando isLoading=true', () => {
    render(<{Nome} isLoading>Enviar</{Nome}>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

---

## Checklist

- [ ] Server Component por padrão — `"use client"` só se necessário
- [ ] Props com `interface`, não `type`
- [ ] `forwardRef` se o componente é um elemento de form
- [ ] `cva` se há mais de 2 variantes visuais
- [ ] Touch target mínimo 48px (`min-h-[var(--tap-target)]`) em elementos interativos
- [ ] Cores via tokens CSS (`bg-primary`, `text-foreground`) — nunca hex direto
- [ ] `cn()` de `@agraia/ui` para merge de classes
- [ ] `{Nome}.displayName` definido se usar `forwardRef`
- [ ] Exportado em `packages/ui/src/index.ts` se componente de pacote compartilhado
- [ ] Teste criado se o componente tem lógica de estado ou interação
