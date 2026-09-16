'use client'

import { Zap, Eye } from '@siamo/ui/icons'
import { ThemeSelector, FontSizeSlider, SettingsGroup, SettingsRow } from '@siamo/ui'
import { ScreenHeader } from '@/components/layout/screen-header'
import { useTheme, type Theme, type FontSize } from '@/lib/theme'

export default function AparenciaPage() {
  const {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    reduceMotion,
    setReduceMotion,
    highContrast,
    setHighContrast,
  } = useTheme()

  return (
    <div className="bg-background min-h-screen pb-[80px]">
      <ScreenHeader backHref="/configuracoes" title="Aparência" />

      {/* Theme selector */}
      <div className="mb-4">
        <p className="text-muted-foreground px-5 pb-3 pt-3 font-mono text-[11px] tracking-[0.4px]">
          TEMA
        </p>
        <ThemeSelector value={theme} onChange={(v: Theme) => setTheme(v)} />
      </div>

      {/* Font size */}
      <div className="mb-4">
        <p className="text-muted-foreground px-5 pb-3 pt-1 font-mono text-[11px] tracking-[0.4px]">
          TAMANHO DO TEXTO
        </p>
        <FontSizeSlider value={fontSize} onChange={(v: FontSize) => setFontSize(v)} />
        <p className="text-muted-foreground px-5 pt-2 text-[11px]">
          Exemplo: A pontuação é de <span className="font-medium">4.9 estrelas</span> com 32
          avaliações.
        </p>
      </div>

      {/* Accessibility */}
      <SettingsGroup label="ACESSIBILIDADE">
        <SettingsRow
          icon={<Zap size={18} strokeWidth={1.8} className="text-muted-foreground" />}
          title="Reduzir animações"
          subtitle="Desativa transições e efeitos de movimento"
          rightElement={
            <button
              role="switch"
              aria-checked={reduceMotion}
              aria-label="Reduzir animações"
              type="button"
              onClick={() => setReduceMotion(!reduceMotion)}
              style={{
                minHeight: '24px',
                minWidth: '44px',
                ...(!reduceMotion ? { backgroundColor: 'hsl(var(--switch-off))' } : {}),
              }}
              className={`relative inline-flex h-[24px] w-[44px] flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${reduceMotion ? 'bg-primary' : ''}`}
            >
              <span
                style={{ transform: reduceMotion ? 'translateX(20px)' : 'translateX(0)' }}
                className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
              />
            </button>
          }
        />
        <SettingsRow
          icon={<Eye size={18} strokeWidth={1.8} className="text-muted-foreground" />}
          title="Alto contraste"
          subtitle="Aumenta o contraste de textos secundários"
          rightElement={
            <button
              role="switch"
              aria-checked={highContrast}
              aria-label="Alto contraste"
              type="button"
              onClick={() => setHighContrast(!highContrast)}
              style={{
                minHeight: '24px',
                minWidth: '44px',
                ...(!highContrast ? { backgroundColor: 'hsl(var(--switch-off))' } : {}),
              }}
              className={`relative inline-flex h-[24px] w-[44px] flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${highContrast ? 'bg-primary' : ''}`}
            >
              <span
                style={{ transform: highContrast ? 'translateX(20px)' : 'translateX(0)' }}
                className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
              />
            </button>
          }
        />
      </SettingsGroup>
    </div>
  )
}
