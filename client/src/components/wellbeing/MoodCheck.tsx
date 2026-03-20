import { useState, useEffect } from 'react'
import { AlertCircle, Heart, TrendingUp, Loader2 } from 'lucide-react'
import { moodHistoryApi } from '@/services/cloudStorage'

interface MoodEntry {
  date: string
  mood: 1 | 2 | 3 | 4 | 5
  note?: string
}

interface MoodCheckProps {
  onMoodSubmit?: (mood: number) => void
  showTrend?: boolean
}

const moodOptions = [
  { value: 5, emoji: '😊', label: 'Bra', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
  { value: 4, emoji: '🙂', label: 'Ganska bra', color: 'text-teal-500', bg: 'bg-teal-50', border: 'border-teal-200' },
  { value: 3, emoji: '😐', label: 'Okej', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
  { value: 2, emoji: '😔', label: 'Tungt', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
  { value: 1, emoji: '😢', label: 'Mycket tungt', color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200' },
]

export function MoodCheck({ onMoodSubmit, showTrend = true }: MoodCheckProps) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([])
  const [showSupport, setShowSupport] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ladda historik från molnet vid mount
  useEffect(() => {
    const loadMoodHistory = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await moodHistoryApi.getAll()
        
        // Konvertera från databasformat till komponentformat
        const entries: MoodEntry[] = data.map((item: { recorded_at?: string; mood: number; note?: string }) => ({
          date: item.recorded_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          mood: item.mood as 1 | 2 | 3 | 4 | 5,
          note: item.note
        }))
        
        setMoodHistory(entries)
        
        // Kolla om användaren redan registrerat idag
        const today = new Date().toISOString().split('T')[0]
        const todayEntry = entries.find((entry: MoodEntry) => entry.date === today)
        if (todayEntry) {
          setSelectedMood(todayEntry.mood)
          setSubmitted(true)
        }
      } catch (err) {
        console.error('Failed to load mood history:', err)
        setError('Kunde inte ladda humörhistorik')
      } finally {
        setIsLoading(false)
      }
    }

    loadMoodHistory()
  }, [])

  const handleMoodSelect = (mood: number) => {
    setSelectedMood(mood)
    setShowDetails(true)
    
    // Visa stöd om humöret är lågt
    if (mood <= 2) {
      setShowSupport(true)
    }
  }

  const handleSubmit = async () => {
    if (selectedMood === null) return

    try {
      setIsSaving(true)
      setError(null)
      
      // Spara till molnet
      await moodHistoryApi.add(selectedMood, note || undefined)
      
      const today = new Date().toISOString().split('T')[0]
      const newEntry: MoodEntry = {
        date: today,
        mood: selectedMood as 1 | 2 | 3 | 4 | 5,
        note: note || undefined
      }

      const updatedHistory = [...moodHistory.filter(h => h.date !== today), newEntry]
      setMoodHistory(updatedHistory)
      
      onMoodSubmit?.(selectedMood)
      setSubmitted(true)
    } catch (err) {
      console.error('Failed to save mood:', err)
      setError('Kunde inte spara humör. Försök igen.')
    } finally {
      setIsSaving(false)
    }
  }

  const getAverageMood = () => {
    if (moodHistory.length === 0) return null
    const sum = moodHistory.reduce((acc, entry) => acc + entry.mood, 0)
    return (sum / moodHistory.length).toFixed(1)
  }

  const getMoodTrend = () => {
    if (moodHistory.length < 2) return null
    const recent = moodHistory.slice(-7)
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2))
    const secondHalf = recent.slice(Math.floor(recent.length / 2))
    
    const firstAvg = firstHalf.reduce((a, b) => a + b.mood, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b.mood, 0) / secondHalf.length
    
    if (secondAvg > firstAvg) return 'improving'
    if (secondAvg < firstAvg) return 'declining'
    return 'stable'
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        <span className="ml-2 text-sm text-slate-500">Laddar...</span>
      </div>
    )
  }

  if (submitted && selectedMood) {
    const moodOption = moodOptions.find(m => m.value === selectedMood)
    
    return (
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
        <div className="text-center">
          <div className="text-4xl mb-2">{moodOption?.emoji}</div>
          <p className="text-lg font-medium text-slate-800">
            Idag mår du: <span className={moodOption?.color}>{moodOption?.label}</span>
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Tack för att du delar med dig. Din hälsa är viktig.
          </p>
          
          {showTrend && moodHistory.length > 1 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-slate-600">
                  <TrendingUp className="w-4 h-4" />
                  Snitt: {getAverageMood()}/5
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  getMoodTrend() === 'improving' ? 'bg-green-100 text-green-700' :
                  getMoodTrend() === 'declining' ? 'bg-rose-100 text-rose-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {getMoodTrend() === 'improving' ? '↗️ På väg uppåt' :
                   getMoodTrend() === 'declining' ? '↘️ Tuff period' :
                   '→ Stabilt'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-rose-500" />
        <h3 className="font-semibold text-slate-800">Hur mår du idag?</h3>
      </div>
      
      <p className="text-sm text-slate-500 mb-4">
        Din hälsa är viktigare än något jobb. Det är okej att må dåligt ibland.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-center gap-2 mb-4">
        {moodOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleMoodSelect(option.value)}
            disabled={isSaving}
            className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
              selectedMood === option.value
                ? `${option.bg} ${option.border} ring-2 ring-offset-2 ring-teal-500`
                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={`Mood: ${option.label}`}
            aria-pressed={selectedMood === option.value}
          >
            <span className="text-2xl mb-1">{option.emoji}</span>
            <span className={`text-xs font-medium ${option.color}`}>
              {option.label}
            </span>
          </button>
        ))}
      </div>

      {showSupport && (
        <div 
          className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-rose-800 font-medium">
                Vi ser att du har det tufft just nu
              </p>
              <p className="text-sm text-rose-700 mt-1">
                Det är modigt att erkänna när man mår dåligt. 
                <a 
                  href="#crisis-support" 
                  className="underline font-medium ml-1 hover:text-rose-900"
                  onClick={(e) => {
                    e.preventDefault()
                    const crisisBtn = document.querySelector('[aria-label*="Behöver du prata"]')
                    if (crisisBtn) {
                      (crisisBtn as HTMLElement).click()
                    }
                  }}
                >
                  Klicka på hjärt-knappen om du behöver prata med någon.
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {showDetails && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Vill du skriva något om hur du mår? (frivilligt)"
            className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            rows={3}
            maxLength={200}
            disabled={isSaving}
          />
          <div className="text-xs text-slate-400 text-right mt-1">
            {note.length}/200
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full mt-3 bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving ? 'Sparar...' : 'Spara'}
          </button>
        </div>
      )}
    </div>
  )
}
