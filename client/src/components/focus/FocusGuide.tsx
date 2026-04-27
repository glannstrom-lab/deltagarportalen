/**
 * FocusGuide - Komplett NPF-anpassad stegvis guide
 *
 * En sammanhållen upplevelse där användaren aldrig lämnar vyn.
 * Allt händer i samma fönster med inbäddade formulär och innehåll.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useFocusMode } from '@/components/FocusModeProvider'
import { cn } from '@/lib/utils'
import {
  Heart, ArrowRight, ArrowLeft, Check, Sparkles,
  User, FileText, Search, Mail, PartyPopper
} from '@/components/ui/icons'

// Step components
import { FocusWelcome } from './steps/FocusWelcome'
import { FocusProfile } from './steps/FocusProfile'
import { FocusCV } from './steps/FocusCV'
import { FocusJobSearch } from './steps/FocusJobSearch'
import { FocusCoverLetter } from './steps/FocusCoverLetter'
import { FocusComplete } from './steps/FocusComplete'

// Step definitions
const STEPS = [
  { id: 'welcome', icon: Heart, titleKey: 'focusGuide.steps.welcome' },
  { id: 'profile', icon: User, titleKey: 'focusGuide.steps.profile' },
  { id: 'cv', icon: FileText, titleKey: 'focusGuide.steps.cv' },
  { id: 'jobs', icon: Search, titleKey: 'focusGuide.steps.jobs' },
  { id: 'coverLetter', icon: Mail, titleKey: 'focusGuide.steps.coverLetter' },
  { id: 'complete', icon: PartyPopper, titleKey: 'focusGuide.steps.complete' },
] as const

type StepId = typeof STEPS[number]['id']

export function FocusGuide() {
  const { t } = useTranslation()
  const { profile } = useAuthStore()
  const { toggleFocusMode } = useFocusMode()
  const [currentStep, setCurrentStep] = useState<StepId>('welcome')
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set())

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep)
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === STEPS.length - 1

  // Progress excluding welcome and complete
  const contentSteps = STEPS.filter(s => s.id !== 'welcome' && s.id !== 'complete')
  const completedContentSteps = contentSteps.filter(s => completedSteps.has(s.id))
  const progressPercent = Math.round((completedContentSteps.length / contentSteps.length) * 100)

  const goToStep = (stepId: StepId) => {
    setCurrentStep(stepId)
  }

  const goNext = () => {
    if (!isLastStep) {
      const nextStep = STEPS[currentStepIndex + 1]
      setCurrentStep(nextStep.id)
    }
  }

  const goPrev = () => {
    if (!isFirstStep) {
      const prevStep = STEPS[currentStepIndex - 1]
      setCurrentStep(prevStep.id)
    }
  }

  const markStepComplete = (stepId: StepId) => {
    setCompletedSteps(prev => new Set([...prev, stepId]))
  }

  const handleStepComplete = () => {
    if (currentStep !== 'welcome' && currentStep !== 'complete') {
      markStepComplete(currentStep)
    }
    goNext()
  }

  const handleSkip = () => {
    goNext()
  }

  const handleExit = () => {
    toggleFocusMode()
  }

  // Get first name for personalization
  const firstName = profile?.first_name || ''

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col">
      {/* Progress Header - only show after welcome */}
      {currentStep !== 'welcome' && currentStep !== 'complete' && (
        <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700/50 px-4 py-3 mb-6">
          <div className="max-w-2xl mx-auto">
            {/* Step indicators */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {t('focusGuide.progress', 'Din framgång')}
              </p>
              <p className="text-sm font-medium text-teal-600 dark:text-teal-400">
                {progressPercent}%
              </p>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-2">
              {contentSteps.map((step) => {
                const isActive = step.id === currentStep
                const isComplete = completedSteps.has(step.id)
                const Icon = step.icon

                return (
                  <button
                    key={step.id}
                    onClick={() => goToStep(step.id)}
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                      isActive && 'bg-teal-500 text-white ring-4 ring-teal-500/20',
                      isComplete && !isActive && 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400',
                      !isActive && !isComplete && 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                    )}
                    aria-label={t(step.titleKey)}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    {isComplete && !isActive ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="flex-1 px-4">
        <div className="max-w-2xl mx-auto">
          {currentStep === 'welcome' && (
            <FocusWelcome
              firstName={firstName}
              onStart={goNext}
              onExit={handleExit}
            />
          )}

          {currentStep === 'profile' && (
            <FocusProfile
              onComplete={handleStepComplete}
              onSkip={handleSkip}
              onBack={goPrev}
            />
          )}

          {currentStep === 'cv' && (
            <FocusCV
              onComplete={handleStepComplete}
              onSkip={handleSkip}
              onBack={goPrev}
            />
          )}

          {currentStep === 'jobs' && (
            <FocusJobSearch
              onComplete={handleStepComplete}
              onSkip={handleSkip}
              onBack={goPrev}
            />
          )}

          {currentStep === 'coverLetter' && (
            <FocusCoverLetter
              onComplete={handleStepComplete}
              onSkip={handleSkip}
              onBack={goPrev}
            />
          )}

          {currentStep === 'complete' && (
            <FocusComplete
              onExit={handleExit}
              onRestart={() => goToStep('profile')}
            />
          )}
        </div>
      </div>

      {/* Bottom navigation - only show for content steps */}
      {currentStep !== 'welcome' && currentStep !== 'complete' && (
        <div className="bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-700/50 px-4 py-4 mt-6">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button
              onClick={goPrev}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors',
                'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              {t('common.previous', 'Tillbaka')}
            </button>

            <button
              onClick={handleExit}
              className="text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
            >
              {t('focusGuide.exitAnytime', 'Avsluta guiden')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FocusGuide
