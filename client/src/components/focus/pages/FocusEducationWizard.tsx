/**
 * FocusEducationWizard — NPF-anpassad utbildningssök.
 *
 * Steg: vad intresserar dig → klart.
 *
 * Guiden LÄMNAR ÖVER det användaren skrev. Till 2026-08-22 gjorde den inte
 * det: sista steget sa "Öppna utbildningssidan i normalläge för att se
 * utbildningar inom X" — till en användare som redan stod på utbildningssidan
 * — och `interest` levde bara i lokalt state och kastades vid avslut.
 * Guiden bad om en uppgift, upprepade den vid namn, och slängde den.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GraduationCap, Smile } from '@/components/ui/icons'
import { FOCUS_WIZARD_TITLE_ID, FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
  /** Körs med det användaren skrev när guiden avslutas. Sidan sätter det
   *  som sökord i normalvyn, som ligger kvar monterad bakom guiden. */
  onSok?: (fraga: string) => void
}

export function FocusEducationWizard({ onExit, onSok }: Props) {
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
          const fraga = interest.trim()
          if (fraga) onSok?.(fraga)
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
          aria-labelledby={FOCUS_WIZARD_TITLE_ID}
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
            'Vi söker efter utbildningar inom "{{interest}}" åt dig. Tryck på Klar så visas träffarna.',
            { interest: interest || 'ditt intresse' }
          )}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusEducationWizard
