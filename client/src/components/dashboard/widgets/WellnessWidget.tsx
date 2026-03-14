import { Link } from 'react-router-dom'
import { Heart, Sparkles, ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  
  const moodConfig: Record<string, { icon: string; color: string; label: string }> = {
    great: { icon: '😄', color: 'text-emerald-600 bg-emerald-100', label: 'Utmärkt' },
    good: { icon: '🙂', color: 'text-blue-600 bg-blue-100', label: 'Bra' },
    okay: { icon: '😐', color: 'text-amber-600 bg-amber-100', label: 'Okej' },
    bad: { icon: '😔', color: 'text-orange-600 bg-orange-100', label: 'Jobbigt' },
    terrible: { icon: '😢', color: 'text-rose-600 bg-rose-100', label: 'Svårt' }
  }
  
  const moodInfo = moodToday ? moodConfig[moodToday] : null
  const hasMood = !!moodToday

  if (size === 'small') {
    return (
      <Link 
        to="/wellness" 
        className={cn(
          "group block bg-white p-4 rounded-xl border-2 transition-all duration-200",
          "hover:border-rose-300 hover:shadow-lg hover:-translate-y-0.5",
          "focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2",
          "border-slate-200"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Heart size={16} />
            </div>
            <h3 className="font-semibold text-slate-800">Välmående</h3>
          </div>
          <ChevronRight 
            size={16} 
            className="text-slate-400 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" 
          />
        </div>
        
        <div className="flex items-center gap-3">
          {moodInfo ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl">{moodInfo.icon}</span>
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                moodInfo.color
              )}>
                {moodInfo.label}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-rose-700">
              <Plus size={16} />
              <span className="text-sm font-medium">Logga humör</span>
            </div>
          )}
          
          {streakDays > 0 && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
              <Sparkles size={12} className="text-rose-600" />
              {streakDays} dagar
            </span>
          )}
        </div>
      </Link>
    )
  }

  return (
    <Link 
      to="/wellness" 
      className={cn(
        "group block bg-white p-5 rounded-xl border-2 transition-all duration-200",
        "hover:border-rose-300 hover:shadow-lg hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2",
        "border-slate-200"
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
          <Sparkles size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Ditt välmående</h3>
          <p className="text-sm text-slate-500">
            {completedActivities} aktiviteter denna vecka
          </p>
        </div>
        <ChevronRight 
          size={20} 
          className="text-slate-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" 
        />
      </div>
      
      {moodInfo ? (
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-lg border",
          moodInfo.color.replace('text-', 'bg-').replace('100', '50'),
          moodInfo.color.replace('text-', 'border-').replace('100', '200')
        )}>
          <span className="text-2xl">{moodInfo.icon}</span>
          <div>
            <p className="text-sm font-medium text-slate-800">Dagens humör</p>
            <p className={cn("text-xs", moodInfo.color.split(' ')[0])}>{moodInfo.label}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-rose-700 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">
          Hur mår du idag? Logga ditt humör
        </p>
      )}
    </Link>
  )
}

export default WellnessWidget
