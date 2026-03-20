/**
 * MoodTab - Mood tracking and analytics
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Smile, Frown, Meh, Sun, Moon, Battery, Brain,
  TrendingUp, TrendingDown, Minus, Calendar, Check,
  ChevronLeft, ChevronRight, Activity
} from 'lucide-react'
import { useMoodLogs } from '@/hooks/useDiary'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'

const MOOD_CONFIG = [
  { value: 1, emoji: '😢', label: 'Mycket dåligt', color: 'bg-rose-500', bgColor: 'bg-rose-100', textColor: 'text-rose-700' },
  { value: 2, emoji: '😔', label: 'Dåligt', color: 'bg-orange-500', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
  { value: 3, emoji: '😐', label: 'Okej', color: 'bg-yellow-500', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  { value: 4, emoji: '🙂', label: 'Bra', color: 'bg-green-500', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  { value: 5, emoji: '😄', label: 'Mycket bra', color: 'bg-emerald-500', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' },
]

const ACTIVITIES = [
  { id: 'exercise', label: 'Träning', emoji: '🏃' },
  { id: 'sleep', label: 'Bra sömn', emoji: '😴' },
  { id: 'social', label: 'Umgås', emoji: '👥' },
  { id: 'nature', label: 'Utomhus', emoji: '🌳' },
  { id: 'work', label: 'Produktiv', emoji: '💼' },
  { id: 'relax', label: 'Avslappning', emoji: '🧘' },
  { id: 'hobby', label: 'Hobby', emoji: '🎨' },
  { id: 'learn', label: 'Lärande', emoji: '📚' },
]

function MoodSelector({
  value,
  onChange,
  size = 'large'
}: {
  value: number
  onChange: (value: number) => void
  size?: 'small' | 'large'
}) {
  return (
    <div className={cn(
      "flex gap-2",
      size === 'large' ? "justify-between" : "justify-start"
    )}>
      {MOOD_CONFIG.map((mood) => (
        <button
          key={mood.value}
          onClick={() => onChange(mood.value)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-xl transition-all",
            size === 'large' ? "flex-1 py-4" : "px-3 py-2",
            value === mood.value
              ? `${mood.bgColor} ring-2 ring-offset-2 ring-${mood.color.replace('bg-', '')}`
              : "bg-slate-50 hover:bg-slate-100"
          )}
        >
          <span className={size === 'large' ? "text-3xl" : "text-xl"}>{mood.emoji}</span>
          {size === 'large' && (
            <span className={cn(
              "text-xs font-medium",
              value === mood.value ? mood.textColor : "text-slate-500"
            )}>
              {mood.label}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

function LevelSlider({
  label,
  icon: Icon,
  value,
  onChange,
  lowLabel,
  highLabel
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  value: number
  onChange: (value: number) => void
  lowLabel: string
  highLabel: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">{label}</span>
        </div>
        <span className="text-sm text-slate-500">{value}/5</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  )
}

function TodayLogger() {
  const { todayMood, logMood, isLoading } = useMoodLogs()
  const [mood, setMood] = useState(todayMood?.mood_level || 3)
  const [energy, setEnergy] = useState(todayMood?.energy_level || 3)
  const [stress, setStress] = useState(todayMood?.stress_level || 3)
  const [sleep, setSleep] = useState(todayMood?.sleep_quality || 3)
  const [activities, setActivities] = useState<string[]>(todayMood?.activities || [])
  const [note, setNote] = useState(todayMood?.note || '')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const toggleActivity = (id: string) => {
    setActivities(prev =>
      prev.includes(id)
        ? prev.filter(a => a !== id)
        : [...prev, id]
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await logMood({
        log_date: new Date().toISOString().split('T')[0],
        mood_level: mood,
        energy_level: energy,
        stress_level: stress,
        sleep_quality: sleep,
        activities,
        note: note.trim() || null
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Hur mår du idag?</h3>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString('sv-SE', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </p>
        </div>
        {todayMood && (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
            <Check className="w-4 h-4" />
            Loggat
          </span>
        )}
      </div>

      <div className="space-y-6">
        {/* Mood */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Allmänt humör
          </label>
          <MoodSelector value={mood} onChange={setMood} />
        </div>

        {/* Energy, Stress, Sleep */}
        <div className="grid gap-6 md:grid-cols-3">
          <LevelSlider
            label="Energinivå"
            icon={Battery}
            value={energy}
            onChange={setEnergy}
            lowLabel="Trött"
            highLabel="Energisk"
          />
          <LevelSlider
            label="Stressnivå"
            icon={Brain}
            value={stress}
            onChange={setStress}
            lowLabel="Lugn"
            highLabel="Stressad"
          />
          <LevelSlider
            label="Sömnkvalitet"
            icon={Moon}
            value={sleep}
            onChange={setSleep}
            lowLabel="Dålig"
            highLabel="Utvilad"
          />
        </div>

        {/* Activities */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Vad har du gjort idag?
          </label>
          <div className="flex flex-wrap gap-2">
            {ACTIVITIES.map((activity) => (
              <button
                key={activity.id}
                onClick={() => toggleActivity(activity.id)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                  activities.includes(activity.id)
                    ? "bg-violet-100 text-violet-700 ring-2 ring-violet-300"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                <span>{activity.emoji}</span>
                {activity.label}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Anteckning (valfritt)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Något speciellt som påverkade din dag?"
            rows={3}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? 'Sparar...' : saved ? '✓ Sparat!' : 'Spara dagens humör'}
        </Button>
      </div>
    </Card>
  )
}

function MoodCalendar() {
  const { logs } = useMoodLogs()
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1

  const getMoodForDate = (dateStr: string) => {
    return logs.find(l => l.log_date === dateStr)
  }

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentMonth(newDate)
  }

  const days = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Humörkalender</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('prev')}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </button>
          <span className="text-sm font-medium text-slate-700 min-w-[120px] text-center">
            {currentMonth.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => navigate('next')}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map(day => (
          <div key={day} className="text-center text-xs font-medium text-slate-400 py-2">
            {day}
          </div>
        ))}
        {Array.from({ length: startingDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const moodLog = getMoodForDate(dateStr)
          const moodConfig = moodLog ? MOOD_CONFIG.find(m => m.value === moodLog.mood_level) : null
          const isToday = new Date().toISOString().split('T')[0] === dateStr

          return (
            <div
              key={day}
              className={cn(
                "aspect-square flex items-center justify-center rounded-lg text-sm",
                isToday && "ring-2 ring-violet-400 ring-offset-1",
                moodConfig ? moodConfig.bgColor : "bg-slate-50"
              )}
              title={moodLog ? `Humör: ${moodLog.mood_level}/5` : ''}
            >
              {moodConfig ? (
                <span className="text-lg">{moodConfig.emoji}</span>
              ) : (
                <span className="text-slate-400">{day}</span>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function MoodStats() {
  const { logs, stats } = useMoodLogs()

  // Calculate weekly comparison
  const thisWeek = logs.slice(0, 7)
  const lastWeek = logs.slice(7, 14)

  const thisWeekAvg = thisWeek.length > 0
    ? thisWeek.reduce((sum, l) => sum + l.mood_level, 0) / thisWeek.length
    : 0
  const lastWeekAvg = lastWeek.length > 0
    ? lastWeek.reduce((sum, l) => sum + l.mood_level, 0) / lastWeek.length
    : 0

  const trend = thisWeekAvg > lastWeekAvg ? 'up' : thisWeekAvg < lastWeekAvg ? 'down' : 'same'

  // Most common activities
  const activityCounts = logs.flatMap(l => l.activities || [])
    .reduce((acc, a) => {
      acc[a] = (acc[a] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  const topActivities = Object.entries(activityCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-1 sm:gap-2 text-slate-500 mb-1">
          <Smile className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm font-medium">Humör</span>
        </div>
        <div className="flex items-baseline gap-1 sm:gap-2">
          <span className="text-lg sm:text-2xl font-bold text-slate-900">
            {stats.averageMood.toFixed(1)}
          </span>
          <span className="text-xs sm:text-sm text-slate-500">/5</span>
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-1 sm:gap-2 text-slate-500 mb-1">
          <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm font-medium">Trend</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {trend === 'up' && (
            <>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              <span className="text-sm text-green-600 font-medium">Uppåt</span>
            </>
          )}
          {trend === 'down' && (
            <>
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
              <span className="text-sm text-orange-600 font-medium">Nedåt</span>
            </>
          )}
          {trend === 'same' && (
            <>
              <Minus className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <span className="text-sm text-slate-600 font-medium">Stabil</span>
            </>
          )}
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-1 sm:gap-2 text-slate-500 mb-1">
          <Battery className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm font-medium">Energi</span>
        </div>
        <div className="flex items-baseline gap-1 sm:gap-2">
          <span className="text-lg sm:text-2xl font-bold text-slate-900">
            {stats.averageEnergy.toFixed(1)}
          </span>
          <span className="text-xs sm:text-sm text-slate-500">/5</span>
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-1 sm:gap-2 text-slate-500 mb-1">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm font-medium">Dagar</span>
        </div>
        <span className="text-lg sm:text-2xl font-bold text-slate-900">
          {stats.totalLogs}
        </span>
      </Card>

      {topActivities.length > 0 && (
        <Card className="p-4 md:col-span-2 lg:col-span-4">
          <div className="flex items-center gap-2 text-slate-500 mb-3">
            <Sun className="w-4 h-4" />
            <span className="text-sm font-medium">Vanligaste aktiviteterna</span>
          </div>
          <div className="flex gap-3">
            {topActivities.map(([id, count]) => {
              const activity = ACTIVITIES.find(a => a.id === id)
              if (!activity) return null
              return (
                <div key={id} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                  <span className="text-lg">{activity.emoji}</span>
                  <span className="text-sm font-medium text-slate-700">{activity.label}</span>
                  <span className="text-xs text-slate-400">({count}x)</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

export function MoodTab() {
  const { isLoading } = useMoodLogs()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <MoodStats />

      <div className="grid gap-6 lg:grid-cols-2">
        <TodayLogger />
        <MoodCalendar />
      </div>
    </div>
  )
}

export default MoodTab
