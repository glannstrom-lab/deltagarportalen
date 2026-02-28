import { cn } from '@/lib/utils'
import type { WidgetSize } from './WidgetSizeSelector'

export type WidgetLayout = {
  id: string
  size: WidgetSize
}

interface DashboardGridProps {
  children: React.ReactNode
  className?: string
  widgetLayouts?: WidgetLayout[]
}

export function DashboardGrid({ children, className }: DashboardGridProps) {
  return (
    <div
      className={cn(
        // Mobile: 1 kolumn
        'grid grid-cols-1 gap-4',
        // Tablet: 2 kolumner  
        'md:grid-cols-2 md:gap-5',
        // Desktop: 4 kolumner för att stödja 1/4-storlek
        'lg:grid-cols-4 lg:gap-5',
        className
      )}
    >
      {children}
    </div>
  )
}

// Hjälpfunktion för att få grid-klass baserat på storlek
export function getWidgetGridClasses(size: WidgetSize): string {
  switch (size) {
    case 'large':
      // Stor: 1/1 (full bredd)
      return 'col-span-1 md:col-span-2 lg:col-span-4'
    case 'medium':
      // Medel: 1/2 (halv bredd)
      return 'col-span-1 md:col-span-2 lg:col-span-2'
    case 'small':
    default:
      // Liten: 1/4 (kvarts bredd) - standard
      return 'col-span-1 lg:col-span-1'
  }
}

// Wrapper-komponent för widgets med storlek
interface SizedWidgetWrapperProps {
  children: React.ReactNode
  size: WidgetSize
  className?: string
}

export function SizedWidgetWrapper({ children, size, className }: SizedWidgetWrapperProps) {
  return (
    <div className={cn(getWidgetGridClasses(size), className)}>
      {children}
    </div>
  )
}
