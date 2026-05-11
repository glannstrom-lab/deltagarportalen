/**
 * FocusCalendarWizard — NPF-anpassad dagsöversikt.
 *
 * Steg: visa vad du har idag → välj en sak att fokusera på.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, Target, Smile } from '@/components/ui/icons'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

export function FocusCalendarWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [todays, setTodays] = useState('')
  const [focus, setFocus] = useState('')

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    {
      id: 'today',
      icon: Calendar,
      title: t('focus.calendar.todayTitle', 'Vad har du idag?'),
      hint: t('focus.calendar.todayHint', 'Skriv kort vad som står på din dag.'),
    },
    {
      id: 'focus',
      icon: Target,
      title: t('focus.calendar.focusTitle', 'Vilken EN sak vill du fokusera på?'),
      hint: t('focus.calendar.focusHint', 'Resten kan vänta.'),
    },
    {
      id: 'done',
      icon: Smile,
      title: t('focus.calendar.doneTitle', 'Bra val!'),
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
      canNext={current.id === 'focus' ? focus.trim().length > 0 : true}
    >
      {current.id === 'today' && (
        <textarea
          value={todays}
          onChange={(e) => setTodays(e.target.value)}
          rows={5}
          placeholder={t('focus.calendar.todayPlaceholder', 't.ex. möte 10, lunch med vän, läsa annonser')}
          className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50 resize-none"
          autoFocus
        />
      )}
      {current.id === 'focus' && (
        <input
          type="text"
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          placeholder={t('focus.calendar.focusPlaceholder', 't.ex. möte med konsulenten')}
          className="w-full px-4 py-3 text-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50"
          autoFocus
        />
      )}
      {current.id === 'done' && (
        <p className="text-stone-600 dark:text-stone-300">
          {t('focus.calendar.doneText', 'Bra fokus. Resten kan du återkomma till senare.')}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusCalendarWizard
