/**
 * KPI Card Component for Dashboard
 * Clean, minimal design with neutral backgrounds and status dots
 * Single accent color approach - no gradient backgrounds
 */

import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  subtext?: string
  status?: 'active' | 'updated' | 'pending' | 'none'
  to?: string
}

const statusConfig = {
  active: { dot: 'bg-brand-600', text: 'text-brand-600' },
  updated: { dot: 'bg-brand-600', text: 'text-brand-600' },
  pending: { dot: 'bg-stone-400', text: 'text-stone-500' },
  none: { dot: '', text: 'text-stone-500' },
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  subtext,
  status = 'none',
  to
}: KpiCardProps) {
  const displayValue = typeof value === 'number' ? Math.max(0, value) : value
  const statusStyle = statusConfig[status]

  const content = (
    <div className={cn(
      'bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-4 sm:p-5',
      'transition-all duration-200',
      to && 'hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-sm cursor-pointer'
    )}>
      {/* Label */}
      <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-medium mb-1">
        {label}
      </p>

      {/* Value */}
      <p className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 mb-1">
        {displayValue}
      </p>

      {/* Status with dot */}
      {subtext && (
        <div className="flex items-center gap-1.5">
          {status !== 'none' && (
            <span className={cn('w-2 h-2 rounded-full', statusStyle.dot)} />
          )}
          <span className={cn('text-xs sm:text-sm', statusStyle.text)}>
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
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 rounded-xl block"
      >
        {content}
      </Link>
    )
  }

  return content
}

export default KpiCard
