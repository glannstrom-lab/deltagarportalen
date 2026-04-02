/**
 * Energy Tab - Track energy levels and get activity suggestions
 */
import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Zap, Sun, Battery, BatteryLow, BatteryMedium, BatteryFull,
  TrendingUp, Calendar, Clock, AlertCircle, CheckCircle2, Lightbulb
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface EnergyLog {
  date: string
  morning: number
  afternoon: number
  evening: number
  notes?: string
}

// Activity suggestion definitions with i18n keys
const activitySuggestionDefs: Record<number, { titleKey: string; icon: React.ElementType; descKey: string }[]> = {
  8: [
    { titleKey: 'wellness.energy.activities.writeLetter.title', icon: Zap, descKey: 'wellness.energy.activities.writeLetter.description' },
    { titleKey: 'wellness.energy.activities.network.title', icon: Zap, descKey: 'wellness.energy.activities.network.description' },
    { titleKey: 'wellness.energy.activities.prepareInterview.title', icon: Zap, descKey: 'wellness.energy.activities.prepareInterview.description' },
  ],
  6: [
    { titleKey: 'wellness.energy.activities.searchJobs.title', icon: BatteryMedium, descKey: 'wellness.energy.activities.searchJobs.description' },
    { titleKey: 'wellness.energy.activities.updateCV.title', icon: BatteryMedium, descKey: 'wellness.energy.activities.updateCV.description' },
    { titleKey: 'wellness.energy.activities.doExercise.title', icon: BatteryMedium, descKey: 'wellness.energy.activities.doExercise.description' },
  ],
  4: [
    { titleKey: 'wellness.energy.activities.readArticles.title', icon: BatteryLow, descKey: 'wellness.energy.activities.readArticles.description' },
    { titleKey: 'wellness.energy.activities.writeDiary.title', icon: BatteryLow, descKey: 'wellness.energy.activities.writeDiary.description' },
    { titleKey: 'wellness.energy.activities.planTomorrow.title', icon: BatteryLow, descKey: 'wellness.energy.activities.planTomorrow.description' },
  ],
  2: [
    { titleKey: 'wellness.energy.activities.rest.title', icon: AlertCircle, descKey: 'wellness.energy.activities.rest.description' },
    { titleKey: 'wellness.energy.activities.reflect.title', icon: AlertCircle, descKey: 'wellness.energy.activities.reflect.description' },
    { titleKey: 'wellness.energy.activities.breathing.title', icon: AlertCircle, descKey: 'wellness.energy.activities.breathing.description' },
  ],
}

