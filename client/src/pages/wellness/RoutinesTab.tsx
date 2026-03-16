/**
 * Routines Tab - Build sustainable daily routines
 */
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CalendarDays, Clock, Sun, Moon, Coffee, Briefcase,
  Plus, Trash2, CheckCircle2, Play, Pause
} from 'lucide-react'
import { Card, Button } from '@/components/ui'

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

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{t('wellness.routines.todaysRoutines')}</h3>
            <p className="text-slate-500">{t('wellness.routines.xOfYCompleted', { completed: completedToday, total: routines.length })}</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-indigo-600">
              {Math.round((completedToday / routines.length) * 100)}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-3 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${(completedToday / routines.length) * 100}%` }}
          />
        </div>
      </Card>

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

      {/* Routines List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">{t('wellness.routines.yourRoutines')}</h3>
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-1" />
            {t('wellness.routines.add')}
          </Button>
        </div>

        <div className="space-y-3">
          {routines.map((routine) => {
            const Icon = routine.icon
            const isTimerActive = activeTimer === routine.id
            
            return (
              <div
                key={routine.id}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  routine.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <button
                  onClick={() => toggleRoutine(routine.id)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    routine.completed ? 'bg-green-500' : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  <CheckCircle2 className={`w-5 h-5 ${routine.completed ? 'text-white' : 'text-slate-400'}`} />
                </button>

                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>

                <div className="flex-1">
                  <h4 className={`font-medium ${routine.completed ? 'text-green-700 line-through' : 'text-slate-800'}`}>
                    {routine.title}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="w-3 h-3" />
                    {routine.time}
                  </div>
                </div>

                {/* Timer button */}
                <button
                  onClick={() => startTimer(routine.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    isTimerActive ? 'bg-red-100 text-red-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {isTimerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => deleteRoutine(routine.id)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>

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

      {/* Suggested Routines */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('wellness.routines.suggestedRoutines')}</h3>
        <div className="space-y-3">
          {[
            { titleKey: 'wellness.routines.suggestions.morningStretch', time: '07:30', icon: Sun },
            { titleKey: 'wellness.routines.suggestions.lunchWalk', time: '12:00', icon: Coffee },
            { titleKey: 'wellness.routines.suggestions.weeklyReview', time: '18:00', icon: CalendarDays },
          ].map((suggestion, index) => {
            const title = t(suggestion.titleKey)
            const Icon = suggestion.icon
            return (
              <div
                key={index}
                className="flex items-center gap-4 p-3 rounded-lg border border-dashed border-slate-300 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer"
                onClick={() => {
                  setNewRoutine({ title, time: suggestion.time.includes(':') ? suggestion.time : '09:00' })
                  setIsAdding(true)
                }}
              >
                <Icon className="w-5 h-5 text-slate-400" />
                <div className="flex-1">
                  <p className="font-medium text-slate-700">{title}</p>
                  <p className="text-sm text-slate-500">{suggestion.time}</p>
                </div>
                <Plus className="w-4 h-4 text-slate-400" />
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
