/**
 * Energy Tab - Track energy levels and get activity suggestions
 */
import { useState, useEffect } from 'react'
import { 
  Zap, Sun, Battery, BatteryLow, BatteryMedium, BatteryFull,
  TrendingUp, Calendar, Clock, AlertCircle, CheckCircle2
} from 'lucide-react'
import { Card, Button } from '@/components/ui'

interface EnergyLog {
  date: string
  morning: number
  afternoon: number
  evening: number
  notes?: string
}

const activitySuggestions: Record<number, { title: string; icon: React.ElementType; description: string }[]> = {
  8: [
    { title: 'Skriv personligt brev', icon: Zap, description: 'Perfekt tid för fokuserat skrivande' },
    { title: 'Nätverka aktivt', icon: Zap, description: 'Kontakta nya personer på LinkedIn' },
    { title: 'Förbered intervju', icon: Zap, description: 'Öva på vanliga frågor' },
  ],
  6: [
    { title: 'Sök jobb', icon: BatteryMedium, description: 'Gå igenom platsbanken' },
    { title: 'Uppdatera CV', icon: BatteryMedium, description: 'Gör små förbättringar' },
    { title: 'Gör en övning', icon: BatteryMedium, description: 'Kompetensutveckling' },
  ],
  4: [
    { title: 'Läsa artiklar', icon: BatteryLow, description: 'Kunskapsbanken väntar' },
    { title: 'Skriv i dagboken', icon: BatteryLow, description: 'Reflektera över dagen' },
    { title: 'Planera imorgon', icon: BatteryLow, description: 'Skriv en lista' },
  ],
  2: [
    { title: 'Vila', icon: AlertCircle, description: 'Det är okej att vila' },
    { title: 'Reflektera', icon: AlertCircle, description: 'Skriv ner tankar' },
    { title: 'Andningsövning', icon: AlertCircle, description: '10 minuter mindfulness' },
  ],
}

export default function EnergyTab() {
  const [todayEnergy, setTodayEnergy] = useState<{ morning?: number; afternoon?: number; evening?: number }>({})
  const [energyHistory, setEnergyHistory] = useState<EnergyLog[]>([])
  const [selectedTime, setSelectedTime] = useState<'morning' | 'afternoon' | 'evening'>('morning')
  const [notes, setNotes] = useState('')

  // Load mock data
  useEffect(() => {
    const mockHistory: EnergyLog[] = [
      { date: '2026-03-07', morning: 6, afternoon: 5, evening: 3 },
      { date: '2026-03-08', morning: 7, afternoon: 6, evening: 4 },
      { date: '2026-03-09', morning: 5, afternoon: 4, evening: 2 },
      { date: '2026-03-10', morning: 8, afternoon: 7, evening: 5 },
      { date: '2026-03-11', morning: 6, afternoon: 5, evening: 3 },
      { date: '2026-03-12', morning: 7, afternoon: 6, evening: 4 },
    ]
    setEnergyHistory(mockHistory)
  }, [])

  const getEnergyLevel = (value: number) => {
    if (value >= 7) return { label: 'Hög', color: 'text-green-600', bg: 'bg-green-100', icon: BatteryFull }
    if (value >= 5) return { label: 'Medel', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: BatteryMedium }
    if (value >= 3) return { label: 'Låg', color: 'text-orange-600', bg: 'bg-orange-100', icon: BatteryLow }
    return { label: 'Mycket låg', color: 'text-red-600', bg: 'bg-red-100', icon: Battery }
  }

  const currentEnergy = todayEnergy[selectedTime] || 5
  const level = getEnergyLevel(currentEnergy)
  const suggestions = activitySuggestions[Math.floor(currentEnergy / 2) * 2] || activitySuggestions[4]

  const saveEnergy = () => {
    setTodayEnergy(prev => ({ ...prev, [selectedTime]: currentEnergy }))
    // Save to backend
  }

  return (
    <div className="space-y-6">
      {/* Today's Energy Logger */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Hur är din energi idag?
        </h3>

        {/* Time selector */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'morning', label: 'Morgon', icon: Sun },
            { key: 'afternoon', label: 'Eftermiddag', icon: Clock },
            { key: 'evening', label: 'Kväll', icon: Clock },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedTime(key as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                selectedTime === key
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 hover:border-indigo-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Energy slider */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Mycket låg</span>
            <span className={`text-lg font-bold ${level.color}`}>{currentEnergy}/10 - {level.label}</span>
            <span className="text-sm text-slate-500">Mycket hög</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={currentEnergy}
            onChange={(e) => setTodayEnergy(prev => ({ ...prev, [selectedTime]: parseInt(e.target.value) }))}
            className="w-full h-3 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-red-400 via-yellow-400 to-green-400"
          />
        </div>

        {/* Notes */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Vill du lägga till en anteckning? (t.ex. 'Sov dåligt', 'Känner mig motiverad')"
          className="w-full p-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none mb-4"
          rows={2}
        />

        <Button onClick={saveEnergy} className="w-full">
          Spara energinivå
        </Button>
      </Card>

      {/* Activity Suggestions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-indigo-600" />
          Aktiviteter för din energinivå
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Baserat på att du har <span className={level.color}>{level.label.toLowerCase()}</span> energi
        </p>

        <div className="space-y-3">
          {suggestions.map((suggestion, index) => {
            const Icon = suggestion.icon
            return (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-transparent"
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <Icon className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{suggestion.title}</h4>
                  <p className="text-sm text-slate-600">{suggestion.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Energy History */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Din energi över tid
        </h3>

        <div className="space-y-3">
          {energyHistory.map((log) => (
            <div key={log.date} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
              <span className="text-sm font-medium text-slate-600 w-24">
                {new Date(log.date).toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric' })}
              </span>
              <div className="flex-1 flex gap-2">
                {[
                  { time: 'Morgon', value: log.morning },
                  { time: 'Efterm.', value: log.afternoon },
                  { time: 'Kväll', value: log.evening },
                ].map(({ time, value }) => {
                  const l = getEnergyLevel(value)
                  const Icon = l.icon
                  return (
                    <div
                      key={time}
                      className="flex-1 flex flex-col items-center gap-1"
                      title={`${time}: ${value}/10`}
                    >
                      <div className={`w-8 h-8 rounded-lg ${l.bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${l.color}`} />
                      </div>
                      <span className="text-xs text-slate-500">{value}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
          <p className="text-sm text-indigo-800">
            <strong>Insikt:</strong> Dina onsdagar tenderar att ha högst energi. 
            Passa på att göra viktiga jobbsökaruppgifter då!
          </p>
        </div>
      </Card>
    </div>
  )
}
