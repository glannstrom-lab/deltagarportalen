/**
 * BaseWidget - Enhetlig design för alla dashboard-widgets
 *
 * Design:
 * - Clean, konsekvent layout
 * - Färgkodade per funktion
 * - Stöd för small/medium storlek
 * - Hover-effekter och animationer
 */

import { memo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, LucideIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

export interface BaseWidgetProps {
  // Required
  title: string
  to: string
  icon: LucideIcon
  color: 'violet' | 'blue' | 'rose' | 'amber' | 'emerald' | 'teal' | 'purple' | 'indigo' | 'orange' | 'cyan'

  // Optional
  size?: 'small' | 'medium'
  subtitle?: string
  badge?: {
    text: string
    variant: 'default' | 'success' | 'warning' | 'info'
  }
  progress?: {
    value: number
    max?: number
    showLabel?: boolean
  }
  stat?: {
    value: string | number
    label: string
  }
  isComplete?: boolean
  isEmpty?: boolean
  children?: React.ReactNode
  className?: string
}

const colorClasses = {
  violet: {
    icon: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
    iconComplete: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    hover: 'hover:border-violet-300 dark:hover:border-violet-600',
    progress: 'bg-violet-500',
    progressComplete: 'bg-emerald-500',
    accent: 'text-violet-600 dark:text-violet-400',
    light: 'bg-violet-50 dark:bg-violet-900/20',
  },
  blue: {
    icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    iconComplete: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    hover: 'hover:border-blue-300 dark:hover:border-blue-600',
    progress: 'bg-blue-500',
    progressComplete: 'bg-emerald-500',
    accent: 'text-blue-600 dark:text-blue-400',
    light: 'bg-blue-50 dark:bg-blue-900/20',
  },
  rose: {
    icon: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400',
    iconComplete: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    hover: 'hover:border-rose-300 dark:hover:border-rose-600',
    progress: 'bg-rose-500',
    progressComplete: 'bg-emerald-500',
    accent: 'text-rose-600 dark:text-rose-400',
    light: 'bg-rose-50 dark:bg-rose-900/20',
  },
  amber: {
    icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    iconComplete: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    hover: 'hover:border-amber-300 dark:hover:border-amber-600',
    progress: 'bg-amber-500',
    progressComplete: 'bg-emerald-500',
    accent: 'text-amber-600 dark:text-amber-400',
    light: 'bg-amber-50 dark:bg-amber-900/20',
  },
  emerald: {
    icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    iconComplete: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    hover: 'hover:border-emerald-300 dark:hover:border-emerald-600',
    progress: 'bg-emerald-500',
    progressComplete: 'bg-emerald-500',
    accent: 'text-emerald-600 dark:text-emerald-400',
    light: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  teal: {
    icon: 'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400',
    iconComplete: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    hover: 'hover:border-teal-300 dark:hover:border-teal-600',
    progress: 'bg-teal-500',
    progressComplete: 'bg-emerald-500',
    accent: 'text-teal-600 dark:text-teal-400',
    light: 'bg-teal-50 dark:bg-teal-900/20',
  },
  purple: {
    icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
    iconComplete: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    hover: 'hover:border-purple-300 dark:hover:border-purple-600',
    progress: 'bg-purple-500',
    progressComplete: 'bg-emerald-500',
    accent: 'text-purple-600 dark:text-purple-400',
    light: 'bg-purple-50 dark:bg-purple-900/20',
  },
  indigo: {
    icon: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
    iconComplete: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    hover: 'hover:border-indigo-300 dark:hover:border-indigo-600',
    progress: 'bg-indigo-500',
    progressComplete: 'bg-emerald-500',
    accent: 'text-indigo-600 dark:text-indigo-400',
    light: 'bg-indigo-50 dark:bg-indigo-900/20',
  },
  orange: {
    icon: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
    iconComplete: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    hover: 'hover:border-orange-300 dark:hover:border-orange-600',
    progress: 'bg-orange-500',
    progressComplete: 'bg-emerald-500',
    accent: 'text-orange-600 dark:text-orange-400',
    light: 'bg-orange-50 dark:bg-orange-900/20',
  },
  cyan: {
    icon: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400',
    iconComplete: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    hover: 'hover:border-cyan-300 dark:hover:border-cyan-600',
    progress: 'bg-cyan-500',
    progressComplete: 'bg-emerald-500',
    accent: 'text-cyan-600 dark:text-cyan-400',
    light: 'bg-cyan-50 dark:bg-cyan-900/20',
  },
}

const badgeClasses = {
  default: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
  success: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700',
  warning: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700',
  info: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700',
}

export const BaseWidget = memo(function BaseWidget({
  title,
  to,
  icon: Icon,
  color,
  size = 'small',
  subtitle,
  badge,
  progress,
  stat,
  isComplete = false,
  isEmpty = false,
  children,
  className,
}: BaseWidgetProps) {
  const colors = colorClasses[color]
  const isSmall = size === 'small'

  return (
    <Link
      to={to}
      className={cn(
        "group block bg-white dark:bg-slate-800 rounded-2xl border-2 transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
        colors.hover,
        `focus:ring-${color}-500`,
        isComplete
          ? "border-emerald-200 dark:border-emerald-700 bg-gradient-to-br from-emerald-50/50 dark:from-emerald-900/20 to-white dark:to-slate-800"
          : "border-slate-200 dark:border-slate-700",
        isSmall ? "p-4" : "p-5",
        className
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between",
        isSmall ? "mb-3" : "mb-4"
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            "rounded-xl flex items-center justify-center transition-colors",
            isSmall ? "w-9 h-9" : "w-11 h-11",
            isComplete ? colors.iconComplete : colors.icon
          )}>
            <Icon size={isSmall ? 18 : 22} />
          </div>
          <div>
            <h3 className={cn(
              "font-semibold text-slate-800 dark:text-slate-100",
              isSmall ? "text-sm" : "text-base"
            )}>
              {title}
            </h3>
            {subtitle && !isSmall && (
              <p className="text-xs text-slate-700 dark:text-slate-600">{subtitle}</p>
            )}
          </div>
        </div>
        <ChevronRight
          size={isSmall ? 16 : 18}
          className="text-slate-300 dark:text-slate-600 group-hover:text-slate-700 dark:group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all"
        />
      </div>

      {/* Stat display */}
      {stat && (
        <div className={cn("flex items-baseline gap-2", isSmall ? "mb-2" : "mb-3")}>
          <span className={cn(
            "font-bold",
            isSmall ? "text-2xl" : "text-3xl",
            isComplete ? "text-emerald-600 dark:text-emerald-400" : colors.accent
          )}>
            {stat.value}
          </span>
          <span className="text-sm text-slate-700 dark:text-slate-600">{stat.label}</span>
        </div>
      )}

      {/* Badge */}
      {badge && (
        <div className={cn("mb-3", isSmall && "mb-2")}>
          <span className={cn(
            "inline-flex items-center text-xs font-medium px-2 py-1 rounded-full border",
            badgeClasses[badge.variant]
          )}>
            {badge.text}
          </span>
        </div>
      )}

      {/* Custom children content */}
      {children}

      {/* Progress bar */}
      {progress && (
        <div className={cn(isSmall ? "mt-3" : "mt-4")}>
          {progress.showLabel && (
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-slate-700 dark:text-slate-600">Progress</span>
              <span className={cn("text-sm font-semibold", isComplete ? "text-emerald-600 dark:text-emerald-400" : colors.accent)}>
                {progress.value}%
              </span>
            </div>
          )}
          <div className={cn(
            "bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden",
            isSmall ? "h-1.5" : "h-2.5"
          )}>
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isComplete ? colors.progressComplete : colors.progress
              )}
              style={{ width: `${Math.min(progress.value, 100)}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  )
})

export default BaseWidget
