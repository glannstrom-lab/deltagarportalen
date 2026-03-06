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
        // Mobile: 1 kolumn (alltid full bredd för bättre UX)
        'grid grid-cols-1 gap-2',
        // Tablet: 2 kolumner  
        'sm:grid-cols-2 sm:gap-3',
        // Desktop: 4 kolumner för att stödja 1/4-storlek
        'lg:grid-cols-4 lg:gap-4',
        className
      )}
    >
      {children}
    </div>
  )
}

// Hjälpfunktion för att få grid-klass baserat på storlek
// UPPDATERAD: Alltid fullbredd på mobil för bättre UX
export function getWidgetGridClasses(size: WidgetSize): string {
  switch (size) {
    case 'large':
      // Stor: alltid full bredd på alla skärmar
      return 'col-span-1 sm:col-span-2 lg:col-span-4'
    case 'medium':
      // Medel: fullbredd mobil, halv bredd tablet+
      return 'col-span-1 sm:col-span-2 lg:col-span-2'
    case 'small':
    default:
      // Liten: alltid fullbredd på mobil för bättre läsbarhet
      // Först på lg (desktop) går de till 1/4 bredd
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
