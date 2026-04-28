/**
 * Skeleton Loader Components
 * Används för att visa loading state med animation
 * Bättre UX än spinner eftersom det visar strukturen
 */

import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

/**
 * Bas Skeleton-komponent
 * Uses shimmer animation for a more polished look
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton-shimmer rounded',
        className
      )}
      {...props}
    />
  )
}

/**
 * Skeleton för kort/widget
 */
export function CardSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-stone-200 p-4', className)} {...props}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="w-24 h-4 mb-2" />
          <Skeleton className="w-16 h-3" />
        </div>
      </div>
      
      {/* Content */}
      <Skeleton className="w-full h-20 mb-4" />
      
      {/* Footer */}
      <Skeleton className="w-full h-8" />
    </div>
  )
}

/**
 * Skeleton för textinnehåll
 */
export function TextSkeleton({ lines = 3, className }: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )} 
        />
      ))}
    </div>
  )
}

/**
 * Skeleton för Dashboard widget
 */
export function DashboardWidgetSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-3 h-full min-h-[140px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-6 h-6 ml-auto" />
      </div>
      
      {/* Progress bar */}
      <Skeleton className="w-full h-1.5 rounded-full mb-2" />
      
      {/* Content */}
      <Skeleton className="w-full h-12 mb-2" />
      
      {/* Action button */}
      <Skeleton className="w-full h-7 rounded-lg" />
    </div>
  )
}

/**
 * Skeleton för Dashboard grid
 */
export function DashboardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <DashboardWidgetSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton för lista
 */
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-stone-200">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="w-32 h-4 mb-2" />
            <Skeleton className="w-24 h-3" />
          </div>
          <Skeleton className="w-6 h-6" />
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton för formulär
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton className="w-24 h-4 mb-2" />
          <Skeleton className="w-full h-10 rounded-lg" />
        </div>
      ))}
      <Skeleton className="w-full h-10 rounded-lg mt-4" />
    </div>
  )
}

/**
 * Skeleton för profilsida
 */
export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Avatar och namn */}
      <div className="flex items-center gap-4">
        <Skeleton className="w-20 h-20 rounded-full" />
        <div>
          <Skeleton className="w-32 h-6 mb-2" />
          <Skeleton className="w-48 h-4" />
        </div>
      </div>
      
      {/* Formulär */}
      <FormSkeleton fields={5} />
    </div>
  )
}

/**
 * Skeleton för CV-byggare
 */
export function CVBuilderSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Formulär-sida */}
      <div className="space-y-4">
        <Skeleton className="w-full h-12 rounded-lg" />
        <FormSkeleton fields={6} />
      </div>
      
      {/* Preview-sida */}
      <div>
        <Skeleton className="w-full h-[600px] rounded-xl" />
      </div>
    </div>
  )
}

/**
 * Skeleton för jobbsök
 */
export function JobSearchSkeleton() {
  return (
    <div className="space-y-4">
      {/* Sökfält */}
      <div className="flex gap-2">
        <Skeleton className="flex-1 h-10 rounded-lg" />
        <Skeleton className="w-24 h-10 rounded-lg" />
      </div>
      
      {/* Filter tags */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="w-20 h-8 rounded-full" />
        ))}
      </div>
      
      {/* Jobb-lista */}
      <ListSkeleton items={5} />
    </div>
  )
}

/**
 * Skeleton för artikel/kunskapsbank
 */
export function ArticleSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="w-full h-8 mb-4" />
        <Skeleton className="w-32 h-4" />
      </div>
      
      {/* Content */}
      <div className="space-y-4">
        <Skeleton className="w-full h-48 rounded-xl" />
        <TextSkeleton lines={10} />
      </div>
    </div>
  )
}

/**
 * Skeleton för tabell
 */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex gap-2 mb-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="flex-1 h-8" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-2 mb-2">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="flex-1 h-10" />
          ))}
        </div>
      ))}
    </div>
  )
}

export default Skeleton
