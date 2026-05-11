/**
 * FocusCareerWizard — NPF-anpassad karriärplanering.
 *
 * Steg: var ser du dig om 5 år → ett konkret första steg → spara.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { Target, Footprints, Smile, CheckCircle2 } from '@/components/ui/icons'
import { careerPlanApi } from '@/services/careerApi'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

export function FocusCareerWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [vision, setVision] = useState('')
  const [firstStep, setFirstStep] = useState('')
  const [saved, setSaved] = useState(false)

  const saveMutation = useMutation({
    mutationFn: async () => {
      return careerPlanApi.create({
        current_situation: t('focus.career.currentSituationLabel', 'Min nuvarande situation (skapad i fokusläge)'),
        goal: `${vision.trim()}\n\nFörsta steget: ${firstStep.trim()}`,
        timeframe: '5_years',
      })
    },
    onSuccess: () => setSaved(true),
  })

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    {
      id: 'vision',
      icon: Target,
      title: t('focus.career.visionTitle', 'Var vill du vara om 5 år?'),
      hint: t('focus.career.visionHint', 'En kort dröm räcker — ord, inte siffror.'),
    },
    {
      id: 'first',
      icon: Footprints,
      title: t('focus.career.firstTitle', 'Vad kan du göra först?'),
      hint: t('focus.career.firstHint', 'Något litet och konkret. Idag eller imorgon.'),
    },
    {
      id: 'done',
      icon: Smile,
      title: t('focus.career.doneTitle', 'Bra plan! Vi sparar den.'),
    },
  ] as const

  const current = STEPS[step]

  return (
    <FocusWizardFrame
      steps={STEPS}
      current={step}
      onNext={async () => {
        if (current.id === 'done') {
          try { await saveMutation.mutateAsync() } catch (err) { console.error('Career save failed', err) }
          onExit()
          return
        }
        setStep((s) => s + 1)
      }}
      onBack={() => setStep((s) => Math.max(s - 1, 0))}
      onExit={onExit}
      canNext={current.id === 'vision'
        ? vision.trim().length > 0
        : current.id === 'first'
          ? firstStep.trim().length > 0
          : true}
      busy={saveMutation.isPending}
      finishLabel={t('focus.career.saveCta', 'Spara plan')}
    >
      {current.id === 'vision' && (
        <textarea
          value={vision}
          onChange={(e) => setVision(e.target.value)}
          rows={4}
          placeholder={t('focus.career.visionPlaceholder', 't.ex. Jag jobbar i en kreativ roll där jag får hjälpa andra.')}
          className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50 resize-none"
          autoFocus
        />
      )}
      {current.id === 'first' && (
        <textarea
          value={firstStep}
          onChange={(e) => setFirstStep(e.target.value)}
          rows={4}
          placeholder={t('focus.career.firstPlaceholder', 't.ex. Skicka ett mejl till min konsulent för att prata om mål.')}
          className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50 resize-none"
          autoFocus
        />
      )}
      {current.id === 'done' && (
        <div className="space-y-3">
          {saved ? (
            <div className="flex items-center gap-2 text-stone-700 dark:text-stone-200">
              <CheckCircle2 className="w-5 h-5 text-[var(--c-solid)]" />
              {t('focus.career.savedText', 'Sparat!')}
            </div>
          ) : (
            <p className="text-stone-600 dark:text-stone-300">
              {t('focus.career.readyText', 'Vi sparar planen till din karriärsida när du trycker på "Spara plan".')}
            </p>
          )}
        </div>
      )}
    </FocusWizardFrame>
  )
}

export default FocusCareerWizard
