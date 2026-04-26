/**
 * KPI Card Component - Clean Pastel Design
 * White background with soft pastel icon circles
 * No gradients, minimal shadows, clean typography
 */

import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ChevronRight } from '@/components/ui/icons'

interface KpiCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  subtext?: string
  color?: 'teal' | 'peach' | 'lavender' | 'mint' | 'sky' | 'amber'
  to?: string
}

// Soft pastel color palette
const colorConfig = {
  teal: {
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    dotColor: 'bg-teal-400',
  },
  peach: {
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    dotColor: 'bg-orange-300',
  },
  lavender: {
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-500',
    dotColor: 'bg-violet-300',
  },
  mint: {
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    dotColor: 'bg-emerald-300',
  },
  sky: {
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-500',
    dotColor: 'bg-sky-300',
  },
  amber: {
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    dotColor: 'bg-amber-300',
  },
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  subtext,
  color = 'teal',
  to,
}: KpiCardProps) {
  const displayValue = typeof value === 'number' ? Math.max(0, value) : value
  const config = colorConfig[color]

  const content = (
    <div className={cn(
      'bg-white dark:bg-stone-900 rounded-xl p-4',
      'border border-stone-200 dark:border-stone-700',
      to && 'hover:border-stone-300 dark:hover:border-stone-600 transition-colors cursor-pointer group'
    )}>
      <div className="flex items-start justify-between">
        {/* Icon */}
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          config.iconBg, 'dark:bg-stone-800'
        )}>
          <Icon className={cn('w-5 h-5', config.iconColor, 'dark:text-stone-400')} aria-hidden="true" />
        </div>

        {/* Arrow for links */}
        {to && (
          <ChevronRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-stone-400 dark:group-hover:text-stone-500 transition-colors" />
        )}
      </div>

      {/* Value */}
      <div className="mt-3">
        <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">
          {displayValue}
        </p>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
          {label}
        </p>
        {subtext && (
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
            {subtext}
          </p>
        )}
      </div>
    </div>
  )

  if (to) {
    return (
      <Link
        to={to}
        aria-label={`${label}: ${displayValue}${subtext ? `, ${subtext}` : ''}`}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 rounded-xl block"
      >
        {content}
      </Link>
    )
  }

  return content
}

export default KpiCard
