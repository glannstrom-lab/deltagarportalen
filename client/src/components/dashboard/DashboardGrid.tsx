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
        'grid grid-cols-1 gap-4',
        // Tablet: 2 kolumner
        'sm:grid-cols-2',
        // Desktop: 3 kolumner
        'lg:grid-cols-3',
        // Large desktop: 3 kolumner (6 widgets = 2 rader)
        'xl:grid-cols-3',
        className
      )}
    >
      {children}
    </div>
  )
}
