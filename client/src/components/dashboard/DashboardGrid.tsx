import { cn } from '@/lib/utils'

interface DashboardGridProps {
  children: React.ReactNode
  className?: string
}

export function DashboardGrid({ children, className }: DashboardGridProps) {
  return (
    <div
      className={cn(
        // Mobile: 1 kolumn
        'grid grid-cols-1 gap-5',
        // Tablet och uppåt: 2 kolumner
        'md:grid-cols-2',
        // Större gap på större skärmar
        'lg:gap-6',
        className
      )}
    >
      {children}
    </div>
  )
}
