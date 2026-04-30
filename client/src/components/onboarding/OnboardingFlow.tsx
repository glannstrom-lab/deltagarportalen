/**
 * OnboardingFlow — global welkomstmodal för nya användare.
 *
 * Renders bara om profile.onboarding_completed === false. Vid "Klar" eller
 * "Hoppa över" sätts flaggan till true i Supabase (cross-device-persistens).
 * Mounted i Layout.tsx ovanför sidan så den syns första inloggade renderingen.
 *
 * Använder designsystem-tokens (--c-* per aktiv domän, stone-skala).
 */

import { useState, useEffect, type ComponentType } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  CheckCircle2,
  Target,
  Sparkles,
  FileText,
  Briefcase,
  X,
} from '@/components/ui/icons'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Step {
  id: number
  titleKey: string
  fallbackTitle: string
  descriptionKey: string
  fallbackDescription: string
  icon: ComponentType<{ className?: string }>
  actionKey: string
  fallbackAction: string
  route: string
}

const STEPS: Step[] = [
  {
    id: 1,
    titleKey: 'onboarding.welcome.title',
    fallbackTitle: 'Välkommen till Jobin!',
    descriptionKey: 'onboarding.welcome.description',
    fallbackDescription:
      'Här hittar du verktyg för att skapa CV, söka jobb och få stöd från din konsulent. Vi tar det i din takt.',
    icon: Sparkles,
    actionKey: 'onboarding.welcome.action',
    fallbackAction: 'Kom igång',
    route: '/',
  },
  {
    id: 2,
    titleKey: 'onboarding.cv.title',
    fallbackTitle: 'Skapa ditt CV',
    descriptionKey: 'onboarding.cv.description',
    fallbackDescription:
      'CV-byggaren guidar dig steg för steg. Du kan komma tillbaka och bygga vidare när du har ork.',
    icon: FileText,
    actionKey: 'onboarding.cv.action',
    fallbackAction: 'Bygg CV',
    route: '/cv',
  },
  {
    id: 3,
    titleKey: 'onboarding.interest.title',
    fallbackTitle: 'Hitta passande yrken',
    descriptionKey: 'onboarding.interest.description',
    fallbackDescription:
      'Intresseguiden tar bara några minuter och ger dig personliga yrkesförslag baserat på vad du tycker om.',
    icon: Target,
    actionKey: 'onboarding.interest.action',
    fallbackAction: 'Starta guiden',
    route: '/interest-guide',
  },
  {
    id: 4,
    titleKey: 'onboarding.jobs.title',
    fallbackTitle: 'Sök jobb',
    descriptionKey: 'onboarding.jobs.description',
    fallbackDescription:
      'Tusentals lediga jobb från Arbetsförmedlingen — sök på yrke, plats och anställningstyp.',
    icon: Briefcase,
    actionKey: 'onboarding.jobs.action',
    fallbackAction: 'Sök jobb',
    route: '/job-search',
  },
  {
    id: 5,
    titleKey: 'onboarding.done.title',
    fallbackTitle: 'Du är redo att börja!',
    descriptionKey: 'onboarding.done.description',
    fallbackDescription:
      'Allt finns kvar när du vill ta nästa steg. Din konsulent finns här om du behöver hjälp.',
    icon: CheckCircle2,
    actionKey: 'onboarding.done.action',
    fallbackAction: 'Till min vy',
    route: '/',
  },
]

export function OnboardingFlow() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profile, user, updateProfile } = useAuthStore()

  // Lokal state för att kunna stänga snabbt — DB-uppdateringen sker async
  const [dismissed, setDismissed] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Visa endast när: inloggad + profil laddad + ej klar tidigare + ej lokalt avskedad
  const shouldShow =
    !!user && !!profile && profile.onboarding_completed === false && !dismissed

  // Reset step när modalen visas (t.ex. om användaren stänger och öppnar igen)
  useEffect(() => {
    if (shouldShow) setCurrentStep(0)
  }, [shouldShow])

  if (!shouldShow) return null

  const step = STEPS[currentStep]
  const Icon = step.icon
  const progress = ((currentStep + 1) / STEPS.length) * 100
  const isLast = currentStep === STEPS.length - 1

  const markCompleted = async () => {
    if (!profile?.id) return
    setSaving(true)
    try {
      const { error } = await updateProfile({ onboarding_completed: true })
      if (error) console.warn('[Onboarding] kunde inte spara status:', error)
    } finally {
      setSaving(false)
      setDismissed(true)
    }
  }

  const handleNext = () => {
    if (isLast) {
      markCompleted()
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  const handleAction = () => {
    // Sista steget = "klar" + behåll på dashboard. Övriga steg = navigera till
    // resp. sida och stäng modalen (markeras som klar).
    void markCompleted()
    navigate(step.route)
  }

  const handleSkip = () => {
    void markCompleted()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 dark:border-stone-700">
        {/* Progress bar */}
        <div className="h-1 bg-stone-100 dark:bg-stone-800">
          <div
            className="h-full bg-[var(--c-solid)] transition-all duration-300"
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 tabular-nums">
              {t('onboarding.stepProgress', { current: currentStep + 1, total: STEPS.length, defaultValue: 'Steg {{current}} av {{total}}' })}
            </span>
            <button
              onClick={handleSkip}
              disabled={saving}
              className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              {t('onboarding.skip', 'Hoppa över')}
            </button>
          </div>

          {/* Domän-pastell ikon-tile */}
          <div className="w-20 h-20 rounded-2xl bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 flex items-center justify-center mx-auto mb-6">
            <Icon className="w-10 h-10 text-[var(--c-solid)]" />
          </div>

          <h2
            id="onboarding-title"
            className="text-2xl font-bold text-stone-900 dark:text-stone-100 text-center mb-3"
          >
            {t(step.titleKey, step.fallbackTitle)}
          </h2>
          <p className="text-stone-600 dark:text-stone-300 text-center mb-8 leading-relaxed">
            {t(step.descriptionKey, step.fallbackDescription)}
          </p>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handleBack} disabled={saving} className="flex-1">
                {t('onboarding.back', 'Tillbaka')}
              </Button>
            )}
            {!isLast && (
              <button
                onClick={handleNext}
                disabled={saving}
                className={cn(
                  'flex-1 py-3 px-4 rounded-xl font-medium',
                  'border border-[var(--c-solid)] text-[var(--c-text)] dark:text-[var(--c-solid)]',
                  'hover:bg-[var(--c-bg)] dark:hover:bg-[var(--c-bg)]/30',
                  'transition-colors disabled:opacity-50'
                )}
              >
                {t('onboarding.nextStep', 'Nästa')}
              </button>
            )}
            <button
              onClick={handleAction}
              disabled={saving}
              className={cn(
                'flex-1 py-3 px-4 rounded-xl font-medium',
                'bg-[var(--c-solid)] text-white',
                'hover:brightness-95 transition-all',
                'inline-flex items-center justify-center gap-2',
                'disabled:opacity-50'
              )}
            >
              {t(step.actionKey, step.fallbackAction)}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingFlow
