/**
 * PageCard - Konsekvent kortdesign för sidor
 * Matchar widget-korten från översikten
 */
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface PageCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function PageCard({ children, className, hover = true }: PageCardProps) {
  return (
    <div 
      className={cn(
        "bg-white dark:bg-stone-900 rounded-xl border-2 border-slate-200 dark:border-stone-700 p-5 sm:p-6",
        hover && "hover:border-slate-300 dark:hover:border-stone-600 hover: hover:-translate-y-1",
        "transition-all duration-300",
        className
      )}
    >
      {children}
    </div>
  )
}

interface PageCardLinkProps extends PageCardProps {
  to: string
}

export function PageCardLink({ children, to, className }: PageCardLinkProps) {
  return (
    <Link 
      to={to}
      className={cn(
        "block bg-white dark:bg-stone-900 rounded-xl border-2 border-slate-200 dark:border-stone-700 p-5 sm:p-6",
        "hover:border-brand-300 dark:hover:border-brand-900 hover: hover:-translate-y-1",
        "transition-all duration-300",
        className
      )}
    >
      {children}
    </Link>
  )
}

interface PageCardGridProps {
  children: React.ReactNode
  className?: string
  cols?: 1 | 2 | 3 | 4
}

export function PageCardGrid({ children, className, cols = 3 }: PageCardGridProps) {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  }

  return (
    <div className={cn("grid gap-4", colsClass[cols], className)}>
      {children}
    </div>
  )
}

export default PageCard
