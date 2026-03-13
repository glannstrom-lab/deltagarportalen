/**
 * QuestsWidget - Dashboard widget for daily quests
 */
import { memo } from 'react'
import { Zap, CheckCircle2, Circle, Target, Trophy } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
import type { WidgetStatus } from '@/types/dashboard'
import type { WidgetSize } from '../WidgetSizeSelector'

interface Quest {
  id: string
  title: string
  completed: boolean
  points: number
  category: string
}

interface QuestsWidgetProps {
  completedQuests?: number
  totalQuests?: number
  quests?: Quest[]
  streakDays?: number
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  size?: WidgetSize
}

const categoryIcons: Record<string, string> = {
  cv: '📝',
  apply: '📤',
  network: '🤝',
  wellness: '✨',
  general: '⭐',
}

// SMALL - Compact view
function QuestsWidgetSmall({ 
  completedQuests = 0, 
  totalQuests = 3,
  streakDays = 0,
  loading, 
  error, 
  onRetry 
}: Omit<QuestsWidgetProps, 'size' | 'quests'>) {
  const getStatus = (): WidgetStatus => {
    if (completedQuests === 0) return 'empty'
    if (completedQuests === totalQuests) return 'complete'
    return 'progress'
  }

  const status = getStatus()
  const progress = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0

  return (
    <DashboardWidget
      title="Quests"
      icon={<Zap size={14} />}
      to="/quests"
      color="yellow"
      status={status}
      progress={progress}
      loading={loading}
      error={error}
      onRetry={onRetry}
    >
      <div className="flex items-center gap-2">
        <Zap size={14} className="text-yellow-500" />
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold text-slate-800">{completedQuests}</span>
          <span className="text-[10px] text-slate-500">/ {totalQuests}</span>
        </div>
        {streakDays > 0 && (
          <span className="text-[9px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">
            🔥 {streakDays}
          </span>
        )}
      </div>
    </DashboardWidget>
  )
}

