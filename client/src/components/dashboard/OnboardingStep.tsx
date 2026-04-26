/**
 * Onboarding Step Component for Dashboard
 * Modern design with animations, progress indication, and celebratory feedback
 * Features: Smooth transitions, checkmark animations, hover effects
 */

import { Link } from 'react-router-dom'
import { Check, ChevronRight, Sparkles } from '@/components/ui/icons'
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
  // Build accessible label
  const statusLabel = isComplete ? 'Klart' : isCurrent ? 'Aktuellt steg' : 'Ej påbörjat'

  return (
    <Link
      to={to}
      aria-label={`Steg ${step}: ${title}. ${description}. Status: ${statusLabel}`}
      className={cn(
        'relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border-2 transition-all duration-300 group',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
        // Complete state - celebration style
        isComplete && [
          'bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-teal-50',
          'dark:from-emerald-900/30 dark:via-emerald-900/20 dark:to-teal-900/20',
          'border-emerald-300 dark:border-emerald-700/50',
          'shadow-sm',
        ],
        // Current state - highlighted with glow
        isCurrent && !isComplete && [
          'bg-gradient-to-br from-teal-50 via-white to-sky-50',
          'dark:from-teal-900/30 dark:via-stone-800/50 dark:to-sky-900/20',
          'border-teal-400 dark:border-teal-600',
          'shadow-bento ring-2 ring-teal-400/20',
          'animate-pulse-soft',
        ],
        // Incomplete state - subtle hover effect
        !isComplete && !isCurrent && [
          'bg-white dark:bg-stone-800/50',
          'border-stone-200 dark:border-stone-700',
          'hover:border-teal-300 dark:hover:border-teal-600',
          'hover:bg-gradient-to-br hover:from-teal-50/50 hover:to-white',
          'dark:hover:from-teal-900/10 dark:hover:to-stone-800/50',
          'hover:shadow-bento',
        ]
      )}
    >
      {/* Step indicator / icon container */}
      <div className={cn(
        'relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300',
        isComplete && [
          'bg-gradient-to-br from-emerald-500 to-teal-500',
          'shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30',
        ],
        isCurrent && !isComplete && [
          'bg-gradient-to-br from-teal-500 to-sky-500',
          'shadow-lg shadow-teal-200 dark:shadow-teal-900/30',
          'group-hover:scale-105',
        ],
        !isComplete && !isCurrent && [
          'bg-stone-100 dark:bg-stone-700',
          'group-hover:bg-gradient-to-br group-hover:from-teal-100 group-hover:to-sky-100',
          'dark:group-hover:from-teal-800/50 dark:group-hover:to-sky-800/50',
        ]
      )}>
        {isComplete ? (
          <>
            <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-scale-in" aria-hidden="true" />
            {/* Celebration sparkle */}
            <Sparkles
              className="absolute -top-1 -right-1 w-4 h-4 text-amber-400 animate-bounce-subtle"
              aria-hidden="true"
            />
          </>
        ) : (
          <Icon className={cn(
            'w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-300',
            isCurrent ? 'text-white' : 'text-stone-500 dark:text-stone-400 group-hover:text-teal-600 dark:group-hover:text-teal-400'
          )} aria-hidden="true" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn(
            'text-[10px] sm:text-xs font-medium uppercase tracking-wider',
            isComplete ? 'text-emerald-600 dark:text-emerald-400' :
            isCurrent ? 'text-teal-600 dark:text-teal-400' :
            'text-stone-400 dark:text-stone-500'
          )} aria-hidden="true">
            Steg {step}
          </span>
          {isCurrent && !isComplete && (
            <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] px-2 py-0.5 bg-gradient-to-r from-teal-500 to-sky-500 text-white rounded-full font-semibold shadow-sm animate-fade-in" aria-hidden="true">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              Nästa
            </span>
          )}
          {isComplete && (
            <span className="text-[9px] sm:text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full font-medium" aria-hidden="true">
              Klart
            </span>
          )}
        </div>
        <p className={cn(
          'text-sm sm:text-base font-semibold truncate transition-colors duration-300',
          isComplete ? 'text-emerald-800 dark:text-emerald-300' :
          isCurrent ? 'text-teal-800 dark:text-teal-200' :
          'text-stone-700 dark:text-stone-300 group-hover:text-teal-700 dark:group-hover:text-teal-300'
        )} aria-hidden="true">
          {title}
        </p>
        <p className={cn(
          'text-xs sm:text-sm mt-0.5 truncate',
          isComplete ? 'text-emerald-600/70 dark:text-emerald-400/70' :
          isCurrent ? 'text-teal-600/80 dark:text-teal-300/80' :
          'text-stone-500 dark:text-stone-400'
        )}>
          {description}
        </p>
      </div>

      {/* Arrow indicator */}
      <div className={cn(
        'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300',
        isComplete && 'bg-emerald-100 dark:bg-emerald-900/30',
        isCurrent && !isComplete && 'bg-teal-100 dark:bg-teal-900/30',
        !isComplete && !isCurrent && 'bg-stone-100 dark:bg-stone-800 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/30'
      )}>
        <ChevronRight className={cn(
          'w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300',
          isComplete ? 'text-emerald-500 dark:text-emerald-400' :
          isCurrent ? 'text-teal-500 dark:text-teal-400' :
          'text-stone-400 dark:text-stone-500 group-hover:text-teal-500 dark:group-hover:text-teal-400',
          'group-hover:translate-x-0.5'
        )} aria-hidden="true" />
      </div>

      {/* Progress line indicator (optional visual) */}
      {isComplete && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-400 rounded-l-full" />
      )}
      {isCurrent && !isComplete && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-400 to-sky-400 rounded-l-full animate-pulse-soft" />
      )}
    </Link>
  )
}

export default OnboardingStep
