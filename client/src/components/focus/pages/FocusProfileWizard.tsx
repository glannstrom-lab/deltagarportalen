/**
 * FocusProfileWizard — NPF-anpassad steg-för-steg profilifyllning.
 *
 * Steg: förnamn → efternamn → telefon → klart
 * Autosave på varje "Nästa" via userApi.updateProfile (samma datalager
 * som normalvyn).
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { User, Phone, Smile } from '@/components/ui/icons'
import { userApi } from '@/services/userApi'
import { useAuthStore } from '@/stores/authStore'
import { FocusWizardFrame, type FocusWizardStep } from './FocusWizardFrame'

interface Props {
  onExit: () => void
}

export function FocusProfileWizard({ onExit }: Props) {
  const { t } = useTranslation()
  const { profile } = useAuthStore()

  const [step, setStep] = useState(0)
  const [firstName, setFirstName] = useState(profile?.first_name ?? '')
  const [lastName, setLastName] = useState(profile?.last_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')

  const saveMutation = useMutation({
    mutationFn: async (updates: Record<string, string | null>) => {
      return userApi.updateProfile(updates)
    },
  })

  const STEPS: ReadonlyArray<FocusWizardStep> = [
    {
      id: 'firstName',
      icon: User,
      title: t('focus.profile.firstNameTitle', 'Vad heter du i förnamn?'),
      hint: t('focus.profile.firstNameHint', 'Vi använder det för att hälsa på dig.'),
    },
    {
      id: 'lastName',
      icon: User,
      title: t('focus.profile.lastNameTitle', 'Och i efternamn?'),
      hint: t('focus.profile.lastNameHint', 'Det visas i CV och brev.'),
    },
    {
      id: 'phone',
      icon: Phone,
      title: t('focus.profile.phoneTitle', 'Vilket telefonnummer kan arbetsgivare nå dig på?'),
      hint: t('focus.profile.phoneHint', 'Du kan hoppa över om du inte vill ange det.'),
    },
    {
      id: 'done',
      icon: Smile,
      title: t('focus.profile.doneTitle', 'Klart! Din profil är sparad.'),
    },
  ] as const

  const current = STEPS[step]

  const handleNext = async () => {
    try {
      if (current.id === 'firstName') {
        if (firstName.trim()) await saveMutation.mutateAsync({ first_name: firstName.trim() })
      } else if (current.id === 'lastName') {
        if (lastName.trim()) await saveMutation.mutateAsync({ last_name: lastName.trim() })
      } else if (current.id === 'phone') {
        if (phone.trim()) await saveMutation.mutateAsync({ phone: phone.trim() })
      } else if (current.id === 'done') {
        onExit()
        return
      }
      setStep((s) => Math.min(s + 1, STEPS.length - 1))
    } catch (err) {
      console.error('Failed to save profile step', err)
    }
  }

  const canNext =
    current.id === 'firstName'
      ? firstName.trim().length > 0
      : current.id === 'lastName'
        ? lastName.trim().length > 0
        : true

  return (
    <FocusWizardFrame
      steps={STEPS}
      current={step}
      onNext={handleNext}
      onBack={() => setStep((s) => Math.max(s - 1, 0))}
      onExit={onExit}
      canNext={canNext}
      busy={saveMutation.isPending}
    >
      {current.id === 'firstName' && (
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder={t('focus.profile.firstNamePlaceholder', 'Anna')}
          className="w-full px-4 py-3 text-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50"
          autoFocus
        />
      )}

      {current.id === 'lastName' && (
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder={t('focus.profile.lastNamePlaceholder', 'Andersson')}
          className="w-full px-4 py-3 text-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50"
          autoFocus
        />
      )}

      {current.id === 'phone' && (
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t('focus.profile.phonePlaceholder', '070-123 45 67')}
          className="w-full px-4 py-3 text-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)]/50"
          autoFocus
        />
      )}

      {current.id === 'done' && (
        <p className="text-stone-600 dark:text-stone-300 text-base">
          {t(
            'focus.profile.doneText',
            'Bra jobbat! Du kan alltid uppdatera dina uppgifter senare under Profil.'
          )}
        </p>
      )}
    </FocusWizardFrame>
  )
}

export default FocusProfileWizard
