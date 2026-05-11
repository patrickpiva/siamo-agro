import { Progress } from '@/components/ui/progress'

interface OnboardingProgressProps {
  currentStep: number
  totalSteps: number
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  const percentage = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className="flex flex-col gap-2 px-6 pt-4">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">
          Etapa {currentStep} de {totalSteps}
        </span>
        <span className="text-primary text-sm font-medium">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-1.5" />
    </div>
  )
}
