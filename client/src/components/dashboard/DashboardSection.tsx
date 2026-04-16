/**
 * Dashboard Section Component
 * Collapsible section with ARIA attributes for accessibility
 */

import { useState } from 'react'
import { ChevronDown } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface DashboardSectionProps {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  defaultExpanded?: boolean
  badge?: string
  colorScheme?: 'teal' | 'sky' | 'amber'
}

const colorConfig = {
  teal: {
    header: 'bg-teal-50 dark:bg-teal-900/20',
    headerText: 'text-teal-800 dark:text-teal-300',
    headerIcon: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800/50',
  },
  sky: {
    header: 'bg-sky-50 dark:bg-sky-900/20',
    headerText: 'text-sky-800 dark:text-sky-300',
    headerIcon: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-800/50',
  },
  amber: {
    header: 'bg-amber-50 dark:bg-amber-900/20',
    headerText: 'text-amber-800 dark:text-amber-300',
    headerIcon: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800/50',
  }
}

export function DashboardSection({
  title,
  icon: Icon,
  children,
  defaultExpanded = true,
  badge,
  colorScheme = 'teal'
}: DashboardSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const sectionId = `section-${title.toLowerCase().replace(/\s+/g, '-').replace(/[åäö]/g, 'a')}`

  const colors = colorConfig[colorScheme]

  return (
    <div className={cn('rounded-2xl border overflow-hidden', colors.border)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={`${sectionId}-content`}
        className={cn('w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3', colors.header)}
      >
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4 sm:w-5 sm:h-5', colors.headerIcon)} aria-hidden="true" />
          <span className={cn('text-sm sm:text-base font-semibold', colors.headerText)}>{title}</span>
          {badge && (
            <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-white/60 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn('w-4 h-4 sm:w-5 sm:h-5 transition-transform', colors.headerIcon, !isExpanded && '-rotate-90')}
          aria-hidden="true"
        />
      </button>
      {isExpanded && (
        <div id={`${sectionId}-content`} role="region" aria-label={title} className="p-3 sm:p-4 bg-white dark:bg-stone-900/50">
          {children}
        </div>
      )}
    </div>
  )
}

export default DashboardSection
