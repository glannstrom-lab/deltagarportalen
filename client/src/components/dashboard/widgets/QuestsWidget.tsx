import { Link } from 'react-router-dom'
import { Target, Flame, Zap, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuestsWidgetProps {
  completedQuests?: number
  totalQuests?: number
  streakDays?: number
  size?: 'small' | 'medium' | 'large'
}

export function QuestsWidget({ 
  completedQuests = 0, 
  totalQuests = 3,
  streakDays = 0,
  size = 'small'
}: QuestsWidgetProps) {
  
  const progress = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0
  const isComplete = completedQuests >= totalQuests
  
  if (size === 'small') {
    return (
      <Link 
        to="/activity" 
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
              <Target size={16} />
            </div>
            <h3 className="font-semibold text-slate-800">Quests</h3>
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
            {completedQuests}
          </span>
          <span className="text-sm text-slate-500">/ {totalQuests}</span>
          
          {streakDays > 0 && (
            <span className={cn(
              "ml-auto inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              "bg-amber-100 text-amber-800 border border-amber-200"
            )}>
              <Flame size={12} className="text-amber-600" />
              {streakDays}
            </span>
          )}
        </div>
        
        {/* Progress bar */}
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

  // Medium size
  return (
    <Link 
      to="/activity" 
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
          <Zap size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Dagens Quests</h3>
          <p className="text-sm text-slate-500">{completedQuests} av {totalQuests} avklarade</p>
        </div>
        <ChevronRight 
          size={20} 
          className="text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" 
        />
      </div>
      
      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isComplete ? "bg-emerald-500" : "bg-violet-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {streakDays > 0 && (
        <div className={cn(
          "flex items-center gap-2 text-sm font-medium",
          "text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200"
        )}>
          <Flame size={16} className="text-amber-600" />
          <span>{streakDays} dagar i rad!</span>
        </div>
      )}
    </Link>
  )
}

export default QuestsWidget
