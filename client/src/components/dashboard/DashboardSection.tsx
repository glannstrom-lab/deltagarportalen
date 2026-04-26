/**
 * Dashboard Section Component
 * Modern collapsible section with glassmorphism and smooth animations
 * Features: Gradient headers, animated expand/collapse, ARIA accessibility
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
  colorScheme?: 'teal' | 'sky' | 'amber' | 'violet' | 'emerald'
  className?: string
}

const colorConfig = {
  teal: {
    headerBg: 'bg-gradient-to-r from-teal-50 via-teal-50/80 to-emerald-50/50 dark:from-teal-900/30 dark:via-teal-900/20 dark:to-emerald-900/10',
    headerText: 'text-teal-800 dark:text-teal-200',
    headerIcon: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200/60 dark:border-teal-800/40',
    badge: 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300',
    ring: 'focus-visible:ring-teal-500',
  },
  sky: {
    headerBg: 'bg-gradient-to-r from-sky-50 via-sky-50/80 to-blue-50/50 dark:from-sky-900/30 dark:via-sky-900/20 dark:to-blue-900/10',
    headerText: 'text-sky-800 dark:text-sky-200',
    headerIcon: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-200/60 dark:border-sky-800/40',
    badge: 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300',
    ring: 'focus-visible:ring-sky-500',
  },
  amber: {
    headerBg: 'bg-gradient-to-r from-amber-50 via-amber-50/80 to-orange-50/50 dark:from-amber-900/30 dark:via-amber-900/20 dark:to-orange-900/10',
    headerText: 'text-amber-800 dark:text-amber-200',
    headerIcon: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200/60 dark:border-amber-800/40',
    badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    ring: 'focus-visible:ring-amber-500',
  },
  violet: {
    headerBg: 'bg-gradient-to-r from-violet-50 via-violet-50/80 to-purple-50/50 dark:from-violet-900/30 dark:via-violet-900/20 dark:to-purple-900/10',
    headerText: 'text-violet-800 dark:text-violet-200',
    headerIcon: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200/60 dark:border-violet-800/40',
    badge: 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300',
    ring: 'focus-visible:ring-violet-500',
  },
  emerald: {
    headerBg: 'bg-gradient-to-r from-emerald-50 via-emerald-50/80 to-green-50/50 dark:from-emerald-900/30 dark:via-emerald-900/20 dark:to-green-900/10',
    headerText: 'text-emerald-800 dark:text-emerald-200',
    headerIcon: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200/60 dark:border-emerald-800/40',
    badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    ring: 'focus-visible:ring-emerald-500',
  },
}

export function DashboardSection({
  title,
  icon: Icon,
  children,
  defaultExpanded = true,
  badge,
  colorScheme = 'teal',
  className
}: DashboardSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const sectionId = `section-${title.toLowerCase().replace(/\s+/g, '-').replace(/[åäö]/g, 'a')}`

  const colors = colorConfig[colorScheme]

  return (
    <div className={cn(
      'rounded-2xl border overflow-hidden shadow-bento transition-shadow duration-300 hover:shadow-bento-hover',
      colors.border,
      'bg-white dark:bg-stone-900/50',
      className
    )}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={`${sectionId}-content`}
        className={cn(
          'w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 transition-all duration-200',
          colors.headerBg,
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset',
          colors.ring
        )}
      >
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className={cn(
            'w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center',
            'bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm shadow-sm'
          )}>
            <Icon className={cn('w-4 h-4 sm:w-5 sm:h-5', colors.headerIcon)} aria-hidden="true" />
          </div>
          <span className={cn('text-sm sm:text-base font-semibold', colors.headerText)}>
            {title}
          </span>
          {badge && (
            <span className={cn(
              'px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full',
              colors.badge
            )}>
              {badge}
            </span>
          )}
        </div>
        <div className={cn(
          'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200',
          'bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm',
          isExpanded ? 'rotate-0' : '-rotate-90'
        )}>
          <ChevronDown
            className={cn('w-4 h-4 sm:w-5 sm:h-5 transition-transform', colors.headerIcon)}
            aria-hidden="true"
          />
        </div>
      </button>

      {/* Animated content area */}
      <div
        id={`${sectionId}-content`}
        role="region"
        aria-label={title}
        className={cn(
          'overflow-hidden transition-all duration-300 ease-out',
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="p-4 sm:p-5 bg-gradient-to-b from-white to-stone-50/50 dark:from-stone-900/50 dark:to-stone-900/30">
          {children}
        </div>
      </div>
    </div>
  )
}

export default DashboardSection
