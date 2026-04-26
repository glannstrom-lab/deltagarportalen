/**
 * Dashboard Section Component
 * Clean card style with optional progress bar
 * Minimal design - white background, subtle border
 */

import { cn } from '@/lib/utils'

interface DashboardSectionProps {
  title: string
  badge?: string
  progress?: number // 0-100, shows progress bar if provided
  children: React.ReactNode
  className?: string
}

export function DashboardSection({
  title,
  badge,
  progress,
  children,
  className
}: DashboardSectionProps) {
  return (
    <div className={cn(
      'bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700',
      className
    )}>
      {/* Header */}
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base sm:text-lg font-semibold text-stone-900 dark:text-stone-100">
            {title}
          </h3>
          {badge && (
            <span className="text-sm text-stone-500 dark:text-stone-400">
              {badge}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {typeof progress === 'number' && (
          <div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-500"
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
