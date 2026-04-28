/**
 * Routines Tab - Build sustainable daily routines
 */
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, Reorder } from 'framer-motion'
import {
  CalendarDays, Clock, Sun, Moon, Coffee, Briefcase,
  Plus, Trash2, CheckCircle2, Play, Pause, Flame, GripVertical
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Routine {
  id: string
  title: string
  time: string
  icon: React.ElementType
  completed: boolean
  days: string[]
}

// Routine definitions with i18n keys
const defaultRoutineDefs = [
  { id: '1', titleKey: 'wellness.routines.defaultRoutines.morningWalk', time: '08:00', icon: Sun, completed: false, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  { id: '2', titleKey: 'wellness.routines.defaultRoutines.jobSearch', time: '09:00', icon: Briefcase, completed: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  { id: '3', titleKey: 'wellness.routines.defaultRoutines.coffeeBreak', time: '10:30', icon: Coffee, completed: false, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  { id: '4', titleKey: 'wellness.routines.defaultRoutines.reflectDay', time: '19:00', icon: Moon, completed: false, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
]

const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

export default function RoutinesTab() {
  const { t } = useTranslation()

  // Build translated days of week
  const daysOfWeek = useMemo(() => dayKeys.map(k => t(`wellness.routines.days.${k}`)), [t])

  // Build translated default routines
  const defaultRoutines = useMemo(() => defaultRoutineDefs.map(r => ({
    ...r,
    title: t(r.titleKey)
  })), [t])

  const [routines, setRoutines] = useState<Routine[]>(() => defaultRoutines)
  const [isAdding, setIsAdding] = useState(false)
  const [newRoutine, setNewRoutine] = useState({ title: '', time: '09:00' })
  const [activeTimer, setActiveTimer] = useState<string | null>(null)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [routineStreaks, setRoutineStreaks] = useState<Record<string, number>>({
    '1': 5,
    '2': 8,
    '3': 3,
    '4': 12,
  })

  const toggleRoutine = (id: string) => {
    setRoutines(prev => prev.map(r => 
      r.id === id ? { ...r, completed: !r.completed } : r
    ))
  }

  const addRoutine = () => {
    if (!newRoutine.title.trim()) return
    const routine: Routine = {
      id: Date.now().toString(),
      title: newRoutine.title,
      time: newRoutine.time,
      icon: Briefcase,
      completed: false,
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    }
    setRoutines(prev => [...prev, routine])
    setNewRoutine({ title: '', time: '09:00' })
    setIsAdding(false)
  }

  const deleteRoutine = (id: string) => {
    setRoutines(prev => prev.filter(r => r.id !== id))
  }

  const startTimer = (id: string) => {
    if (activeTimer === id) {
      setActiveTimer(null)
    } else {
      setActiveTimer(id)
      setTimerSeconds(0)
    }
  }

  const completedToday = routines.filter(r => r.completed).length
  const completionPercentage = Math.round((completedToday / routines.length) * 100)

  return (
    <div className="space-y-6">
      {/* Progress Overview with Streak */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-4"
      >
        <Card className="p-6 bg-gradient-to-br from-[var(--c-bg)] to-[var(--c-bg)] dark:from-[var(--c-bg)]/30 dark:to-[var(--c-bg)]/30 border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Idag</p>
              <h3 className="text-3xl font-bold text-[var(--c-text)] dark:text-[var(--c-text)]">{completedToday}/{routines.length}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">rutiner slutförda</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Andel</p>
              <p className="text-2xl font-bold text-[var(--c-text)] dark:text-[var(--c-text)]">{completionPercentage}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-100 dark:border-orange-800">
          <div className="flex items-start gap-3">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <Flame className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </motion.div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Bästa serie</p>
              <h3 className="text-3xl font-bold text-orange-600 dark:text-orange-400">12</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">dagar i rad</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Daglig framsteg</span>
          <span className="text-sm text-gray-600 dark:text-gray-300">{completionPercentage}%</span>
        </div>
        <div className="h-3 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-[var(--c-solid)] to-[var(--c-solid)] dark:from-[var(--c-solid)] dark:to-[var(--c-solid)]"
          />
        </div>
      </div>

      {/* Weekly Calendar */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('wellness.routines.weekOverview')}</h3>
        <div className="grid grid-cols-7 gap-2">
          {daysOfWeek.map((day, index) => (
            <div key={day} className="text-center">
              <div className={`p-3 rounded-xl border-2 ${
                index < 5
                  ? 'border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30'
                  : 'border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700'
              }`}>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{day}</span>
                <div className="mt-2 flex justify-center gap-0.5">
                  {routines.filter(r => r.days.includes(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index])).map(() => (
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--c-solid)]/80 dark:bg-[var(--c-solid)]" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Routines List with Reordering and Streaks */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('wellness.routines.yourRoutines')}</h3>
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-1" />
            {t('wellness.routines.add')}
          </Button>
        </div>

        <Reorder.Group
          axis="y"
          values={routines}
          onReorder={setRoutines}
          className="space-y-3"
        >
          {routines.map((routine) => {
            const Icon = routine.icon
            const isTimerActive = activeTimer === routine.id
            const streak = routineStreaks[routine.id] || 0

            return (
              <Reorder.Item
                key={routine.id}
                value={routine}
              >
                <motion.div
                  layout
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing',
                    routine.completed
                      ? 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50'
                      : 'bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 hover:border-[var(--c-accent)] dark:hover:border-[var(--c-solid)]'
                  )}
                >
                  <GripVertical className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleRoutine(routine.id)}
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0',
                      routine.completed ? 'bg-[var(--c-solid)] dark:bg-[var(--c-solid)]' : 'bg-stone-100 dark:bg-stone-600 hover:bg-stone-200 dark:hover:bg-stone-500'
                    )}
                  >
                    <CheckCircle2 className={cn('w-5 h-5', routine.completed ? 'text-white' : 'text-gray-600 dark:text-gray-300')} />
                  </motion.button>

                  <div className="w-8 h-8 rounded-lg bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[var(--c-text)] dark:text-[var(--c-text)]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className={cn('font-medium', routine.completed ? 'text-[var(--c-text)] dark:text-[var(--c-text)] line-through' : 'text-gray-800 dark:text-gray-100')}>
                      {routine.title}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <Clock className="w-3 h-3" />
                      {routine.time}
                      {streak > 0 && (
                        <>
                          <span className="text-gray-300 dark:text-gray-500">•</span>
                          <div className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-500 dark:text-orange-400" />
                            <span className="text-orange-600 dark:text-orange-400 font-medium">{streak}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Timer button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startTimer(routine.id)}
                    className={cn(
                      'p-2 rounded-lg transition-colors flex-shrink-0',
                      isTimerActive ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-stone-100 dark:bg-stone-600 hover:bg-stone-200 dark:hover:bg-stone-500 text-gray-600 dark:text-gray-300'
                    )}
                  >
                    {isTimerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => deleteRoutine(routine.id)}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              </Reorder.Item>
            )
          })}
        </Reorder.Group>

        {/* Add new routine form */}
        {isAdding && (
          <div className="mt-4 p-4 bg-stone-50 dark:bg-stone-700 rounded-xl border border-stone-200 dark:border-stone-600">
            <div className="flex gap-3">
              <input
                type="text"
                value={newRoutine.title}
                onChange={(e) => setNewRoutine(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('wellness.routines.routineNamePlaceholder')}
                className="flex-1 px-3 py-2 rounded-lg border bg-white dark:bg-stone-600 border-stone-200 dark:border-stone-500 focus:border-[var(--c-solid)] dark:focus:border-[var(--c-solid)]/60 focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <input
                type="time"
                value={newRoutine.time}
                onChange={(e) => setNewRoutine(prev => ({ ...prev, time: e.target.value }))}
                className="px-3 py-2 rounded-lg border bg-white dark:bg-stone-600 border-stone-200 dark:border-stone-500 text-gray-800 dark:text-gray-100"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={addRoutine}>{t('common.save')}</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>{t('common.cancel')}</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Suggested Routines - Templates */}
      <Card className="p-6 bg-gradient-to-br from-[var(--c-bg)] to-[var(--c-bg)] dark:from-[var(--c-bg)]/30 dark:to-[var(--c-bg)]/30 border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('wellness.routines.suggestedRoutines')}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Förslagade rutiner som kan hjälpa dig få en strukturerad dag:</p>
        <div className="space-y-2">
          {[
            { titleKey: 'wellness.routines.suggestions.morningStretch', time: '07:30', icon: Sun, desc: 'Starta dagen med energi' },
            { titleKey: 'wellness.routines.suggestions.lunchWalk', time: '12:00', icon: Coffee, desc: 'Frisk luft och rörelse' },
            { titleKey: 'wellness.routines.suggestions.weeklyReview', time: '18:00', icon: CalendarDays, desc: 'Reflektera över dagen' },
          ].map((suggestion, index) => {
            const title = t(suggestion.titleKey)
            const Icon = suggestion.icon
            return (
              <motion.button
                key={index}
                whileHover={{ x: 4 }}
                onClick={() => {
                  setNewRoutine({ title, time: suggestion.time.includes(':') ? suggestion.time : '09:00' })
                  setIsAdding(true)
                }}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-[var(--c-accent)] dark:border-[var(--c-solid)] hover:border-[var(--c-solid)]/60 dark:hover:border-[var(--c-solid)] hover:bg-white dark:hover:bg-stone-800 transition-all text-left"
              >
                <Icon className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-gray-100">{title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{suggestion.time} • {suggestion.desc}</p>
                </div>
                <Plus className="w-4 h-4 text-[var(--c-text)] dark:text-[var(--c-text)] flex-shrink-0" />
              </motion.button>
            )
          })}
        </div>
      </Card>

      {/* Morning & Evening Routine Templates */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Rutinmallar</h3>
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border-2 border-orange-200 dark:border-orange-800 cursor-pointer hover:shadow-md transition-all"
          >
            <Sun className="w-6 h-6 text-orange-600 dark:text-orange-400 mb-2" />
            <h4 className="font-semibold text-orange-900 dark:text-orange-200">Morgon-rutin</h4>
            <p className="text-xs text-orange-800 dark:text-orange-300 mt-1">5 aktiviteter för bra start</p>
            <p className="text-xs text-orange-700 dark:text-orange-400 mt-2">07:00 - 09:00</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-gradient-to-br from-[var(--c-accent)]/40 to-[var(--c-accent)]/40 dark:from-[var(--c-bg)]/40 dark:to-[var(--c-bg)]/40 border-2 border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50 cursor-pointer hover:shadow-md transition-all"
          >
            <Moon className="w-6 h-6 text-[var(--c-text)] dark:text-[var(--c-text)] mb-2" />
            <h4 className="font-semibold text-[var(--c-text)] dark:text-[var(--c-text)]">Kväll-rutin</h4>
            <p className="text-xs text-[var(--c-text)] dark:text-[var(--c-text)] mt-1">4 aktiviteter för bättre sömn</p>
            <p className="text-xs text-[var(--c-text)] dark:text-[var(--c-text)] mt-2">20:00 - 21:30</p>
          </motion.div>
        </div>
      </Card>
    </div>
  )
}
