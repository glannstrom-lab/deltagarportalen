/**
 * FocusWellnessWizard — NPF-anpassad incheckning för energi/mående.
 *
 * Steg: energi nu (1-5) → varför kanske → ett litet nästa-steg.
 * Sparar via moodLogsApi.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { Smile, BatteryMedium, MessageSquare, ArrowRight, CheckCircle2 } from '@/components/ui/icons'
import { moodLogsApi } from '@/services/diaryApi'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

export function FocusWellnessWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [energy, setEnergy] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [nextStep, setNextStep] = useState('')
  const [saved, setSaved] = useState(false)

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (energy == null) return
      return moodLogsApi.upsert({
        log_date: new Date().toISOString().slice(0, 10),
        mood_level: energy,
        energy_level: energy,
        stress_level: null,
        sleep_quality: null,
        activities: [],
        note: `${reason ? `Varför: ${reason}\n` : ''}${nextStep ? `Nästa steg: ${nextStep}` : ''}`.trim() || null,
      })
    },
    onSuccess: () => setSaved(true),
  })

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    {
      id: 'energy',
      icon: BatteryMedium,
      title: t('focus.wellness.energyTitle', 'Hur mycket energi har du just nu?'),
      hint: t('focus.wellness.energyHint', '1 är väldigt lite, 5 är mycket.'),
    },
    {
      id: 'reason',
      icon: MessageSquare,
      title: t('focus.wellness.reasonTitle', 'Vad tror du beror det på?'),
      hint: t('focus.wellness.reasonHint', 'Ett ord eller en mening räcker. Du kan hoppa över.'),
    },
    {
      id: 'next',
      icon: ArrowRight,
      title: t('focus.wellness.nextTitle', 'En liten sak du kan göra nu?'),
      hint: t('focus.wellness.nextHint', 'Något snällt mot dig själv. T.ex. ett glas vatten.'),
    },
    {
      id: 'done',
      icon: Smile,
      title: t('focus.wellness.doneTitle', 'Bra att du checkade in'),
    },
  ] as const

  const current = STEPS[step]

  return (
    <FocusWizardFrame
      steps={STEPS}
      current={step}
      onNext={async () => {
        if (current.id === 'done') {
          try { await saveMutation.mutateAsync() } catch (err) { console.error(err) }
          onExit()
          return
        }
        setStep((s) => s + 1)
      }}
      onBack={() => setStep((s) => Math.max(s - 1, 0))}
      onExit={onExit}
      canNext={current.id === 'energy' ? energy != null : true}
      busy={saveMutation.isPending}
    >
      {current.id === 'energy' && (
        <div className="flex justify-between gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setEnergy(n)}
              className={`flex-1 py-4 rounded-xl text-xl font-semibold border-2 ${
                energy === n
                  ? 'border-[var(--c-solid)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20 text-[var(--c-text)]'
                  : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {current.id === 'reason' && (
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder={t('focus.wellness.reasonPlaceholder', 't.ex. sov dåligt, mycket att tänka på')}
          className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50 resize-none"
          autoFocus
        />
      )}

      {current.id === 'next' && (
        <input
          type="text"
          value={nextStep}
          onChange={(e) => setNextStep(e.target.value)}
          placeholder={t('focus.wellness.nextPlaceholder', 't.ex. dricka vatten, gå ut 5 minuter')}
          className="w-full px-4 py-3 text-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50"
          autoFocus
        />
      )}

      {current.id === 'done' && (
        <div className="space-y-3">
          {saved ? (
            <div className="flex items-center gap-2 text-stone-700 dark:text-stone-200">
              <CheckCircle2 className="w-5 h-5 text-[var(--c-solid)]" />
              {t('focus.wellness.savedText', 'Tack — sparat i din dagbok.')}
            </div>
          ) : (
            <p className="text-stone-600 dark:text-stone-300">
              {t('focus.wellness.readyText', 'Vi sparar din incheckning i din dagbok.')}
            </p>
          )}
        </div>
      )}
    </FocusWizardFrame>
  )
}

export default FocusWellnessWizard
