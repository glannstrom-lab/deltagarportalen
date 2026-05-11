/**
 * FocusNetworkWizard — NPF-anpassad första kontakten i nätverket.
 *
 * Steg: vem vill du nå → meddelande → klart.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, MessageSquare, Smile } from '@/components/ui/icons'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

export function FocusNetworkWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [person, setPerson] = useState('')
  const [message, setMessage] = useState('')

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    { id: 'person', icon: Users, title: t('focus.network.personTitle', 'Vem vill du höra av dig till?'), hint: t('focus.network.personHint', 'En person — namn eller roll.') },
    { id: 'message', icon: MessageSquare, title: t('focus.network.messageTitle', 'Skriv ett kort meddelande'), hint: t('focus.network.messageHint', 'Du behöver inte skicka det nu. Bara skriv.') },
    { id: 'done', icon: Smile, title: t('focus.network.doneTitle', 'Bra start!') },
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
      canNext={current.id === 'person' ? person.trim().length > 0 : current.id === 'message' ? message.trim().length > 0 : true}
    >
      {current.id === 'person' && (
        <input
          type="text"
          value={person}
          onChange={(e) => setPerson(e.target.value)}
          placeholder={t('focus.network.personPlaceholder', 't.ex. min gamla chef, en kursare')}
          className="w-full px-4 py-3 text-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50"
          autoFocus
        />
      )}
      {current.id === 'message' && (
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder={t('focus.network.messagePlaceholder', 'Hej! Jag tänkte på dig... Hur har du det? Jag undrar om vi kan höras kort.')}
          className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50 resize-none"
          autoFocus
        />
      )}
      {current.id === 'done' && (
        <p className="text-stone-600 dark:text-stone-300">
          {t('focus.network.doneText', 'Bra! Du har förberett ett meddelande till {{person}}. Du bestämmer själv när det ska skickas.', { person: person || '...' })}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusNetworkWizard
