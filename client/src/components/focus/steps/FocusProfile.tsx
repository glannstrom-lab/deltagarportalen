/**
 * FocusProfile - Förenklad profilredigering för fokusläget
 * Ett fält i taget med tydlig guidning
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { userApi } from '@/services/supabaseApi'
import {
  User, Mail, Phone, MapPin,
  ArrowRight, Check, Loader2, SkipForward
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface FocusProfileProps {
  onComplete: () => void
  onSkip: () => void
  onBack: () => void
}

interface ProfileFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  location: string
}

const PROFILE_STEPS = [
  {
    id: 'name',
    icon: User,
    fields: ['first_name', 'last_name'],
    titleKey: 'focusGuide.profile.nameTitle',
    titleDefault: 'Vad heter du?'
  },
  {
    id: 'contact',
    icon: Mail,
    fields: ['email', 'phone'],
    titleKey: 'focusGuide.profile.contactTitle',
    titleDefault: 'Hur kan arbetsgivare kontakta dig?'
  },
  {
    id: 'location',
    icon: MapPin,
    fields: ['location'],
    titleKey: 'focusGuide.profile.locationTitle',
    titleDefault: 'Var bor du?'
  }
] as const

export function FocusProfile({ onComplete, onSkip, onBack }: FocusProfileProps) {
  const { t } = useTranslation()
  const { profile, refreshProfile } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    location: ''
  })

  // Load initial data from profile
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        location: profile.location || ''
      })
    }
  }, [profile])

  const step = PROFILE_STEPS[currentStep]
  const StepIcon = step.icon
  const isLastStep = currentStep === PROFILE_STEPS.length - 1
  const progress = ((currentStep + 1) / PROFILE_STEPS.length) * 100

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = async () => {
    if (isLastStep) {
      // Save all data
      setIsSaving(true)
      try {
        await userApi.updateProfile(formData)
        await refreshProfile()
        onComplete()
      } catch (error) {
        console.error('Failed to save profile:', error)
        // Still proceed, data will sync later
        onComplete()
      } finally {
        setIsSaving(false)
      }
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleNext()
    }
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-teal-500" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">
          {t('focusGuide.profile.title', 'Din profil')}
        </h2>
        <p className="text-stone-500 dark:text-stone-400">
          {t('focusGuide.profile.subtitle', 'Låt oss börja med grunderna')}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-stone-500 dark:text-stone-400">
            {t('focusGuide.stepOf', 'Steg {{current}} av {{total}}', {
              current: currentStep + 1,
              total: PROFILE_STEPS.length
            })}
          </span>
          <span className="font-medium text-teal-600 dark:text-teal-400">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-3 mt-4">
          {PROFILE_STEPS.map((s, i) => {
            const Icon = s.icon
            const isActive = i === currentStep
            const isDone = i < currentStep

            return (
              <div
                key={s.id}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                  isActive && 'bg-teal-500 text-white ring-4 ring-teal-500/20',
                  isDone && 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400',
                  !isActive && !isDone && 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                )}
              >
                {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Current step form */}
      <div className="bg-white dark:bg-stone-800/50 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
            <StepIcon className="w-6 h-6 text-teal-500" />
          </div>
          <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
            {t(step.titleKey, step.titleDefault)}
          </h3>
        </div>

        <div className="space-y-4">
          {step.id === 'name' && (
            <>
              <div>
                <label
                  htmlFor="first_name"
                  className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2"
                >
                  {t('profile.firstName', 'Förnamn')}
                </label>
                <input
                  id="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('profile.firstNamePlaceholder', 'Anna')}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  autoFocus
                />
              </div>
              <div>
                <label
                  htmlFor="last_name"
                  className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2"
                >
                  {t('profile.lastName', 'Efternamn')}
                </label>
                <input
                  id="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('profile.lastNamePlaceholder', 'Andersson')}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>
            </>
          )}

          {step.id === 'contact' && (
            <>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2"
                >
                  {t('profile.email', 'E-postadress')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('profile.emailPlaceholder', 'din.email@exempel.se')}
                    className="w-full pl-12 pr-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2"
                >
                  {t('profile.phone', 'Telefonnummer')}
                  <span className="text-stone-400 ml-1">({t('common.optional', 'valfritt')})</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('profile.phonePlaceholder', '070-123 45 67')}
                    className="w-full pl-12 pr-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  />
                </div>
              </div>
            </>
          )}

          {step.id === 'location' && (
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2"
              >
                {t('profile.location', 'Ort')}
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('profile.locationPlaceholder', 'Stockholm')}
                  className="w-full pl-12 pr-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  autoFocus
                />
              </div>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-2">
                {t('focusGuide.profile.locationHint', 'Detta hjälper dig hitta jobb nära dig')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleNext}
          disabled={isSaving}
          className={cn(
            'flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-lg transition-all',
            'bg-teal-500 text-white hover:bg-teal-600',
            'focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('common.saving', 'Sparar...')}
            </>
          ) : isLastStep ? (
            <>
              <Check className="w-5 h-5" />
              {t('focusGuide.profile.save', 'Spara och fortsätt')}
            </>
          ) : (
            <>
              {t('common.next', 'Nästa')}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <button
          onClick={onSkip}
          className="flex items-center justify-center gap-2 py-3 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
        >
          <SkipForward className="w-4 h-4" />
          {t('focusGuide.skipStep', 'Hoppa över detta steg')}
        </button>
      </div>
    </div>
  )
}
