import { useState } from 'react'
import { Smile, Battery, AlertTriangle, TrendingUp } from 'lucide-react'
import type { MoodEntry, MoodLevel } from '@/services/calendarData'
import { getMoodEmoji, getMoodLabel, getEnergyEmoji } from '@/services/calendarData'

interface MoodTrackerProps {
  entries: MoodEntry[]
  onAddEntry: (entry: MoodEntry) => void
}

export function MoodTracker({ entries, onAddEntry }: MoodTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [mood, setMood] = useState<MoodLevel>(3)
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [stress, setStress] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [note, setNote] = useState('')

  const handleSubmit = () => {
    onAddEntry({
      date: new Date().toISOString().split('T')[0],
      level: mood,
      energyLevel: energy,
      stressLevel: stress,
      note: note || undefined,
    })
    setIsExpanded(false)
    setNote('')
  }

  const todayEntry = entries.find(e => e.date === new Date().toISOString().split('T')[0])

  // Beräkna trend
  const recentEntries = entries.slice(-7)
  const avgMood = recentEntries.length > 0 
    ? recentEntries.reduce((sum, e) => sum + e.level, 0) / recentEntries.length 
    : 0

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 overflow-hidden">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-white/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Smile className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Hur mår du idag?</h3>
              {todayEntry ? (
                <p className="text-sm text-slate-500">
                  Registrerat: {getMoodEmoji(todayEntry.level)} {getMoodLabel(todayEntry.level).toLowerCase()}
                </p>
              ) : (
                <p className="text-sm text-slate-500">Klicka för att registrera</p>
              )}
            </div>
          </div>
          {avgMood > 0 && (
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <TrendingUp size={16} />
              Snitt vecka: {avgMood.toFixed(1)}/5
            </div>
          )}
        </button>
      ) : (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Smile className="w-5 h-5 text-amber-600" />
              Dagens check-in
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Stäng
            </button>
          </div>

          {/* Mood */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Humör
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setMood(level as MoodLevel)}
                  className={`flex-1 p-2 rounded-lg border-2 transition-all ${
                    mood === level
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-transparent hover:bg-white/50'
                  }`}
                >
                  <span className="text-2xl">{getMoodEmoji(level as MoodLevel)}</span>
                  <p className="text-xs text-slate-600 mt-1">{getMoodLabel(level as MoodLevel)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Energy */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-1">
              <Battery className="w-4 h-4" />
              Energinivå
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setEnergy(level as 1 | 2 | 3 | 4 | 5)}
                  className={`flex-1 p-2 rounded-lg border-2 transition-all ${
                    energy === level
                      ? 'border-green-500 bg-green-50'
                      : 'border-transparent hover:bg-white/50'
                  }`}
                >
                  <span className="text-lg">{getEnergyEmoji(level as 1 | 2 | 3 | 4 | 5)}</span>
                  <p className="text-xs text-slate-600 mt-1">{level}/5</p>
                </button>
              ))}
            </div>
          </div>

          {/* Stress */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              Stressnivå
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setStress(level as 1 | 2 | 3 | 4 | 5)}
                  className={`flex-1 p-2 rounded-lg border-2 transition-all ${
                    stress === level
                      ? level >= 4 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-blue-500 bg-blue-50'
                      : 'border-transparent hover:bg-white/50'
                  }`}
                >
                  <div className={`h-2 w-full rounded-full ${
                    level === 1 ? 'bg-green-200' :
                    level === 2 ? 'bg-green-300' :
                    level === 3 ? 'bg-yellow-300' :
                    level === 4 ? 'bg-orange-400' : 'bg-red-500'
                  }`} />
                  <p className="text-xs text-slate-600 mt-1">{level}/5</p>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Anteckning (valfritt)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Hur känns det idag? Vad påverkar ditt mående?"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              rows={2}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            Spara check-in
          </button>

          {/* Warning for high stress */}
          {stress >= 4 && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Du verkar ha hög stressnivå. Kom ihåg att ta pauser och vila. 
                  Besök gärna <a href="/wellness" className="underline">Välmående-sidan</a> för tips.
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
