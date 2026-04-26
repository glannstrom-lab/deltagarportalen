/**
 * Badge Component
 * Status badges and pills following DESIGN.md
 * Uses brand colors + allowed semantic colors (amber for warning, red for destructive)
 */

import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'default'      // Neutral stone
  | 'brand'        // Brand teal
  | 'success'      // Brand (not green per DESIGN.md)
  | 'warning'      // Amber
  | 'error'        // Red (destructive only)
  | 'info'         // Brand light
  // Category colors (pastels from DESIGN.md)
  | 'blue'
  | 'green'
  | 'pink'
  | 'purple'
  | 'yellow'
  | 'orange'

type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: React.ComponentType<{ className?: string; size?: number }>
  removable?: boolean
  onRemove?: () => void
  pill?: boolean
  dot?: boolean
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300',
  brand: 'bg-brand-100 dark:bg-brand-900/40 text-brand-900 dark:text-brand-300',
  success: 'bg-brand-100 dark:bg-brand-900/40 text-brand-900 dark:text-brand-300',
  warning: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300',
  error: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
  info: 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400',
  // Category colors from DESIGN.md
  blue: 'bg-[#DBEAFE] dark:bg-blue-900/40 text-[#1E40AF] dark:text-blue-300',
  green: 'bg-[#D1FAE5] dark:bg-emerald-900/40 text-[#065F46] dark:text-emerald-300',
  pink: 'bg-[#FCE7F3] dark:bg-pink-900/40 text-[#9F1239] dark:text-pink-300',
  purple: 'bg-[#EDE9FE] dark:bg-purple-900/40 text-[#5B21B6] dark:text-purple-300',
  yellow: 'bg-[#FEF3C7] dark:bg-amber-900/40 text-[#92400E] dark:text-amber-300',
  orange: 'bg-[#FFEDD5] dark:bg-orange-900/40 text-[#9A3412] dark:text-orange-300',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-sm',
}

const iconSizes: Record<BadgeSize, number> = {
  sm: 10,
  md: 12,
  lg: 14,
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  icon: Icon,
  removable = false,
  onRemove,
  pill = true,
  dot = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        pill ? 'rounded-full' : 'rounded-md',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          variant === 'warning' && 'bg-amber-500',
          variant === 'error' && 'bg-red-500',
          variant === 'success' && 'bg-brand-500',
          variant === 'brand' && 'bg-brand-500',
          variant === 'default' && 'bg-stone-500',
          variant === 'info' && 'bg-brand-400',
        )} />
      )}
      {Icon && <Icon size={iconSizes[size]} className="flex-shrink-0" />}
      {children}
      {removable && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            'ml-0.5 -mr-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-900'
          )}
          aria-label="Ta bort"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}

// Status Badge - Preset status indicators
interface StatusBadgeProps {
  status: 'active' | 'pending' | 'completed' | 'cancelled' | 'draft' | 'archived'
  size?: BadgeSize
  className?: string
}

const statusConfig: Record<StatusBadgeProps['status'], { label: string; variant: BadgeVariant }> = {
  active: { label: 'Aktiv', variant: 'brand' },
  pending: { label: 'Väntar', variant: 'warning' },
  completed: { label: 'Klar', variant: 'success' },
  cancelled: { label: 'Avbruten', variant: 'error' },
  draft: { label: 'Utkast', variant: 'default' },
  archived: { label: 'Arkiverad', variant: 'default' },
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <Badge variant={config.variant} size={size} dot className={className}>
      {config.label}
    </Badge>
  )
}

// Count Badge - For notification counts
interface CountBadgeProps {
  count: number
  max?: number
  variant?: 'default' | 'brand' | 'error'
  size?: BadgeSize
  className?: string
}

export function CountBadge({ count, max = 99, variant = 'brand', size = 'sm', className }: CountBadgeProps) {
  if (count <= 0) return null

  const displayCount = count > max ? `${max}+` : count.toString()

  return (
    <Badge variant={variant} size={size} className={cn('min-w-[1.25rem] justify-center', className)}>
      {displayCount}
    </Badge>
  )
}

export default Badge
