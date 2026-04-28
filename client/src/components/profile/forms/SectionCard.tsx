/**
 * SectionCard - Clean styled card wrapper for profile sections
 */

import { cn } from '@/lib/utils'

export interface SectionCardProps {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  colorScheme?: 'teal' | 'sky' | 'amber'
  collapsible?: boolean
  defaultExpanded?: boolean
  className?: string
  action?: React.ReactNode
}

export function SectionCard({
  title,
  icon,
  children,
  colorScheme = 'teal',
  className,
  action
}: SectionCardProps) {
  const colorConfig = {
    teal: {
      iconBg: 'bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/50',
      iconColor: 'text-[var(--c-text)] dark:text-[var(--c-solid)]',
      titleColor: 'text-stone-800 dark:text-stone-200'
    },
    sky: {
      iconBg: 'bg-sky-100 dark:bg-sky-900/50',
      iconColor: 'text-sky-600 dark:text-sky-400',
      titleColor: 'text-stone-800 dark:text-stone-200'
    },
    amber: {
      iconBg: 'bg-amber-100 dark:bg-amber-900/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
      titleColor: 'text-stone-800 dark:text-stone-200'
    }
  }

  const colors = colorConfig[colorScheme]

  return (
    <section
      aria-label={title}
      className={cn(
        'bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700/50 p-5',
        'transition-shadow hover:shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center',
              colors.iconBg,
              colors.iconColor
            )}>
              {icon}
            </div>
          )}
          <h3 className={cn('font-semibold text-sm', colors.titleColor)}>
            {title}
          </h3>
        </div>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>

      {children}
    </section>
  )
}
