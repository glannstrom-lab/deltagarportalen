/**
 * FocusInterestGuideWizard — NPF-anpassad intresseguide-introduktion.
 *
 * Steg: vad gillar du att göra → vad är du bra på → klart (länkar till
 * fullständig RIASEC-test i normalvyn).
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Heart, Star, Smile } from '@/components/ui/icons'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

export function FocusInterestGuideWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [interests, setInterests] = useState('')
  const [strengths, setStrengths] = useState('')

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    {
      id: 'interests',
      icon: Heart,
      title: t('focus.interest.interestsTitle', 'Vad gillar du att göra?'),
      hint: t('focus.interest.interestsHint', 'På jobbet eller på fritiden.'),
    },
    {
      id: 'strengths',
      icon: Star,
      title: t('focus.interest.strengthsTitle', 'Vad är du extra bra på?'),
      hint: t('focus.interest.strengthsHint', 'Något du gör utan att tänka på det.'),
    },
    {
      id: 'done',
      icon: Smile,
      title: t('focus.interest.doneTitle', 'Bra start!'),
    },
  ] as const

  const current = STEPS[step]
  return (
    <FocusWizardFrame
      steps={STEPS}
      current={step}
      onNext={async () => {
        if (current.id === 'done') { onExit(); return }
        setStep((s) => s + 1)
      }}
      onBack={() => setStep((s) => Math.max(s - 1, 0))}
      onExit={onExit}
      canNext={current.id === 'interests'
        ? interests.trim().length > 0
        : current.id === 'strengths'
          ? strengths.trim().length > 0
          : true}
    >
      {current.id === 'interests' && (
        <textarea
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          rows={5}
          placeholder={t('focus.interest.interestsPlaceholder', 't.ex. att hjälpa människor, organisera saker, jobba utomhus')}
          className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50 resize-none"
          autoFocus
        />
      )}
      {current.id === 'strengths' && (
        <textarea
          value={strengths}
          onChange={(e) => setStrengths(e.target.value)}
          rows={5}
          placeholder={t('focus.interest.strengthsPlaceholder', 't.ex. lyssna på andra, lösa problem, vara noga med detaljer')}
          className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50 resize-none"
          autoFocus
        />
      )}
      {current.id === 'done' && (
        <p className="text-stone-600 dark:text-stone-300">
          {t('focus.interest.doneText', 'Bra start! Öppna intresseguiden i normalläge för att göra hela RIASEC-testet och se yrken som passar dig.')}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusInterestGuideWizard
