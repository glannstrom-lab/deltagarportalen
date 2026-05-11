/**
 * FocusMyConsultantWizard — NPF-anpassad meddelande till konsulent.
 *
 * Steg: vad vill du säga → klart.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserCheck, Smile } from '@/components/ui/icons'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

export function FocusMyConsultantWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [message, setMessage] = useState('')

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    { id: 'message', icon: UserCheck, title: t('focus.consultant.messageTitle', 'Vad vill du säga till din konsulent?'), hint: t('focus.consultant.messageHint', 'Du kan formulera det i lugn takt här. Du skickar det själv senare.') },
    { id: 'done', icon: Smile, title: t('focus.consultant.doneTitle', 'Bra jobbat!') },
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
      canNext={current.id === 'message' ? message.trim().length > 0 : true}
    >
      {current.id === 'message' && (
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={7}
          placeholder={t('focus.consultant.messagePlaceholder', 'Skriv det du tänker på...')}
          className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50 resize-none"
          autoFocus
        />
      )}
      {current.id === 'done' && (
        <p className="text-stone-600 dark:text-stone-300">
          {t('focus.consultant.doneText', 'Bra! Du har förberett ditt meddelande. Öppna min-konsulent-sidan i normalläge för att skicka.')}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusMyConsultantWizard
