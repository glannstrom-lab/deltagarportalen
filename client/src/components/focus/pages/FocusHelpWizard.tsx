/**
 * FocusHelpWizard — NPF-anpassad hjälp.
 *
 * Steg: vad behöver du hjälp med → välj kategori → läs (leder till FAQ i normalvyn).
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HelpCircle, Smile } from '@/components/ui/icons'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

const TOPICS = [
  { id: 'login', labelKey: 'focus.help.login', labelDefault: 'Logga in / mitt konto' },
  { id: 'cv', labelKey: 'focus.help.cv', labelDefault: 'CV och brev' },
  { id: 'job-search', labelKey: 'focus.help.jobSearch', labelDefault: 'Jobbsök' },
  { id: 'privacy', labelKey: 'focus.help.privacy', labelDefault: 'Mina uppgifter / sekretess' },
  { id: 'other', labelKey: 'focus.help.other', labelDefault: 'Annat' },
] as const

export function FocusHelpWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [topic, setTopic] = useState<string | null>(null)

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    { id: 'topic', icon: HelpCircle, title: t('focus.help.topicTitle', 'Vad behöver du hjälp med?') },
    { id: 'done', icon: Smile, title: t('focus.help.doneTitle', 'Bra!') },
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
      canNext={current.id === 'topic' ? topic != null : true}
    >
      {current.id === 'topic' && (
        <div className="space-y-2">
          {TOPICS.map((tp) => (
            <button
              key={tp.id}
              type="button"
              onClick={() => setTopic(tp.id)}
              className={`w-full px-4 py-4 rounded-xl text-left border-2 ${
                topic === tp.id ? 'border-[var(--c-solid)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20' : 'border-stone-200 dark:border-stone-700'
              }`}
            >
              <span className="text-base text-stone-800 dark:text-stone-100">{t(tp.labelKey, tp.labelDefault)}</span>
            </button>
          ))}
        </div>
      )}
      {current.id === 'done' && (
        <p className="text-stone-600 dark:text-stone-300">
          {t('focus.help.doneText', 'Öppna hjälpsidan i normalläge för svar på frågor i denna kategori.')}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusHelpWizard
