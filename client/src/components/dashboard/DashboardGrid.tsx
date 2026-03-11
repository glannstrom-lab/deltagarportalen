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
        // Prevent horizontal overflow
        'w-full overflow-x-hidden',
        // Mobile: 1 kolumn (alltid full bredd för bättre UX)
        'grid grid-cols-1 gap-4',
        // Tablet: 2 kolumner  
        'sm:grid-cols-2 sm:gap-5',
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
// UPPDATERAD: Alltid fullbredd på mobil (<768px) för bättre UX
export function getWidgetGridClasses(size: WidgetSize): string {
  // På mobil (grid-cols-1) är allt col-span-1 automatiskt
  // Men vi lägger till !important för att vara säkra
  switch (size) {
    case 'large':
      // Stor: fullbredd på mobil, 2 cols på tablet, 4 cols på desktop
      return 'col-span-1 sm:col-span-2 lg:col-span-4'
    case 'medium':
      // Medel: fullbredd mobil, halv bredd tablet+, men max 2 cols
      return 'col-span-1 sm:col-span-2 lg:col-span-2'
    case 'small':
    default:
      // Liten: fullbredd på mobil och tablet, 1/4 på desktop
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
