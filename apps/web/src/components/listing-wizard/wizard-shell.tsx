'use client'

import { useEffect } from 'react'
import type { Listing } from '@/lib/api'
import { useWizardStore } from './use-wizard-store'
import { StepKind } from './step-kind'
import { StepDetails } from './step-details'
import { StepMedia } from './step-media'
import { StepReview } from './step-review'

const STEP_LABELS = ['Tipo', 'Detalhes', 'Mídia', 'Revisão']

interface WizardShellProps {
  initialListing?: Listing
}

export function WizardShell({ initialListing }: WizardShellProps) {
  const { step, isEditMode, preload } = useWizardStore()

  useEffect(() => {
    if (initialListing) preload(initialListing)
    // intentionally run only on mount
  }, [])

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-xl px-4 py-8">
        {/* Header */}
        <h1 className="mb-6 text-2xl font-bold">
          {isEditMode ? 'Editar anúncio' : 'Criar anúncio'}
        </h1>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between">
            {STEP_LABELS.map((label, i) => (
              <span
                key={label}
                className={[
                  'text-xs font-medium',
                  step > i + 1
                    ? 'text-primary'
                    : step === i + 1
                      ? 'text-foreground'
                      : 'text-muted-foreground',
                ].join(' ')}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-1 text-right text-xs">Passo {step} de 4</p>
        </div>

        {/* Step content */}
        {step === 1 && <StepKind />}
        {step === 2 && <StepDetails />}
        {step === 3 && <StepMedia />}
        {step === 4 && <StepReview />}
      </div>
    </div>
  )
}
