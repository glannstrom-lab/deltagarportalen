import { Link } from 'react-router-dom'
import { Target, Flame, Zap, ChevronRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuestsWidgetProps {
  completedQuests?: number
  totalQuests?: number
  streakDays?: number
  size?: 'small' | 'medium'
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
          "group block bg-white p-4 rounded-2xl border-2 transition-all duration-200",
          "hover:border-amber-300 hover:shadow-lg hover:-translate-y-0.5",
          "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2",
          isComplete ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center",
              isComplete ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
            )}>
              {isComplete ? <Zap size={18} /> : <Target size={18} />}
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">Quests</h3>
          </div>
          <ChevronRight
            size={16}
            className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className={cn(
            "text-2xl font-bold",
            isComplete ? "text-emerald-600" : "text-slate-800"
          )}>
            {completedQuests}
          </span>
          <span className="text-sm text-slate-500">/ {totalQuests}</span>

          {streakDays > 0 && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
              <Flame size={12} />
              {streakDays}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isComplete ? "bg-emerald-500" : "bg-amber-500"
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
        "group block bg-white p-5 rounded-2xl border-2 transition-all duration-200",
        "hover:border-amber-300 hover:shadow-xl hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2",
        isComplete ? "border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white" : "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shadow-sm",
            isComplete
              ? "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600"
              : "bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600"
          )}>
            {isComplete ? <Zap size={22} /> : <Target size={22} />}
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Dagens Quests</h3>
            <p className="text-xs text-slate-500">
              {isComplete ? 'Alla klara!' : `${totalQuests - completedQuests} kvar`}
            </p>
          </div>
        </div>
        <ChevronRight
          size={18}
          className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all mt-1"
        />
      </div>

      {/* Progress visualization */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600">Progress</span>
          <span className={cn(
            "text-lg font-bold",
            isComplete ? "text-emerald-600" : "text-amber-600"
          )}>
            {completedQuests}/{totalQuests}
          </span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isComplete
                ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                : "bg-gradient-to-r from-amber-400 to-orange-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className={cn(
          "p-3 rounded-xl",
          isComplete ? "bg-emerald-50" : "bg-amber-50"
        )}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className={isComplete ? "text-emerald-500" : "text-amber-500"} />
            <span className="text-lg font-bold text-slate-800">{completedQuests}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Avklarade</p>
        </div>
        <div className="p-3 bg-orange-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-orange-500" />
            <span className="text-lg font-bold text-slate-800">{streakDays}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Dagars streak</p>
        </div>
      </div>
    </Link>
  )
}

export default QuestsWidget
