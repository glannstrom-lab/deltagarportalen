/**
 * AI Team Onboarding Modal
 * Introduces new users to the AI Team feature with a guided tour
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { AgentAvatar } from './AgentAvatar'
import { agents } from './AgentSelector'
import { agentColorClasses } from './types'
import { X, ChevronRight, ChevronLeft, Sparkles } from '@/components/ui/icons'

const ONBOARDING_KEY = 'ai-team-onboarding-completed'

interface OnboardingModalProps {
  onComplete?: () => void
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0)

  // Check if user has seen onboarding
  useEffect(() => {
    const hasCompleted = localStorage.getItem(ONBOARDING_KEY)
    if (!hasCompleted) {
      setIsOpen(true)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setIsOpen(false)
    onComplete?.()
  }

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setIsOpen(false)
  }

  if (!isOpen) return null

  const steps = [
    {
      title: t('aiTeam.onboarding.welcome.title'),
      description: t('aiTeam.onboarding.welcome.description'),
      content: (
        <div className="flex justify-center py-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-xl">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-white font-bold text-sm animate-bounce">
              5
            </div>
          </div>
        </div>
      ),
    },
    {
      title: t('aiTeam.onboarding.agents.title'),
      description: t('aiTeam.onboarding.agents.description'),
      content: (
        <div className="grid grid-cols-5 gap-2 py-4">
          {agents.map((agent) => {
            const colors = agentColorClasses[agent.color]
            return (
              <div key={agent.id} className="flex flex-col items-center gap-2 p-2">
                <AgentAvatar agentId={agent.id} color={agent.color} size="lg" />
                <span className={cn('text-xs font-medium text-center', colors.text)}>
                  {t(agent.nameKey)}
                </span>
              </div>
            )
          })}
        </div>
      ),
    },
    {
      title: t('aiTeam.onboarding.personality.title'),
      description: t('aiTeam.onboarding.personality.description'),
      content: (
        <div className="flex flex-wrap justify-center gap-3 py-6">
          {['🎯', '❤️', '⚡', '💪', '👵', '🏴‍☠️'].map((emoji, i) => (
            <div
              key={i}
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
                'bg-stone-100 dark:bg-stone-800',
                'shadow-sm hover:shadow-md transition-shadow',
                i === 0 && 'ring-2 ring-teal-500'
              )}
            >
              {emoji}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: t('aiTeam.onboarding.quickstart.title'),
      description: t('aiTeam.onboarding.quickstart.description'),
      content: (
        <div className="space-y-3 py-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800">
            <span className="text-2xl">1️⃣</span>
            <span className="text-sm text-teal-700 dark:text-teal-300">
              {t('aiTeam.onboarding.quickstart.step1')}
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800">
            <span className="text-2xl">2️⃣</span>
            <span className="text-sm text-violet-700 dark:text-violet-300">
              {t('aiTeam.onboarding.quickstart.step2')}
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
            <span className="text-2xl">3️⃣</span>
            <span className="text-sm text-amber-700 dark:text-amber-300">
              {t('aiTeam.onboarding.quickstart.step3')}
            </span>
          </div>
        </div>
      ),
    },
  ]

  const currentStep = steps[step]
  const isLastStep = step === steps.length - 1
  const isFirstStep = step === 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label={t('common.close')}
        >
          <X className="w-5 h-5 text-stone-500" />
        </button>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                i === step ? 'bg-teal-500' : 'bg-stone-200 dark:bg-stone-700'
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            {currentStep.title}
          </h2>
          <p className="text-stone-600 dark:text-stone-400 mb-4">
            {currentStep.description}
          </p>
          {currentStep.content}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between">
          {!isFirstStep ? (
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              {t('common.back')}
            </Button>
          ) : (
            <Button variant="ghost" onClick={handleSkip}>
              {t('common.skip')}
            </Button>
          )}

          {isLastStep ? (
            <Button onClick={handleComplete}>
              {t('aiTeam.onboarding.startChat')}
            </Button>
          ) : (
            <Button
              onClick={() => setStep(step + 1)}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              {t('common.next')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default OnboardingModal
