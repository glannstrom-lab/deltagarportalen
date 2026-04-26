/**
 * Dashboard Section Component
 * Zone-style card with progress bar
 * Uses brand-zone background for grouped content
 */

import { cn } from '@/lib/utils'

interface DashboardSectionProps {
  title: string
  badge?: string
  progress?: number // 0-100, shows progress bar if provided
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'zone'
}

export function DashboardSection({
  title,
  badge,
  progress,
  children,
  className,
  variant = 'zone'
}: DashboardSectionProps) {
  return (
    <div className={cn(
      'rounded-xl',
      variant === 'zone'
        ? 'bg-brand-zone dark:bg-brand-900/10'
        : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700',
      className
    )}>
      {/* Header */}
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base sm:text-lg font-semibold text-stone-900 dark:text-stone-100">
            {title}
          </h3>
          {badge && (
            <span className="text-sm text-brand-700 dark:text-brand-400 font-medium">
              {badge}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {typeof progress === 'number' && (
          <div className="h-2 bg-brand-100 dark:bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-900 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5">
        {children}
      </div>
    </div>
  )
}

export default DashboardSection
