/**
 * FocusExercisesWizard — NPF-anpassad övning/avslappning.
 *
 * Steg: välj övning → timer kör → klart.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Dumbbell, Timer, Smile } from '@/components/ui/icons'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

const EXERCISES = [
  { id: 'breath', labelKey: 'focus.exercises.breath', labelDefault: 'Andningsövning (1 min)', seconds: 60 },
  { id: 'stretch', labelKey: 'focus.exercises.stretch', labelDefault: 'Lätt sträckning (2 min)', seconds: 120 },
  { id: 'walk', labelKey: 'focus.exercises.walk', labelDefault: 'Promenad-paus (5 min)', seconds: 300 },
] as const

export function FocusExercisesWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<typeof EXERCISES[number] | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running || remaining <= 0) return
    const id = setTimeout(() => setRemaining((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [running, remaining])

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    {
      id: 'choose',
      icon: Dumbbell,
      title: t('focus.exercises.chooseTitle', 'Välj en övning'),
    },
    {
      id: 'timer',
      icon: Timer,
      title: t('focus.exercises.timerTitle', 'Gör övningen i ditt eget tempo'),
    },
    {
      id: 'done',
      icon: Smile,
      title: t('focus.exercises.doneTitle', 'Bra jobbat!'),
    },
  ] as const

  const current = STEPS[step]

  return (
    <FocusWizardFrame
      steps={STEPS}
      current={step}
      onNext={async () => {
        if (current.id === 'choose') {
          if (selected) {
            setRemaining(selected.seconds)
            setRunning(true)
          }
          setStep(1)
          return
        }
        if (current.id === 'timer') {
          setRunning(false)
          setStep(2)
          return
        }
        onExit()
      }}
      onBack={() => setStep((s) => Math.max(s - 1, 0))}
      onExit={onExit}
      canNext={current.id === 'choose' ? selected != null : true}
      nextLabel={current.id === 'timer' && remaining > 0 ? t('focus.exercises.skipTimer', 'Klar redan') : undefined}
    >
      {current.id === 'choose' && (
        <div className="space-y-2">
          {EXERCISES.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => setSelected(ex)}
              className={`w-full px-4 py-4 rounded-xl text-left border-2 ${
                selected?.id === ex.id
                  ? 'border-[var(--c-solid)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20'
                  : 'border-stone-200 dark:border-stone-700'
              }`}
            >
              <span className="text-base text-stone-800 dark:text-stone-100">
                {t(ex.labelKey, ex.labelDefault)}
              </span>
            </button>
          ))}
        </div>
      )}

      {current.id === 'timer' && (
        <div className="text-center py-6">
          <div className="text-6xl font-bold text-[var(--c-solid)] mb-3">
            {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
          </div>
          <p className="text-stone-600 dark:text-stone-300">
            {remaining > 0
              ? t('focus.exercises.timerHint', 'Andas lugnt och gör övningen.')
              : t('focus.exercises.timerDone', 'Tiden är ute — bra jobbat!')}
          </p>
        </div>
      )}

      {current.id === 'done' && (
        <p className="text-stone-600 dark:text-stone-300">
          {t('focus.exercises.doneText', 'Bra! Små pauser hjälper dig hålla i längre.')}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusExercisesWizard
