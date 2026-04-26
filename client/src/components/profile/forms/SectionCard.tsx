/**
 * SectionCard - Styled card wrapper for profile sections
 */

import { cn } from '@/lib/utils'

export interface SectionCardProps {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  colorScheme?: 'brand' | 'sky' | 'amber' | 'neutral'
  collapsible?: boolean
  defaultExpanded?: boolean
  className?: string
}

export function SectionCard({
  title,
  icon,
  children,
  colorScheme = 'brand',
  className
}: SectionCardProps) {
  const colorConfig = {
    brand: {
      border: 'border-brand-300 dark:border-brand-900/50',
      iconColor: 'text-brand-900 dark:text-brand-400',
      titleColor: 'text-brand-900 dark:text-brand-300'
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
    },
    neutral: {
      border: 'border-stone-200 dark:border-stone-700',
      iconColor: 'text-stone-500 dark:text-stone-400',
      titleColor: 'text-stone-800 dark:text-stone-200'
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
