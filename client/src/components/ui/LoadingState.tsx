/**
 * Loading State Components
 * Standardiserade loading states för olika scenarier
 */

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Card } from './Card'
import { Loader2, RefreshCw } from '@/components/ui/icons'
import { Button } from './Button'

// ============================================
// SPINNER
// ============================================
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }

  return (
    <Loader2
      className={cn(
        'animate-spin text-indigo-600',
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
    />
  )
}

// ============================================
// LOADING STATE (Full)
// ============================================
interface LoadingStateProps {
  title?: string
  message?: string
  size?: 'sm' | 'md' | 'lg'
  fullHeight?: boolean
  className?: string
}

export function LoadingState({
  title,
  message,
  size = 'md',
  fullHeight = false,
  className
}: LoadingStateProps) {
  const { t } = useTranslation()
  const displayMessage = message ?? t('common.loading')

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'text-center p-6',
        fullHeight && 'min-h-[400px]',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner size={size === 'sm' ? 'md' : size === 'md' ? 'lg' : 'xl'} />
      {title && (
        <h3 className="mt-4 text-lg font-semibold text-stone-800">{title}</h3>
      )}
      <p className={cn(
        'text-stone-700',
        title ? 'mt-1' : 'mt-4'
      )}>
        {displayMessage}
      </p>
    </div>
  )
}

// ============================================
// SKELETON
// ============================================
interface SkeletonProps {
  className?: string
  circle?: boolean
  width?: string | number
  height?: string | number
}

export function Skeleton({ 
  className, 
  circle = false,
  width,
  height 
}: SkeletonProps) {
  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height
  
  return (
    <div
      className={cn(
        'animate-pulse bg-stone-200',
        circle ? 'rounded-full' : 'rounded-lg',
        className
      )}
      style={style}
    />
  )
}

// ============================================
// SKELETON CARD
// ============================================
interface SkeletonCardProps {
  rows?: number
  showHeader?: boolean
  showFooter?: boolean
  className?: string
}

export function SkeletonCard({ 
  rows = 3, 
  showHeader = true,
  showFooter = false,
  className 
}: SkeletonCardProps) {
  return (
    <Card className={cn('animate-pulse', className)}>
      {showHeader && (
        <div className="flex items-center gap-4 mb-4">
          <Skeleton circle width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height={20} />
            <Skeleton width="40%" height={16} />
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} height={i === 0 ? 20 : 16} />
        ))}
      </div>
      {showFooter && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-100">
          <Skeleton width={80} height={20} />
          <Skeleton width={100} height={36} className="rounded-lg" />
        </div>
      )}
    </Card>
  )
}

// ============================================
// SKELETON GRID
// ============================================
interface SkeletonGridProps {
  count?: number
  columns?: 1 | 2 | 3 | 4
  className?: string
}

export function SkeletonGrid({ 
  count = 4, 
  columns = 2,
  className 
}: SkeletonGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }
  
  return (
    <div className={cn(
      'grid gap-4',
      gridCols[columns],
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// ============================================
// SKELETON LIST
// ============================================
interface SkeletonListProps {
  count?: number
  className?: string
}

export function SkeletonList({ count = 5, className }: SkeletonListProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-stone-200 animate-pulse">
          <Skeleton circle width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton width="50%" height={18} />
            <Skeleton width="30%" height={14} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================
// ERROR STATE
// ============================================
interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  icon?: React.ReactNode
  className?: string
}

export function ErrorState({
  title,
  message,
  onRetry,
  icon,
  className
}: ErrorStateProps) {
  const { t } = useTranslation()
  const displayTitle = title ?? t('common.error')
  const displayMessage = message ?? t('errors.loadFailed')

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'text-center p-8',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      {icon ? (
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-red-600">{icon}</span>
        </div>
      ) : (
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <RefreshCw className="w-8 h-8 text-red-600" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-stone-800 mb-2">{displayTitle}</h3>
      <p className="text-stone-700 mb-6 max-w-sm">{displayMessage}</p>
      {onRetry && (
        <Button
          variant="secondary"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={onRetry}
        >
          {t('common.tryAgain')}
        </Button>
      )}
    </div>
  )
}

// ============================================
// PAGE LOADING (för hela sidor)
// ============================================
interface PageLoadingProps {
  title?: string
  message?: string
}

export function PageLoading({
  title,
  message
}: PageLoadingProps) {
  const { t } = useTranslation()

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingState
        title={title}
        message={message ?? t('common.loadingPage')}
        size="lg"
      />
    </div>
  )
}

// ============================================
// INLINE LOADING (för små operationer)
// ============================================
interface InlineLoadingProps {
  text?: string
  size?: 'sm' | 'md'
}

export function InlineLoading({
  text,
  size = 'sm'
}: InlineLoadingProps) {
  const { t } = useTranslation()
  const displayText = text ?? t('common.loading')

  return (
    <span
      className="inline-flex items-center gap-2 text-stone-700"
      role="status"
      aria-live="polite"
    >
      <Spinner size={size} />
      {displayText && <span className="text-sm">{displayText}</span>}
    </span>
  )
}

// ============================================
// CONTENT PLACEHOLDER (Facebook-style)
// ============================================
interface ContentPlaceholderProps {
  lines?: number
  className?: string
}

export function ContentPlaceholder({ 
  lines = 3,
  className 
}: ContentPlaceholderProps) {
  return (
    <div className={cn('space-y-3 animate-pulse', className)}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-stone-200 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-stone-200 rounded w-1/3" />
          <div className="h-3 bg-stone-200 rounded w-1/4" />
        </div>
      </div>
      <div className="space-y-2 pt-4">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i} 
            className="h-3 bg-stone-200 rounded"
            style={{ width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </div>
    </div>
  )
}

export default LoadingState
