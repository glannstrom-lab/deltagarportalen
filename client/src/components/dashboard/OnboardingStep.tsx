/**
 * Onboarding Step Component for Dashboard
 * Displays a single step in the onboarding checklist
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
  icon: Icon,
  isComplete,
  isCurrent,
  to
}: OnboardingStepProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border transition-all group',
        isComplete
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50'
          : isCurrent
          ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700 ring-2 ring-teal-400/30'
          : 'bg-white dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 hover:border-teal-300 dark:hover:border-teal-700'
      )}
    >
      <div className={cn(
        'w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0',
        isComplete
          ? 'bg-emerald-500 text-white'
          : isCurrent
          ? 'bg-teal-500 text-white'
          : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
      )}>
        {isComplete ? (
          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        ) : (
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[10px] sm:text-xs text-stone-400 dark:text-stone-500">Steg {step}</span>
          {isCurrent && !isComplete && (
            <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 rounded-full font-medium">
              Nu
            </span>
          )}
        </div>
        <p className={cn(
          'text-xs sm:text-sm font-medium truncate',
          isComplete ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-800 dark:text-stone-200'
        )}>
          {title}
        </p>
      </div>
      <ChevronRight className={cn(
        'w-4 h-4 shrink-0 transition-transform',
        isComplete ? 'text-emerald-400 dark:text-emerald-500' : 'text-stone-300 dark:text-stone-600 group-hover:translate-x-1'
      )} />
    </Link>
  )
}

export default OnboardingStep
