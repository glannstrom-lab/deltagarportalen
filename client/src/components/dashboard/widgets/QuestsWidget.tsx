import { Link } from 'react-router-dom'

interface QuestsWidgetProps {
  completedQuests?: number
  totalQuests?: number
  streakDays?: number
  size?: 'small' | 'medium' | 'large'
}

export function QuestsWidget({ 
  completedQuests = 0, 
  totalQuests = 3,
  streakDays = 0,
  size = 'small'
}: QuestsWidgetProps) {
  
  if (size === 'small') {
    return (
      <Link to="/activity" className="block bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-slate-800">Quests</h3>
          <span className="text-yellow-500">⚡</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-slate-800">{completedQuests}</span>
          <span className="text-sm text-slate-500">/ {totalQuests}</span>
          {streakDays > 0 && (
            <span className="ml-auto text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-full">
              🔥 {streakDays}
            </span>
          )}
        </div>
      </Link>
    )
  }

  // Medium size
  return (
    <Link to="/activity" className="block bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-xl">
          🎯
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">Dagens Quests</h3>
          <p className="text-sm text-slate-500">{completedQuests} av {totalQuests} avklarade</p>
        </div>
      </div>
      
      {streakDays > 0 && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <span>🔥</span>
          <span>{streakDays} dagar i rad</span>
        </div>
      )}
    </Link>
  )
}

export default QuestsWidget
