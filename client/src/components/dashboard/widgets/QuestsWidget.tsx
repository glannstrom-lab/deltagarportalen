import { Zap, CheckCircle2, Circle, Target, Trophy } from 'lucide-react'
import { DashboardWidget } from '../DashboardWidget'
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
  to?: string
}

const categoryIcons: Record<string, string> = {
  cv: '📝',
  apply: '📤',
  network: '🤝',
  wellness: '✨',
  general: '⭐',
}

export function QuestsWidget({ 
  completedQuests = 0, 
  totalQuests = 3,
  quests,
  streakDays = 0,
  loading, 
  error, 
  onRetry,
  size = 'small',
  to = '/activity'
}: QuestsWidgetProps) {
  
  const progress = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0
  
  // Safe fallback for quests
  const safeQuests = quests || []
  const defaultQuests: Quest[] = [
    { id: '1', title: 'Uppdatera CV', completed: false, points: 10, category: 'cv' },
    { id: '2', title: 'Skicka 1 ansökan', completed: false, points: 20, category: 'apply' },
    { id: '3', title: 'Registrera mående', completed: false, points: 10, category: 'wellness' },
  ]
  const displayQuests = safeQuests.length > 0 ? safeQuests : defaultQuests

  if (size === 'small') {
    return (
      <DashboardWidget
        title="Quests"
        icon={<Zap size={14} />}
        to={to}
        color="yellow"
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

  // Medium and Large sizes
  return (
    <DashboardWidget
      title="Dagens Quests"
      icon={<Target size={22} />}
      to={to}
      color="yellow"
      loading={loading}
      error={error}
      onRetry={onRetry}
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
              className={`flex items-center gap-2 p-2 rounded-lg ${
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
      </div>
    </DashboardWidget>
  )
}
