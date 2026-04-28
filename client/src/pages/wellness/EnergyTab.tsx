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
    if (value >= 7) return { label: t('wellness.energy.high'), color: 'text-[var(--c-text)] dark:text-[var(--c-text)]', bg: 'bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40', icon: BatteryFull }
    if (value >= 5) return { label: t('wellness.energy.medium'), color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: BatteryMedium }
    if (value >= 3) return { label: t('wellness.energy.low'), color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', icon: BatteryLow }
    return { label: t('wellness.energy.veryLow'), color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: Battery }
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
        className="p-4 bg-gradient-to-r from-[var(--c-bg)] to-[var(--c-bg)] dark:from-[var(--c-bg)]/30 dark:to-[var(--c-bg)]/30 rounded-xl border border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50"
      >
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--c-text)] dark:text-[var(--c-text)] italic">{getRandomQuote()}</p>
        </div>
      </motion.div>

      {/* Today's Energy Logger */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-[var(--c-solid)] dark:text-[var(--c-text)]" />
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
                  ? 'border-[var(--c-solid)] dark:border-[var(--c-solid)]/60 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 text-[var(--c-text)] dark:text-[var(--c-text)]'
                  : 'border-stone-200 dark:border-stone-600 hover:border-[var(--c-accent)] dark:hover:border-[var(--c-solid)] text-gray-700 dark:text-gray-300'
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
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Välj energinivå:</span>
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
                      ? 'bg-[var(--c-solid)] dark:bg-[var(--c-solid)] text-white scale-110 shadow-lg'
                      : 'bg-stone-100 dark:bg-stone-600 text-gray-600 dark:text-gray-200 hover:bg-stone-200 dark:hover:bg-stone-500'
                  )}
                >
                  {num}
                </motion.button>
              )
            })}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {level.label} - {level.label === t('wellness.energy.high') ? 'Dags att ta på sig större uppgifter!' : level.label === t('wellness.energy.medium') ? 'Bra nivå för fokuserat arbete' : 'Ta det lugnt och vila'}
          </p>
        </div>

        {/* Notes */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('wellness.energy.notesPlaceholder')}
          className="w-full p-3 rounded-lg border bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 focus:border-[var(--c-solid)] dark:focus:border-[var(--c-solid)]/60 focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] resize-none mb-4 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          rows={2}
        />

        <Button onClick={saveEnergy} className="w-full">
          {t('wellness.energy.saveEnergy')}
        </Button>
      </Card>

      {/* Activity Suggestions */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
          {t('wellness.energy.suggestions')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {t('wellness.energy.suggestions')} (<span className={level.color}>{level.label.toLowerCase()}</span>)
        </p>

        <div className="space-y-3">
          {suggestions.map((suggestion, index) => {
            const Icon = suggestion.icon
            return (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl bg-stone-50 dark:bg-stone-700 border border-transparent"
              >
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-stone-600 flex items-center justify-center shadow-sm">
                  <Icon className="w-6 h-6 text-[var(--c-text)] dark:text-[var(--c-text)]" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100">{suggestion.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{suggestion.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Weekly Summary Stats */}
      <Card className="p-6 bg-gradient-to-br from-[var(--c-bg)] to-[var(--c-bg)] dark:from-[var(--c-bg)]/30 dark:to-[var(--c-bg)]/30 border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
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
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">{label}</p>
                <p className={`text-2xl font-bold ${l.color}`}>{value}</p>
              </motion.div>
            )
          })}
        </div>
      </Card>

      {/* Energy Graph */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
          {t('wellness.energy.weekHistory')}
        </h3>

        {/* Simple bar chart visualization */}
        <div className="mb-6">
          <div className="space-y-3">
            {energyHistory.map((log) => (
              <div key={log.date} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300 w-20">
                    {new Date(log.date).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'sv-SE', { weekday: 'short' })}
                  </span>
                  <div className="flex-1 ml-3 flex gap-2 items-center">
                    {[
                      { time: 'M', value: log.morning, color: 'bg-[var(--c-solid)]/80 dark:bg-[var(--c-solid)]' },
                      { time: 'A', value: log.afternoon, color: 'bg-[var(--c-solid)] dark:bg-[var(--c-solid)]' },
                      { time: 'K', value: log.evening, color: 'bg-[var(--c-solid)] dark:bg-[var(--c-solid)]' },
                    ].map(({ time, value, color }) => (
                      <div key={time} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-stone-200 dark:bg-stone-600 rounded-lg h-6 relative overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(value / 10) * 100}%` }}
                            transition={{ duration: 0.5 }}
                            className={`h-full ${color} rounded-lg flex items-center justify-center`}
                          >
                            {value >= 5 && <span className="text-xs font-bold text-white">{value}</span>}
                          </motion.div>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-300">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 p-4 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 rounded-lg border border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50">
          <p className="text-sm text-[var(--c-text)] dark:text-[var(--c-text)]">
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
