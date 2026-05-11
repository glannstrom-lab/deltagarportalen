/**
 * FocusEducationWizard — NPF-anpassad utbildningssök.
 *
 * Steg: vad intresserar dig → klart (länkar till sökresultat i normalvyn).
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GraduationCap, Smile } from '@/components/ui/icons'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

export function FocusEducationWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [interest, setInterest] = useState('')

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    {
      id: 'interest',
      icon: GraduationCap,
      title: t('focus.education.interestTitle', 'Vad vill du lära dig?'),
      hint: t('focus.education.interestHint', 'Ett ämne eller en yrkesroll räcker.'),
    },
    {
      id: 'done',
      icon: Smile,
      title: t('focus.education.doneTitle', 'Klart!'),
    },
  ] as const

  const current = STEPS[step]

  return (
    <FocusWizardFrame
      steps={STEPS}
      current={step}
      onNext={async () => {
        if (current.id === 'done') {
          onExit()
          return
        }
        setStep((s) => s + 1)
      }}
      onBack={() => setStep((s) => Math.max(s - 1, 0))}
      onExit={onExit}
      canNext={current.id === 'interest' ? interest.trim().length > 0 : true}
    >
      {current.id === 'interest' && (
        <input
          type="text"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          placeholder={t('focus.education.interestPlaceholder', 't.ex. webbutveckling, vård, ekonomi')}
          className="w-full px-4 py-3 text-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50"
          autoFocus
        />
      )}

      {current.id === 'done' && (
        <p className="text-stone-600 dark:text-stone-300">
          {t(
            'focus.education.doneText',
            'Öppna utbildningssidan i normalläge för att se utbildningar inom "{{interest}}".',
            { interest: interest || 'ditt intresse' }
          )}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusEducationWizard
