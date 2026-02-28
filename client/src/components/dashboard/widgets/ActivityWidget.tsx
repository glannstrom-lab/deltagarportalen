import { memo } from 'react'
import { TrendingUp, Target, Flame } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'

interface ActivityWidgetProps {
  weeklyApplications: number
  streakDays: number
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export const ActivityWidget = memo(function ActivityWidget({
  weeklyApplications,
  streakDays,
  loading,
  error,
  onRetry,
}: ActivityWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (weeklyApplications === 0 && streakDays === 0) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  // Uppmuntrande meddelande baserat på aktivitet
  const getEncouragementMessage = () => {
    if (streakDays >= 7) return 'Fantastiskt! Du är igång! 🔥'
    if (streakDays >= 3) return 'Bra jobbat med att hålla igång!'
    if (weeklyApplications > 0) return 'Bra att du är aktiv!'
    return 'Ta den tid du behöver - portalen finns här när du vill.'
  }

  return (
    <DashboardWidget
      title="Din aktivitet"
      icon={<TrendingUp size={20} />}
      to="/calendar"
      color="rose"
      status={status}
      progress={Math.min(100, (weeklyApplications / 5) * 100)} // 5 ansökningar = 100%
      loading={loading}
      error={error}
      onRetry={onRetry}
      stats={[
        { 
          label: 'Denna veckan', 
          value: `${weeklyApplications} ansökningar` 
        },
        ...(streakDays > 0 ? [{ 
          label: 'Aktivitetsstreak', 
          value: `${streakDays} dagar`,
          trend: 'up' as const
        }] : []),
      ]}
      primaryAction={{
        label: 'Se aktivitet',
      }}
    >
      {/* Streak-indikator */}
      {streakDays > 0 && (
        <div className="mt-2 flex items-center gap-3 p-3 bg-gradient-to-r from-rose-50 to-orange-50 rounded-lg">
          <div className="flex items-center gap-1">
            <Flame size={20} className="text-orange-500" />
            <span className="text-2xl font-bold text-orange-600">{streakDays}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">
              {streakDays === 1 ? 'Dag' : 'Dagar'} i rad
            </p>
            <p className="text-xs text-slate-500">
              {streakDays >= 7 ? 'Imponerande!' : 'Fortsätt så!'}
            </p>
          </div>
        </div>
      )}
      
      {/* Uppmuntrande meddelande */}
      <div className="mt-3 flex items-start gap-2">
        <Target size={16} className="text-rose-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-slate-600">
          {getEncouragementMessage()}
        </p>
      </div>
      
      {/* Tips för tom state */}
      {weeklyApplications === 0 && streakDays === 0 && (
        <div className="mt-2 p-3 bg-rose-50 rounded-lg">
          <p className="text-sm text-rose-700">
            Det är okej att ha perioder med lägre aktivitet. 
            Det viktiga är att du kommer tillbaka när du känner dig redo.
          </p>
        </div>
      )}
    </DashboardWidget>
  )
})
