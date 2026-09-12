/**
 * FocusStaWizard — NPF-anpassat fokusläge för Steg till arbete (ROADMAP G3b)
 *
 * Deltagarvyn för STA är en tät sida: hero, tidslinje, fem flikar, dagsslinga,
 * obligatoriska aktiviteter, pulskoll, frånvaro, konsulentkort. För en deltagare
 * med ADHD eller autism är det precis den sortens yta fokusläget finns för att
 * skala bort — och STA var en av två sidor som saknade det (G3 tog CV).
 *
 * Fokusläget visar därför bara två saker, i tur och ordning:
 *   1. Dagens övning ur dagsslingan — titel, tidsåtgång, plats för reflektion
 *   2. Dagens pulskoll — energi och mående
 *
 * Allt annat (flikar, tidslinje, statistik, framtida delar) är borta. Det är
 * inte en förenklad kopia av sidan; det är dagens uppgift och inget mer.
 *
 * Skriver till samma tabeller som normalvyn (`sta_activities`,
 * `sta_pulse_checks`) via samma hooks — ingen parallell datamodell.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ClipboardCheck, HeartPulse, CheckCircle2 } from '@/components/ui/icons'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'
import { PulseCheckWidget } from '@/pages/sta/components/PulseCheckWidget'
import {
  useParticipantEnrollment,
  useStaActivities,
  useStaPulseChecks,
} from '@/hooks/useSta'
import { DAILY_EXERCISES_DEL1 } from '@/pages/sta/mockData'

interface Props {
  onExit: () => void
}

/** Antal vardagar sedan start, 1-indexerat och kapat till programmets längd. */
function programDay(startedAt: string, total: number): number {
  const start = new Date(startedAt)
  start.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let weekdays = 0
  const cursor = new Date(start)
  while (cursor <= today) {
    const d = cursor.getDay()
    if (d !== 0 && d !== 6) weekdays++
    cursor.setDate(cursor.getDate() + 1)
  }
  return Math.min(Math.max(1, weekdays), total)
}

export function FocusStaWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [reflection, setReflection] = useState('')
  const [saving, setSaving] = useState(false)

  const { enrollment, loading } = useParticipantEnrollment()
  const enrollmentId = enrollment?.id ?? null
  const { activities, markDayComplete } = useStaActivities(enrollmentId, 1)
  // hasToday kommer från hooken — samma källa som normalvyn använder, i stället
  // för att jämföra datum själv (tidszonsfällor).
  const { hasToday: hasPulseToday, submitToday: submitPulse } = useStaPulseChecks(enrollmentId)

  // Ingen inskrivning → ingen uppgift att fokusera på. Säg det lugnt i stället
  // för att visa en tom wizard.
  if (!loading && !enrollment) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 pt-8">
        <p className="text-stone-700 dark:text-stone-200">
          {t(
            'focus.sta.noEnrollment',
            'Du är inte inskriven i någon arbetsprövning just nu. Här dyker din dag upp när du är det.'
          )}
        </p>
        <button
          type="button"
          onClick={onExit}
          className="py-3 px-6 rounded-xl bg-[var(--c-solid)] text-white font-semibold"
        >
          {t('focus.exit', 'Avsluta fokusläge')}
        </button>
      </div>
    )
  }

  if (loading || !enrollment) return null

  const day = programDay(enrollment.started_at, DAILY_EXERCISES_DEL1.length)
  const exercise = DAILY_EXERCISES_DEL1.find((e) => e.day === day) ?? DAILY_EXERCISES_DEL1[0]
  const activityKey = `dag-${exercise.day}`
  const alreadyDone = activities.some(
    (a) => a.activity_key === activityKey && a.completed_at
  )

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    {
      id: 'exercise',
      icon: ClipboardCheck,
      title: t('focus.sta.exerciseTitle', 'Dagens övning'),
      hint: t('focus.sta.dayOf', {
        defaultValue: 'Dag {{day}} av {{total}}',
        day: exercise.day,
        total: DAILY_EXERCISES_DEL1.length,
      }),
    },
    {
      id: 'pulse',
      icon: HeartPulse,
      title: t('focus.sta.pulseTitle', 'Hur känns dagen?'),
      hint: t('focus.sta.pulseHint', 'Bara du och din konsulent ser det här.'),
    },
  ] as const

  const current = STEPS[step]

  const handleNext = async () => {
    if (current.id === 'exercise') {
      // Autosave enligt fokuslägets kontrakt (punkt 8): svaret får inte
      // försvinna om deltagaren avbryter. Redan avklarad dag skrivs inte om.
      if (!alreadyDone) {
        setSaving(true)
        try {
          await markDayComplete(activityKey, reflection.trim() || undefined)
        } catch {
          // Sparfel ska inte blockera vägen vidare till pulskollen — men vi
          // låtsas inte heller att det gick bra: dagen står kvar som ogjord
          // i normalvyn, vilket är det ärliga utfallet.
        } finally {
          setSaving(false)
        }
      }
      setStep(1)
      return
    }
    onExit()
  }

  return (
    <FocusWizardFrame
      steps={STEPS}
      current={step}
      onNext={handleNext}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onExit={onExit}
      busy={saving}
      finishLabel={t('focus.sta.finish', 'Klar för idag')}
    >
      {current.id === 'exercise' && (
        <div className="space-y-4">
          <div>
            <p className="text-lg font-medium text-stone-800 dark:text-stone-100">
              {exercise.title}
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              {t('focus.sta.duration', {
                defaultValue: 'Cirka {{min}} minuter',
                min: exercise.durationMin,
              })}
            </p>
          </div>

          {alreadyDone ? (
            <p className="flex items-center gap-2 text-stone-700 dark:text-stone-200">
              <CheckCircle2 className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
              {t('focus.sta.alreadyDone', 'Den här dagen har du redan gjort. Fint.')}
            </p>
          ) : (
            <div>
              <label
                htmlFor="focus-sta-reflection"
                className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2"
              >
                {t('focus.sta.reflectionLabel', 'Vill du skriva något om dagen?')}
              </label>
              <textarea
                id="focus-sta-reflection"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                rows={5}
                placeholder={t('focus.sta.reflectionPlaceholder', 'Det är helt okej att lämna tomt.')}
                className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50 resize-none"
              />
            </div>
          )}
        </div>
      )}

      {current.id === 'pulse' && (
        <PulseCheckWidget
          hasToday={hasPulseToday}
          onSubmit={(energy, mood, comment) => submitPulse(energy, mood, comment)}
        />
      )}
    </FocusWizardFrame>
  )
}

export default FocusStaWizard
