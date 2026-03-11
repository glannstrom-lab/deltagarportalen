/**
 * Card Components
 * Standardiserade kort-komponenter för olika användningsområden
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
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
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
      'flex items-start justify-between gap-4',
      'pb-4 mb-4 border-b border-slate-100',
      className
    )}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
            <span className="text-indigo-600">{icon}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
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
      'pt-4 mt-4 border-t border-slate-100',
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
            <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
          )}
          {description && (
            <p className="text-sm text-slate-500 mt-0.5">{description}</p>
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
  color?: 'default' | 'indigo' | 'green' | 'amber' | 'blue' | 'purple'
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
    default: 'bg-slate-50 text-slate-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  
  return (
    <Card 
      variant="hover" 
      padding="md"
      className={cn(className)}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
            colorClasses[color]
          )}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{value}</span>
            {trend && (
              <span className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 truncate">{label}</p>
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
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  }
  
  const iconColors = {
    info: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
  }
  
  return (
    <div className={cn(
      'rounded-xl border p-4',
      variantClasses[variant],
      className
    )}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className={cn('flex-shrink-0 mt-0.5', iconColors[variant])}>
            {icon}
          </div>
        )}
        <div className="flex-1">
          {title && (
            <h4 className={cn('font-semibold mb-1', variantClasses[variant].split(' ')[2])}>
              {title}
            </h4>
          )}
          <div className="text-sm opacity-90">{children}</div>
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
        'bg-white rounded-xl border-2 p-4',
        'transition-all duration-200',
        animations.press,
        animations.lift,
        isSelected 
          ? 'border-indigo-500 ring-2 ring-indigo-500 ring-offset-2' 
          : 'border-slate-200 hover:border-indigo-300 hover:shadow-md',
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
            isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'
          )}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800">{title}</h3>
            {badge && (
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-slate-500 mt-1">{description}</p>
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
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-200 rounded" />
        ))}
      </div>
    </Card>
  )
}

export default Card
