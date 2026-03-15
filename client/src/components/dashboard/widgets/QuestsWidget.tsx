import { Link } from 'react-router-dom'
import { Target, Flame, Zap, ChevronRight, CheckCircle2, Circle, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuestsWidgetProps {
  completedQuests?: number
  totalQuests?: number
  streakDays?: number
  size?: 'mini' | 'medium' | 'large'
}

export function QuestsWidget({
  completedQuests = 0,
  totalQuests = 3,
  streakDays = 0,
  size = 'medium'
}: QuestsWidgetProps) {
  const progress = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0
  const isComplete = completedQuests >= totalQuests

  // MINI
  if (size === 'mini') {
    return (
      <Link
        to="/activity"
        className={cn(
          "group flex items-center gap-3 bg-white p-3 rounded-xl border transition-all duration-200",
          "hover:border-amber-300 hover:shadow-md",
          isComplete ? "border-emerald-200" : "border-slate-200"
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          isComplete ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
        )}>
          {isComplete ? <Zap size={16} /> : <Target size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">Quests</p>
          <p className={cn("text-xs", isComplete ? "text-emerald-600" : "text-slate-500")}>
            {completedQuests}/{totalQuests}
          </p>
        </div>
        {streakDays > 0 && (
          <div className="flex items-center gap-1 text-orange-500">
            <Flame size={12} />
            <span className="text-xs font-medium">{streakDays}</span>
          </div>
        )}
      </Link>
    )
  }

  // MEDIUM
  if (size === 'medium') {
    return (
      <Link
        to="/activity"
        className={cn(
          "group block bg-white p-4 rounded-xl border transition-all duration-200",
          "hover:border-amber-300 hover:shadow-lg hover:-translate-y-0.5",
          isComplete ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              isComplete ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
            )}>
              {isComplete ? <Zap size={18} /> : <Target size={18} />}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Dagens Quests</h3>
              <p className="text-xs text-slate-500">
                {isComplete ? 'Alla klara!' : `${totalQuests - completedQuests} kvar`}
              </p>
            </div>
          </div>
          {streakDays > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full text-orange-600">
              <Flame size={12} />
              <span className="text-xs font-bold">{streakDays}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className={cn(
            "text-2xl font-bold",
            isComplete ? "text-emerald-600" : "text-amber-600"
          )}>
            {completedQuests}/{totalQuests}
          </span>
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isComplete ? "bg-emerald-500" : "bg-amber-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Link>
    )
  }

  // LARGE
  const sampleQuests = [
    { id: 1, title: 'Läs en artikel', completed: completedQuests >= 1 },
    { id: 2, title: 'Uppdatera ditt CV', completed: completedQuests >= 2 },
    { id: 3, title: 'Sök ett jobb', completed: completedQuests >= 3 },
  ]

  return (
    <Link
      to="/activity"
      className={cn(
        "group block bg-white p-5 rounded-xl border transition-all duration-200",
        "hover:border-amber-300 hover:shadow-lg",
        isComplete ? "border-emerald-200" : "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            isComplete
              ? "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600"
              : "bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600"
          )}>
            {isComplete ? <Zap size={24} /> : <Target size={24} />}
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Dagens Quests</h3>
            <p className="text-sm text-slate-500">
              {isComplete ? 'Du har klarat allt!' : 'Slutför uppgifterna'}
            </p>
          </div>
        </div>
        {streakDays > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 rounded-lg text-orange-600">
            <Flame size={16} />
            <span className="text-sm font-bold">{streakDays} dagar</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">Progress</span>
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

      {/* Quest List */}
      <div className="space-y-2 mb-4">
        {sampleQuests.map(quest => (
          <div
            key={quest.id}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg",
              quest.completed ? "bg-emerald-50" : "bg-slate-50"
            )}
          >
            {quest.completed ? (
              <CheckCircle2 size={16} className="text-emerald-500" />
            ) : (
              <Circle size={16} className="text-slate-300" />
            )}
            <span className={cn(
              "text-sm",
              quest.completed ? "text-emerald-700 line-through" : "text-slate-600"
            )}>
              {quest.title}
            </span>
          </div>
        ))}
      </div>

      {/* Action */}
      <div className="flex gap-2">
        <span className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
          isComplete
            ? "bg-emerald-100 text-emerald-700"
            : "bg-amber-100 text-amber-700 group-hover:bg-amber-200"
        )}>
          {isComplete ? <CheckCircle2 size={12} /> : <Play size={12} />}
          {isComplete ? 'Visa alla' : 'Fortsätt'}
        </span>
      </div>
    </Link>
  )
}

export default QuestsWidget
