import { Link } from 'react-router-dom'
import { Heart, Sparkles, ChevronRight, Plus, Flame, Sun, Moon, Cloud } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WellnessWidgetProps {
  completedActivities?: number
  streakDays?: number
  moodToday?: string | null
  lastEntryDate?: string | null
  size?: 'small' | 'medium'
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
  lastEntryDate = null,
  size = 'small'
}: WellnessWidgetProps) {
  const moodInfo = moodToday ? moodConfig[moodToday] : null
  const hasMood = !!moodToday

  if (size === 'small') {
    return (
      <Link
        to="/wellness"
        className={cn(
          "group block bg-white p-4 rounded-2xl border-2 transition-all duration-200",
          "hover:border-rose-300 hover:shadow-lg hover:-translate-y-0.5",
          "focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2",
          "border-slate-200"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Heart size={18} />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">Välmående</h3>
          </div>
          <ChevronRight
            size={16}
            className="text-slate-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all"
          />
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
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
              <Flame size={12} />
              {streakDays}
            </span>
          )}
        </div>
      </Link>
    )
  }

  // Medium size
  return (
    <Link
      to="/wellness"
      className={cn(
        "group block bg-white p-5 rounded-2xl border-2 transition-all duration-200",
        "hover:border-rose-300 hover:shadow-xl hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2",
        "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 text-rose-600 flex items-center justify-center shadow-sm">
            <Heart size={22} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Ditt välmående</h3>
            <p className="text-xs text-slate-500">
              {completedActivities} aktiviteter denna vecka
            </p>
          </div>
        </div>
        <ChevronRight
          size={18}
          className="text-slate-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all mt-1"
        />
      </div>

      {/* Mood card */}
      {moodInfo ? (
        <div className={cn(
          "flex items-center gap-4 p-4 rounded-xl border mb-3",
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
        <div className="flex items-center gap-4 p-4 rounded-xl bg-rose-50 border border-rose-100 mb-3">
          <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
            <Plus size={24} className="text-rose-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-rose-800">Hur mår du idag?</p>
            <p className="text-xs text-rose-600">Tryck för att logga ditt humör</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-rose-500" />
            <span className="text-lg font-bold text-slate-800">{completedActivities}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Aktiviteter</p>
        </div>
        <div className="p-3 bg-orange-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-orange-500" />
            <span className="text-lg font-bold text-slate-800">{streakDays}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Dagars streak</p>
        </div>
      </div>
    </Link>
  )
}

export default WellnessWidget
