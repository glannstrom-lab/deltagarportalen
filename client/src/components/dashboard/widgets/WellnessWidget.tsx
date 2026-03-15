import { Link } from 'react-router-dom'
import { Heart, ChevronRight, Plus, Flame, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WellnessWidgetProps {
  completedActivities?: number
  streakDays?: number
  moodToday?: string | null
  size?: 'mini' | 'medium' | 'large'
}

const moodConfig: Record<string, { icon: string; color: string; bgColor: string; label: string }> = {
  great: { icon: '😄', color: 'text-emerald-600', bgColor: 'bg-emerald-100', label: 'Utmärkt' },
  good: { icon: '🙂', color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Bra' },
  okay: { icon: '😐', color: 'text-amber-600', bgColor: 'bg-amber-100', label: 'Okej' },
  bad: { icon: '😔', color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Inte så bra' },
  terrible: { icon: '😢', color: 'text-rose-600', bgColor: 'bg-rose-100', label: 'Tufft' }
}

export function WellnessWidget({
  completedActivities = 0,
  streakDays = 0,
  moodToday = null,
  size = 'medium'
}: WellnessWidgetProps) {
  const moodInfo = moodToday ? moodConfig[moodToday] : null
  const hasMood = !!moodToday

  // MINI
  if (size === 'mini') {
    return (
      <Link
        to="/wellness"
        className="group flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 hover:border-rose-300 hover:shadow-md transition-all duration-200"
      >
        <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
          {moodInfo ? <span className="text-lg">{moodInfo.icon}</span> : <Heart size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">Välmående</p>
          <p className={cn("text-xs", moodInfo ? moodInfo.color : "text-slate-500")}>
            {moodInfo ? moodInfo.label : 'Logga humör'}
          </p>
        </div>
        {streakDays > 0 && (
          <div className="flex items-center gap-1 text-orange-500">
            <Flame size={12} />
            <span className="text-xs font-medium">{streakDays}</span>
          </div>
        )}
      </Link>
    )
  }

  // MEDIUM
  if (size === 'medium') {
    return (
      <Link
        to="/wellness"
        className="group block bg-white p-4 rounded-xl border border-slate-200 hover:border-rose-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <Heart size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Välmående</h3>
              <p className="text-xs text-slate-500">Hur mår du idag?</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-rose-500 transition-colors" />
        </div>

        <div className="flex items-center gap-3">
          {moodInfo ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl">{moodInfo.icon}</span>
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                moodInfo.bgColor,
                moodInfo.color
              )}>
                {moodInfo.label}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-rose-600">
              <Plus size={16} />
              <span className="text-sm font-medium">Logga humör</span>
            </div>
          )}
          {streakDays > 0 && (
            <span className="ml-auto flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
              <Flame size={12} />
              {streakDays}
            </span>
          )}
        </div>
      </Link>
    )
  }

  // LARGE
  const moodOptions = ['great', 'good', 'okay', 'bad', 'terrible']

  return (
    <Link
      to="/wellness"
      className="group block bg-white p-5 rounded-xl border border-slate-200 hover:border-rose-300 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 text-rose-600 flex items-center justify-center">
            <Heart size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Ditt välmående</h3>
            <p className="text-sm text-slate-500">{completedActivities} aktiviteter denna vecka</p>
          </div>
        </div>
        {streakDays > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 rounded-lg text-orange-600">
            <Flame size={16} />
            <span className="text-sm font-bold">{streakDays} dagar</span>
          </div>
        )}
      </div>

      {/* Mood Card */}
      {moodInfo ? (
        <div className={cn(
          "flex items-center gap-4 p-4 rounded-xl border mb-4",
          moodInfo.bgColor,
          moodInfo.color.replace('text-', 'border-').replace('600', '200')
        )}>
          <span className="text-4xl">{moodInfo.icon}</span>
          <div>
            <p className="text-sm font-semibold text-slate-800">Dagens humör</p>
            <p className={cn("text-lg font-bold", moodInfo.color)}>{moodInfo.label}</p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 mb-4">
          <p className="text-sm font-semibold text-rose-800 mb-2">Hur mår du idag?</p>
          <div className="flex gap-2">
            {moodOptions.map(mood => (
              <span
                key={mood}
                className="w-10 h-10 flex items-center justify-center bg-white rounded-lg border border-rose-200 text-xl hover:scale-110 transition-transform"
              >
                {moodConfig[mood].icon}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-rose-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-rose-500" />
            <span className="text-lg font-bold text-slate-800">{completedActivities}</span>
          </div>
          <p className="text-xs text-slate-500">Aktiviteter</p>
        </div>
        <div className="p-3 bg-orange-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-orange-500" />
            <span className="text-lg font-bold text-slate-800">{streakDays}</span>
          </div>
          <p className="text-xs text-slate-500">Dagars streak</p>
        </div>
      </div>

      {/* Action */}
      <div className="flex gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-xs font-medium group-hover:bg-rose-200 transition-colors">
          <Heart size={12} />
          {hasMood ? 'Se historik' : 'Logga humör'}
        </span>
      </div>
    </Link>
  )
}

export default WellnessWidget
