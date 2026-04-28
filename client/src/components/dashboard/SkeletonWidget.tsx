import { cn } from '@/lib/utils'

interface SkeletonWidgetProps {
  variant?: 'stat' | 'widget' | 'card' | 'list'
  count?: number
  className?: string
}

export function SkeletonWidget({ 
  variant = 'widget', 
  count = 1,
  className 
}: SkeletonWidgetProps) {
  
  const renderSkeleton = () => {
    switch (variant) {
      case 'stat':
        return (
          <div className="bg-white p-4 rounded-xl border border-stone-200 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-stone-200 rounded-lg" />
              <div className="h-4 bg-stone-200 rounded w-20" />
            </div>
            <div className="h-8 bg-stone-200 rounded w-16 mb-1" />
            <div className="h-3 bg-stone-200 rounded w-24" />
          </div>
        )
        
      case 'widget':
        return (
          <div className="bg-white p-4 rounded-xl border border-stone-200 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-stone-200 rounded-lg" />
                <div className="h-4 bg-stone-200 rounded w-16" />
              </div>
              <div className="w-4 h-4 bg-stone-200 rounded" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 bg-stone-200 rounded w-12" />
              <div className="h-4 bg-stone-200 rounded w-16" />
            </div>
            <div className="h-1.5 bg-stone-200 rounded-full" />
          </div>
        )
        
      case 'card':
        return (
          <div className="bg-white p-5 rounded-xl border border-stone-200 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-stone-200 rounded-xl" />
              <div className="flex-1">
                <div className="h-5 bg-stone-200 rounded w-32 mb-2" />
                <div className="h-3 bg-stone-200 rounded w-24" />
              </div>
            </div>
            <div className="h-2 bg-stone-200 rounded-full mb-4" />
            <div className="h-8 bg-stone-200 rounded-lg" />
          </div>
        )
        
      case 'list':
        return (
          <div className="bg-white p-4 rounded-xl border border-stone-200 animate-pulse space-y-3">
            <div className="h-4 bg-stone-200 rounded w-1/3" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-stone-200 rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-stone-200 rounded w-3/4 mb-1" />
                  <div className="h-3 bg-stone-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )
        
      default:
        return null
    }
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={className}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  )
}

// Specialized skeleton layouts for different dashboard sections
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <SkeletonWidget variant="stat" count={count} />
    </div>
  )
}

export function SkeletonWidgets({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SkeletonWidget variant="widget" count={count} />
    </div>
  )
}

export function SkeletonNextStep() {
  return (
    <div className="bg-white p-5 rounded-xl border border-stone-200 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-stone-200 rounded-lg" />
          <div className="h-4 bg-stone-200 rounded w-32" />
        </div>
        <div className="w-8 h-8 bg-stone-200 rounded-lg" />
      </div>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-stone-200 rounded-xl flex-shrink-0" />
        <div className="flex-1">
          <div className="h-6 bg-stone-200 rounded w-48 mb-2" />
          <div className="h-4 bg-stone-200 rounded w-full mb-2" />
          <div className="h-4 bg-stone-200 rounded w-3/4 mb-4" />
          <div className="flex items-center gap-3">
            <div className="h-8 bg-stone-200 rounded-lg w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonHeader() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-stone-200 rounded w-48 mb-2" />
      <div className="h-4 bg-stone-200 rounded w-64" />
    </div>
  )
}

export default SkeletonWidget
