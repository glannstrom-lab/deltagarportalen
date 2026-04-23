/**
 * OnboardingModal - Progressive onboarding for new users
 * Shows 3 steps at a time with positive language
 */

import { useState, useEffect, useRef } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles, User, Briefcase, Heart } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useProfileStore } from '@/stores/profileStore'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  encouragement: string
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Välkommen!',
    description: 'Det här är din profil - ett verktyg som hjälper dig framåt i din jobbsökning. Ta det i din egen takt.',
    icon: <Sparkles className="w-8 h-8" />,
    encouragement: 'Varje steg räknas!'
  },
  {
    id: 'basic',
    title: 'Berätta lite om dig',
    description: 'Börja med det grundläggande: ditt namn och hur man når dig. Det tar bara en minut.',
    icon: <User className="w-8 h-8" />,
    encouragement: 'Du bestämmer vad du vill dela.'
  },
  {
    id: 'jobs',
    title: 'Vad vill du jobba med?',
    description: 'Lägg till några önskade jobb. Du kan ändra detta när som helst.',
    icon: <Briefcase className="w-8 h-8" />,
    encouragement: 'Osäker? Det är helt okej!'
  },
  {
    id: 'support',
    title: 'Vi finns här för dig',
    description: 'Om du behöver stöd eller anpassningar finns det plats för det. Inget är obligatoriskt.',
    icon: <Heart className="w-8 h-8" />,
    encouragement: 'Dina behov är viktiga.'
  }
]

export function OnboardingModal() {
  const { showOnboarding, onboardingStep, setOnboardingStep, completeOnboarding, setActiveTab } = useProfileStore()

  const [isClosing, setIsClosing] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Focus management
  useEffect(() => {
    if (showOnboarding) {
      previousFocusRef.current = document.activeElement as HTMLElement
      modalRef.current?.focus()
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus()
    }
  }, [showOnboarding])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showOnboarding) {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showOnboarding])

  if (!showOnboarding) return null

  const currentStep = ONBOARDING_STEPS[onboardingStep]
  const isFirstStep = onboardingStep === 0
  const isLastStep = onboardingStep === ONBOARDING_STEPS.length - 1

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      completeOnboarding()
      setIsClosing(false)
    }, 200)
  }

  const handleNext = () => {
    if (isLastStep) {
      handleClose()
      // Navigate to first tab
      setActiveTab('overview')
    } else {
      setOnboardingStep(onboardingStep + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirstStep) {
      setOnboardingStep(onboardingStep - 1)
    }
  }

  const handleSkipToTab = (tabId: 'overview' | 'jobbsok' | 'stod') => {
    handleClose()
    setActiveTab(tabId)
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black/50 backdrop-blur-sm',
        'transition-opacity duration-200',
        isClosing ? 'opacity-0' : 'opacity-100'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          'w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-2xl overflow-hidden',
          'transform transition-all duration-200',
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        )}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-teal-500 to-sky-500 px-6 py-8 text-white">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Stäng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              {currentStep.icon}
            </div>
          </div>

          <h2 id="onboarding-title" className="text-2xl font-bold text-center">
            {currentStep.title}
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-stone-600 dark:text-stone-300 text-center mb-4">
            {currentStep.description}
          </p>

          <p className="text-sm text-teal-600 dark:text-teal-400 text-center font-medium">
            {currentStep.encouragement}
          </p>

          {/* Quick action buttons */}
          {onboardingStep > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {onboardingStep >= 1 && (
                <button
                  onClick={() => handleSkipToTab('overview')}
                  className="px-3 py-1.5 text-xs bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  Börja med grundinfo
                </button>
              )}
              {onboardingStep >= 2 && (
                <button
                  onClick={() => handleSkipToTab('jobbsok')}
                  className="px-3 py-1.5 text-xs bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  Välj önskade jobb
                </button>
              )}
            </div>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 pb-4">
          {ONBOARDING_STEPS.map((_, index) => (
            <button
              key={index}
              onClick={() => setOnboardingStep(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index === onboardingStep
                  ? 'w-6 bg-teal-500'
                  : 'bg-stone-300 dark:bg-stone-600 hover:bg-stone-400'
              )}
              aria-label={`Steg ${index + 1} av ${ONBOARDING_STEPS.length}`}
              aria-current={index === onboardingStep ? 'step' : undefined}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className={cn(
              'flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              isFirstStep
                ? 'text-stone-300 dark:text-stone-600 cursor-not-allowed'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Tillbaka
          </button>

          <button
            onClick={handleClose}
            className="text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            Hoppa över
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isLastStep ? 'Kom igång' : 'Nästa'}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Encouragement footer */}
        <div className="px-6 pb-6 pt-2 border-t border-stone-100 dark:border-stone-800">
          <p className="text-xs text-stone-400 dark:text-stone-500 text-center">
            Du kan alltid komma tillbaka och ändra. Ta den tid du behöver.
          </p>
        </div>
      </div>
    </div>
  )
}
