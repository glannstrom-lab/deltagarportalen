/**
 * Health Tab - Main Wellness Content
 * Mood logging prominently at top, activities and tips below
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Heart, Brain, Sun, Moon, Activity, Coffee,
  Sparkles, CheckCircle, PenLine, Quote, Loader2, Check
} from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { moodApi, wellnessDataApi, type MoodType } from '@/services/cloudStorage'
import { cn } from '@/lib/utils'

interface WellnessTip {
  id: string
  category: 'mental' | 'physical' | 'sleep' | 'social'
  title: string
  description: string
  icon: React.ElementType
  color: string
}

interface DailyActivity {
  id: string
  title: string
  completed: boolean
  icon: React.ElementType
}

const moodOptions: { value: MoodType; icon: string; label: string; color: string; bgColor: string }[] = [
  { value: 'great', icon: '😄', label: 'Utmärkt', color: 'text-emerald-600', bgColor: 'bg-emerald-100 hover:bg-emerald-200 border-emerald-200' },
  { value: 'good', icon: '🙂', label: 'Bra', color: 'text-blue-600', bgColor: 'bg-blue-100 hover:bg-blue-200 border-blue-200' },
  { value: 'okay', icon: '😐', label: 'Okej', color: 'text-amber-600', bgColor: 'bg-amber-100 hover:bg-amber-200 border-amber-200' },
  { value: 'bad', icon: '😔', label: 'Inte så bra', color: 'text-orange-600', bgColor: 'bg-orange-100 hover:bg-orange-200 border-orange-200' },
  { value: 'terrible', icon: '😢', label: 'Tufft', color: 'text-rose-600', bgColor: 'bg-rose-100 hover:bg-rose-200 border-rose-200' },
]

const wellnessTips: WellnessTip[] = [
  {
    id: '1',
    category: 'mental',
    title: 'Mindfulness för arbetssökande',
    description: 'Ta 5 minuter varje dag för att bara andas och vara närvarande.',
    icon: Brain,
    color: 'bg-purple-100 text-purple-700'
  },
  {
    id: '2',
    category: 'physical',
    title: 'Rör på dig regelbundet',
    description: 'En kort promenad kan göra underverk för ditt humör och din energi.',
    icon: Activity,
    color: 'bg-green-100 text-green-700'
  },
  {
    id: '3',
    category: 'sleep',
    title: 'Prioritera din sömn',
    description: 'God sömn är avgörande för din prestation. Sikta på 7-9 timmar.',
    icon: Moon,
    color: 'bg-indigo-100 text-indigo-700'
  },
  {
    id: '4',
    category: 'social',
    title: 'Behåll sociala kontakter',
    description: 'Träffa vänner och familj regelbundet för att behålla perspektivet.',
    icon: Coffee,
    color: 'bg-amber-100 text-amber-700'
  },
]

const initialActivities: DailyActivity[] = [
  { id: '1', title: 'Gå en promenad', completed: false, icon: Activity },
  { id: '2', title: 'Meditation 10 min', completed: false, icon: Brain },
  { id: '3', title: 'Skriv 3 positiva saker', completed: false, icon: Sun },
  { id: '4', title: 'Kontakta en vän', completed: false, icon: Coffee },
]

const quotes = [
  { text: "Varje steg framåt är ett steg närmare ditt mål", author: "Okänd" },
  { text: "Du är mer än ditt jobb", author: "Okänd" },
  { text: "Ta det i din egen takt", author: "Okänd" },
]

export default function HealthTab() {
  const [currentMood, setCurrentMood] = useState<MoodType | null>(null)
  const [moodNote, setMoodNote] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [isSavingMood, setIsSavingMood] = useState(false)
  const [moodSaved, setMoodSaved] = useState(false)
  const [moodStreak, setMoodStreak] = useState(0)

  const [activities, setActivities] = useState<DailyActivity[]>(initialActivities)
  const [reflection, setReflection] = useState('')
  const [savedReflections, setSavedReflections] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [quote] = useState(quotes[Math.floor(Math.random() * quotes.length)])

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)

      // Load mood data
      const [todaysMood, streak, wellnessData] = await Promise.all([
        moodApi.getTodaysMood(),
        moodApi.getStreak(),
        wellnessDataApi.get()
      ])

      if (todaysMood) {
        setCurrentMood(todaysMood.mood)
        setMoodNote(todaysMood.note || '')
        setMoodSaved(true)
      }
      setMoodStreak(streak)

      if (wellnessData) {
        if (wellnessData.activities) {
          setActivities(prev => prev.map(a => ({
            ...a,
            completed: wellnessData.activities?.[a.id] || false
          })))
        }
        if (wellnessData.reflections) {
          setSavedReflections(wellnessData.reflections)
        }
      }
    } catch (error) {
      console.error('Failed to load wellness data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleMoodSelect = async (mood: MoodType) => {
    setCurrentMood(mood)
    setIsSavingMood(true)

    try {
      const success = await moodApi.logMood(mood, moodNote || undefined)
      if (success) {
        setMoodSaved(true)
        // Refresh streak
        const newStreak = await moodApi.getStreak()
        setMoodStreak(newStreak)
      }
    } catch (error) {
      console.error('Failed to save mood:', error)
    } finally {
      setIsSavingMood(false)
    }
  }

  const handleSaveMoodNote = async () => {
    if (!currentMood) return
    setIsSavingMood(true)

    try {
      await moodApi.logMood(currentMood, moodNote || undefined)
      setShowNoteInput(false)
    } catch (error) {
      console.error('Failed to save mood note:', error)
    } finally {
      setIsSavingMood(false)
    }
  }

  const toggleActivity = async (id: string) => {
    const newActivities = activities.map(a =>
      a.id === id ? { ...a, completed: !a.completed } : a
    )
    setActivities(newActivities)

    try {
      await wellnessDataApi.save({
        activities: newActivities.reduce((acc, a) => ({ ...acc, [a.id]: a.completed }), {}),
        reflections: savedReflections
      })
    } catch (error) {
      console.error('Failed to save activity:', error)
    }
  }

  const saveReflection = async () => {
    if (!reflection.trim()) return

    setIsSaving(true)
    try {
      const newReflections = [...savedReflections, reflection]
      await wellnessDataApi.save({
        activities: activities.reduce((acc, a) => ({ ...acc, [a.id]: a.completed }), {}),
        reflections: newReflections
      })
      setSavedReflections(newReflections)
      setReflection('')
    } catch (error) {
      console.error('Failed to save reflection:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
      </div>
    )
  }

  const completedCount = activities.filter(a => a.completed).length
  const selectedMoodOption = moodOptions.find(m => m.value === currentMood)

  return (
    <div className="space-y-6">
      {/* Mood Logging - Prominent at top */}
      <Card className="p-6 bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
              <Heart className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Hur mår du idag?</h2>
              <p className="text-sm text-slate-500">
                {moodSaved ? 'Du har loggat ditt humör idag' : 'Logga ditt humör för att följa ditt välmående'}
              </p>
            </div>
          </div>
          {moodStreak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 rounded-full">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-bold text-orange-700">{moodStreak} dagar</span>
            </div>
          )}
        </div>

        {/* Mood Selection */}
        <div className="flex flex-wrap gap-3 mb-4">
          {moodOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleMoodSelect(option.value)}
              disabled={isSavingMood}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 transition-all duration-200",
                currentMood === option.value
                  ? `${option.bgColor} border-current ring-2 ring-offset-2 ${option.color.replace('text-', 'ring-')}`
                  : "bg-white border-slate-200 hover:border-slate-300"
              )}
            >
              <span className="text-3xl">{option.icon}</span>
              <span className={cn(
                "text-xs font-medium",
                currentMood === option.value ? option.color : "text-slate-600"
              )}>
                {option.label}
              </span>
              {currentMood === option.value && moodSaved && (
                <Check className="w-4 h-4 text-emerald-500 absolute -top-1 -right-1" />
              )}
            </button>
          ))}
        </div>

        {/* Mood saved confirmation */}
        {moodSaved && selectedMoodOption && (
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg",
            selectedMoodOption.bgColor.split(' ')[0]
          )}>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium text-slate-700">
                Humör loggat: {selectedMoodOption.label}
              </span>
            </div>
            {!showNoteInput && (
              <button
                onClick={() => setShowNoteInput(true)}
                className="text-sm text-slate-600 hover:text-slate-800 underline"
              >
                Lägg till anteckning
              </button>
            )}
          </div>
        )}

        {/* Optional note */}
        {showNoteInput && (
          <div className="mt-3">
            <textarea
              value={moodNote}
              onChange={(e) => setMoodNote(e.target.value)}
              placeholder="Vill du skriva något om hur du mår? (valfritt)"
              className="w-full p-3 rounded-lg border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 resize-none text-sm"
              rows={2}
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNoteInput(false)}
              >
                Avbryt
              </Button>
              <Button
                size="sm"
                onClick={handleSaveMoodNote}
                disabled={isSavingMood}
              >
                {isSavingMood ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Spara'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Daily Quote */}
      <Card className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
        <div className="flex items-start gap-4">
          <Quote className="w-6 h-6 text-indigo-400 flex-shrink-0" />
          <div>
            <p className="text-base font-medium text-indigo-900 italic">
              "{quote.text}"
            </p>
            <p className="text-sm text-indigo-600 mt-1">— {quote.author}</p>
          </div>
        </div>
      </Card>

      {/* Daily Activities */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Dagens aktiviteter</h3>
            <p className="text-sm text-slate-500">
              {completedCount} av {activities.length} avklarade
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
        </div>

        <div className="space-y-2">
          {activities.map((activity) => {
            const Icon = activity.icon
            return (
              <button
                key={activity.id}
                onClick={() => toggleActivity(activity.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                  activity.completed
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-slate-200 hover:border-indigo-300"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  activity.completed ? "bg-green-100" : "bg-slate-100"
                )}>
                  {activity.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Icon className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <span className={cn(
                  "flex-1 text-left font-medium text-sm",
                  activity.completed ? "text-green-700 line-through" : "text-slate-700"
                )}>
                  {activity.title}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Wellness Tips */}
      <div className="grid gap-3 md:grid-cols-2">
        {wellnessTips.map((tip) => {
          const Icon = tip.icon
          return (
            <Card key={tip.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", tip.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm mb-0.5">{tip.title}</h4>
                  <p className="text-xs text-slate-600">{tip.description}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Reflection */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <PenLine className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-slate-800">Dagens reflektion</h3>
        </div>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Vad har du tänkt på idag? Hur känner du dig?"
          className="w-full h-24 p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none text-sm"
        />
        <div className="flex justify-end mt-3">
          <Button
            onClick={saveReflection}
            disabled={!reflection.trim() || isSaving}
            size="sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Spara reflektion'}
          </Button>
        </div>

        {savedReflections.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-700 mb-2">Tidigare reflektioner</p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {savedReflections.slice(-3).reverse().map((r, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                  {r}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
