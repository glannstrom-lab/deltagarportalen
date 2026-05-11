/**
 * FocusResourcesWizard — NPF-anpassad val av resurs.
 *
 * Steg: vilken typ → välj en (länkar till normalvyn).
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bookmark, Smile } from '@/components/ui/icons'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

const TYPES = [
  { id: 'cv', labelKey: 'focus.resources.typeCv', labelDefault: 'CV-mallar' },
  { id: 'letter', labelKey: 'focus.resources.typeLetter', labelDefault: 'Brevmallar' },
  { id: 'checklist', labelKey: 'focus.resources.typeChecklist', labelDefault: 'Checklistor' },
  { id: 'guide', labelKey: 'focus.resources.typeGuide', labelDefault: 'Guider' },
] as const

export function FocusResourcesWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [type, setType] = useState<string | null>(null)

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    { id: 'type', icon: Bookmark, title: t('focus.resources.typeTitle', 'Vilken typ av resurs?') },
    { id: 'done', icon: Smile, title: t('focus.resources.doneTitle', 'Bra val!') },
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
      canNext={current.id === 'type' ? type != null : true}
    >
      {current.id === 'type' && (
        <div className="space-y-2">
          {TYPES.map((tp) => {
            const sel = type === tp.id
            return (
              <button
                key={tp.id}
                type="button"
                onClick={() => setType(tp.id)}
                className={`w-full px-4 py-4 rounded-xl text-left border-2 ${
                  sel ? 'border-[var(--c-solid)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20' : 'border-stone-200 dark:border-stone-700'
                }`}
              >
                <span className="text-base text-stone-800 dark:text-stone-100">{t(tp.labelKey, tp.labelDefault)}</span>
              </button>
            )
          })}
        </div>
      )}
      {current.id === 'done' && (
        <p className="text-stone-600 dark:text-stone-300">
          {t('focus.resources.doneText', 'Öppna resurssidan i normalläge för att se resurser i denna kategori.')}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusResourcesWizard
