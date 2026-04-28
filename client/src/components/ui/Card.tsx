/**
 * Card Components
 * Standardiserade kort-komponenter för olika användningsområden
 * UPPDATERAD: "Calm & Capable" färgpalett (Violet + Warm Stone)
 */

import { cn } from '@/lib/utils'
import { cardVariants, animations, radius, shadows, spacing } from '@/styles/design-system'

// ============================================
// BASE CARD
// ============================================
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'elevated' | 'flat'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}: CardProps) {
  // Responsive padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5 md:p-6',
    lg: 'p-5 sm:p-6 md:p-8',
  }

  return (
    <div
      className={cn(
        cardVariants[variant],
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ============================================
// CARD HEADER
// ============================================
interface CardHeaderProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function CardHeader({
  title,
  description,
  icon,
  actions,
  className
}: CardHeaderProps) {
  if (!title && !actions) return null

  return (
    <div className={cn(
      'flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4',
      'pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-stone-100 dark:border-stone-700',
      className
    )}>
      <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
        {icon && (
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 flex items-center justify-center">
            <span className="text-[var(--c-text)] dark:text-[var(--c-solid)] [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5">{icon}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-base sm:text-lg font-semibold text-stone-800 dark:text-stone-100 truncate">{title}</h3>
          )}
          {description && (
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0 mt-1 sm:mt-0">
          {actions}
        </div>
      )}
    </div>
  )
}

// ============================================
// CARD FOOTER
// ============================================
interface CardFooterProps {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right' | 'between'
}

export function CardFooter({ 
  children, 
  className,
  align = 'between'
}: CardFooterProps) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  }
  
  return (
    <div className={cn(
      'flex items-center gap-3',
      'pt-4 mt-4 border-t border-stone-100 dark:border-stone-700',
      alignClasses[align],
      className
    )}>
      {children}
    </div>
  )
}

// ============================================
// CARD SECTION
// ============================================
interface CardSectionProps {
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
}

export function CardSection({ 
  children, 
  title,
  description,
  className 
}: CardSectionProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {(title || description) && (
        <div>
          {title && (
            <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-100">{title}</h4>
          )}
          {description && (
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

// ============================================
// STAT CARD (för dashboard stats)
// ============================================
interface StatCardProps {
  value: string | number
  label: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'default' | 'violet' | 'green' | 'amber' | 'blue' | 'purple'
  className?: string
}

export function StatCard({
  value,
  label,
  icon,
  trend,
  color = 'default',
  className
}: StatCardProps) {
  const colorClasses = {
    default: 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300',
    violet: 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 text-[var(--c-text)] dark:text-[var(--c-solid)]',
    green: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',
  }

  return (
    <Card
      variant="hover"
      padding="sm"
      className={cn(className)}
    >
      {/* Vertical on mobile, horizontal on larger screens */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4">
        {icon && (
          <div className={cn(
            'w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0',
            '[&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6',
            colorClasses[color]
          )}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100">{value}</span>
            {trend && (
              <span className={cn(
                'text-[10px] sm:text-xs font-medium',
                trend.isPositive ? 'text-emerald-600' : 'text-red-600'
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 truncate">{label}</p>
        </div>
      </div>
    </Card>
  )
}

// ============================================
// INFO CARD (för tips, info, etc)
// ============================================
interface InfoCardProps {
  title?: string
  children: React.ReactNode
  variant?: 'info' | 'success' | 'warning' | 'error'
  icon?: React.ReactNode
  className?: string
}

export function InfoCard({
  title,
  children,
  variant = 'info',
  icon,
  className
}: InfoCardProps) {
  const variantClasses = {
    info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200',
    success: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200',
    warning: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200',
    error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200',
  }

  const iconColors = {
    info: 'text-blue-600 dark:text-blue-400',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    error: 'text-red-600 dark:text-red-400',
  }

  return (
    <div className={cn(
      'rounded-lg sm:rounded-xl border p-3 sm:p-4',
      variantClasses[variant],
      className
    )}>
      <div className="flex items-start gap-2 sm:gap-3">
        {icon && (
          <div className={cn(
            'flex-shrink-0 mt-0.5 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5',
            iconColors[variant]
          )}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn('text-sm sm:text-base font-semibold mb-0.5 sm:mb-1', variantClasses[variant].split(' ')[2])}>
              {title}
            </h4>
          )}
          <div className="text-xs sm:text-sm opacity-90">{children}</div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ACTION CARD (klickbart kort)
// ============================================
interface ActionCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title: string
  description?: string
  icon?: React.ReactNode
  badge?: string
  isSelected?: boolean
  className?: string
}

export function ActionCard({
  title,
  description,
  icon,
  badge,
  isSelected,
  className,
  ...props
}: ActionCardProps) {
  return (
    <button
      className={cn(
        'w-full text-left',
        'bg-white dark:bg-stone-900 rounded-lg sm:rounded-xl border sm:border-2 p-3 sm:p-4',
        'transition-all duration-200',
        'min-h-[44px]', // Touch target
        animations.press,
        animations.lift,
        isSelected
          ? 'border-[var(--c-solid)] ring-2 ring-[var(--c-solid)] ring-offset-2 dark:ring-offset-stone-900'
          : 'border-stone-200 dark:border-stone-700 hover:border-[var(--c-accent)] dark:hover:border-[var(--c-solid)] hover:shadow-md',
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {icon && (
          <div className={cn(
            'w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0',
            '[&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6',
            isSelected ? 'bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/30 text-[var(--c-text)] dark:text-[var(--c-solid)]' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
          )}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base font-semibold text-stone-800 dark:text-stone-100">{title}</h3>
            {badge && (
              <span className="px-1.5 sm:px-2 py-0.5 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/30 text-[var(--c-text)] dark:text-[var(--c-accent)] text-[10px] sm:text-xs font-medium rounded-full">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5 sm:mt-1 line-clamp-2">{description}</p>
          )}
        </div>
      </div>
    </button>
  )
}

// ============================================
// SKELETON CARD
// ============================================
interface SkeletonCardProps {
  className?: string
  rows?: number
}

export function SkeletonCard({ className, rows = 3 }: SkeletonCardProps) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <div className="space-y-3">
        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-3/4" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-3 bg-stone-200 dark:bg-stone-700 rounded" />
        ))}
      </div>
    </Card>
  )
}

export default Card
