/**
 * FocusExternalResourcesWizard — NPF-anpassad val av extern resurs.
 *
 * Steg: vad behöver du → välj en typ av extern länk (Arbetsförmedlingen,
 * Försäkringskassan, m.fl.).
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, Smile } from '@/components/ui/icons'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

const NEEDS = [
  { id: 'job-listings', labelKey: 'focus.ext.jobListings', labelDefault: 'Hitta jobbannonser' },
  { id: 'benefits', labelKey: 'focus.ext.benefits', labelDefault: 'Ersättning och stöd' },
  { id: 'rights', labelKey: 'focus.ext.rights', labelDefault: 'Mina rättigheter' },
  { id: 'health', labelKey: 'focus.ext.health', labelDefault: 'Hjälp med hälsa' },
] as const

export function FocusExternalResourcesWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [need, setNeed] = useState<string | null>(null)

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    { id: 'need', icon: ExternalLink, title: t('focus.ext.needTitle', 'Vad behöver du hjälp med?') },
    { id: 'done', icon: Smile, title: t('focus.ext.doneTitle', 'Bra val!') },
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
      canNext={current.id === 'need' ? need != null : true}
    >
      {current.id === 'need' && (
        <div className="space-y-2">
          {NEEDS.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setNeed(n.id)}
              className={`w-full px-4 py-4 rounded-xl text-left border-2 ${
                need === n.id ? 'border-[var(--c-solid)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20' : 'border-stone-200 dark:border-stone-700'
              }`}
            >
              <span className="text-base text-stone-800 dark:text-stone-100">{t(n.labelKey, n.labelDefault)}</span>
            </button>
          ))}
        </div>
      )}
      {current.id === 'done' && (
        <p className="text-stone-600 dark:text-stone-300">
          {t('focus.ext.doneText', 'Öppna sidan för externa resurser i normalläge för att se länkar.')}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusExternalResourcesWizard
