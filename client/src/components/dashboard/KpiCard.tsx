/**
 * KPI Card Component for Dashboard
 * 60/30/10 color distribution:
 * - Positive KPIs: tinted background (brand-50) with brand-300 border
 * - Neutral KPIs: white background
 */

import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  subtext?: string
  status?: 'active' | 'updated' | 'pending' | 'none'
  variant?: 'positive' | 'neutral'
  to?: string
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  subtext,
  status = 'none',
  variant = 'neutral',
  to
}: KpiCardProps) {
  const displayValue = typeof value === 'number' ? Math.max(0, value) : value
  const isPositive = variant === 'positive'

  const content = (
    <div className={cn(
      'rounded-xl p-4 sm:p-5 transition-all duration-200',
      isPositive
        ? 'bg-brand-50 border border-brand-300 dark:bg-brand-900/20 dark:border-brand-700'
        : 'bg-white border border-stone-200 dark:bg-stone-900 dark:border-stone-700',
      to && 'hover:shadow-sm cursor-pointer',
      to && isPositive && 'hover:border-brand-400',
      to && !isPositive && 'hover:border-stone-300 dark:hover:border-stone-600'
    )}>
      {/* Label */}
      <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-medium mb-1">
        {label}
      </p>

      {/* Value */}
      <p className={cn(
        'text-2xl sm:text-3xl font-bold mb-1',
        isPositive
          ? 'text-brand-900 dark:text-brand-400'
          : 'text-stone-900 dark:text-stone-100'
      )}>
        {displayValue}
      </p>

      {/* Status with dot */}
      {subtext && (
        <div className="flex items-center gap-1.5">
          {status !== 'none' && (
            <span className={cn(
              'w-2 h-2 rounded-full',
              isPositive ? 'bg-brand-900' : 'bg-stone-400'
            )} />
          )}
          <span className={cn(
            'text-xs sm:text-sm',
            isPositive ? 'text-brand-700 dark:text-brand-400' : 'text-stone-500'
          )}>
            {subtext}
          </span>
        </div>
      )}
    </div>
  )

  if (to) {
    return (
      <Link
        to={to}
        aria-label={`${label}: ${displayValue}${subtext ? `, ${subtext}` : ''}`}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-900 focus-visible:ring-offset-2 rounded-xl block"
      >
        {content}
      </Link>
    )
  }

  return content
}

export default KpiCard
