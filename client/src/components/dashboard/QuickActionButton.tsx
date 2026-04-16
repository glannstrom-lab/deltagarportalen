/**
 * Quick Action Button Component for Dashboard
 * Compact action buttons for common tasks
 */

import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface QuickActionButtonProps {
  icon: React.ElementType
  label: string
  to: string
  color?: 'teal' | 'sky' | 'amber'
}

const colorClasses = {
  teal: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/60',
  sky: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-900/60',
  amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60',
}

export function QuickActionButton({
  icon: Icon,
  label,
  to,
  color = 'teal'
}: QuickActionButtonProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors',
        colorClasses[color]
      )}
    >
      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      {label}
    </Link>
  )
}

export default QuickActionButton
