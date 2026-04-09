import { memo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Dumbbell, Trophy, Flame, ChevronRight, Play } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface ExercisesWidgetProps {
  totalExercises?: number
  completedCount?: number
  completionRate?: number
  streakDays?: number
  size?: 'mini' | 'medium' | 'large'
}

export const ExercisesWidget = memo(function ExercisesWidget({
  totalExercises = 38,
  completedCount = 0,
  completionRate = 0,
  streakDays = 0,
  size = 'medium'
}: ExercisesWidgetProps) {
  const { t } = useTranslation()
  // MINI
  if (size === 'mini') {
    return (
      <Link
        to="/exercises"
        className="group flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md transition-all duration-200"
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
          <Dumbbell size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('exercisesWidget.exercises')}</p>
          <p className="text-xs text-slate-700 dark:text-slate-600">{completedCount}/{totalExercises}</p>
        </div>
        {streakDays > 0 && (
          <div className="flex items-center gap-1 text-orange-500 dark:text-orange-400">
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
        className="group block bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Dumbbell size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{t('exercisesWidget.exercises')}</h3>
              <p className="text-xs text-slate-700 dark:text-slate-600">{t('exercisesWidget.trainSkills')}</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors" />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</span>
          <span className="text-sm text-slate-700 dark:text-slate-600">/ {totalExercises}</span>
          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
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
      className="group block bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Dumbbell size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('exercisesWidget.exercises')}</h3>
            <p className="text-sm text-slate-700 dark:text-slate-600">{t('exercisesWidget.trainToBetter')}</p>
          </div>
        </div>
        {streakDays > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/40 rounded-lg text-orange-600 dark:text-orange-400">
            <Flame size={16} />
            <span className="text-sm font-bold">{t('exercisesWidget.streakDays', { count: streakDays })}</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600 dark:text-slate-600">{t('exercisesWidget.yourProgress')}</span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{completionRate}%</span>
        </div>
        <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-emerald-500 dark:text-emerald-400" />
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{completedCount}</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-600">{t('exercisesWidget.completed')}</p>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Dumbbell size={16} className="text-slate-700 dark:text-slate-600" />
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{totalExercises - completedCount}</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-600">{t('exercisesWidget.remaining')}</p>
        </div>
      </div>

      {/* Action */}
      <div className="flex gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-medium group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/60 transition-colors">
          <Play size={12} />
          {completedCount > 0 ? t('exercisesWidget.continuePractice') : t('exercisesWidget.startPractice')}
        </span>
      </div>
    </Link>
  )
})

export default ExercisesWidget
