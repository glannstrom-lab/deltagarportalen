/**
 * FocusKnowledgeBaseWizard — NPF-anpassad guidning till kunskapsbasen.
 *
 * Steg: vad behöver du läsa om → välj kategori → klart (öppna i normalvyn).
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, ListChecks, Smile } from '@/components/ui/icons'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

const CATEGORIES = [
  { id: 'job-search', labelKey: 'focus.kb.catJobSearch', labelDefault: 'Hitta jobb' },
  { id: 'cv', labelKey: 'focus.kb.catCv', labelDefault: 'CV och brev' },
  { id: 'interview', labelKey: 'focus.kb.catInterview', labelDefault: 'Intervju' },
  { id: 'rights', labelKey: 'focus.kb.catRights', labelDefault: 'Rättigheter och regler' },
  { id: 'wellbeing', labelKey: 'focus.kb.catWellbeing', labelDefault: 'Mående och vila' },
] as const

export function FocusKnowledgeBaseWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [category, setCategory] = useState<string | null>(null)

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    {
      id: 'category',
      icon: ListChecks,
      title: t('focus.kb.categoryTitle', 'Vad vill du läsa om?'),
    },
    {
      id: 'done',
      icon: Smile,
      title: t('focus.kb.doneTitle', 'Bra val!'),
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
      canNext={current.id === 'category' ? category != null : true}
    >
      {current.id === 'category' && (
        <div className="space-y-2">
          {CATEGORIES.map((c) => {
            const selected = category === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`w-full px-4 py-4 rounded-xl text-left border-2 ${
                  selected
                    ? 'border-[var(--c-solid)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20'
                    : 'border-stone-200 dark:border-stone-700'
                }`}
              >
                <span className="text-base text-stone-800 dark:text-stone-100">
                  {t(c.labelKey, c.labelDefault)}
                </span>
              </button>
            )
          })}
        </div>
      )}
      {current.id === 'done' && (
        <p className="text-stone-600 dark:text-stone-300">
          {t('focus.kb.doneText', 'Öppna kunskapsbasen i normalläge för att läsa artiklar i denna kategori.')}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusKnowledgeBaseWizard
