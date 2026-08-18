import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Design System' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="text-muted-foreground mb-4 mt-12 font-mono text-xs uppercase tracking-widest first:mt-0">
      {children}
    </h2>
  )
}

function TokenBadge({ children }: { children: string }) {
  return (
    <code className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
      {children}
    </code>
  )
}

// ─── Dados ────────────────────────────────────────────────────────────────────

const surfaces = [
  { label: 'background', bg: 'bg-background', border: true, desc: '#FAFAF7 · #0A0A0A' },
  { label: 'card', bg: 'bg-card', border: true, desc: '#FFFFFF · #141412' },
  { label: 'muted', bg: 'bg-muted', border: false, desc: '#EFEEE7 · ~rgba(fff,0.06)' },
  { label: 'primary-subtle', bg: 'bg-primary-subtle', border: true, desc: '#F0F7D9 · lime tint' },
  { label: 'secondary', bg: 'bg-secondary', border: false, desc: 'tint do primary · chip inativo' },
]

const semanticColors = [
  {
    label: 'primary',
    bg: 'bg-primary',
    text: 'text-primary-foreground',
    desc: 'Verde-limão #C6E845',
    note: 'CTAs dark · acentos, badges',
  },
  {
    label: 'accent',
    bg: 'bg-accent',
    text: 'text-accent-foreground',
    desc: 'Verde-floresta #1F5F3F',
    note: 'Preços light · estado ativo · avatares',
  },
  {
    label: 'destructive',
    bg: 'bg-destructive',
    text: 'text-destructive-foreground',
    desc: '#DC2626',
    note: 'Ações destrutivas',
  },
  {
    label: 'success',
    bg: 'bg-success',
    text: 'text-success-foreground',
    desc: '#16A34A',
    note: 'Confirmações',
  },
  {
    label: 'warning',
    bg: 'bg-warning',
    text: 'text-warning-foreground',
    desc: '#EA580C',
    note: 'Alertas',
  },
]

const radiusScale = [
  { label: 'sm', cls: 'rounded-sm', value: '0.5rem' },
  { label: 'md', cls: 'rounded-md', value: '0.75rem' },
  { label: 'lg', cls: 'rounded-lg', value: '1rem' },
  { label: 'xl', cls: 'rounded-xl', value: '1.25rem' },
  { label: '2xl', cls: 'rounded-2xl', value: '1.5rem' },
  { label: 'full', cls: 'rounded-full', value: '9999px' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DesignSystemPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Header */}
      <header className="border-border bg-card border-b px-6 py-5">
        <div className="mx-auto flex max-w-4xl items-baseline gap-3">
          <span className="text-primary font-mono text-2xl">◆</span>
          <div>
            <h1 className="text-lg font-semibold">Siamo — Design System</h1>
            <p className="text-muted-foreground mt-0.5 font-mono text-xs">
              /design-system · somente desenvolvimento
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* ── Superfícies ── */}
        <SectionTitle>Superfícies</SectionTitle>
        <div className="grid grid-cols-5 gap-2">
          {surfaces.map((s) => (
            <div
              key={s.label}
              className={`overflow-hidden rounded-lg border ${s.border ? 'border-border' : 'border-transparent'}`}
            >
              <div className={`${s.bg} h-14`} />
              <div className="bg-card border-border space-y-0.5 border-t p-2">
                <code className="text-foreground block font-mono text-[10px]">--{s.label}</code>
                <p className="text-muted-foreground text-[10px] leading-tight">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Cores semânticas ── */}
        <SectionTitle>Cores semânticas</SectionTitle>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          {semanticColors.map((c) => (
            <div key={c.label} className="overflow-hidden rounded-lg border border-transparent">
              <div className={`${c.bg} flex h-16 items-end px-2.5 pb-2`}>
                <span className={`${c.text} text-xs font-semibold`}>{c.label}</span>
              </div>
              <div className="bg-card border-border space-y-0.5 rounded-b-lg border border-t-0 px-2.5 py-2">
                <code className="text-foreground block font-mono text-[10px]">{c.desc}</code>
                <p className="text-muted-foreground text-[10px] leading-tight">{c.note}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Hierarquia tipográfica de texto ── */}
        <SectionTitle>Hierarquia de texto</SectionTitle>
        <div className="bg-card border-border space-y-2 rounded-lg border p-5">
          {[
            { cls: 'text-foreground', label: 'foreground', sample: 'Café arábica — safra 2025' },
            {
              cls: 'text-foreground/70',
              label: 'foreground/70',
              sample: 'Colheita manual, secagem natural ao sol',
            },
            {
              cls: 'text-muted-foreground',
              label: 'muted-foreground',
              sample: '8 km · há 2h · #6A6A62 · #8A8A82',
            },
          ].map((t) => (
            <div key={t.label} className="flex items-baseline gap-4">
              <span className={`text-sm ${t.cls} flex-1`}>{t.sample}</span>
              <TokenBadge>{`text-${t.label}`}</TokenBadge>
            </div>
          ))}
        </div>

        {/* ── Padrões de UI dos mockups ── */}
        <SectionTitle>Padrões de UI (referência dos mockups)</SectionTitle>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Preço destacado */}
          <div className="bg-card border-border space-y-3 rounded-lg border p-4">
            <p className="text-muted-foreground font-mono text-xs">
              [caixa de preço — light usa accent, dark usa primary]
            </p>
            <div className="bg-primary-subtle border-primary rounded-xl border p-3">
              <p className="text-accent mb-1 font-mono text-[10px] tracking-wider">
                [PREÇO POR SACA]
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-accent font-mono text-2xl font-medium">R$ 1.850</span>
                <span className="text-muted-foreground text-xs">· 50 sacas</span>
              </div>
            </div>
            <TokenBadge>bg-primary-subtle + border-primary + text-accent</TokenBadge>
          </div>

          {/* Badges de reputação */}
          <div className="bg-card border-border space-y-3 rounded-lg border p-4">
            <p className="text-muted-foreground font-mono text-xs">[badges de reputação]</p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-accent text-accent-foreground rounded px-2 py-1 text-[9px] font-semibold tracking-widest">
                OURO
              </span>
              <span className="bg-muted-foreground/30 text-foreground/70 rounded px-2 py-1 text-[9px] font-semibold tracking-widest">
                PRATA
              </span>
              <span className="bg-muted text-muted-foreground rounded px-2 py-1 text-[9px] font-semibold tracking-widest">
                BRONZE
              </span>
              <span className="bg-muted text-muted-foreground rounded px-2 py-1 text-[9px] font-semibold tracking-widest">
                NENHUM
              </span>
            </div>
            <p className="text-muted-foreground text-[10px]">
              Light: OURO em bg-accent (floresta) · Dark: em primary-subtle/primary
            </p>
          </div>

          {/* Badge de tipo de anúncio */}
          <div className="bg-card border-border space-y-3 rounded-lg border p-4">
            <p className="text-muted-foreground font-mono text-xs">
              [badges de tipo — OFERTA usa fundo preto em ambos os temas]
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-foreground text-primary rounded px-2 py-1 text-[9px] font-semibold tracking-wider">
                OFERTA
              </span>
              <span className="bg-accent text-accent-foreground rounded px-2 py-1 text-[9px] font-semibold tracking-wider">
                SERVIÇO
              </span>
              <span className="bg-muted text-foreground rounded px-2 py-1 text-[9px] font-semibold tracking-wider">
                DEMANDA
              </span>
              <span className="bg-muted text-foreground rounded px-2 py-1 text-[9px] font-semibold tracking-wider">
                EQUIPMENT
              </span>
            </div>
          </div>

          {/* Match card */}
          <div className="bg-card border-border space-y-3 rounded-lg border p-4">
            <p className="text-muted-foreground font-mono text-xs">[match card com score alto]</p>
            <div className="bg-primary-subtle border-primary rounded-xl border p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="bg-accent text-accent-foreground flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold">
                  CA
                </div>
                <div>
                  <p className="text-xs font-medium">Celso Aguiar</p>
                  <p className="text-muted-foreground text-[10px]">12 km · 4.8 ★</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-2 text-[10px]">
                Demanda: café arábica, 50 sacas
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-accent font-mono text-xs font-semibold">92</span>
                  <span className="text-muted-foreground text-[10px]">/100</span>
                </div>
                <span className="bg-accent text-accent-foreground rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-widest">
                  OURO
                </span>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="bg-card border-border space-y-3 rounded-lg border p-4">
            <p className="text-muted-foreground font-mono text-xs">
              [botões — CTA primário dark: bg-primary; light: bg-foreground]
            </p>
            <div className="space-y-2">
              {/* Dark mode CTA: bg-primary text-primary-foreground */}
              <button className="bg-primary text-primary-foreground w-full rounded-xl py-3 text-sm font-medium">
                Fazer proposta{' '}
                <span className="ml-1 text-[10px] opacity-60">(dark: bg-primary)</span>
              </button>
              {/* Light mode CTA: bg-foreground text-primary — inversão deliberada */}
              <button className="bg-foreground text-primary w-full rounded-xl py-3 text-sm font-medium">
                Fazer proposta{' '}
                <span className="ml-1 text-[10px] opacity-60">(light: bg-foreground)</span>
              </button>
              <button className="bg-muted text-foreground border-border w-full rounded-xl border py-3 text-sm font-medium">
                Ação secundária
              </button>
            </div>
            <p className="text-muted-foreground text-[10px] leading-relaxed">
              O CTA light usa fundo preto + texto verde-limão. Inversão deliberada que preserva a
              assinatura visual da marca fora do dark mode.
            </p>
          </div>

          {/* Search bar */}
          <div className="bg-card border-border space-y-3 rounded-lg border p-4">
            <p className="text-muted-foreground font-mono text-xs">[search bar + filtros chip]</p>
            <div className="bg-muted flex items-center gap-2 rounded-xl px-3 py-2.5">
              <svg
                className="text-muted-foreground"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <span className="text-muted-foreground text-sm">Buscar anúncios, serviços...</span>
            </div>
            <div className="flex gap-2">
              <span className="bg-foreground text-primary rounded-full px-3 py-1.5 text-xs font-medium">
                Tudo
              </span>
              <span className="bg-muted text-muted-foreground rounded-full px-3 py-1.5 text-xs">
                Ofertas
              </span>
              <span className="bg-muted text-muted-foreground rounded-full px-3 py-1.5 text-xs">
                Serviços
              </span>
            </div>
            <TokenBadge>bg-foreground + text-primary no chip ativo</TokenBadge>
          </div>
        </div>

        {/* ── Tipografia ── */}
        <SectionTitle>Tipografia</SectionTitle>
        <div className="bg-card border-border space-y-6 rounded-lg border p-5">
          <div>
            <TokenBadge>--font-sans · Inter</TokenBadge>
            <div className="mt-3 space-y-1.5">
              {[
                { cls: 'text-3xl font-semibold', label: '3xl · 30px semibold' },
                { cls: 'text-xl font-semibold', label: 'xl · 20px semibold' },
                { cls: 'text-base font-medium', label: 'base · 16px medium' },
                { cls: 'text-sm', label: 'sm · 14px regular' },
                { cls: 'text-xs', label: 'xs · 12px regular' },
              ].map((t) => (
                <div key={t.label} className="flex items-baseline gap-4">
                  <span className={`font-sans ${t.cls} flex-1`}>Conectando o campo</span>
                  <TokenBadge>{t.label}</TokenBadge>
                </div>
              ))}
            </div>
          </div>
          <div className="border-border border-t pt-5">
            <TokenBadge>--font-mono · JetBrains Mono</TokenBadge>
            <div className="mt-3 space-y-1.5">
              {[
                { cls: 'text-2xl font-medium', label: '2xl — score de match' },
                { cls: 'text-lg font-medium', label: 'lg — preços' },
                { cls: 'text-sm', label: 'sm — labels [Siamo]' },
                { cls: 'text-xs', label: 'xs — metadados técnicos' },
              ].map((t) => (
                <div key={t.label} className="flex items-baseline gap-4">
                  <span className={`font-mono ${t.cls} flex-1`}>
                    {t.label.includes('score')
                      ? '92 /100'
                      : t.label.includes('preço')
                        ? 'R$ 1.850 / saca'
                        : '[Siamo] · 8 km · há 2h'}
                  </span>
                  <TokenBadge>{t.label}</TokenBadge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Border Radius ── */}
        <SectionTitle>Border radius (--radius: 0.75rem)</SectionTitle>
        <div className="bg-card border-border rounded-lg border p-5">
          <div className="flex flex-wrap items-end gap-5">
            {radiusScale.map((r) => (
              <div key={r.label} className="flex flex-col items-center gap-2">
                <div className={`bg-primary h-14 w-14 ${r.cls}`} />
                <TokenBadge>{`rounded-${r.label}`}</TokenBadge>
                <p className="text-muted-foreground text-[10px]">{r.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Touch Targets ── */}
        <SectionTitle>Touch targets (--tap-target: 48px)</SectionTitle>
        <div className="bg-card border-border space-y-3 rounded-lg border p-5">
          <p className="text-muted-foreground text-sm">
            Mínimo 48×48px via{' '}
            <code className="bg-muted rounded px-1 font-mono text-xs">@layer base</code>. Usuários
            rurais operam com dedos calejados, luvas e telas sob sol forte.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="bg-primary text-primary-foreground rounded-xl px-5 text-sm font-medium">
              CTA primário
            </button>
            <button className="bg-foreground text-primary rounded-xl px-5 text-sm font-medium">
              Fazer proposta
            </button>
            <button className="bg-accent text-accent-foreground rounded-xl px-5 text-sm font-medium">
              Acento
            </button>
            <button className="bg-muted text-foreground border-border rounded-xl border px-5 text-sm font-medium">
              Outline
            </button>
            <button className="bg-destructive text-destructive-foreground rounded-xl px-5 text-sm font-medium">
              Destrutivo
            </button>
          </div>
          <p className="text-muted-foreground font-mono text-[10px]">
            min-height: var(--tap-target) → 48px em button, input, select, textarea
          </p>
        </div>

        {/* ── Estados semânticos ── */}
        <SectionTitle>Estados semânticos</SectionTitle>
        <div className="space-y-2">
          {[
            {
              bg: 'bg-success/10 border-success/30',
              text: 'text-success',
              label: 'Sucesso',
              msg: 'Transação concluída com sucesso.',
            },
            {
              bg: 'bg-warning/10 border-warning/30',
              text: 'text-warning',
              label: 'Atenção',
              msg: 'Proposta expira em 24 horas.',
            },
            {
              bg: 'bg-destructive/10 border-destructive/30',
              text: 'text-destructive',
              label: 'Erro',
              msg: 'Falha ao processar proposta.',
            },
          ].map((s) => (
            <div key={s.label} className={`rounded-lg border px-4 py-3 ${s.bg}`}>
              <span className={`text-sm font-semibold ${s.text}`}>{s.label}: </span>
              <span className="text-sm">{s.msg}</span>
            </div>
          ))}
        </div>

        {/* ── Decisões do mockup ── */}
        <SectionTitle>Decisões de design (do mockup)</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            {
              title: 'Tema escuro como padrão',
              body: 'Reduz fadiga visual ao sol forte e economiza bateria em OLED. Light mode disponível nas configurações.',
            },
            {
              title: 'Verde-floresta assume o texto no light',
              body: '#1F5F3F (#C6E845 não tem contraste sobre branco). Assume preços, labels [Siamo], aba ativa e estrelas.',
            },
            {
              title: 'CTA light é invertido',
              body: 'Fundo preto + texto verde-limão. Preserva a assinatura do pitch deck fora do dark mode.',
            },
            {
              title: 'Font mono em acentos técnicos',
              body: 'Scores, preços e labels [entre colchetes] usam JetBrains Mono. Personalidade sem comprometer legibilidade.',
            },
            {
              title: 'Reputação como elemento visual central',
              body: 'Badge + score + distribuição de notas sempre visíveis. Confiança é o ativo principal do marketplace.',
            },
            {
              title: 'primary-subtle para destaques',
              body: '#F0F7D9 (light) / lime tint escuro (dark) — match cards de score alto e caixas de preço.',
            },
          ].map((d) => (
            <div key={d.title} className="bg-card border-border rounded-lg border p-4">
              <p className="mb-1 text-sm font-semibold">{d.title}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">{d.body}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-border mt-12 border-t px-6 py-4 text-center">
        <p className="text-muted-foreground font-mono text-[10px]">
          /design-system — remover rota antes de deploy em produção
        </p>
      </footer>
    </div>
  )
}
