import { memo } from 'react'
import { Dumbbell, Trophy, Flame, CheckCircle2 } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'
import type { WidgetSize } from '../WidgetSizeSelector'

interface ExercisesWidgetProps {
  totalExercises?: number
  completedCount?: number
  completionRate?: number
  streakDays?: number
  lastCompleted?: { title: string; completedAt: string } | null
  recommendedExercise?: { title: string; duration: number; category: string } | null
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  size?: WidgetSize
}

// SMALL - Ultra kompakt
function ExercisesWidgetSmall({ 
  totalExercises = 38,
  completedCount = 0, 
  completionRate = 0,
  streakDays = 0,
  loading, 
  error, 
  onRetry 
}: Omit<ExercisesWidgetProps, 'size' | 'lastCompleted' | 'recommendedExercise'>) {
  const getStatus = (): WidgetStatus => {
    if (completedCount === 0) return 'empty'
    if (completionRate >= 100) return 'complete'
    return 'in-progress'
  }

  const status = getStatus()

  return (
    <DashboardWidget
      title="Övningar"
      icon={<Dumbbell size={14} />}
      to="/exercises"
      color="green"
      status={status}
      progress={completionRate}
      loading={loading}
      error={error}
      onRetry={onRetry}
    >
      <div className="flex items-center gap-2">
        <Trophy size={14} className="text-emerald-500" />
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold text-slate-800">{completedCount}</span>
          <span className="text-[10px] text-slate-500">/{totalExercises}</span>
        </div>
        {streakDays > 0 && (
          <span className="text-[9px] bg-orange-100 text-orange-600 px-1 py-0.5 rounded flex items-center gap-0.5">
            <Flame size={8} />
            {streakDays}
          </span>
        )}
      </div>
    </DashboardWidget>
  )
}

// MEDIUM - Balanserad överblick
function ExercisesWidgetMedium({ 
  totalExercises = 38,
  completedCount = 0, 
  completionRate = 0,
  streakDays = 0,
  lastCompleted, 
  recommendedExercise, 
  loading, 
  error, 
  onRetry 
}: ExercisesWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (completedCount === 0) return 'empty'
    if (completionRate >= 100) return 'complete'
    return 'in-progress'
  }

  const status = getStatus()
  const progress = completionRate

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Idag'
    if (diffDays === 1) return 'Igår'
    return `${diffDays}d`
  }

  return (
    <DashboardWidget
      title="Övningar"
      icon={<Dumbbell size={20} />}
      to="/exercises"
      color="green"
      status={status}
      progress={progress}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: completedCount > 0 ? 'Fortsätt' : 'Börja',
      }}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Trophy size={22} className="text-emerald-500" />
          <div>
            <p className="text-2xl font-bold text-slate-800">{completedCount}/{totalExercises}</p>
            <p className="text-xs text-slate-500">övningar gjorda</p>
          </div>
          {streakDays > 0 && (
            <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-lg">
              <Flame size={14} className="text-orange-500" />
              <span className="text-sm font-medium text-orange-700">{streakDays}</span>
            </div>
          )}
        </div>

        {lastCompleted && (
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-700 truncate">{lastCompleted.title}</p>
            </div>
            <span className="text-[10px] text-slate-400">{getTimeAgo(lastCompleted.completedAt)}</span>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// LARGE - Full översikt
function ExercisesWidgetLarge({ 
  totalExercises = 38,
  completedCount = 0, 
  completionRate = 0,
  streakDays = 0,
  lastCompleted, 
  recommendedExercise, 
  loading, 
  error, 
  onRetry 
}: ExercisesWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (completedCount === 0) return 'empty'
    if (completionRate >= 100) return 'complete'
    return 'in-progress'
  }

  const status = getStatus()
  const progress = completionRate

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Idag'
    if (diffDays === 1) return 'Igår'
    return `${diffDays} dagar sedan`
  }

  const weekDays = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']
  const weekData = [true, true, false, true, false, false, false]
  const today = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

  return (
    <DashboardWidget
      title="Övningar"
      icon={<Dumbbell size={22} />}
      to="/exercises"
      color="green"
      status={status}
      progress={progress}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: completedCount > 0 ? 'Fortsätt öva' : 'Börja',
      }}
    >
      <div className="space-y-4">
        {/* Stats header */}
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
            <Trophy size={24} className="text-emerald-500" />
            <div>
              <p className="text-2xl font-bold text-slate-800">{completedCount}/{totalExercises}</p>
              <p className="text-sm text-slate-500">övningar gjorda ({completionRate}%)</p>
            </div>
          </div>
          {streakDays > 0 ? (
            <div className="p-3 bg-orange-50 rounded-xl text-center min-w-[80px]">
              <Flame size={24} className="text-orange-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-orange-600">{streakDays}</p>
              <p className="text-xs text-orange-600/70">dagar</p>
            </div>
          ) : null}
        </div>

        {/* Week overview */}
        <div className="flex justify-between gap-1">
          {weekDays.map((day, index) => {
            const isToday = index === today
            const isCompleted = weekData[index]
            return (
              <div key={day} className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${
                  isCompleted 
                    ? 'bg-emerald-500 text-white' 
                    : isToday 
                      ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300' 
                      : 'bg-slate-100 text-slate-400'
                }`}>
                  {isCompleted ? <CheckCircle2 size={14} /> : day.charAt(0)}
                </div>
              </div>
            )
          })}
        </div>

        {lastCompleted && (
          <div className="p-3 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Senaste övningen</p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-800">{lastCompleted.title}</p>
              <span className="text-xs text-slate-400">{getTimeAgo(lastCompleted.completedAt)}</span>
            </div>
          </div>
        )}

        {completedCount === 0 && (
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="font-semibold text-emerald-900">Redo att öva?</p>
            <p className="text-sm text-emerald-600">Börja med en kort övning – det tar bara 5 minuter!</p>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// Huvudkomponent
export const ExercisesWidget = memo(function ExercisesWidget(props: ExercisesWidgetProps) {
  const { size = 'small', ...rest } = props

  switch (size) {
    case 'large':
      return <ExercisesWidgetLarge {...rest} />
    case 'medium':
      return <ExercisesWidgetMedium {...rest} />
    case 'small':
    default:
      return <ExercisesWidgetSmall {...rest} />
  }
})
