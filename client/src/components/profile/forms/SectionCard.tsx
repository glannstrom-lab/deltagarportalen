/**
 * SectionCard - Styled card wrapper for profile sections
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
}

export function SectionCard({
  title,
  icon,
  children,
  colorScheme = 'teal',
  className
}: SectionCardProps) {
  const colorConfig = {
    teal: {
      border: 'border-teal-200 dark:border-teal-800/50',
      iconColor: 'text-teal-600 dark:text-teal-400',
      titleColor: 'text-teal-800 dark:text-teal-300'
    },
    sky: {
      border: 'border-sky-200 dark:border-sky-800/50',
      iconColor: 'text-sky-600 dark:text-sky-400',
      titleColor: 'text-sky-800 dark:text-sky-300'
    },
    amber: {
      border: 'border-amber-200 dark:border-amber-800/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
      titleColor: 'text-amber-800 dark:text-amber-300'
    }
  }

  const colors = colorConfig[colorScheme]

  return (
    <section
      aria-label={title}
      className={cn(
        'bg-white dark:bg-stone-800/50 rounded-2xl border p-5',
        'transition-shadow hover:shadow-md hover:-translate-y-0.5 transition-transform duration-200',
        colors.border,
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        {icon && (
          <div className={colors.iconColor} aria-hidden="true">
            {icon}
          </div>
        )}
        <h3 className={cn('font-semibold text-base', colors.titleColor)}>
          {title}
        </h3>
      </div>

      {children}
    </section>
  )
}