// MEDIUM - Balanced overview
function QuestsWidgetMedium({ 
  completedQuests = 0, 
  totalQuests = 3,
  quests,
  streakDays = 0,
  loading, 
  error, 
  onRetry 
}: QuestsWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (completedQuests === 0) return 'empty'
    if (completedQuests === totalQuests) return 'complete'
    return 'progress'
  }

  const status = getStatus()
  const progress = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0

  // Safe fallback for quests
  const safeQuests = quests || []
  const defaultQuests: Quest[] = [
    { id: '1', title: 'Uppdatera CV', completed: false, points: 10, category: 'cv' },
    { id: '2', title: 'Skicka 1 ansökan', completed: false, points: 20, category: 'apply' },
    { id: '3', title: 'Registrera mående', completed: false, points: 10, category: 'wellness' },
  ]
  const displayQuests = safeQuests.length > 0 ? safeQuests : defaultQuests

  return (
    <DashboardWidget
      title="Dagens Quests"
      icon={<Target size={22} />}
      to="/quests"
      color="yellow"
      status={status}
      progress={progress}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: completedQuests === totalQuests ? 'Alla klara!' : 'Fortsätt',
      }}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Trophy size={24} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{completedQuests}/{totalQuests}</p>
              <p className="text-xs text-slate-500">quest avklarade</p>
            </div>
          </div>
          {streakDays > 0 && (
            <div className="text-right">
              <p className="text-lg font-semibold text-amber-600">{streakDays}</p>
              <p className="text-xs text-slate-500">dagar i rad 🔥</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {displayQuests.slice(0, 3).map((quest) => (
            <div
              key={quest.id}
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                quest.completed ? 'bg-yellow-50/50' : 'bg-slate-50'
              }`}
            >
              {quest.completed ? (
                <CheckCircle2 size={16} className="text-yellow-500 flex-shrink-0" />
              ) : (
                <Circle size={16} className="text-slate-300 flex-shrink-0" />
              )}
              <span className={`text-sm flex-1 ${quest.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                {categoryIcons[quest.category] || '⭐'} {quest.title}
              </span>
              <span className="text-[10px] text-slate-400">+{quest.points}</span>
            </div>
          ))}
        </div>

        {completedQuests === 0 && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-700">Starta din dag med små mål!</p>
            <p className="text-xs text-yellow-600 mt-1">Avsluta quests för att bygga streak</p>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// LARGE - Full overview
function QuestsWidgetLarge({ 
  completedQuests = 0, 
  totalQuests = 5,
  quests,
  streakDays = 0,
  loading, 
  error, 
  onRetry 
}: QuestsWidgetProps) {
  const getStatus = (): WidgetStatus => {
    if (completedQuests === 0) return 'empty'
    if (completedQuests === totalQuests) return 'complete'
    return 'progress'
  }

  const status = getStatus()
  const progress = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0
  
  // Safe fallback for quests
  const safeQuests = quests || []
  const defaultQuests: Quest[] = [
    { id: '1', title: 'Uppdatera CV med ny erfarenhet', completed: false, points: 10, category: 'cv' },
    { id: '2', title: 'Skicka 1 jobbansökan', completed: false, points: 20, category: 'apply' },
    { id: '3', title: 'Kontakta 1 person i nätverket', completed: false, points: 15, category: 'network' },
    { id: '4', title: 'Registrera dagens mående', completed: false, points: 10, category: 'wellness' },
    { id: '5', title: 'Gör 1 karriärövning', completed: false, points: 15, category: 'cv' },
  ]
  const displayQuests = safeQuests.length > 0 ? safeQuests : defaultQuests
  const totalPoints = displayQuests.reduce((sum, q) => sum + (q.completed ? q.points : 0), 0)

  return (
    <DashboardWidget
      title="Dagens Quests"
      icon={<Target size={24} />}
      to="/quests"
      color="yellow"
      status={status}
      progress={progress}
      loading={loading}
      error={error}
      onRetry={onRetry}
      primaryAction={{
        label: 'Se alla quests',
      }}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-yellow-50 rounded-xl text-center">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
              <Target size={20} className="text-yellow-600" />
            </div>
            <p className="text-xl font-bold text-yellow-800">{completedQuests}</p>
            <p className="text-xs text-yellow-600">klara</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-xl text-center">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
              <Zap size={20} className="text-yellow-600" />
            </div>
            <p className="text-xl font-bold text-yellow-800">{totalPoints}</p>
            <p className="text-xs text-yellow-600">poäng</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-xl text-center">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
              <Trophy size={20} className="text-yellow-600" />
            </div>
            <p className="text-xl font-bold text-yellow-800">{streakDays}</p>
            <p className="text-xs text-yellow-600">streak 🔥</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Dagens progress</span>
            <span className="font-medium text-yellow-600">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-amber-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Att göra idag:</p>
          <div className="space-y-2">
            {displayQuests.map((quest) => (
              <div
                key={quest.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer hover:shadow-sm ${
                  quest.completed 
                    ? 'bg-yellow-50/50 border border-yellow-100' 
                    : 'bg-slate-50 border border-transparent hover:border-slate-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  quest.completed ? 'bg-yellow-100' : 'bg-white border border-slate-200'
                }`}>
                  {quest.completed ? (
                    <CheckCircle2 size={18} className="text-yellow-600" />
                  ) : (
                    <Circle size={18} className="text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${quest.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {quest.title}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {categoryIcons[quest.category] || '⭐'} {quest.category}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  quest.completed ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  +{quest.points}
                </span>
              </div>
            ))}
          </div>
        </div>

        {completedQuests === totalQuests && completedQuests > 0 && (
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Trophy size={24} className="text-emerald-500" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900">Bra jobbat! 🎉</p>
                <p className="text-sm text-emerald-700">
                  Du har avslutat alla dagens quests. Fortsätt så!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  )
}

// Main component
export const QuestsWidget = memo(function QuestsWidget(props: QuestsWidgetProps) {
  const { size = 'small', ...rest } = props

  switch (size) {
    case 'large':
      return <QuestsWidgetLarge {...rest} />
    case 'medium':
      return <QuestsWidgetMedium {...rest} />
    case 'small':
    default:
      return <QuestsWidgetSmall {...rest} />
  }
})
