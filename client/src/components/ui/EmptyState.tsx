/**
 * Empty State Component
 * Standardiserad design för tomma tillstånd
 */

import { cn } from '@/lib/utils'
import { Button } from './Button'
import { LucideIcon } from '@/components/ui/icons'

// ============================================
// EMPTY STATE
// ============================================
interface EmptyStateProps {
  icon?: LucideIcon
  iconClassName?: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'outline'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  compact?: boolean
  className?: string
}

export function EmptyState({
  icon: Icon,
  iconClassName,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  className,
}: EmptyStateProps) {
  if (compact) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center',
        'text-center py-8 px-4',
        className
      )}>
        {Icon && (
          <div className={cn(
            'w-12 h-12 bg-slate-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-3',
            iconClassName
          )}>
            <Icon className="w-6 h-6 text-slate-600 dark:text-stone-300" />
          </div>
        )}
        <h3 className="text-sm font-medium text-slate-800 dark:text-stone-100">{title}</h3>
        {description && (
          <p className="text-xs text-slate-700 dark:text-stone-300 mt-1 max-w-xs">{description}</p>
        )}
        {action && (
          <Button
            variant={action.variant || 'secondary'}
            size="sm"
            onClick={action.onClick}
            className="mt-3"
          >
            {action.label}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center',
      'text-center py-12 px-4',
      className
    )}>
      {Icon && (
        <div className={cn(
          'w-16 h-16 bg-slate-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4',
          iconClassName
        )}>
          <Icon className="w-8 h-8 text-slate-600 dark:text-stone-300" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-800 dark:text-stone-100">{title}</h3>
      {description && (
        <p className="text-sm text-slate-700 dark:text-stone-300 mt-2 max-w-xs mx-auto">
          {description}
        </p>
      )}
      <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
        {action && (
          <Button
            variant={action.variant || 'primary'}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            variant="ghost"
            onClick={secondaryAction.onClick}
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  )
}

// ============================================
// EMPTY STATE FOR LISTS
// ============================================
interface EmptyListProps extends Omit<EmptyStateProps, 'compact'> {
  itemName: string
  createHref?: string
  onCreate?: () => void
}

export function EmptyList({
  itemName,
  createHref,
  onCreate,
  ...props
}: EmptyListProps) {
  const action = onCreate || createHref
    ? {
        label: `Skapa ${itemName.toLowerCase()}`,
        onClick: onCreate || (() => window.location.href = createHref!),
        variant: 'primary' as const,
      }
    : undefined

  return (
    <EmptyState
      {...props}
      description={props.description || `Du har inte skapat några ${itemName.toLowerCase()} än.`}
      action={action}
    />
  )
}

// ============================================
// EMPTY STATE FOR SEARCH
// ============================================
interface EmptySearchProps {
  query: string
  onClear: () => void
  suggestions?: string[]
  className?: string
}

export function EmptySearch({
  query,
  onClear,
  suggestions,
  className,
}: EmptySearchProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center',
      'text-center py-12 px-4',
      className
    )}>
      <div className="w-16 h-16 bg-slate-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-slate-600 dark:text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-stone-100">
        Inga resultat för "{query}"
      </h3>
      <p className="text-sm text-slate-700 dark:text-stone-300 mt-2 max-w-xs">
        Försök med andra sökord eller kontrollera stavningen.
      </p>
      <Button
        variant="secondary"
        onClick={onClear}
        className="mt-6"
      >
        Rensa sökning
      </Button>
      
      {suggestions && suggestions.length > 0 && (
        <div className="mt-8 text-left w-full max-w-md">
          <p className="text-sm font-medium text-slate-700 dark:text-stone-300 mb-3">Förslag:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onClear()}
                className="px-3 py-1.5 bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-700 rounded-full text-sm text-slate-600 dark:text-stone-300 hover:bg-slate-50 dark:hover:bg-stone-800 hover:border-slate-300 dark:hover:border-stone-600 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// EMPTY STATE FOR DASHBOARD WIDGETS
// ============================================
interface EmptyWidgetProps {
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export function EmptyWidget({
  title,
  description,
  action,
  className,
}: EmptyWidgetProps) {
  const handleClick = () => {
    if (action?.onClick) {
      action.onClick()
    } else if (action?.href) {
      window.location.href = action.href
    }
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center',
      'text-center py-8 px-4',
      'bg-slate-50 dark:bg-stone-800 rounded-xl border border-dashed border-slate-300 dark:border-stone-600',
      className
    )}>
      <p className="text-sm font-medium text-slate-700 dark:text-stone-300">{title}</p>
      <p className="text-xs text-slate-700 dark:text-stone-300 mt-1">{description}</p>
      {action && (
        <button
          onClick={handleClick}
          className="mt-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          {action.label} →
        </button>
      )}
    </div>
  )
}

// ============================================
// ILLUSTRATED EMPTY STATE (med SVG illustration)
// ============================================
interface IllustratedEmptyStateProps {
  illustration?: 'documents' | 'search' | 'notifications' | 'success' | 'error'
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function IllustratedEmptyState({
  illustration = 'documents',
  title,
  description,
  action,
  className,
}: IllustratedEmptyStateProps) {
  const illustrations = {
    documents: (
      <svg viewBox="0 0 120 120" className="w-32 h-32 text-slate-300" fill="currentColor">
        <rect x="20" y="20" width="40" height="50" rx="4" className="text-slate-200" />
        <rect x="35" y="35" width="70" height="50" rx="4" className="text-slate-300" />
        <rect x="45" y="50" width="40" height="4" rx="2" className="text-slate-600 dark:text-stone-300" />
        <rect x="45" y="60" width="30" height="4" rx="2" className="text-slate-600 dark:text-stone-300" />
        <rect x="45" y="70" width="35" height="4" rx="2" className="text-slate-600 dark:text-stone-300" />
      </svg>
    ),
    search: (
      <svg viewBox="0 0 120 120" className="w-32 h-32 text-slate-300" fill="currentColor">
        <circle cx="55" cy="55" r="25" className="text-slate-200" stroke="currentColor" strokeWidth="4" fill="none" />
        <line x1="75" y1="75" x2="95" y2="95" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <circle cx="55" cy="55" r="35" className="text-slate-100" opacity="0.5" />
      </svg>
    ),
    notifications: (
      <svg viewBox="0 0 120 120" className="w-32 h-32 text-slate-300" fill="currentColor">
        <path d="M60 20c-16.6 0-30 13.4-30 30v20l-10 10h80l-10-10V50c0-16.6-13.4-30-30-30z" className="text-slate-200" />
        <circle cx="60" cy="95" r="8" className="text-slate-200" />
        <circle cx="60" cy="55" r="30" className="text-slate-100" opacity="0.5" />
      </svg>
    ),
    success: (
      <svg viewBox="0 0 120 120" className="w-32 h-32 text-slate-300" fill="currentColor">
        <circle cx="60" cy="60" r="35" className="text-brand-100" />
        <path d="M45 60l10 10 20-20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-brand-700" fill="none" />
      </svg>
    ),
    error: (
      <svg viewBox="0 0 120 120" className="w-32 h-32 text-slate-300" fill="currentColor">
        <circle cx="60" cy="60" r="35" className="text-red-100" />
        <path d="M48 48l24 24M72 48l-24 24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-red-500" />
      </svg>
    ),
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center',
      'text-center py-12 px-4',
      className
    )}>
      <div className="mb-6">
        {illustrations[illustration]}
      </div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-stone-100">{title}</h3>
      {description && (
        <p className="text-sm text-slate-700 dark:text-stone-300 mt-2 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant="primary"
          onClick={action.onClick}
          className="mt-6"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

export default EmptyState
