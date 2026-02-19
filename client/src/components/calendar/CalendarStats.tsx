import { useMemo } from 'react'
import { Target, TrendingUp, CheckCircle, Briefcase, Users, Clock, Zap } from 'lucide-react'
import type { CalendarEvent, CalendarGoal, MoodEntry } from '@/services/calendarData'
import { getWeekNumber, getMoodEmoji, getMoodLabel } from '@/services/calendarData'

interface CalendarStatsProps {
  events: CalendarEvent[]
  goals: CalendarGoal[]
  moodEntries: MoodEntry[]
}

export function CalendarStats({ events, goals, moodEntries }: CalendarStatsProps) {
  const currentWeek = getWeekNumber(new Date())
  
  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Denna månad
    const monthEvents = events.filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
    
    // Denna vecka
    const weekEvents = events.filter(e => getWeekNumber(new Date(e.date)) === currentWeek)
    
    return {
      month: {
        applications: monthEvents.filter(e => e.type === 'deadline').length,
        interviews: monthEvents.filter(e => e.type === 'interview').length,
        meetings: monthEvents.filter(e => e.type === 'meeting').length,
        tasks: monthEvents.reduce((sum, e) => sum + (e.tasks?.filter(t => t.status === 'done').length || 0), 0),
        totalTasks: monthEvents.reduce((sum, e) => sum + (e.tasks?.length || 0), 0),
      },
      week: {
        applications: weekEvents.filter(e => e.type === 'deadline').length,
        interviews: weekEvents.filter(e => e.type === 'interview').length,
        meetings: weekEvents.filter(e => e.type === 'meeting').length,
      },
    }
  }, [events, currentWeek])

  const getGoalProgress = (type: CalendarGoal['type']) => {
    const goal = goals.find(g => g.type === type && g.period === 'week')
    if (!goal) return null
    
    const actual = stats.week[type === 'applications' ? 'applications' : type === 'interviews' ? 'interviews' : 'meetings']
    return {
      target: goal.target,
      actual,
      percentage: Math.min(100, (actual / goal.target) * 100),
    }
  }

  const latestMood = moodEntries[moodEntries.length - 1]

  return (
    <div className="space-y-4">
      {/* Weekly Goals */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-teal-600" />
          Veckomål
        </h3>
        
        <div className="space-y-4">
          {['applications', 'interviews', 'tasks'].map((type) => {
            const progress = getGoalProgress(type as CalendarGoal['type'])
            if (!progress) return null
            
            const labels: Record<string, string> = {
              applications: 'Ansökningar',
              interviews: 'Intervjuer',
              tasks: 'Uppgifter klara',
            }
            
            return (
              <div key={type}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{labels[type]}</span>
                  <span className="font-medium text-slate-900">
                    {progress.actual}/{progress.target}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      progress.percentage >= 100 ? 'bg-green-500' : 'bg-teal-500'
                    }`}
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-4 rounded-xl text-white">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Denna månad
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-teal-100" />
              <span className="text-xs text-teal-100">Ansökningar</span>
            </div>
            <p className="text-2xl font-bold">{stats.month.applications}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-4 h-4 text-teal-100" />
              <span className="text-xs text-teal-100">Intervjuer</span>
            </div>
            <p className="text-2xl font-bold">{stats.month.interviews}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-teal-100" />
              <span className="text-xs text-teal-100">Möten</span>
            </div>
            <p className="text-2xl font-bold">{stats.month.meetings}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-teal-100" />
              <span className="text-xs text-teal-100">Uppgifter</span>
            </div>
            <p className="text-2xl font-bold">
              {stats.month.tasks}/{stats.month.totalTasks}
            </p>
          </div>
        </div>
      </div>

      {/* Mood Tracker Summary */}
      {latestMood && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Dagens mående
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-4xl">{getMoodEmoji(latestMood.level)}</span>
            <div>
              <p className="font-medium text-slate-900">{getMoodLabel(latestMood.level)}</p>
              <p className="text-sm text-slate-500">
                Energi: {latestMood.energyLevel}/5 • Stress: {latestMood.stressLevel}/5
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Activity Heatmap (simplified) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900 mb-3">Aktivitetsnivå</h3>
        <div className="flex items-end gap-1 h-16">
          {[...Array(7)].map((_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - (6 - i))
            const dayEvents = events.filter(e => e.date === d.toISOString().split('T')[0])
            const intensity = Math.min(4, dayEvents.length)
            const colors = ['bg-slate-100', 'bg-teal-200', 'bg-teal-300', 'bg-teal-500', 'bg-teal-600']
            const dayNames = ['S', 'M', 'T', 'O', 'T', 'F', 'L']
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className={`w-full rounded-t ${colors[intensity]} transition-all`}
                  style={{ height: `${(intensity + 1) * 20}%` }}
                />
                <span className="text-xs text-slate-400">{dayNames[d.getDay()]}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