export default function EnergyTab() {
  const { t, i18n } = useTranslation()
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
    if (value >= 7) return { label: t('wellness.energy.high'), color: 'text-green-600', bg: 'bg-green-100', icon: BatteryFull }
    if (value >= 5) return { label: t('wellness.energy.medium'), color: 'text-yellow-600', bg: 'bg-yellow-100', icon: BatteryMedium }
    if (value >= 3) return { label: t('wellness.energy.low'), color: 'text-orange-600', bg: 'bg-orange-100', icon: BatteryLow }
    return { label: t('wellness.energy.veryLow'), color: 'text-red-600', bg: 'bg-red-100', icon: Battery }
  }

  // Build translated suggestions
  const activitySuggestions = useMemo(() => {
    const result: Record<number, { title: string; icon: React.ElementType; description: string }[]> = {}
    for (const [key, defs] of Object.entries(activitySuggestionDefs)) {
      result[parseInt(key)] = defs.map(def => ({
        title: t(def.titleKey),
        icon: def.icon,
        description: t(def.descKey)
      }))
    }
    return result
  }, [t])

  const currentEnergy = todayEnergy[selectedTime] || 5
  const level = getEnergyLevel(currentEnergy)
  const suggestions = activitySuggestions[Math.floor(currentEnergy / 2) * 2] || activitySuggestions[4]

  // Motivational quotes in Swedish
  const motivationalQuotes = [
    "Varje dag är en ny början. Acceptera ditt energinivå och gör det bästa idag.",
    "Det är okej att inte ha energi för allt. Fokusera på en sak åt gången.",
    "Din väl mår är viktigare än produktivitet. Du gör redan ditt bästa.",
    "Energin fluktuerar - det är helt normalt. Var snäll mot dig själv.",
    "Små steg framåt är fortfarande framåt. Du klarar detta.",
  ]

  const getRandomQuote = () => {
    return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  }

  const saveEnergy = () => {
    setTodayEnergy(prev => ({ ...prev, [selectedTime]: currentEnergy }))
    // Save to backend
  }

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const avgMorning = Math.round(energyHistory.reduce((sum, log) => sum + log.morning, 0) / energyHistory.length)
    const avgAfternoon = Math.round(energyHistory.reduce((sum, log) => sum + log.afternoon, 0) / energyHistory.length)
    const avgEvening = Math.round(energyHistory.reduce((sum, log) => sum + log.evening, 0) / energyHistory.length)
    const overallAvg = Math.round((avgMorning + avgAfternoon + avgEvening) / 3)
    return { avgMorning, avgAfternoon, avgEvening, overallAvg }
  }, [energyHistory])

  return (
    <div className="space-y-6">
      {/* Motivational Quote */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100"
      >
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-indigo-900 italic">{getRandomQuote()}</p>
        </div>
      </motion.div>

      {/* Today's Energy Logger */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          {t('wellness.energy.howIsYourEnergy')}
        </h3>

        {/* Time selector */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'morning', label: t('wellness.energy.morning'), icon: Sun },
            { key: 'afternoon', label: t('wellness.energy.afternoon'), icon: Clock },
            { key: 'evening', label: t('wellness.energy.evening'), icon: Clock },
          ].map(({ key, label, icon: Icon }) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTime(key as any)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all',
                selectedTime === key
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 hover:border-indigo-300'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{label}</span>
            </motion.button>
          ))}
        </div>

        {/* Energy Level Emoji Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">Välj energinivå:</span>
            <span className={`text-2xl font-bold ${level.color}`}>{currentEnergy}/10</span>
          </div>
          <div className="flex gap-2 justify-between mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
              const isSelected = currentEnergy === num
              return (
                <motion.button
                  key={num}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTodayEnergy(prev => ({ ...prev, [selectedTime]: num }))}
                  className={cn(
                    'w-8 h-8 rounded-lg font-semibold text-xs transition-all',
                    isSelected
                      ? 'bg-indigo-600 text-white scale-110 shadow-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {num}
                </motion.button>
              )
            })}
          </div>
          <p className="text-sm text-slate-600">
            {level.label} - {level.label === t('wellness.energy.high') ? 'Dags att ta på sig större uppgifter!' : level.label === t('wellness.energy.medium') ? 'Bra nivå för fokuserat arbete' : 'Ta det lugnt och vila'}
          </p>
        </div>

        {/* Notes */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('wellness.energy.notesPlaceholder')}
          className="w-full p-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none mb-4"
          rows={2}
        />

        <Button onClick={saveEnergy} className="w-full">
          {t('wellness.energy.saveEnergy')}
        </Button>
      </Card>

      {/* Activity Suggestions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-indigo-600" />
          {t('wellness.energy.suggestions')}
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          {t('wellness.energy.suggestions')} (<span className={level.color}>{level.label.toLowerCase()}</span>)
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

      {/* Weekly Summary Stats */}
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Veckovyn
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Morgon', value: weeklyStats.avgMorning, icon: Sun },
            { label: 'Eftermiddag', value: weeklyStats.avgAfternoon, icon: Clock },
            { label: 'Kväll', value: weeklyStats.avgEvening, icon: Moon },
            { label: 'Genomsnitt', value: weeklyStats.overallAvg, icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => {
            const l = getEnergyLevel(value)
            return (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-xl text-center border-2 ${l.bg} border-opacity-30`}
              >
                <Icon className={`w-5 h-5 ${l.color} mx-auto mb-2`} />
                <p className="text-xs text-slate-600 mb-1">{label}</p>
                <p className={`text-2xl font-bold ${l.color}`}>{value}</p>
              </motion.div>
            )
          })}
        </div>
      </Card>

      {/* Energy Graph */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          {t('wellness.energy.weekHistory')}
        </h3>

        {/* Simple bar chart visualization */}
        <div className="mb-6">
          <div className="space-y-3">
            {energyHistory.map((log) => (
              <div key={log.date} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 w-20">
                    {new Date(log.date).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'sv-SE', { weekday: 'short' })}
                  </span>
                  <div className="flex-1 ml-3 flex gap-2 items-center">
                    {[
                      { time: 'M', value: log.morning, color: 'bg-amber-400' },
                      { time: 'A', value: log.afternoon, color: 'bg-amber-500' },
                      { time: 'K', value: log.evening, color: 'bg-amber-600' },
                    ].map(({ time, value, color }) => (
                      <div key={time} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-slate-200 rounded-lg h-6 relative overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(value / 10) * 100}%` }}
                            transition={{ duration: 0.5 }}
                            className={`h-full ${color} rounded-lg flex items-center justify-center`}
                          >
                            {value >= 5 && <span className="text-xs font-bold text-white">{value}</span>}
                          </motion.div>
                        </div>
                        <span className="text-xs text-slate-500">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
          <p className="text-sm text-indigo-800">
            <strong>Insikt:</strong> Din genomsnittliga energi är högst på morgonen ({weeklyStats.avgMorning}/10).
            Planera viktiga uppgifter då för bäst resultat!
          </p>
        </div>
      </Card>
    </div>
  )
}

const Moon = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)
