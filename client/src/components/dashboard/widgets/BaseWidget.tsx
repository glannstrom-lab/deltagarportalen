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
import { useTranslation } from 'react-i18next'
import { ChevronRight } from '@/components/ui/icons'
import type { LucideIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

export interface BaseWidgetProps {
  // Required
  title: string
  to: string
  icon: LucideIcon
  color: 'teal' | 'blue' | 'rose' | 'amber' | 'emerald' | 'sky' | 'orange' | 'cyan'

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
  teal: {
    icon: 'bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-solid)]',
    iconComplete: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    hover: 'hover:border-[var(--c-accent)] dark:hover:border-[var(--c-solid)]',
    progress: 'bg-[var(--c-solid)]',
    progressComplete: 'bg-emerald-500',
    accent: 'text-[var(--c-text)] dark:text-[var(--c-solid)]',
    light: 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20',
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
  sky: {
    icon: 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400',
    iconComplete: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    hover: 'hover:border-sky-300 dark:hover:border-sky-600',
    progress: 'bg-sky-500',
    progressComplete: 'bg-emerald-500',
    accent: 'text-sky-600 dark:text-sky-400',
    light: 'bg-sky-50 dark:bg-sky-900/20',
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
  default: 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-600',
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
  const { t } = useTranslation()
  const colors = colorClasses[color]
  const isSmall = size === 'small'

  return (
    <Link
      to={to}
      className={cn(
        "group block bg-white dark:bg-stone-800 rounded-2xl border-2",
        "card-interactive", // Consistent hover lift effect
        "focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-stone-900",
        colors.hover,
        `focus:ring-${color}-500`,
        isComplete
          ? "border-emerald-200 dark:border-emerald-700 bg-gradient-to-br from-emerald-50/50 dark:from-emerald-900/20 to-white dark:to-stone-800"
          : "border-stone-200 dark:border-stone-700",
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
              "font-semibold text-stone-800 dark:text-stone-100",
              isSmall ? "text-sm" : "text-base"
            )}>
              {title}
            </h3>
            {subtitle && !isSmall && (
              <p className="text-xs text-stone-500 dark:text-stone-400">{subtitle}</p>
            )}
          </div>
        </div>
        <ChevronRight
          size={isSmall ? 16 : 18}
          className="text-stone-300 dark:text-stone-600 group-hover:text-stone-500 dark:group-hover:text-stone-400 group-hover:translate-x-0.5 transition-all"
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
          <span className="text-sm text-stone-500 dark:text-stone-400">{stat.label}</span>
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
              <span className="text-xs text-stone-500 dark:text-stone-400">{t('common.progress')}</span>
              <span className={cn("text-sm font-semibold", isComplete ? "text-emerald-600 dark:text-emerald-400" : colors.accent)}>
                {progress.value}%
              </span>
            </div>
          )}
          <div className={cn(
            "bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden",
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
