/**
 * SectionCard - Styled card wrapper for profile sections
 *
 * Design system (DESIGN.md):
 * - Border: thin neutral (stone-200)
 * - Radius: 8px (rounded-lg)
 * - No shadows
 * - Icon color: brand-900
 * - Title: 14px, weight 500
 */

import { cn } from '@/lib/utils'

export interface SectionCardProps {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  /** @deprecated Use className for custom styling */
  colorScheme?: 'brand' | 'sky' | 'amber' | 'neutral'
  collapsible?: boolean
  defaultExpanded?: boolean
  className?: string
}

export function SectionCard({
  title,
  icon,
  children,
  className
}: SectionCardProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        'bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700 p-5',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        {icon && (
          <div className="text-brand-900 dark:text-brand-400" aria-hidden="true">
            {icon}
          </div>
        )}
        <h3 className="font-medium text-sm text-stone-800 dark:text-stone-200">
          {title}
        </h3>
      </div>

      {children}
    </section>
  )
}
