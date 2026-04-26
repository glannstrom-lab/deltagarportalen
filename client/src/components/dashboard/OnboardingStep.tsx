/**
 * Onboarding Step Component for Dashboard
 * Clean, minimal checklist style with green checkmarks
 * Matches the simplified design language
 */

import { Link } from 'react-router-dom'
import { Check } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface OnboardingStepProps {
  step: number
  title: string
  description?: string
  icon: React.ElementType
  isComplete: boolean
  isCurrent: boolean
  to: string
}

export function OnboardingStep({
  title,
  icon: Icon,
  isComplete,
  isCurrent,
  to
}: OnboardingStepProps) {
  const statusLabel = isComplete ? 'Klart' : isCurrent ? 'Aktuellt steg' : 'Ej påbörjat'

  return (
    <Link
      to={to}
      aria-label={`${title}. Status: ${statusLabel}`}
      className={cn(
        'flex items-center gap-3 py-3 px-1 border-b border-stone-100 dark:border-stone-800 last:border-b-0',
        'transition-colors duration-150',
        'hover:bg-stone-50 dark:hover:bg-stone-800/50 -mx-1 px-2 rounded-lg',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2'
      )}
    >
      {/* Checkmark or icon */}
      <div className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
        isComplete
          ? 'bg-brand-600 text-white'
          : 'border-2 border-stone-300 dark:border-stone-600'
      )}>
        {isComplete ? (
          <Check className="w-4 h-4" aria-hidden="true" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-600" />
        )}
      </div>

      {/* Title */}
      <span className={cn(
        'flex-1 text-sm sm:text-base',
        isComplete
          ? 'text-stone-600 dark:text-stone-400'
          : 'text-stone-900 dark:text-stone-100 font-medium'
      )}>
        {title}
      </span>

      {/* Current indicator */}
      {isCurrent && !isComplete && (
        <span className="text-xs text-brand-600 font-medium">
          Nästa →
        </span>
      )}
    </Link>
  )
}

export default OnboardingStep
