/**
 * Onboarding Step Component - Clean Pastel Design
 * Simple list-style steps with soft pastel accents
 * No gradients, clean checkmarks, subtle hover states
 */

import { Link } from 'react-router-dom'
import { Check, ChevronRight } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface OnboardingStepProps {
  step: number
  title: string
  description: string
  icon: React.ElementType
  isComplete: boolean
  isCurrent: boolean
  to: string
}

export function OnboardingStep({
  step,
  title,
  description,
  icon: Icon,
  isComplete,
  isCurrent,
  to
}: OnboardingStepProps) {
  const statusLabel = isComplete ? 'Klart' : isCurrent ? 'Aktuellt steg' : 'Ej påbörjat'

  return (
    <Link
      to={to}
      aria-label={`Steg ${step}: ${title}. ${description}. Status: ${statusLabel}`}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
        // Complete state
        isComplete && 'bg-teal-50/50 dark:bg-teal-900/10',
        // Current state - subtle highlight
        isCurrent && !isComplete && 'bg-stone-50 dark:bg-stone-800/50 border border-teal-200 dark:border-teal-800',
        // Default state
        !isComplete && !isCurrent && 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
      )}
    >
      {/* Step indicator */}
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
        isComplete && 'bg-teal-100 dark:bg-teal-900/30',
        isCurrent && !isComplete && 'bg-teal-500',
        !isComplete && !isCurrent && 'bg-stone-100 dark:bg-stone-800 group-hover:bg-stone-200 dark:group-hover:bg-stone-700'
      )}>
        {isComplete ? (
          <Check className="w-5 h-5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
        ) : (
          <Icon className={cn(
            'w-5 h-5',
            isCurrent ? 'text-white' : 'text-stone-400 dark:text-stone-500'
          )} aria-hidden="true" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium',
          isComplete && 'text-teal-700 dark:text-teal-400 line-through',
          isCurrent && !isComplete && 'text-stone-800 dark:text-stone-100',
          !isComplete && !isCurrent && 'text-stone-600 dark:text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200'
        )}>
          {title}
        </p>
        <p className={cn(
          'text-xs mt-0.5',
          isComplete ? 'text-teal-600/70 dark:text-teal-500/70' : 'text-stone-400 dark:text-stone-500'
        )}>
          {description}
        </p>
      </div>

      {/* Status badge or arrow */}
      {isComplete ? (
        <span className="text-xs text-teal-600 dark:text-teal-400 font-medium px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 rounded-full">
          Klart
        </span>
      ) : isCurrent ? (
        <span className="text-xs text-white font-medium px-2 py-0.5 bg-teal-500 rounded-full">
          Nästa
        </span>
      ) : (
        <ChevronRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-stone-400 dark:group-hover:text-stone-500 transition-colors" />
      )}
    </Link>
  )
}

export default OnboardingStep
