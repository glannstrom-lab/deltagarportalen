/**
 * FocusSettingsWizard — NPF-anpassad ingång till inställningar.
 *
 * Steg: vilken kategori vill du ändra → klart (leder till normalvyn).
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings, Smile } from '@/components/ui/icons'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

const CATEGORIES = [
  { id: 'profile', labelKey: 'focus.settings.profile', labelDefault: 'Min profil' },
  { id: 'access', labelKey: 'focus.settings.access', labelDefault: 'Tillgänglighet' },
  { id: 'notifications', labelKey: 'focus.settings.notifications', labelDefault: 'Aviseringar' },
  { id: 'appearance', labelKey: 'focus.settings.appearance', labelDefault: 'Utseende' },
  { id: 'privacy', labelKey: 'focus.settings.privacy', labelDefault: 'Sekretess' },
] as const

export function FocusSettingsWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [category, setCategory] = useState<string | null>(null)

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    { id: 'category', icon: Settings, title: t('focus.settings.categoryTitle', 'Vad vill du ändra?') },
    { id: 'done', icon: Smile, title: t('focus.settings.doneTitle', 'Bra val!') },
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
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`w-full px-4 py-4 rounded-xl text-left border-2 ${
                category === c.id ? 'border-[var(--c-solid)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20' : 'border-stone-200 dark:border-stone-700'
              }`}
            >
              <span className="text-base text-stone-800 dark:text-stone-100">{t(c.labelKey, c.labelDefault)}</span>
            </button>
          ))}
        </div>
      )}
      {current.id === 'done' && (
        <p className="text-stone-600 dark:text-stone-300">
          {t('focus.settings.doneText', 'Öppna inställningssidan i normalläge för att ändra dem.')}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusSettingsWizard
