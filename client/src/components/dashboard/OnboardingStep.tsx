/**
 * Onboarding Step Component for Dashboard
 * Checklist with brand-colored checkmarks and "Nu" badge
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
        'flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg',
        'transition-colors duration-150',
        isCurrent && !isComplete
          ? 'bg-brand-100 dark:bg-brand-900/30'
          : 'hover:bg-white/50 dark:hover:bg-stone-800/50',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-900 focus-visible:ring-offset-2'
      )}
    >
      {/* Checkmark or icon */}
      <div className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
        isComplete
          ? 'bg-brand-900 text-white'
          : isCurrent
            ? 'border-2 border-brand-900 dark:border-brand-400'
            : 'border-2 border-stone-300 dark:border-stone-600'
      )}>
        {isComplete ? (
          <Check className="w-4 h-4" aria-hidden="true" />
        ) : isCurrent ? (
          <span className="w-2 h-2 rounded-full bg-brand-900 dark:bg-brand-400" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-600" />
        )}
      </div>

      {/* Title */}
      <span className={cn(
        'flex-1 text-sm sm:text-base',
        isComplete
          ? 'text-stone-500 dark:text-stone-400 line-through'
          : isCurrent
            ? 'text-brand-900 dark:text-brand-300 font-semibold'
            : 'text-stone-900 dark:text-stone-100 font-medium'
      )}>
        {title}
      </span>

      {/* Current indicator - "Nu" badge */}
      {isCurrent && !isComplete && (
        <span className="px-2 py-0.5 text-xs font-bold bg-brand-900 text-white rounded">
          Nu
        </span>
      )}
    </Link>
  )
}

export default OnboardingStep
