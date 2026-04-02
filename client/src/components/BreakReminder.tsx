import { useState, useEffect, useCallback } from 'react'
import { Coffee, X, Clock, CheckCircle } from '@/components/ui/icons'
import { useSettingsStore } from '../stores/settingsStore'

interface BreakReminderProps {
  workDuration?: number // minuter, default 15
}

export default function BreakReminder({ workDuration = 15 }: BreakReminderProps) {
  const { calmMode } = useSettingsStore()
  const [showReminder, setShowReminder] = useState(false)
  const [secondsActive, setSecondsActive] = useState(0)
  const [lastActiveTime, setLastActiveTime] = useState(Date.now())
  const [isPaused, setIsPaused] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const REMINDER_INTERVAL = workDuration * 60 // sekunder
  const PAUSE_TIMEOUT = 60 * 1000 // 1 minut inaktivitet = paus

  // Spåra användaraktivitet
  useEffect(() => {
    if (!calmMode || dismissed) return

    const handleActivity = () => {
      setLastActiveTime(Date.now())
      setIsPaused(false)
    }

    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('click', handleActivity)
    window.addEventListener('scroll', handleActivity)

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('scroll', handleActivity)
    }
  }, [calmMode, dismissed])

  // Räkna aktiv tid
  useEffect(() => {
    if (!calmMode || dismissed) return

    const interval = setInterval(() => {
      const now = Date.now()
      const inactive = now - lastActiveTime

      // Om inaktiv i mer än 1 minut, pausa räknaren
      if (inactive > PAUSE_TIMEOUT) {
        setIsPaused(true)
      } else {
        setIsPaused(false)
        setSecondsActive(prev => {
          const newValue = prev + 1
          // Visa påminnelse när det är dags för paus
          if (newValue >= REMINDER_INTERVAL && !showReminder) {
            setShowReminder(true)
          }
          return newValue
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [calmMode, dismissed, lastActiveTime, REMINDER_INTERVAL, showReminder])

  const dismissReminder = useCallback(() => {
    setShowReminder(false)
    setSecondsActive(0)
    setDismissed(true)
    
    // Återaktivera påminnelser efter 5 minuter
    setTimeout(() => {
      setDismissed(false)
    }, 5 * 60 * 1000)
  }, [])

  const takeBreak = useCallback(() => {
    setShowReminder(false)
    setSecondsActive(0)
    
    // Förslag på pausaktiviteter
    const suggestions = [
      'Sträck på dig och rör på nacken',
      'Gå en kort promenad',
      'Drick ett glas vatten',
      'Titta ut genom fönstret i 30 sekunder',
      'Gör några djupa andetag',
      'Stäng ögonen och vila i en minut',
    ]
    
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)]
    alert(`🌿 Pausförslag: ${randomSuggestion}\n\nTa den tid du behöver. Allt sparas automatiskt.`)
  }, [])

  // Visa inte om lugn läge inte är aktivt
  if (!calmMode) return null

  // Visa inte om påminnelsen inte ska visas än
  if (!showReminder) {
    // Visa liten indikator om hur långt det är kvar
    if (secondsActive > REMINDER_INTERVAL * 0.5 && !isPaused) {
      const minutesLeft = Math.ceil((REMINDER_INTERVAL - secondsActive) / 60)
      return (
        <div className="fixed bottom-24 right-6 z-30 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-slate-200 text-sm text-slate-600 flex items-center gap-2">
          <Clock size={14} />
          Paus om {minutesLeft} min
        </div>
      )
    }
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Coffee className="w-8 h-8 text-teal-600" />
        </div>

        {/* Content */}
        <h2 className="text-xl font-bold text-slate-900 text-center mb-2">
          Dags för en paus?
        </h2>
        <p className="text-slate-600 text-center mb-6">
          Du har varit aktiv i {workDuration} minuter. Det är okej att ta en paus - 
          allt sparas automatiskt.
        </p>

        {/* Suggestion */}
        <div className="p-4 bg-teal-50 rounded-xl mb-6">
          <p className="text-sm text-teal-800 font-medium">
            💡 Förslag: Sträck på dig, drick vatten, eller titta ut genom fönstret.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={takeBreak}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
          >
            <CheckCircle size={18} />
            Ja, ta en paus
          </button>
          
          <button
            onClick={dismissReminder}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
          >
            <X size={18} />
            Fortsätt jobba
          </button>
        </div>

        {/* Gentle note */}
        <p className="text-xs text-slate-400 text-center mt-4">
          Du kan alltid pausa när du vill. Din hälsa är viktigare än något jobb.
        </p>
      </div>
    </div>
  )
}
