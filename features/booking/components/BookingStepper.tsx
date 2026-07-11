import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookingStepperProps {
  currentStep: number
}

export function BookingStepper({ currentStep }: BookingStepperProps) {
  const steps = [1, 2, 3, 4]

  return (
    <div className="flex items-center justify-between w-full max-w-xs md:max-w-md mx-auto px-4 mb-8">
      {steps.map((step, index) => {
        const isCompleted = step < currentStep
        const isActive = step === currentStep

        return (
          <div key={step} className="flex items-center flex-1 last:flex-initial">
            {/* Circle */}
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors z-10 shrink-0',
                isCompleted ? 'bg-brand-secondary text-foreground' : isActive ? 'bg-brand text-white' : 'bg-foreground/5 text-foreground/80'
              )}
            >
              {isCompleted ? <Check className="w-4 h-4" /> : step}
            </div>

            {/* Line connector */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-1 flex-1 mx-2 transition-colors rounded-full',
                  step < currentStep ? 'bg-brand-secondary' : 'bg-foreground/10'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
