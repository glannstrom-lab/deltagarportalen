import { memo } from 'react'
import { Dumbbell, CheckCircle2, Clock, Trophy, Zap, Target, TrendingUp, Play } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'
import type { WidgetSize } from '../WidgetSizeSelector'

interface ExercisesWidgetProps {
  completedCount?: number
  streakDays?: number
  lastCompleted?: { title: string; completedAt: string } | null
  recommendedExercise?: { title: string; duration: number; category: string } | null
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  size?: WidgetSize
}

// SMALL - Enkelt räknare
function ExercisesWidgetSmall({ completedCount = 0, loading, error, onRetry }: Omit<ExercisesWidgetProps, 'size' | 'streakDays' | 'lastCompleted' | 'recommendedExercise'>) {
  const getStatus = (): WidgetStatus => {
    if (completedCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  return (
    <DashboardWidget
      title="Övningar"
      icon={<Dumbbell size={20} />}
      to="/exercises"
      color="green"
      status={status}
      progress={Math.min(100, (completedCount / 10) * 100)}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: completedCount > 0 ? 'Öva mer' : 'Börja öva',
      }}
    >
      <div className="flex flex-col items-center justify-center py-2 text-center">
        <Trophy size={28} className="text-emerald-500 mb-2" />
        <p className="text-3xl font-bold text-slate-800">{completedCount}</p>
        <p className="text-sm text-slate-500">
          {completedCount === 0 ? 'Inga övningar' : completedCount === 1 ? 'övning' : 'övningar'}
        </p>
      </div>
    </DashboardWidget>
  )
}

// MEDIUM - Senaste övning + rekommendation
function ExercisesWidgetMedium({ completedCount = 0, lastCompleted, recommendedExercise, loading, error, onRetry }: ExercisesWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (completedCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  // Formatera datum
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Idag'
    if (diffDays === 1) return 'Igår'
    return `${diffDays} dagar sedan`
  }

  return (
    <DashboardWidget
      title="Övningar"
      icon={<Dumbbell size={22} />}
      to="/exercises"
      color="green"
      status={status}
      progress={Math.min(100, (completedCount / 10) * 100)}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: 'Öva när du vill',
      }}
    >
      <div className="space-y-3">
        {/* Antal */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Trophy size={24} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{completedCount}</p>
            <p className="text-xs text-slate-500">genomförda</p>
          </div>
        </div>

        {/* Rekommenderad övning */}
        {recommendedExercise && (
          <div className="p-3 bg-emerald-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-emerald-500" />
              <span className="text-xs font-medium text-emerald-700">Rekommenderas:</span>
            </div>
            <p className="text-sm font-medium text-slate-800 mb-1">{recommendedExercise.title}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {recommendedExercise.duration} min
              </span>
              <span>•</span>
              <span>{recommendedExercise.category}</span>
            </div>
          </div>
        )}

        {/* Senaste övning */}
        {lastCompleted && (
          <div className="p-2 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span className="text-xs text-slate-400">Senaste: {getTimeAgo(lastCompleted.completedAt)}</span>
            </div>
            <p className="text-sm text-slate-700 mt-1">{lastCompleted.title}</p>
          </div>
        )}

        {/* Empty state */}
        {completedCount === 0 && (
          <div className="p-3 bg-emerald-50 rounded-lg">
            <p className="text-sm text-emerald-700">Öva inför intervjun</p>
            <p className="text-xs text-emerald-600 mt-1">Förbered dig för vanliga frågor</p>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// LARGE - Fullt övningscenter
function ExercisesWidgetLarge({ completedCount = 0, lastCompleted, recommendedExercise, loading, error, onRetry }: ExercisesWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (completedCount === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  // Formatera datum
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Idag'
    if (diffDays === 1) return 'Igår'
    return `${diffDays} dagar sedan`
  }

  return (
    <DashboardWidget
      title="Övningar"
      icon={<Dumbbell size={24} />}
      to="/exercises"
      color="green"
      status={status}
      progress={Math.min(100, (completedCount / 10) * 100)}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: 'Gör dagens övning',
      }}
      secondaryAction={completedCount > 0 ? {
        label: 'Se alla övningar',
        onClick: () => {},
      } : undefined}
    >
      <div className="space-y-4">
        {/* Header med stats */}
        <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl">
          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <Trophy size={28} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-3xl font-bold text-emerald-700">{completedCount}</p>
            <p className="text-sm text-emerald-600">genomförda övningar</p>
          </div>
        </div>

        {/* Rekommenderad övning - prominently */}
        {recommendedExercise && (
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Zap size={24} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-emerald-600">Dagens rekommendation</p>
                <p className="font-semibold text-slate-800">{recommendedExercise.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
              <span className="flex items-center gap-1">
                <Clock size={14} className="text-emerald-500" />
                {recommendedExercise.duration} minuter
              </span>
              <span className="flex items-center gap-1">
                <Target size={14} className="text-emerald-500" />
                {recommendedExercise.category}
              </span>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
              <Play size={14} />
              Starta övning
            </button>
          </div>
        )}

        {/* Grid: Senaste + Progress */}
        <div className="grid grid-cols-2 gap-4">
          {/* Senaste övning */}
          {lastCompleted && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-sm font-medium text-slate-700">Senaste övningen</span>
              </div>
              <p className="text-sm text-slate-800 font-medium mb-1">{lastCompleted.title}</p>
              <p className="text-xs text-slate-500">{getTimeAgo(lastCompleted.completedAt)}</p>
            </div>
          )}

          {/* Progress */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-emerald-500" />
              <span className="text-sm font-medium text-slate-700">Din progress</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (completedCount / 10) * 100)}%` }}
                />
              </div>
              <span className="text-sm font-medium text-slate-700">{Math.min(100, (completedCount / 10) * 100)}%</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Mål: 10 övningar</p>
          </div>
        </div>

        {/* Empty state */}
        {completedCount === 0 && !recommendedExercise && (
          <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Dumbbell size={32} className="text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-emerald-900 mb-2">Öva inför intervjun</p>
                <p className="text-sm text-emerald-700 mb-4">
                  Övningar hjälper dig att förbereda dig för intervjuer och utveckla 
                  dina jobbsökar-färdigheter. Börja med en kort övning idag!
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white rounded-xl text-center">
                    <Target size={20} className="text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-700">Intervjufrågor</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl text-center">
                    <Clock size={20} className="text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-700">5-10 minuter</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl text-center">
                    <Trophy size={20} className="text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-700">Bygg självförtroende</p>
                  </div>
                </div>
              </div>
            </div>
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
