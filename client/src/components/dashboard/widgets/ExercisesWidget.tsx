import { memo } from 'react'
import { Dumbbell, CheckCircle2, Clock, Trophy, Flame, Zap, Target, TrendingUp } from 'lucide-react'
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
      icon={<Dumbbell size={22} />}
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
      <div className="mt-3 space-y-3">
        {/* Stort nummer med streak */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-cyan-100 rounded-2xl flex items-center justify-center">
            <Trophy size={28} className="text-cyan-600" />
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-800">{completedCount}</p>
            <p className="text-sm text-slate-500">
              {completedCount === 0 ? 'Inga övningar gjorda' : completedCount === 1 ? 'övning gjord' : 'övningar gjorda'}
            </p>
          </div>
        </div>
        
        {/* Streak-indikator */}
        {streakDays > 0 && (
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-100">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Flame size={20} className="text-orange-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-orange-700">{streakDays} dagar</p>
              <p className="text-sm text-orange-600">i rad - fortsätt så!</p>
            </div>
          </div>
        )}
        
        {/* Visa senaste övning */}
        {lastCompleted && (
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span className="text-xs text-slate-500">Senaste övningen:</span>
            </div>
            <p className="text-sm font-medium text-slate-700">{lastCompleted.title}</p>
            <p className="text-xs text-slate-500 mt-1">{getTimeAgo(lastCompleted.completedAt)}</p>
          </div>
        )}
        
        {/* Visa rekommenderad övning */}
        {recommendedExercise && (
          <div className="p-3 bg-cyan-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-cyan-500" />
              <span className="text-xs text-slate-500">Rekommenderas för dig:</span>
            </div>
            <p className="text-sm font-medium text-slate-700">{recommendedExercise.title}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {recommendedExercise.duration} min
              </span>
              <span>•</span>
              <span>{recommendedExercise.category}</span>
            </div>
          </div>
        )}
        
        {/* Tom state */}
        {completedCount === 0 && (
          <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-100">
            <div className="flex items-start gap-3">
              <Target size={20} className="text-cyan-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-cyan-900">Öva inför intervjun</p>
                <p className="text-xs text-cyan-700 mt-1">
                  Övningar hjälper dig att förbereda dig för intervjuer 
                  och utveckla dina jobbsökar-färdigheter.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Motivation för aktiva användare */}
        {completedCount > 0 && !streakDays && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <TrendingUp size={14} className="text-emerald-500" />
            <span>Fortsätt öva för att bygga en streak!</span>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
})
