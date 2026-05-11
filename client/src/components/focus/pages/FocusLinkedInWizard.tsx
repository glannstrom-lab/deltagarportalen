/**
 * FocusLinkedInWizard — NPF-anpassad LinkedIn-optimering.
 *
 * Steg: vilken del → klistra in din nuvarande text → spara förslag.
 * AI-call är inte med här (för att undvika streaming-komplexitet); användaren
 * leds vidare till normalvyn för att få förbättringsförslag.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linkedin, FileText, Smile } from '@/components/ui/icons'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

const PART_OPTIONS = [
  { id: 'headline', labelKey: 'focus.linkedin.partHeadline', labelDefault: 'Rubrik (Headline)' },
  { id: 'about', labelKey: 'focus.linkedin.partAbout', labelDefault: 'Om mig (About)' },
  { id: 'experience', labelKey: 'focus.linkedin.partExperience', labelDefault: 'Erfarenhet' },
] as const

export function FocusLinkedInWizard({ onExit }: Props) {
  const { t } = useTranslation()

  const [step, setStep] = useState(0)
  const [part, setPart] = useState<string>('headline')
  const [text, setText] = useState('')

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    {
      id: 'part',
      icon: Linkedin,
      title: t('focus.linkedin.partTitle', 'Vilken del vill du förbättra?'),
    },
    {
      id: 'text',
      icon: FileText,
      title: t('focus.linkedin.textTitle', 'Klistra in din nuvarande text'),
      hint: t('focus.linkedin.textHint', 'Vi använder den för att föreslå förbättringar i normalläge.'),
    },
    {
      id: 'done',
      icon: Smile,
      title: t('focus.linkedin.doneTitle', 'Klart!'),
    },
  ] as const

  const current = STEPS[step]
  const handleNext = async () => {
    if (current.id === 'done') {
      onExit()
      return
    }
    setStep((s) => s + 1)
  }

  return (
    <FocusWizardFrame
      steps={STEPS}
      current={step}
      onNext={handleNext}
      onBack={() => setStep((s) => Math.max(s - 1, 0))}
      onExit={onExit}
      canNext={current.id === 'text' ? text.trim().length > 0 : true}
    >
      {current.id === 'part' && (
        <div className="space-y-2">
          {PART_OPTIONS.map((opt) => {
            const selected = part === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPart(opt.id)}
                className={`w-full px-4 py-4 rounded-xl text-left border-2 ${
                  selected
                    ? 'border-[var(--c-solid)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20'
                    : 'border-stone-200 dark:border-stone-700'
                }`}
              >
                <span className="text-base text-stone-800 dark:text-stone-100">
                  {t(opt.labelKey, opt.labelDefault)}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {current.id === 'text' && (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={t('focus.linkedin.textPlaceholder', 'Klistra in din text här...')}
          className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50 resize-none"
          autoFocus
        />
      )}

      {current.id === 'done' && (
        <p className="text-stone-600 dark:text-stone-300">
          {t('focus.linkedin.doneText', 'Öppna LinkedIn-optimeraren i normalläge för att få AI-förslag på din text.')}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusLinkedInWizard
