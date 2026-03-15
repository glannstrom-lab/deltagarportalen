/**
 * BaseWidget - Enhetlig design för alla dashboard-widgets
 *
 * Design:
 * - Clean, konsekvent layout
 * - Färgkodade per funktion
 * - Stöd för small/medium storlek
 * - Hover-effekter och animationer
 */

import { Link } from 'react-router-dom'
import { ChevronRight, LucideIcon } from 'lucide-react'
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
    icon: 'bg-violet-100 text-violet-600',
    iconComplete: 'bg-emerald-100 text-emerald-600',
    hover: 'hover:border-violet-300',
    progress: 'bg-violet-500',
    progressComplete: 'bg-emerald-500',
    accent: 'text-violet-600',
    light: 'bg-violet-50',
  },
  blue: {
    icon: 'bg-blue-100 text-blue-600',
    iconComplete: 'bg-emerald-100 text-emerald-600',
    hover: 'hover:border-blue-300',
    progress: 'bg-blue-500',
    progressComplete: 'bg-emerald-500',
    accent: 'text-blue-600',
    light: 'bg-blue-50',
  },
  rose: {
    icon: 'bg-rose-100 text-rose-600',
    iconComplete: 'bg-emerald-100 text-emerald-600',
    hover: 'hover:border-rose-300',
    progress: 'bg-rose-500',
    progressComplete: 'bg-emerald-500',
    accent: 'text-rose-600',
    light: 'bg-rose-50',
  },
  amber: {
    icon: 'bg-amber-100 text-amber-600',
    iconComplete: 'bg-emerald-100 text-emerald-600',
    hover: 'hover:border-amber-300',
    progress: 'bg-amber-500',
    progressComplete: 'bg-emerald-500',
    accent: 'text-amber-600',
    light: 'bg-amber-50',
  },
  emerald: {
    icon: 'bg-emerald-100 text-emerald-600',
    iconComplete: 'bg-emerald-100 text-emerald-600',
    hover: 'hover:border-emerald-300',
    progress: 'bg-emerald-500',
    progressComplete: 'bg-emerald-500',
    accent: 'text-emerald-600',
    light: 'bg-emerald-50',
  },
  teal: {
    icon: 'bg-teal-100 text-teal-600',
    iconComplete: 'bg-emerald-100 text-emerald-600',
    hover: 'hover:border-teal-300',
    progress: 'bg-teal-500',
    progressComplete: 'bg-emerald-500',
    accent: 'text-teal-600',
    light: 'bg-teal-50',
  },
  purple: {
    icon: 'bg-purple-100 text-purple-600',
    iconComplete: 'bg-emerald-100 text-emerald-600',
    hover: 'hover:border-purple-300',
    progress: 'bg-purple-500',
    progressComplete: 'bg-emerald-500',
    accent: 'text-purple-600',
    light: 'bg-purple-50',
  },
  indigo: {
    icon: 'bg-indigo-100 text-indigo-600',
    iconComplete: 'bg-emerald-100 text-emerald-600',
    hover: 'hover:border-indigo-300',
    progress: 'bg-indigo-500',
    progressComplete: 'bg-emerald-500',
    accent: 'text-indigo-600',
    light: 'bg-indigo-50',
  },
  orange: {
    icon: 'bg-orange-100 text-orange-600',
    iconComplete: 'bg-emerald-100 text-emerald-600',
    hover: 'hover:border-orange-300',
    progress: 'bg-orange-500',
    progressComplete: 'bg-emerald-500',
    accent: 'text-orange-600',
    light: 'bg-orange-50',
  },
  cyan: {
    icon: 'bg-cyan-100 text-cyan-600',
    iconComplete: 'bg-emerald-100 text-emerald-600',
    hover: 'hover:border-cyan-300',
    progress: 'bg-cyan-500',
    progressComplete: 'bg-emerald-500',
    accent: 'text-cyan-600',
    light: 'bg-cyan-50',
  },
}

const badgeClasses = {
  default: 'bg-slate-100 text-slate-600 border-slate-200',
  success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
}

export function BaseWidget({
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
        "group block bg-white rounded-2xl border-2 transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        colors.hover,
        `focus:ring-${color}-500`,
        isComplete ? "border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white" : "border-slate-200",
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
              "font-semibold text-slate-800",
              isSmall ? "text-sm" : "text-base"
            )}>
              {title}
            </h3>
            {subtitle && !isSmall && (
              <p className="text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
        </div>
        <ChevronRight
          size={isSmall ? 16 : 18}
          className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all"
        />
      </div>

      {/* Stat display */}
      {stat && (
        <div className={cn("flex items-baseline gap-2", isSmall ? "mb-2" : "mb-3")}>
          <span className={cn(
            "font-bold",
            isSmall ? "text-2xl" : "text-3xl",
            isComplete ? "text-emerald-600" : colors.accent
          )}>
            {stat.value}
          </span>
          <span className="text-sm text-slate-500">{stat.label}</span>
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
              <span className="text-xs text-slate-500">Progress</span>
              <span className={cn("text-sm font-semibold", isComplete ? "text-emerald-600" : colors.accent)}>
                {progress.value}%
              </span>
            </div>
          )}
          <div className={cn(
            "bg-slate-100 rounded-full overflow-hidden",
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
}

export default BaseWidget
