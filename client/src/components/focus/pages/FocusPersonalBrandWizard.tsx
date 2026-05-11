/**
 * FocusPersonalBrandWizard — NPF-anpassad personlig varumärkesbyggare.
 *
 * Steg: tre adjektiv → en mening om vem du är (tagline) → "om mig"-stycke.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Star, MessageSquare, FileText, Smile } from '@/components/ui/icons'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

export function FocusPersonalBrandWizard({ onExit }: Props) {
  const { t } = useTranslation()

  const [step, setStep] = useState(0)
  const [adjectives, setAdjectives] = useState('')
  const [tagline, setTagline] = useState('')
  const [about, setAbout] = useState('')

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    {
      id: 'adjectives',
      icon: Star,
      title: t('focus.personalBrand.adjTitle', 'Tre ord som beskriver dig'),
      hint: t('focus.personalBrand.adjHint', 'Separera med komma. T.ex. lugn, lojal, ordningsam.'),
    },
    {
      id: 'tagline',
      icon: MessageSquare,
      title: t('focus.personalBrand.taglineTitle', 'En kort mening om dig'),
      hint: t('focus.personalBrand.taglineHint', 'Vad är du bra på? Hur hjälper du andra?'),
    },
    {
      id: 'about',
      icon: FileText,
      title: t('focus.personalBrand.aboutTitle', 'Berätta lite mer om dig'),
      hint: t('focus.personalBrand.aboutHint', '3-5 meningar räcker. Vi använder det som "om mig".'),
    },
    {
      id: 'done',
      icon: Smile,
      title: t('focus.personalBrand.doneTitle', 'Klart!'),
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

  const canNext = current.id === 'adjectives'
    ? adjectives.trim().length > 0
    : current.id === 'tagline'
      ? tagline.trim().length > 0
      : current.id === 'about'
        ? about.trim().length > 0
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
      {current.id === 'adjectives' && (
        <input
          type="text"
          value={adjectives}
          onChange={(e) => setAdjectives(e.target.value)}
          placeholder={t('focus.personalBrand.adjPlaceholder', 'lugn, lojal, ordningsam')}
          className="w-full px-4 py-3 text-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50"
          autoFocus
        />
      )}

      {current.id === 'tagline' && (
        <textarea
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          rows={3}
          placeholder={t('focus.personalBrand.taglinePlaceholder', 't.ex. Jag är en noggrann administratör som hjälper team att hålla ordning.')}
          className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50 resize-none"
          autoFocus
        />
      )}

      {current.id === 'about' && (
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          rows={8}
          placeholder={t('focus.personalBrand.aboutPlaceholder', 'Skriv som du skulle berätta för en vän...')}
          className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50 resize-none"
          autoFocus
        />
      )}

      {current.id === 'done' && (
        <p className="text-stone-600 dark:text-stone-300">
          {t('focus.personalBrand.doneText', 'Fint! Du kan kopiera och använda din "om mig" på LinkedIn och i CV.')}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusPersonalBrandWizard
