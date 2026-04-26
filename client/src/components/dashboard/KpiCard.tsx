/**
 * KPI Card Component - Semantic Domain Colors
 * Uses semantic color domains from DESIGN.md
 * Clean white cards with domain-colored icon circles
 */

import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ChevronRight } from '@/components/ui/icons'

interface KpiCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  subtext?: string
  /** Semantic domain color - maps to activity domains */
  color?: 'action' | 'info' | 'activity' | 'wellbeing' | 'coaching'
  to?: string
}

// Semantic domain color palette (from DESIGN.md)
const colorConfig = {
  // Turkos - CTA, brand, primära handlingar
  action: {
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-900',
    dotColor: 'bg-teal-300',
  },
  // Blå - sparade jobb, information, referens
  info: {
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-900',
    dotColor: 'bg-blue-300',
  },
  // Persika - utåtriktad aktivitet, ansökningar
  activity: {
    iconBg: 'bg-peach-50',
    iconColor: 'text-peach-900',
    dotColor: 'bg-peach-300',
  },
  // Rosa - mående, hälsa, personliga känslor
  wellbeing: {
    iconBg: 'bg-pink-50',
    iconColor: 'text-pink-900',
    dotColor: 'bg-pink-300',
  },
  // Lila - självkännedom, reflektion, intresseguide
  coaching: {
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-900',
    dotColor: 'bg-purple-300',
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
