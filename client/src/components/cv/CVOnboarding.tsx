/**
 * CV Builder Onboarding / Walkthrough
 * Guides first-time users through the CV creation process
 */

import { useState, useEffect } from 'react'
import { 
  X, ChevronRight, ChevronLeft, Sparkles, CheckCircle,
  FileText, User, Briefcase, Award, Eye, Download
} from '@/components/ui/icons'

interface OnboardingStep {
  id: string
  title: string
  description: string
  target: string
  icon: React.ElementType
  tip: string
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Välkommen till CV-byggaren!',
    description: 'Här skapar du ett professionellt CV på nolltid. Jag guidar dig genom processen.',
    target: '',
    icon: Sparkles,
    tip: 'Allt sparas automatiskt, så du kan alltid fortsätta senare.'
  },
  {
    id: 'design',
    title: 'Välj design',
    description: 'Börja med att välja en mall och färg som passar din personlighet och bransch.',
    target: 'step-1',
    icon: FileText,
    tip: 'Moderna mallar passar bra för kreativa yrken, medan klassiska fungerar överallt.'
  },
  {
    id: 'personal',
    title: 'Fyll i dina uppgifter',
    description: 'Lägg till ditt namn, kontaktuppgifter och en profilbild.',
    target: 'step-2',
    icon: User,
    tip: 'En professionell profilbild ökar chanserna att bli uppmärksammad.'
  },
  {
    id: 'profile',
    title: 'Skriv en sammanfattning',
    description: 'Berätta kort vem du är och vad du söker. Detta är det första rekryterare läser.',
    target: 'step-3',
    icon: FileText,
    tip: 'Använd aktiva verb och nämn dina starkaste sidor. 3-5 meningar räcker.'
  },
  {
    id: 'experience',
    title: 'Lägg till erfarenhet',
    description: 'Beskriv dina tidigare jobb och utbildningar. Var specifik!',
    target: 'step-4',
    icon: Briefcase,
    tip: 'Kvantifiera resultat när du kan: "Ökade försäljningen med 25%".'
  },
  {
    id: 'skills',
    title: 'Lista dina kompetenser',
    description: 'Lägg till både tekniska och mjuka färdigheter. Betygsätta dig själv ärligt.',
    target: 'step-5',
    icon: Award,
    tip: 'Titta på jobbannonser för att se vilka kompetenser som efterfrågas.'
  },
  {
    id: 'preview',
    title: 'Förhandsgranska och exportera',
    description: 'Se hur ditt CV ser ut och ladda ner det som PDF när du är nöjd.',
    target: '',
    icon: Eye,
    tip: 'Be någon du litar på att läsa igenom innan du skickar det.'
  }
]

interface CVOnboardingProps {
  onComplete: () => void
  onSkip: () => void
}

export function CVOnboarding({ onComplete, onSkip }: CVOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  // Check if user has seen onboarding before
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('cv-onboarding-completed')
    if (hasSeenOnboarding) {
      setIsVisible(false)
    }
  }, [])

  if (!isVisible) return null

  const step = ONBOARDING_STEPS[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1
  const Icon = step.icon

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding()
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1)
  }

  const completeOnboarding = () => {
    localStorage.setItem('cv-onboarding-completed', 'true')
    setIsVisible(false)
    onComplete()
  }

  const handleSkip = () => {
    localStorage.setItem('cv-onboarding-completed', 'true')
    setIsVisible(false)
    onSkip()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header with progress */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-white/80">
                Steg {currentStep + 1} av {ONBOARDING_STEPS.length}
              </span>
            </div>
            <button
              onClick={handleSkip}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-stone-800 mb-3">
            {step.title}
          </h2>
          <p className="text-stone-600 mb-6 leading-relaxed">
            {step.description}
          </p>

          {/* Tip box */}
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-purple-800 mb-1">Tips!</p>
                <p className="text-sm text-purple-700">{step.tip}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={`
                flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-colors
                ${isFirstStep 
                  ? 'text-stone-300 cursor-not-allowed' 
                  : 'text-stone-600 hover:bg-stone-100'
                }
              `}
            >
              <ChevronLeft className="w-4 h-4" />
              Tillbaka
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-stone-700 hover:text-stone-700 font-medium transition-colors"
              >
                Hoppa över
              </button>
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
              >
                {isLastStep ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Kom igång!
                  </>
                ) : (
                  <>
                    Nästa
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-1.5 pb-4">
          {ONBOARDING_STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`
                w-2 h-2 rounded-full transition-colors
                ${idx === currentStep ? 'bg-purple-600' : 
                  idx < currentStep ? 'bg-purple-300' : 'bg-stone-200'}
              `}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Reset onboarding (for testing or if user wants to see it again)
export function resetOnboarding() {
  localStorage.removeItem('cv-onboarding-completed')
}

// Check if onboarding should be shown
export function shouldShowOnboarding(): boolean {
  return !localStorage.getItem('cv-onboarding-completed')
}
