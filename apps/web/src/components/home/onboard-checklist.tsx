import { Check, ChevronRight } from '@agraia/ui/icons'
import { cn } from '@agraia/ui'

export type OnboardStepState = 'done' | 'active' | 'todo'

export interface OnboardStep {
  title: string
  sub: string
  state: OnboardStepState
}

/** Checklist de onboarding do primeiro acesso (passos: conta → perfil → 1º anúncio). */
export function OnboardChecklist({ steps }: { steps: OnboardStep[] }) {
  return (
    <div className="bg-card border-border mx-4 rounded-[18px] border py-2">
      {steps.map((s, i) => (
        <div
          key={s.title}
          className={cn(
            'flex items-center gap-[14px] px-[18px] py-[14px]',
            i < steps.length - 1 && 'border-border border-b-[0.5px]',
          )}
        >
          <div
            className={cn(
              'flex size-[30px] shrink-0 items-center justify-center rounded-full font-mono text-[13px] font-semibold',
              s.state === 'done' && 'bg-accent dark:bg-primary text-white dark:text-[#0A0A0A]',
              s.state === 'active' &&
                'bg-primary-subtle text-accent border-accent dark:text-primary dark:border-primary border-[1.5px]',
              s.state === 'todo' && 'bg-muted text-muted-foreground',
            )}
          >
            {s.state === 'done' ? <Check size={15} strokeWidth={3} /> : i + 1}
          </div>
          <div className="flex-1">
            <p
              className={cn(
                'text-[14px] font-medium',
                s.state === 'done' && 'text-muted-foreground line-through',
              )}
            >
              {s.title}
            </p>
            <p className="text-muted-foreground text-[11px]">{s.sub}</p>
          </div>
          {s.state === 'active' && (
            <ChevronRight
              size={18}
              strokeWidth={2}
              className="text-accent dark:text-primary shrink-0"
            />
          )}
        </div>
      ))}
    </div>
  )
}
