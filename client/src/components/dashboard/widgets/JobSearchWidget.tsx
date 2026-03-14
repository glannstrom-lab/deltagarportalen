import { Link } from 'react-router-dom'
import { Briefcase, Bookmark, ChevronRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JobSearchWidgetProps {
  savedCount?: number
  size?: 'small' | 'medium' | 'large'
}

export function JobSearchWidget({ 
  savedCount = 0,
  size = 'small'
}: JobSearchWidgetProps) {
  const hasJobs = savedCount > 0
  
  if (size === 'small') {
    return (
      <Link 
        to="/job-search" 
        className={cn(
          "group block bg-white p-4 rounded-xl border-2 transition-all duration-200",
          "hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          hasJobs ? "border-slate-200" : "border-blue-200 bg-blue-50/30"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              hasJobs ? "bg-blue-100 text-blue-700" : "bg-blue-200 text-blue-800"
            )}>
              {hasJobs ? <Bookmark size={16} /> : <Search size={16} />}
            </div>
            <h3 className="font-semibold text-slate-800">Jobb</h3>
          </div>
          <ChevronRight 
            size={16} 
            className="text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" 
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-slate-800">{savedCount}</span>
          <span className="text-sm text-slate-500">{savedCount === 1 ? 'sparad' : 'sparade'}</span>
        </div>
        
        {!hasJobs && (
          <p className="mt-2 text-xs text-blue-700">
            Hitta ditt nästa jobb
          </p>
        )}
      </Link>
    )
  }

  return (
    <Link 
      to="/job-search" 
      className={cn(
        "group block bg-white p-5 rounded-xl border-2 transition-all duration-200",
        "hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        hasJobs ? "border-slate-200" : "border-blue-200 bg-blue-50/30"
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          hasJobs ? "bg-blue-100 text-blue-700" : "bg-blue-200 text-blue-800"
        )}>
          {hasJobs ? <Briefcase size={24} /> : <Search size={24} />}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Sparade jobb</h3>
          <p className="text-sm text-slate-500">{savedCount} {savedCount === 1 ? 'jobb' : 'jobb'} i din lista</p>
        </div>
        <ChevronRight 
          size={20} 
          className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" 
        />
      </div>
      
      {savedCount === 0 ? (
        <p className="text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
          Börja spara jobb som intresserar dig
        </p>
      ) : (
        <p className="text-sm text-slate-600">
          Klicka för att se dina sparade jobb
        </p>
      )}
    </Link>
  )
}

export default JobSearchWidget
