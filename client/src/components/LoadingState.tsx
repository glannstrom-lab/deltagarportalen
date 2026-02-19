import { Loader2, Sparkles } from 'lucide-react'

interface LoadingStateProps {
  message?: string
  submessage?: string
  size?: 'sm' | 'md' | 'lg'
  type?: 'spinner' | 'skeleton' | 'dots'
}

export default function LoadingState({ 
  message = 'Laddar...', 
  submessage,
  size = 'md',
  type = 'spinner'
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  if (type === 'skeleton') {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-3/4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
      </div>
    )
  }

  if (type === 'dots') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <div className={`${sizeClasses[size]} bg-teal-500 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
          <div className={`${sizeClasses[size]} bg-teal-500 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
          <div className={`${sizeClasses[size]} bg-teal-500 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
        </div>
        {message && (
          <p className={`mt-4 text-slate-600 ${textSizes[size]}`}>{message}</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      <div className="relative">
        <Loader2 className={`${sizeClasses[size]} text-teal-600 animate-spin`} />
        <Sparkles className={`absolute -top-1 -right-1 w-4 h-4 text-amber-400 animate-pulse`} />
      </div>
      {message && (
        <p className={`mt-4 text-slate-700 font-medium ${textSizes[size]}`}>
          {message}
        </p>
      )}
      {submessage && (
        <p className="mt-2 text-slate-500 text-sm max-w-md text-center">
          {submessage}
        </p>
      )}
    </div>
  )
}

// Skeleton card for lists
export function SkeletonCard() {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-slate-200 rounded-lg flex-shrink-0"></div>
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          <div className="flex gap-2 mt-2">
            <div className="h-6 bg-slate-200 rounded-full w-20"></div>
            <div className="h-6 bg-slate-200 rounded-full w-24"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Skeleton for statistics
export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
          <div className="h-8 bg-slate-200 rounded w-16"></div>
        </div>
      ))}
    </div>
  )
}

// Skeleton for table
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="h-10 bg-slate-200 rounded-lg"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" style={{ animationDelay: `${i * 100}ms` }}></div>
      ))}
    </div>
  )
}
