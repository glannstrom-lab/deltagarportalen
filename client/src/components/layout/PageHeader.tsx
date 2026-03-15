/**
 * PageHeader - Konsekvent sidhuvud för alla sidor
 * Matchar designen från översikten
 */
import { Link } from 'react-router-dom'
import { ChevronRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  showInsightsLink?: boolean
  children?: React.ReactNode
}

export function PageHeader({ 
  title, 
  subtitle, 
  showInsightsLink = false,
  children 
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-base text-slate-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {children}
        
        {showInsightsLink && (
          <Link 
            to="/insights" 
            className={cn(
              "inline-flex items-center justify-center gap-2 px-5 py-2.5",
              "bg-violet-100 text-violet-700 rounded-xl",
              "text-sm font-semibold",
              "hover:bg-violet-200 hover:shadow-lg hover:-translate-y-0.5",
              "transition-all duration-200"
            )}
          >
            <Sparkles size={18} />
            <span className="hidden sm:inline">Mina insikter</span>
            <span className="sm:hidden">Insikter</span>
            <ChevronRight size={18} className="hidden sm:block" />
          </Link>
        )}
      </div>
    </div>
  )
}

export default PageHeader
