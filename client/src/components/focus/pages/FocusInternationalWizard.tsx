/**
 * FocusInternationalWizard — NPF-anpassad ingång till "Ny i Sverige".
 *
 * Guiden frågade tidigare "vilket språk kan du jobba på?" och "vilket land
 * funderar du på?" — två frågor om att flytta UT ur Sverige, på en sida som
 * handlar om att komma i arbete här. Svaren gick dessutom ingenstans: de låg i
 * lokal state, användes för att interpolera en sluttext, och kastades vid
 * `onExit`. Sista raden var "öppna internationella sidan i normalläge för fler
 * tips om {{country}}" — alltså en guide som slutade med att be användaren
 * göra om det på ett annat ställe.
 *
 * Nu gör guiden en sak: låter användaren välja vad hen vill ta tag i, och
 * öppnar den fliken. Ett val, ett resultat.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Smile } from '@/components/ui/icons'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

type Del = 'validation' | 'firstSteps' | 'language'

const RUTTER: Record<Del, string> = {
  validation: '/international',
  firstSteps: '/international/integration',
  language: '/international/language',
}

const VAL: { id: Del; nyckel: string }[] = [
  { id: 'validation', nyckel: 'focus.intl.optionValidation' },
  { id: 'firstSteps', nyckel: 'focus.intl.optionFirstSteps' },
  { id: 'language', nyckel: 'focus.intl.optionLanguage' },
]

interface Props {
  /** Öppnar den valda fliken i normalvyn. */
  onOppna: (rutt: string) => void
  onExit: () => void
}

export function FocusInternationalWizard({ onOppna, onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [del, setDel] = useState<Del>('firstSteps')

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    { id: 'val', icon: Globe, title: t('focus.intl.introTitle') },
    { id: 'done', icon: Smile, title: t('focus.intl.doneTitle') },
  ] as const

  const current = STEPS[step]

  return (
    <FocusWizardFrame
      steps={STEPS}
      current={step}
      onNext={async () => {
        if (current.id === 'done') {
          onOppna(RUTTER[del])
          return
        }
        setStep((s) => s + 1)
      }}
      onBack={() => setStep((s) => Math.max(s - 1, 0))}
      onExit={onExit}
      canNext
    >
      {current.id === 'val' && (
        <ul className="space-y-2">
          {VAL.map((v) => {
            const vald = del === v.id
            return (
              <li key={v.id}>
                <button
                  type="button"
                  aria-pressed={vald}
                  onClick={() => setDel(v.id)}
                  className={`w-full px-4 py-4 rounded-xl text-left border-2 min-h-[48px] ${
                    vald
                      ? 'border-[var(--c-solid)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20'
                      : 'border-stone-200 dark:border-stone-700'
                  }`}
                >
                  <span className="text-base text-stone-800 dark:text-stone-100">{t(v.nyckel)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {current.id === 'done' && (
        <p className="text-stone-600 dark:text-stone-300" role="status" aria-live="polite">
          {t('focus.intl.doneText', { part: t(VAL.find((v) => v.id === del)!.nyckel) })}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusInternationalWizard
