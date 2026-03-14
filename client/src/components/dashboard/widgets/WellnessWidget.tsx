import { Link } from 'react-router-dom'
import { Heart, Sparkles } from 'lucide-react'

interface WellnessWidgetProps {
  completedActivities?: number
  streakDays?: number
  moodToday?: string | null
  size?: 'small' | 'medium' | 'large'
}

export function WellnessWidget({ 
  completedActivities = 0,
  streakDays = 0,
  moodToday = null,
  size = 'small'
}: WellnessWidgetProps) {
  
  const moodEmoji = moodToday ? {
    great: '😄',
    good: '🙂',
    okay: '😐',
    bad: '😔',
    terrible: '😢'
  }[moodToday] || '❓' : null

  if (size === 'small') {
    return (
      <Link to="/wellness" className="block bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-slate-800">Välmående</h3>
          <Heart size={18} className="text-rose-500" />
        </div>
        <div className="flex items-center gap-2">
          {moodEmoji ? (
            <span className="text-2xl">{moodEmoji}</span>
          ) : (
            <span className="text-sm text-slate-500">Logga humör</span>
          )}
          {streakDays > 0 && (
            <span className="ml-auto text-xs bg-rose-100 text-rose-600 px-2 py-1 rounded-full">
              {streakDays} dagar
            </span>
          )}
        </div>
      </Link>
    )
  }

  return (
    <Link to="/wellness" className="block bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
          <Sparkles size={20} className="text-rose-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">Ditt välmående</h3>
          <p className="text-sm text-slate-500">
            {completedActivities} aktiviteter denna vecka
          </p>
        </div>
      </div>
      
      {moodToday ? (
        <div className="flex items-center gap-2">
          <span className="text-2xl">{moodEmoji}</span>
          <span className="text-sm text-slate-600">Dagens humör</span>
        </div>
      ) : (
        <p className="text-sm text-rose-600">
          Hur mår du idag? Logga ditt humör
        </p>
      )}
    </Link>
  )
}

export default WellnessWidget
