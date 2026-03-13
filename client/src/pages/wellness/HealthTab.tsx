/**
 * Health Tab - Main Wellness Content
 * Existing wellness content moved to this tab
 */
import { useState, useEffect } from 'react'
import { 
  Heart, Brain, Sun, Moon, Activity, Coffee,
  Music, BookOpen, Dumbbell, Sparkles, CheckCircle,
  ArrowRight, PenLine, Quote, Loader2
} from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { journalApi } from '@/services/cloudStorage'

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

const wellnessTips: WellnessTip[] = [
  {
    id: '1',
    category: 'mental',
    title: 'Mindfulness för arbetssökande',
    description: 'Ta 5 minuter varje dag för att bara andas och vara närvarande. Det hjälper dig hantera stressen i jobbsökandet.',
    icon: Brain,
    color: 'bg-purple-100 text-purple-700'
  },
  {
    id: '2',
    category: 'physical',
    title: 'Rör på dig regelbundet',
    description: 'En kort promenad kan göra underverk för ditt humör och din energi. Försök röra på dig minst 30 minuter om dagen.',
    icon: Activity,
    color: 'bg-green-100 text-green-700'
  },
  {
    id: '3',
    category: 'sleep',
    title: 'Prioritera din sömn',
    description: 'God sömn är avgörande för din prestation i intervjuer. Sikta på 7-9 timmar per natt.',
    icon: Moon,
    color: 'bg-indigo-100 text-indigo-700'
  },
  {
    id: '4',
    category: 'social',
    title: 'Behåll sociala kontakter',
    description: 'Jobbsökande kan vara isolerande. Träffa vänner och familj regelbundet för att behålla perspektivet.',
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
  const [activities, setActivities] = useState<DailyActivity[]>(initialActivities)
  const [reflection, setReflection] = useState('')
  const [savedReflections, setSavedReflections] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [quote, setQuote] = useState(quotes[0])

  useEffect(() => {
    loadData()
    setQuote(quotes[Math.floor(Math.random() * quotes.length)])
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const data = await journalApi.getWellnessData()
      if (data) {
        if (data.activities) {
          setActivities(prev => prev.map(a => ({
            ...a,
            completed: data.activities?.[a.id] || false
          })))
        }
        if (data.reflections) {
          setSavedReflections(data.reflections)
        }
      }
    } catch (error) {
      console.error('Failed to load wellness data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleActivity = async (id: string) => {
    const newActivities = activities.map(a =>
      a.id === id ? { ...a, completed: !a.completed } : a
    )
    setActivities(newActivities)
    
    try {
      await journalApi.saveWellnessData({
        activities: newActivities.reduce((acc, a) => ({ ...acc, [a.id]: a.completed }), {})
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
      await journalApi.saveWellnessData({
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
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  const completedCount = activities.filter(a => a.completed).length

  return (
    <div className="space-y-6">
      {/* Daily Quote */}
      <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
        <div className="flex items-start gap-4">
          <Quote className="w-8 h-8 text-indigo-400 flex-shrink-0" />
          <div>
            <p className="text-lg font-medium text-indigo-900 italic">
              "{quote.text}"
            </p>
            <p className="text-sm text-indigo-600 mt-2">— {quote.author}</p>
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
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-indigo-600" />
          </div>
        </div>

        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = activity.icon
            return (
              <button
                key={activity.id}
                onClick={() => toggleActivity(activity.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  activity.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  activity.completed ? 'bg-green-100' : 'bg-slate-100'
                }`}>
                  {activity.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Icon className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <span className={`flex-1 text-left font-medium ${
                  activity.completed ? 'text-green-700 line-through' : 'text-slate-700'
                }`}>
                  {activity.title}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Wellness Tips */}
      <div className="grid gap-4 md:grid-cols-2">
        {wellnessTips.map((tip) => {
          const Icon = tip.icon
          return (
            <Card key={tip.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tip.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">{tip.title}</h4>
                  <p className="text-sm text-slate-600">{tip.description}</p>
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
          placeholder="Hur mår du idag? Vad har du tänkt på?"
          className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none"
        />
        <div className="flex justify-end mt-3">
          <Button
            onClick={saveReflection}
            disabled={!reflection.trim() || isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Spara reflektion
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
        
        {savedReflections.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-700 mb-2">Tidigare reflektioner</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
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
