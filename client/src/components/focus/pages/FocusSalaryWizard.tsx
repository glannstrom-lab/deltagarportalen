/**
 * FocusSalaryWizard — NPF-anpassad lönekoll.
 *
 * Steg: vilken roll → vilken ort → klart (länkar till normalvyn för fullständig siffra).
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Wallet, MapPin, Smile } from '@/components/ui/icons'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

export function FocusSalaryWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [role, setRole] = useState('')
  const [city, setCity] = useState('')

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    {
      id: 'role',
      icon: Wallet,
      title: t('focus.salary.roleTitle', 'Vilken roll vill du veta lön för?'),
    },
    {
      id: 'city',
      icon: MapPin,
      title: t('focus.salary.cityTitle', 'I vilken stad?'),
      hint: t('focus.salary.cityHint', 'Skriv en stad eller lämna tomt för hela Sverige.'),
    },
    {
      id: 'done',
      icon: Smile,
      title: t('focus.salary.doneTitle', 'Klart!'),
    },
  ] as const

  const current = STEPS[step]

  return (
    <FocusWizardFrame
      steps={STEPS}
      current={step}
      onNext={async () => {
        if (current.id === 'done') {
          onExit()
          return
        }
        setStep((s) => s + 1)
      }}
      onBack={() => setStep((s) => Math.max(s - 1, 0))}
      onExit={onExit}
      canNext={current.id === 'role' ? role.trim().length > 0 : true}
    >
      {current.id === 'role' && (
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder={t('focus.salary.rolePlaceholder', 't.ex. snickare, säljare')}
          className="w-full px-4 py-3 text-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50"
          autoFocus
        />
      )}

      {current.id === 'city' && (
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={t('focus.salary.cityPlaceholder', 't.ex. Malmö')}
          className="w-full px-4 py-3 text-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50"
          autoFocus
        />
      )}

      {current.id === 'done' && (
        <p className="text-stone-600 dark:text-stone-300">
          {t('focus.salary.doneText', 'Öppna lönesidan i normalläge för att se en uppskattning för "{{role}}" i {{city}}.', {
            role: role || '...',
            city: city || 'Sverige',
          })}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusSalaryWizard
