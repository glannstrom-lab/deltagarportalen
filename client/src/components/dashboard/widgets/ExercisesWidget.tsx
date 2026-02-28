import { memo } from 'react'
import { Dumbbell, CheckCircle2, Clock, Trophy, Flame } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'

interface ExercisesWidgetProps {
  completedCount?: number
  streakDays?: number
  lastCompleted?: { title: string; completedAt: string } | null
  recommendedExercise?: { title: string; duration: number; category: string } | null
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export const ExercisesWidget = memo(function ExercisesWidget({
  completedCount = 0,
  streakDays = 0,
  lastCompleted,
  recommendedExercise,
  loading,
  error,
  onRetry,
}: ExercisesWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (completedCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  // Formatera datum
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Idag'
    if (diffDays === 1) return 'Igår'
    return `${diffDays} dagar sedan`
  }

  return (
    <DashboardWidget
      title="Övningar"
      icon={<Dumbbell size={20} />}
      to="/exercises"
      color="cyan"
      status={status}
      progress={Math.min(100, (completedCount / 10) * 100)}
      loading={loading}
      error={error}
      onRetry={onRetry}
      stats={[
        { label: 'Genomförda', value: completedCount },
        ...(streakDays > 0 ? [{ 
          label: 'Streak', 
          value: `${streakDays} dagar`,
          trend: 'up' as const
        }] : []),
      ]}
      primaryAction={{
        label: completedCount > 0 ? 'Fortsätt öva' : 'Börja öva',
      }}
    >
      {/* Visa streak om aktiv */}
      {streakDays > 0 && (
        <div className="mt-2 flex items-center gap-2 p-2 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
          <Flame size={16} className="text-orange-500" />
          <span className="text-sm font-medium text-slate-700">
            {streakDays} dagar i rad!
          </span>
        </div>
      )}
      
      {/* Visa senaste övning */}
      {lastCompleted && (
        <div className="mt-2">
          <p className="text-xs text-slate-500 mb-1">Senaste övning:</p>
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">
                {lastCompleted.title}
              </p>
              <p className="text-xs text-slate-500">
                {getTimeAgo(lastCompleted.completedAt)}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Visa rekommenderad övning */}
      {recommendedExercise && (
        <div className="mt-2">
          <p className="text-xs text-slate-500 mb-1">Rekommenderas för dig:</p>
          <div className="flex items-start gap-2 p-2 bg-cyan-50 rounded-lg">
            <Trophy size={14} className="text-cyan-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-700">
                {recommendedExercise.title}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Clock size={10} />
                {recommendedExercise.duration} min • {recommendedExercise.category}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Tom state */}
      {completedCount === 0 && (
        <div className="mt-2 p-3 bg-cyan-50 rounded-lg">
          <p className="text-sm text-cyan-700">
            Övningar hjälper dig att förbereda dig för intervjuer 
            och utveckla dina jobbsökar-färdigheter.
          </p>
        </div>
      )}
    </DashboardWidget>
  )
})
