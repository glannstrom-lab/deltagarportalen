import { useTranslation } from 'react-i18next'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingState({ message, size = 'md' }: LoadingStateProps) {
  const { t } = useTranslation()
  const displayMessage = message || t('common.loading')
  const sizeClasses = {
    sm: 'h-32',
    md: 'h-64',
    lg: 'h-96'
  }

  const spinnerSizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${sizeClasses[size]}`}>
      {/* Branded spinner with violet accent */}
      <div className="relative mb-4">
        <div className={`${spinnerSizes[size]} rounded-full border-4 border-stone-200 dark:border-stone-700`} />
        <div
          className={`absolute inset-0 ${spinnerSizes[size]} rounded-full border-4 border-transparent border-t-violet-600 dark:border-t-violet-400 animate-spin`}
        />
      </div>
      <p className="text-stone-500 dark:text-stone-600 text-sm font-medium">{displayMessage}</p>
    </div>
  )
}

// Skeleton loader for content areas
export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-stone-200 dark:bg-stone-700 rounded-lg ${className}`} />
  )
}

// Card skeleton for dashboard widgets
export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonLoader className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader className="h-4 w-24" />
          <SkeletonLoader className="h-3 w-16" />
        </div>
      </div>
      <SkeletonLoader className="h-8 w-full" />
    </div>
  )
}
