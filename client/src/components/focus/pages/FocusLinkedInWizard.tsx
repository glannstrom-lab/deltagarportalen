/**
 * FocusLinkedInWizard — NPF-anpassad LinkedIn-hjälp.
 *
 * Guiden frågade tidigare vilken del man ville förbättra, bad om texten — och
 * kastade bort båda svaren. `part` och `text` låg i `useState` och lästes
 * aldrig; sista steget sa "öppna LinkedIn-optimeraren i normalläge för att få
 * AI-förslag på din text", men texten följde inte med, så användaren fick
 * skriva in allt en gång till. Fokusläget finns för den som orkar minst, och
 * var den vy som kostade mest.
 *
 * Nu lämnas valet och texten över till normalvyn via `onTaMedTillNormalvy`
 * (tillståndet bor i `pages/LinkedInOptimizer.tsx`, precis som `val` i
 * `pages/Salary.tsx`), så att fältet redan är ifyllt när guiden stängs.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linkedin, FileText, Smile } from '@/components/ui/icons'
import { FOCUS_WIZARD_TITLE_ID, FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

export type LinkedInDel = 'headline' | 'about' | 'post'

interface Props {
  /** Tar med valet och texten till normalvyn. Anropas när guiden är klar. */
  onTaMedTillNormalvy: (del: LinkedInDel, text: string) => void
  onExit: () => void
}

const DELAR: { id: LinkedInDel; nyckel: string }[] = [
  { id: 'headline', nyckel: 'focus.linkedin.partHeadline' },
  { id: 'about', nyckel: 'focus.linkedin.partAbout' },
  { id: 'post', nyckel: 'focus.linkedin.partExperience' },
]

export function FocusLinkedInWizard({ onTaMedTillNormalvy, onExit }: Props) {
  const { t } = useTranslation()

  const [step, setStep] = useState(0)
  const [del, setDel] = useState<LinkedInDel>('headline')
  const [text, setText] = useState('')

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    { id: 'part', icon: Linkedin, title: t('focus.linkedin.introTitle') },
    {
      id: 'text',
      icon: FileText,
      title: t('focus.linkedin.textTitle'),
      hint: t('focus.linkedin.textHint'),
    },
    { id: 'done', icon: Smile, title: t('focus.linkedin.doneTitle') },
  ] as const

  const current = STEPS[step]

  const handleNext = async () => {
    if (current.id === 'text') {
      // Spara vid "Nästa", inte bara på sista steget — kontraktet i
      // PageFocusShell punkt 8: användaren ska aldrig tappa arbete.
      onTaMedTillNormalvy(del, text.trim())
      setStep((s) => s + 1)
      return
    }
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
        <ul className="space-y-2">
          {DELAR.map((d) => {
            const vald = del === d.id
            return (
              <li key={d.id}>
                <button
                  type="button"
                  aria-pressed={vald}
                  onClick={() => setDel(d.id)}
                  className={`w-full px-4 py-4 rounded-xl text-left border-2 min-h-[48px] ${
                    vald
                      ? 'border-[var(--c-solid)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20'
                      : 'border-stone-200 dark:border-stone-700'
                  }`}
                >
                  <span className="text-base text-stone-800 dark:text-stone-100">{t(d.nyckel)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {current.id === 'text' && (
        <textarea
          aria-labelledby={FOCUS_WIZARD_TITLE_ID}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder={t('focus.linkedin.textPlaceholder')}
          className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50 resize-none"
          autoFocus
        />
      )}

      {current.id === 'done' && (
        <p className="text-stone-600 dark:text-stone-300" role="status" aria-live="polite">
          {t('focus.linkedin.doneText', { part: t(DELAR.find((d) => d.id === del)!.nyckel) })}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusLinkedInWizard
