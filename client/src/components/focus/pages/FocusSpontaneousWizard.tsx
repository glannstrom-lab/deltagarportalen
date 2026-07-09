/**
 * FocusSpontaneousWizard — NPF-anpassad spontanansökan.
 *
 * Steg: vilken bransch? → vilket företag (namn/typ) → kort meddelande → klart.
 * Sparar utkastet i localStorage — normalvyns SearchTab plockar upp det,
 * förifyller sökningen och lägger meddelandet som anteckning vid spara.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, Search, MessageSquare, Smile } from '@/components/ui/icons'
import { saveSpontaneousFocusDraft } from '@/lib/spontaneousFocusDraft'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

export function FocusSpontaneousWizard({ onExit }: Props) {
  const { t } = useTranslation()

  const [step, setStep] = useState(0)
  const [industry, setIndustry] = useState('')
  const [company, setCompany] = useState('')
  const [message, setMessage] = useState('')

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    {
      id: 'industry',
      icon: Building2,
      title: t('focus.spontaneous.industryTitle', 'Vilken bransch är du intresserad av?'),
      hint: t('focus.spontaneous.industryHint', 'En bransch eller område.'),
    },
    {
      id: 'company',
      icon: Search,
      title: t('focus.spontaneous.companyTitle', 'Vilket företag vill du kontakta?'),
      hint: t('focus.spontaneous.companyHint', 'Skriv namnet eller en beskrivning.'),
    },
    {
      id: 'message',
      icon: MessageSquare,
      title: t('focus.spontaneous.messageTitle', 'Skriv ett kort meddelande'),
      hint: t('focus.spontaneous.messageHint', 'Berätta vem du är och varför du hör av dig.'),
    },
    {
      id: 'done',
      icon: Smile,
      title: t('focus.spontaneous.doneTitle', 'Klart!'),
    },
  ] as const

  const current = STEPS[step]

  const handleNext = async () => {
    if (current.id === 'message') {
      // Spara utkastet innan sista steget så det inte går förlorat vid avslut
      saveSpontaneousFocusDraft({ industry, company, message })
    }
    if (current.id === 'done') {
      onExit()
      return
    }
    setStep((s) => s + 1)
  }

  const canNext = current.id === 'industry'
    ? industry.trim().length > 0
    : current.id === 'company'
      ? company.trim().length > 0
      : true

  return (
    <FocusWizardFrame
      steps={STEPS}
      current={step}
      onNext={handleNext}
      onBack={() => setStep((s) => Math.max(s - 1, 0))}
      onExit={onExit}
      canNext={canNext}
    >
      {current.id === 'industry' && (
        <input
          type="text"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder={t('focus.spontaneous.industryPlaceholder', 't.ex. restaurang, vård, IT')}
          className="w-full px-4 py-3 text-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50"
          autoFocus
        />
      )}

      {current.id === 'company' && (
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder={t('focus.spontaneous.companyPlaceholder', 't.ex. ICA Maxi, Volvo')}
          className="w-full px-4 py-3 text-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50"
          autoFocus
        />
      )}

      {current.id === 'message' && (
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={7}
          placeholder={t(
            'focus.spontaneous.messagePlaceholder',
            'Hej! Jag heter ... och söker arbete inom ... Jag tror jag skulle passa hos er för att ...'
          )}
          className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50 resize-none"
          autoFocus
        />
      )}

      {current.id === 'done' && (
        <p className="text-stone-600 dark:text-stone-300">
          {t(
            'focus.spontaneous.doneText',
            'Bra! Ditt utkast är sparat. Öppna sidan i normalläge — sökningen är förifylld, och meddelandet följer med som anteckning när du sparar företaget.'
          )}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusSpontaneousWizard
