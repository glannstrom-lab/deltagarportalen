/**
 * Smart Reminders Component
 * Visar och hanterar AI-genererade påminnelser
 */

import { useState, useEffect } from 'react'
import { 
  Bell, 
  Clock, 
  CheckCircle2, 
  X,
  Calendar,
  TrendingUp,
  AlertCircle,
  Zap,
  ChevronRight,
  Settings,
  Moon
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { 
  generateSmartReminders, 
  type Reminder,
  loadReminderPreferences,
  saveReminderPreferences,
  type ReminderPreferences
} from '@/services/notifications/reminderService'
import { useNavigate } from 'react-router-dom'

interface SmartRemindersProps {
  className?: string
  compact?: boolean
}

export function SmartReminders({ className, compact = false }: SmartRemindersProps) {
  const navigate = useNavigate()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [preferences, setPreferences] = useState<ReminderPreferences>(loadReminderPreferences())
  const [showSettings, setShowSettings] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Hämta användardata och generera påminnelser
    const loadReminders = () => {
      const savedJobs = JSON.parse(localStorage.getItem('saved-jobs') || '[]') as Array<{ savedAt?: string }>
      const applications = JSON.parse(localStorage.getItem('applications') || '[]') as Array<{ appliedAt?: string }>
      const goals = JSON.parse(localStorage.getItem('goals') || '[]') as Array<{ deadline?: string }>
      const lastLogin = new Date(localStorage.getItem('last-login') || Date.now())

      // Simulerad aktivitetsdata
      const activityPattern = new Array(24).fill(0).map((_, i) =>
        i >= 9 && i <= 17 ? Math.floor(Math.random() * 5) : 0
      )

      const userData = {
        savedJobs: savedJobs.map((j) => ({
          ...j,
          savedAt: new Date(j.savedAt || Date.now() - 6 * 24 * 60 * 60 * 1000)
        })),
        applications: applications.map((a) => ({
          ...a,
          appliedAt: new Date(a.appliedAt || Date.now() - 8 * 24 * 60 * 60 * 1000)
        })),
        goals: goals.map((g) => ({
          ...g,
          deadline: new Date(g.deadline || Date.now() + 3 * 24 * 60 * 60 * 1000)
        })),
        lastLogin,
        streakDays: parseInt(localStorage.getItem('streak-days') || '0'),
        activityPattern
      }

      const generated = generateSmartReminders(userData)
      setReminders(generated)
    }

    loadReminders()
    // Uppdatera varje timme
    const interval = setInterval(loadReminders, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]))
  }

  const handleComplete = (id: string) => {
    setReminders(prev => 
      prev.map(r => r.id === id ? { ...r, completed: true } : r)
    )
  }

  const handleAction = (reminder: Reminder) => {
    if (reminder.action) {
      navigate(reminder.action.url)
    }
  }

  const updatePreferences = (updates: Partial<ReminderPreferences>) => {
    const newPrefs = { ...preferences, ...updates }
    setPreferences(newPrefs)
    saveReminderPreferences(newPrefs)
  }

  const visibleReminders = reminders.filter(r => !dismissed.has(r.id) && !r.completed)
  const criticalCount = visibleReminders.filter(r => r.priority === 'high').length

  if (compact) {
    const topReminder = visibleReminders[0]
    if (!topReminder) return null

    return (
      <div className={cn('bg-white rounded-xl border border-slate-200 p-4', className)}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            topReminder.priority === 'high' ? 'bg-rose-100' :
            topReminder.priority === 'medium' ? 'bg-amber-100' : 'bg-blue-100'
          )}>
            {topReminder.priority === 'high' ? 
              <AlertCircle className="w-5 h-5 text-rose-600" /> :
              <Bell className="w-5 h-5 text-slate-600" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-800 text-sm truncate">{topReminder.title}</p>
            <p className="text-xs text-slate-700">
              {topReminder.dueDate < new Date(Date.now() + 24 * 60 * 60 * 1000) 
                ? 'Idag' 
                : 'Imorgon'}
            </p>
          </div>
          {topReminder.action && (
            <button
              onClick={() => handleAction(topReminder)}
              className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('bg-white rounded-2xl border border-slate-200 overflow-hidden', className)}>
      {/* Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Smart påminnelser</h3>
              <p className="text-sm text-slate-700">
                {criticalCount > 0 ? (
                  <span className="text-rose-600 font-medium">{criticalCount} brådskande</span>
                ) : (
                  `${visibleReminders.length} påminnelser`
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-slate-600 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="p-4 bg-slate-50 border-b border-slate-100 animate-in fade-in">
          <h4 className="font-medium text-slate-700 mb-3">Inställningar</h4>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Push-notiser</span>
              <input
                type="checkbox"
                checked={preferences.pushNotifications}
                onChange={(e) => updatePreferences({ pushNotifications: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Tysta timmar (22-08)</span>
              <input
                type="checkbox"
                checked={preferences.quietHours.enabled}
                onChange={(e) => updatePreferences({ 
                  quietHours: { ...preferences.quietHours, enabled: e.target.checked }
                })}
                className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
            </label>

            <div>
              <span className="text-sm text-slate-600 block mb-2">Frekvens</span>
              <select
                value={preferences.frequency}
                onChange={(e) => updatePreferences({ frequency: e.target.value as ReminderPreferences['frequency'] })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="smart">Smart (AI-driven)</option>
                <option value="daily">Dagligen</option>
                <option value="weekly">Veckovis</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Reminders list */}
      <div className="max-h-[400px] overflow-y-auto">
        {visibleReminders.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-slate-600 font-medium">Allt är uppdaterat!</p>
            <p className="text-sm text-slate-600 mt-1">
              Inga brådskande påminnelser just nu
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleReminders.map((reminder) => (
              <div
                key={reminder.id}
                className={cn(
                  'p-4 transition-colors hover:bg-slate-50',
                  reminder.priority === 'high' && 'bg-rose-50/50'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    reminder.type === 'application' && 'bg-blue-100',
                    reminder.type === 'followUp' && 'bg-amber-100',
                    reminder.type === 'deadline' && 'bg-rose-100',
                    reminder.type === 'milestone' && 'bg-emerald-100',
                    reminder.type === 'insight' && 'bg-teal-100'
                  )}>
                    {reminder.type === 'application' && <Briefcase className="w-5 h-5 text-blue-600" />}
                    {reminder.type === 'followUp' && <TrendingUp className="w-5 h-5 text-amber-600" />}
                    {reminder.type === 'deadline' && <Clock className="w-5 h-5 text-rose-600" />}
                    {reminder.type === 'milestone' && <Zap className="w-5 h-5 text-emerald-600" />}
                    {reminder.type === 'insight' && <Bell className="w-5 h-5 text-teal-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        reminder.priority === 'high' && 'bg-rose-100 text-rose-700',
                        reminder.priority === 'medium' && 'bg-amber-100 text-amber-700',
                        reminder.priority === 'low' && 'bg-slate-100 text-slate-600'
                      )}>
                        {reminder.priority === 'high' ? 'Brådskande' :
                         reminder.priority === 'medium' ? 'Viktigt' : 'Tips'}
                      </span>
                      <span className="text-xs text-slate-600">
                        {formatDueDate(reminder.dueDate)}
                      </span>
                    </div>

                    <h4 className="font-medium text-slate-800">{reminder.title}</h4>
                    <p className="text-sm text-slate-600 mt-0.5">{reminder.description}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      {reminder.action && (
                        <button
                          onClick={() => handleAction(reminder)}
                          className="px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                        >
                          {reminder.action.label}
                        </button>
                      )}
                      <button
                        onClick={() => handleComplete(reminder.id)}
                        className="px-3 py-1.5 text-emerald-600 text-sm font-medium hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        Markera klar
                      </button>
                      <button
                        onClick={() => handleDismiss(reminder.id)}
                        className="px-3 py-1.5 text-slate-600 text-sm hover:text-slate-600 ml-auto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function formatDueDate(date: Date): string {
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days < 0) return 'Försenad'
  if (days === 0) return 'Idag'
  if (days === 1) return 'Imorgon'
  if (days < 7) return `Om ${days} dagar`
  return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })
}

export default SmartReminders
