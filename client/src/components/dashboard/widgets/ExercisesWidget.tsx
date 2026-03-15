import { Link } from 'react-router-dom'
import { Dumbbell, Trophy, Flame, ChevronRight, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExercisesWidgetProps {
  totalExercises?: number
  completedCount?: number
  completionRate?: number
  streakDays?: number
  size?: 'mini' | 'medium' | 'large'
}

export function ExercisesWidget({
  totalExercises = 38,
  completedCount = 0,
  completionRate = 0,
  streakDays = 0,
  size = 'medium'
}: ExercisesWidgetProps) {
  // MINI
  if (size === 'mini') {
    return (
      <Link
        to="/exercises"
        className="group flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200"
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
          <Dumbbell size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">Övningar</p>
          <p className="text-xs text-slate-500">{completedCount}/{totalExercises}</p>
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
        to="/exercises"
        className="group block bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Dumbbell size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Övningar</h3>
              <p className="text-xs text-slate-500">Träna dina jobbfärdigheter</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-emerald-600">{completedCount}</span>
          <span className="text-sm text-slate-500">/ {totalExercises}</span>
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </Link>
    )
  }

  // LARGE
  return (
    <Link
      to="/exercises"
      className="group block bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600 flex items-center justify-center">
            <Dumbbell size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Övningar</h3>
            <p className="text-sm text-slate-500">Träna för att bli bättre</p>
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
          <span className="text-sm text-slate-600">Din progress</span>
          <span className="text-lg font-bold text-emerald-600">{completionRate}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-emerald-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-emerald-500" />
            <span className="text-lg font-bold text-slate-800">{completedCount}</span>
          </div>
          <p className="text-xs text-slate-500">Avklarade</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Dumbbell size={16} className="text-slate-500" />
            <span className="text-lg font-bold text-slate-800">{totalExercises - completedCount}</span>
          </div>
          <p className="text-xs text-slate-500">Kvar att göra</p>
        </div>
      </div>

      {/* Action */}
      <div className="flex gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium group-hover:bg-emerald-200 transition-colors">
          <Play size={12} />
          {completedCount > 0 ? 'Fortsätt öva' : 'Börja öva'}
        </span>
      </div>
    </Link>
  )
}

export default ExercisesWidget
