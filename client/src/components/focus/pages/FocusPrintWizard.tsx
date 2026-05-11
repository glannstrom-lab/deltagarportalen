/**
 * FocusPrintWizard — NPF-anpassad val av utskrivbar resurs.
 *
 * Steg: vilken resurs → klart (öppna och skriv ut i normalvyn).
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Printer, Smile } from '@/components/ui/icons'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

const OPTIONS = [
  { id: 'cv-checklist', labelKey: 'focus.print.cv', labelDefault: 'CV-checklista' },
  { id: 'interview-prep', labelKey: 'focus.print.interview', labelDefault: 'Intervju-förberedelse' },
  { id: 'daily-plan', labelKey: 'focus.print.daily', labelDefault: 'Dagsplanerare' },
  { id: 'goals', labelKey: 'focus.print.goals', labelDefault: 'Målsättning vecka' },
] as const

export function FocusPrintWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [pick, setPick] = useState<string | null>(null)

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    { id: 'pick', icon: Printer, title: t('focus.print.pickTitle', 'Vilken resurs vill du skriva ut?') },
    { id: 'done', icon: Smile, title: t('focus.print.doneTitle', 'Bra val!') },
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
      canNext={current.id === 'pick' ? pick != null : true}
    >
      {current.id === 'pick' && (
        <div className="space-y-2">
          {OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setPick(o.id)}
              className={`w-full px-4 py-4 rounded-xl text-left border-2 ${
                pick === o.id ? 'border-[var(--c-solid)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20' : 'border-stone-200 dark:border-stone-700'
              }`}
            >
              <span className="text-base text-stone-800 dark:text-stone-100">{t(o.labelKey, o.labelDefault)}</span>
            </button>
          ))}
        </div>
      )}
      {current.id === 'done' && (
        <p className="text-stone-600 dark:text-stone-300">
          {t('focus.print.doneText', 'Öppna utskriftssidan i normalläge för att skriva ut.')}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusPrintWizard
