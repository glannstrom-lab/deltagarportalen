/**
 * FocusInternationalWizard — NPF-anpassad guide för internationellt arbete.
 *
 * Steg: vilket språk → vilket land → ett konkret nästa steg.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, MapPin, Lightbulb } from '@/components/ui/icons'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

export function FocusInternationalWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [language, setLanguage] = useState('')
  const [country, setCountry] = useState('')

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    {
      id: 'language',
      icon: Globe,
      title: t('focus.intl.languageTitle', 'Vilket språk kan du jobba på?'),
      hint: t('focus.intl.languageHint', 'Förutom svenska.'),
    },
    {
      id: 'country',
      icon: MapPin,
      title: t('focus.intl.countryTitle', 'Vilket land funderar du på?'),
    },
    {
      id: 'tip',
      icon: Lightbulb,
      title: t('focus.intl.tipTitle', 'Ett tips att börja med'),
    },
  ] as const

  const current = STEPS[step]

  return (
    <FocusWizardFrame
      steps={STEPS}
      current={step}
      onNext={async () => {
        if (current.id === 'tip') {
          onExit()
          return
        }
        setStep((s) => s + 1)
      }}
      onBack={() => setStep((s) => Math.max(s - 1, 0))}
      onExit={onExit}
      canNext={
        current.id === 'language'
          ? language.trim().length > 0
          : current.id === 'country'
            ? country.trim().length > 0
            : true
      }
    >
      {current.id === 'language' && (
        <input
          type="text"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          placeholder={t('focus.intl.languagePlaceholder', 't.ex. engelska, spanska')}
          className="w-full px-4 py-3 text-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50"
          autoFocus
        />
      )}

      {current.id === 'country' && (
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder={t('focus.intl.countryPlaceholder', 't.ex. Tyskland, Norge')}
          className="w-full px-4 py-3 text-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50"
          autoFocus
        />
      )}

      {current.id === 'tip' && (
        <div className="space-y-3 text-stone-600 dark:text-stone-300">
          <p>
            {t(
              'focus.intl.tipText',
              'Ett bra första steg: skriv ditt CV på {{language}} och spara en kopia. Du kan göra det i CV-byggaren.',
              { language: language || 'engelska' }
            )}
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {t('focus.intl.tipExtra', 'Öppna internationella sidan i normalläge för fler tips om {{country}}.', {
              country: country || 'ditt land',
            })}
          </p>
        </div>
      )}
    </FocusWizardFrame>
  )
}

export default FocusInternationalWizard
