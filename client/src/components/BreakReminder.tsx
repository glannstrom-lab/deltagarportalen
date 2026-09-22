import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Coffee, X, Clock, CheckCircle } from '@/components/ui/icons'
import { useSettingsStore } from '../stores/settingsStore'
import { useFocusTrap } from '@/hooks/useFocusTrap'

const PAUSE_TIMEOUT = 60 * 1000 // 1 minut inaktivitet = paus

// Pausförslagen — nycklar under breakReminder.suggestions.
const FORSLAG = ['stretch', 'walk', 'water', 'window', 'breathe', 'rest'] as const

interface BreakReminderProps {
  workDuration?: number // minuter, default 15
}

export default function BreakReminder({ workDuration = 15 }: BreakReminderProps) {
  const { t } = useTranslation()
  const { calmMode } = useSettingsStore()
  // Satt = användaren har valt "Ja, ta en paus" och dialogen visar ett förslag.
  const [pausForslag, setPausForslag] = useState<(typeof FORSLAG)[number] | null>(null)
  const [showReminder, setShowReminder] = useState(false)
  const [secondsActive, setSecondsActive] = useState(0)
  // En ref, inte state. Som state startade varje musrörelse om räkneintervallet
  // nedan (det låg i dess beroenden) — och ett intervall som startas om oftare
  // än en gång i sekunden tickar aldrig. Den som faktiskt arbetade, med musen
  // eller tangentbordet, fick alltså aldrig någon pauspåminnelse; räknaren gick
  // bara under stilla stunder. (2026-09-22)
  // Sätts när spårningen startar (nedan) — Date.now() får inte anropas under render.
  const lastActiveRef = useRef(0)
  const [isPaused, setIsPaused] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const REMINDER_INTERVAL = workDuration * 60 // sekunder

  // Spåra användaraktivitet
  useEffect(() => {
    if (!calmMode || dismissed) return

    lastActiveRef.current = Date.now()
    const handleActivity = () => {
      lastActiveRef.current = Date.now()
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
      const inactive = now - lastActiveRef.current

      // Om inaktiv i mer än 1 minut, pausa räknaren
      if (inactive > PAUSE_TIMEOUT) {
        setIsPaused(true)
      } else {
        setIsPaused(false)
        setSecondsActive(prev => {
          const newValue = prev + 1
          // Visa påminnelse när det är dags för paus
          if (newValue >= REMINDER_INTERVAL) {
            setShowReminder(true)
          }
          return newValue
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [calmMode, dismissed, REMINDER_INTERVAL])

  // Rensa dismiss timeout vid unmount
  useEffect(() => {
    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current)
      }
    }
  }, [])

  const dismissReminder = useCallback(() => {
    setShowReminder(false)
    setPausForslag(null)
    setSecondsActive(0)
    setDismissed(true)

    // Rensa eventuell tidigare timeout
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current)
    }

    // Återaktivera påminnelser efter 5 minuter
    dismissTimeoutRef.current = setTimeout(() => {
      setDismissed(false)
    }, 5 * 60 * 1000)
  }, [])

  // Förr: `alert()` med "Allt sparas automatiskt" — en blockerande
  // webbläsarruta, och ett löfte som inte stämmer (flera formulär sparar först
  // på Spara). Nu visas förslaget i samma dialog, och ingenting lovas om sparning.
  const takeBreak = useCallback(() => {
    setSecondsActive(0)
    setPausForslag(FORSLAG[Math.floor(Math.random() * FORSLAG.length)])
  }, [])

  const tillbakaFranPaus = useCallback(() => {
    setPausForslag(null)
    setShowReminder(false)
    setSecondsActive(0)
  }, [])

  // Påminnelsen är en modal: fokus in, Tab stannar kvar, Esc = "Fortsätt jobba",
  // och fokus tillbaka dit användaren var. Den saknade alla fyra.
  const dialogRef = useFocusTrap<HTMLDivElement>(calmMode && showReminder, {
    onEscape: pausForslag ? tillbakaFranPaus : dismissReminder,
  })

  // Visa inte om lugn läge inte är aktivt
  if (!calmMode) return null

  // Visa inte om påminnelsen inte ska visas än
  if (!showReminder) {
    // Visa liten indikator om hur långt det är kvar
    if (secondsActive > REMINDER_INTERVAL * 0.5 && !isPaused) {
      const minutesLeft = Math.ceil((REMINDER_INTERVAL - secondsActive) / 60)
      return (
        <div className="fixed bottom-24 right-6 z-30 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-stone-200 dark:border-stone-700 text-sm text-stone-600 dark:text-stone-300 flex items-center gap-2">
          <Clock size={14} aria-hidden="true" />
          {t('breakReminder.breakIn', { count: minutesLeft })}
        </div>
      )
    }
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pauspaminnelse-rubrik"
        className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-md w-full p-6"
      >
        {/* Icon */}
        <div className="w-16 h-16 bg-[var(--c-accent)]/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <Coffee className="w-8 h-8 text-[var(--c-text)]" aria-hidden="true" />
        </div>

        {pausForslag ? (
          <>
            <h2 id="pauspaminnelse-rubrik" className="text-xl font-bold text-stone-900 dark:text-stone-100 text-center mb-2">
              {t('breakReminder.pauseHeading')}
            </h2>
            <div className="p-4 bg-[var(--c-bg)] rounded-xl mb-6">
              <p className="text-sm text-[var(--c-text)] font-medium text-center">
                {t(`breakReminder.suggestions.${pausForslag}`)}
              </p>
            </div>
            <button
              type="button"
              onClick={tillbakaFranPaus}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--c-solid)] text-white rounded-xl font-semibold hover:bg-[var(--c-text)] transition-colors"
            >
              <CheckCircle size={18} aria-hidden="true" />
              {t('breakReminder.back')}
            </button>
          </>
        ) : (
          <>
            <h2 id="pauspaminnelse-rubrik" className="text-xl font-bold text-stone-900 dark:text-stone-100 text-center mb-2">
              {t('breakReminder.heading')}
            </h2>
            <p className="text-stone-600 dark:text-stone-300 text-center mb-6">
              {t('breakReminder.body', { count: workDuration })}
            </p>

            <div className="p-4 bg-[var(--c-bg)] rounded-xl mb-6">
              <p className="text-sm text-[var(--c-text)] font-medium">
                {t('breakReminder.tip')}
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={takeBreak}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--c-solid)] text-white rounded-xl font-semibold hover:bg-[var(--c-text)] transition-colors"
              >
                <CheckCircle size={18} aria-hidden="true" />
                {t('breakReminder.takeBreak')}
              </button>

              <button
                type="button"
                onClick={dismissReminder}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-xl font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              >
                <X size={18} aria-hidden="true" />
                {t('breakReminder.keepWorking')}
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400 text-center mt-4">
              {t('breakReminder.note')}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
