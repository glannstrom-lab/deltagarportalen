import { Link } from 'react-router-dom'
import { Dumbbell, Trophy, Flame, ChevronRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExercisesWidgetProps {
  totalExercises?: number
  completedCount?: number
  completionRate?: number
  streakDays?: number
  size?: 'small' | 'medium'
}

export function ExercisesWidget({
  totalExercises = 38,
  completedCount = 0,
  completionRate = 0,
  streakDays = 0,
  size = 'small'
}: ExercisesWidgetProps) {
  const isComplete = completionRate >= 100
  const hasStarted = completedCount > 0

  if (size === 'small') {
    return (
      <Link
        to="/exercises"
        className={cn(
          "group block bg-white p-4 rounded-2xl border-2 transition-all duration-200",
          "hover:border-emerald-300 hover:shadow-lg hover:-translate-y-0.5",
          "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
          isComplete ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center",
              isComplete ? "bg-emerald-100 text-emerald-600" : "bg-emerald-100 text-emerald-600"
            )}>
              <Dumbbell size={18} />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">Övningar</h3>
          </div>
          <ChevronRight
            size={16}
            className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className={cn(
            "text-2xl font-bold",
            isComplete ? "text-emerald-600" : "text-slate-800"
          )}>
            {completedCount}
          </span>
          <span className="text-sm text-slate-500">/ {totalExercises}</span>

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
            className="h-full rounded-full transition-all duration-500 bg-emerald-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </Link>
    )
  }

  // Medium size
  return (
    <Link
      to="/exercises"
      className={cn(
        "group block bg-white p-5 rounded-2xl border-2 transition-all duration-200",
        "hover:border-emerald-300 hover:shadow-xl hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
        isComplete ? "border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white" : "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shadow-sm",
            "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600"
          )}>
            <Dumbbell size={22} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Övningar</h3>
            <p className="text-xs text-slate-500">
              {isComplete ? 'Alla klara!' : hasStarted ? 'Fortsätt öva' : 'Börja din träning'}
            </p>
          </div>
        </div>
        <ChevronRight
          size={18}
          className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all mt-1"
        />
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600">Progress</span>
          <span className="text-lg font-bold text-emerald-600">{completionRate}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-400 to-teal-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-emerald-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-emerald-500" />
            <span className="text-lg font-bold text-slate-800">{completedCount}</span>
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

export default ExercisesWidget
