/**
 * KPI Card Component for Dashboard
 * Displays key performance indicators with gradient styling
 */

import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  subtext?: string
  color?: 'teal' | 'sky' | 'amber' | 'emerald' | 'rose'
  to?: string
}

const colorClasses = {
  teal: 'from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700',
  sky: 'from-sky-500 to-sky-600 dark:from-sky-600 dark:to-sky-700',
  amber: 'from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700',
  emerald: 'from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700',
  rose: 'from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-700',
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  subtext,
  color = 'teal',
  to
}: KpiCardProps) {
  const content = (
    <div className={cn(
      'relative overflow-hidden rounded-xl p-3 sm:p-4 bg-gradient-to-br text-white shadow-lg',
      colorClasses[color],
      to && 'hover:scale-[1.02] transition-transform cursor-pointer'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-white/80 text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1 truncate">{label}</p>
          <p className="text-xl sm:text-2xl font-bold">{value}</p>
          {subtext && <p className="text-white/70 text-[10px] sm:text-xs mt-0.5 sm:mt-1 truncate">{subtext}</p>}
        </div>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      </div>
    </div>
  )

  return to ? <Link to={to}>{content}</Link> : content
}

export default KpiCard
