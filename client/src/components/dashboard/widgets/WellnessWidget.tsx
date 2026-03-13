import { memo } from 'react'
import { Sparkles, Sun, Moon, Brain, Heart, Activity } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'
import type { WidgetSize } from '../WidgetSizeSelector'

interface WellnessWidgetProps {
  completedActivities?: number
  streakDays?: number
  moodToday?: 1 | 2 | 3 | 4 | 5 | null
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  size?: WidgetSize
}

const moodEmojis: Record<number, string> = {
  1: '😢',
  2: '😔',
  3: '😐',
  4: '🙂',
  5: '😄',
}

const moodLabels: Record<number, string> = {
  1: 'Svår dag',
  2: 'Nere',
  3: 'Okej',
  4: 'Bra',
  5: 'Jättebra!',
}

// SMALL - Ultra kompakt
function WellnessWidgetSmall({ 
  completedActivities = 0, 
  streakDays = 0,
  moodToday = null,
  loading, 
  error, 
  onRetry 
}: Omit<WellnessWidgetProps, 'size'>) {
  const getStatus = (): WidgetStatus => {
    if (completedActivities === 0 && !moodToday) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  return (
    <DashboardWidget
      title="Hälsa"
      icon={<Sparkles size={14} />}
      to="/wellness"
      color="green"
      status={status}
      progress={completedActivities > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
    >
      <div className="flex items-center gap-2">
        {moodToday ? (
          <>
            <span className="text-base">{moodEmojis[moodToday]}</span>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-slate-500">{moodLabels[moodToday]}</span>
              {streakDays > 0 && (
                <span className="text-[9px] text-emerald-600 ml-2">{streakDays} dagar</span>
              )}
            </div>
          </>
        ) : (
          <>
            <Sparkles size={14} className="text-emerald-500" />
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-slate-800">{completedActivities}</span>
              <span className="text-[10px] text-slate-500">
                {completedActivities === 1 ? 'aktivitet' : 'aktiviteter'}
              </span>
            </div>
          </>
        )}
      </div>
    </DashboardWidget>
  )
}

// MEDIUM - Balanserad överblick
function WellnessWidgetMedium({ 
  completedActivities = 0, 
  streakDays = 0,
  moodToday = null,
  loading, 
  error, 
  onRetry 
}: WellnessWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (completedActivities === 0 && !moodToday) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  return (
    <DashboardWidget
      title="Hälsa & välmående"
      icon={<Sparkles size={20} />}
      to="/wellness"
      color="green"
      status={status}
      progress={completedActivities > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: 'Öppna',
      }}
    >
      <div className="space-y-3">
        {/* Mood check */}
        {moodToday ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-2xl">{moodEmojis[moodToday]}</span>
            </div>
            <div>
              <p className="font-medium text-slate-800">{moodLabels[moodToday]}</p>
              <p className="text-xs text-slate-500">Dagens mående</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <Heart size={20} className="text-emerald-500" />
            <div>
              <p className="font-medium text-slate-800">Hur mår du idag?</p>
              <p className="text-xs text-slate-500">Registrera ditt mående</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-emerald-500" />
            <span className="text-sm text-slate-600">{completedActivities} aktiviteter</span>
          </div>
          {streakDays > 0 && (
            <div className="flex items-center gap-1 text-amber-600">
              <Sun size={14} />
              <span className="text-sm font-medium">{streakDays} dagar</span>
            </div>
          )}
        </div>
      </div>
    </DashboardWidget>
  )
}

// LARGE - Full översikt
function WellnessWidgetLarge({ 
  completedActivities = 0, 
  streakDays = 0,
  moodToday = null,
  loading, 
  error, 
  onRetry 
}: WellnessWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (completedActivities === 0 && !moodToday) return 'empty'
    return 'complete'
  }

  const status = getStatus()

  const wellnessActivities = [
    { id: '1', title: 'Mindfulness', completed: false, icon: Brain },
    { id: '2', title: 'Rörelse', completed: false, icon: Activity },
    { id: '3', title: 'Sömn', completed: false, icon: Moon },
  ]

  return (
    <DashboardWidget
      title="Hälsa & välmående"
      icon={<Sparkles size={22} />}
      to="/wellness"
      color="green"
      status={status}
      progress={completedActivities > 0 ? 100 : 0}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: 'Öppna hälsa',
      }}
    >
      <div className="space-y-4">
        {/* Mood card */}
        {moodToday ? (
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-3xl">{moodEmojis[moodToday]}</span>
            </div>
            <div>
              <p className="font-semibold text-slate-800">{moodLabels[moodToday]}</p>
              <p className="text-sm text-slate-500">Dagens mående</p>
              {streakDays > 0 && (
                <p className="text-xs text-emerald-600 mt-1">🔥 {streakDays} dagar i rad</p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-xl border border-emerald-200">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Heart size={28} className="text-emerald-500" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900">Hur mår du idag?</p>
                <p className="text-sm text-emerald-700 mt-1">
                  Registrera ditt mående och få personliga tips för ditt välmående.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Activity suggestions */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Förslag för idag:</p>
          <div className="grid grid-cols-3 gap-2">
            {wellnessActivities.map((activity) => (
              <div 
                key={activity.id}
                className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                <activity.icon size={20} className="text-emerald-500" />
                <span className="text-xs font-medium text-slate-600">{activity.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-emerald-500" />
            <span className="text-sm text-slate-600">{completedActivities} aktiviteter gjorda</span>
          </div>
          {streakDays > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 rounded-full">
              <Sun size={14} className="text-amber-600" />
              <span className="text-sm font-medium text-amber-700">{streakDays} dagar</span>
            </div>
          )}
        </div>
      </div>
    </DashboardWidget>
  )
}

// Main component
export const WellnessWidget = memo(function WellnessWidget(props: WellnessWidgetProps) {
  const { size = 'small', ...rest } = props

  switch (size) {
    case 'large':
      return <WellnessWidgetLarge {...rest} />
    case 'medium':
      return <WellnessWidgetMedium {...rest} />
    case 'small':
    default:
      return <WellnessWidgetSmall {...rest} />
  }
})
