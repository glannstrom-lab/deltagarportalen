import { Link } from 'react-router-dom'
import { FileText, ChevronRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CVWidgetProps {
  hasCV?: boolean
  progress?: number
  size?: 'small' | 'medium' | 'large'
}

export function CVWidget({ 
  hasCV = false, 
  progress = 0,
  size = 'small'
}: CVWidgetProps) {
  const isComplete = progress >= 100
  
  if (size === 'small') {
    return (
      <Link 
        to="/cv" 
        className={cn(
          "group block bg-white p-4 rounded-xl border-2 transition-all duration-200",
          "hover:border-violet-300 hover:shadow-lg hover:-translate-y-0.5",
          "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
          isComplete ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
              isComplete ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"
            )}>
              {isComplete ? <CheckCircle2 size={16} /> : <FileText size={16} />}
            </div>
            <h3 className="font-semibold text-slate-800">CV</h3>
          </div>
          <ChevronRight 
            size={16} 
            className="text-slate-400 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" 
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-2xl font-bold",
            isComplete ? "text-emerald-700" : "text-slate-800"
          )}>
            {progress}%
          </span>
          {!hasCV && (
            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              Skapa CV
            </span>
          )}
          {isComplete && (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Komplett
            </span>
          )}
        </div>
        
        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isComplete ? "bg-emerald-500" : "bg-violet-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </Link>
    )
  }

  return (
    <Link 
      to="/cv" 
      className={cn(
        "group block bg-white p-5 rounded-xl border-2 transition-all duration-200",
        "hover:border-violet-300 hover:shadow-lg hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
        isComplete ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
          isComplete ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"
        )}>
          {isComplete ? <CheckCircle2 size={24} /> : <FileText size={24} />}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Ditt CV</h3>
          <p className="text-sm text-slate-500">{progress}% komplett</p>
        </div>
        <ChevronRight 
          size={20} 
          className="text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" 
        />
      </div>
      
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isComplete ? "bg-emerald-500" : "bg-gradient-to-r from-violet-500 to-purple-500"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {!hasCV && (
        <p className="mt-4 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
          Kom igång genom att skapa ditt CV
        </p>
      )}
    </Link>
  )
}

export default CVWidget
