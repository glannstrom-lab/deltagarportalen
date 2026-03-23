/**
 * Routines Tab - Build sustainable daily routines
 */
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, Reorder } from 'framer-motion'
import {
  CalendarDays, Clock, Sun, Moon, Coffee, Briefcase,
  Plus, Trash2, CheckCircle2, Play, Pause, Flame, GripVertical
} from 'lucide-react'
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
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Idag</p>
              <h3 className="text-3xl font-bold text-indigo-600">{completedToday}/{routines.length}</h3>
              <p className="text-xs text-slate-500 mt-1">rutiner slutförda</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600 mb-1">Andel</p>
              <p className="text-2xl font-bold text-indigo-600">{completionPercentage}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50">
          <div className="flex items-start gap-3">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <Flame className="w-8 h-8 text-orange-600" />
            </motion.div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Bästa serie</p>
              <h3 className="text-3xl font-bold text-orange-600">12</h3>
              <p className="text-xs text-slate-500 mt-1">dagar i rad</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">Daglig framsteg</span>
          <span className="text-sm text-slate-500">{completionPercentage}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          />
        </div>
      </div>

      {/* Weekly Calendar */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('wellness.routines.weekOverview')}</h3>
        <div className="grid grid-cols-7 gap-2">
          {daysOfWeek.map((day, index) => (
            <div key={day} className="text-center">
              <div className={`p-3 rounded-xl border-2 ${
                index < 5 
                  ? 'border-indigo-200 bg-indigo-50' 
                  : 'border-slate-200 bg-slate-50'
              }`}>
                <span className="text-sm font-medium text-slate-600">{day}</span>
                <div className="mt-2 flex justify-center gap-0.5">
                  {routines.filter(r => r.days.includes(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index])).map(() => (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Routines List with Reordering and Streaks */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800">{t('wellness.routines.yourRoutines')}</h3>
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
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-slate-200 hover:border-indigo-300'
                  )}
                >
                  <GripVertical className="w-4 h-4 text-slate-400 flex-shrink-0" />

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleRoutine(routine.id)}
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0',
                      routine.completed ? 'bg-green-500' : 'bg-slate-100 hover:bg-slate-200'
                    )}
                  >
                    <CheckCircle2 className={cn('w-5 h-5', routine.completed ? 'text-white' : 'text-slate-400')} />
                  </motion.button>

                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-indigo-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className={cn('font-medium', routine.completed ? 'text-green-700 line-through' : 'text-slate-800')}>
                      {routine.title}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                      <Clock className="w-3 h-3" />
                      {routine.time}
                      {streak > 0 && (
                        <>
                          <span className="text-slate-300">•</span>
                          <div className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-500" />
                            <span className="text-orange-600 font-medium">{streak}</span>
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
                      isTimerActive ? 'bg-red-100 text-red-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    )}
                  >
                    {isTimerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => deleteRoutine(routine.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
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
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex gap-3">
              <input
                type="text"
                value={newRoutine.title}
                onChange={(e) => setNewRoutine(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('wellness.routines.routineNamePlaceholder')}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              <input
                type="time"
                value={newRoutine.time}
                onChange={(e) => setNewRoutine(prev => ({ ...prev, time: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-slate-200"
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
      <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('wellness.routines.suggestedRoutines')}</h3>
        <p className="text-sm text-slate-600 mb-4">Förslagade rutiner som kan hjälpa dig få en strukturerad dag:</p>
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
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-amber-300 hover:border-amber-400 hover:bg-white transition-all text-left"
              >
                <Icon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800">{title}</p>
                  <p className="text-xs text-slate-500">{suggestion.time} • {suggestion.desc}</p>
                </div>
                <Plus className="w-4 h-4 text-amber-600 flex-shrink-0" />
              </motion.button>
            )
          })}
        </div>
      </Card>

      {/* Morning & Evening Routine Templates */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Rutinmallar</h3>
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-orange-200 cursor-pointer hover:shadow-md transition-all"
          >
            <Sun className="w-6 h-6 text-orange-600 mb-2" />
            <h4 className="font-semibold text-orange-900">Morgon-rutin</h4>
            <p className="text-xs text-orange-800 mt-1">5 aktiviteter för bra start</p>
            <p className="text-xs text-orange-700 mt-2">07:00 - 09:00</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 border-2 border-purple-200 cursor-pointer hover:shadow-md transition-all"
          >
            <Moon className="w-6 h-6 text-purple-600 mb-2" />
            <h4 className="font-semibold text-purple-900">Kväll-rutin</h4>
            <p className="text-xs text-purple-800 mt-1">4 aktiviteter för bättre sömn</p>
            <p className="text-xs text-purple-700 mt-2">20:00 - 21:30</p>
          </motion.div>
        </div>
      </Card>
    </div>
  )
}
