import { useState, useEffect } from 'react'
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Target, 
  Briefcase, 
  FileText,
  Compass,
  CheckCircle
} from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  action?: {
    label: string
    path: string
  }
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Välkommen till Deltagarportalen!',
    description: 'Din personliga portal för att hitta jobb, skapa CV och få stöd i din arbetssökning. Låt oss visa dig runt!',
    icon: <Sparkles className="w-12 h-12 text-amber-500" />
  },
  {
    id: 'cv',
    title: 'Skapa ett professionellt CV',
    description: 'Använd vår CV-generator för att skapa ett ATS-vänligt CV som sticker ut. Du kan även få hjälp med personliga brev.',
    icon: <FileText className="w-12 h-12 text-teal-600" />,
    action: {
      label: 'Skapa CV',
      path: '/cv'
    }
  },
  {
    id: 'jobs',
    title: 'Hitta ditt drömjobb',
    description: 'Sök bland tusentals jobb från Arbetsförmedlingen. Spara intressanta annonser och få notifikationer om nya jobb.',
    icon: <Briefcase className="w-12 h-12 text-blue-600" />,
    action: {
      label: 'Sök jobb',
      path: '/job-search'
    }
  },
  {
    id: 'guide',
    title: 'Upptäck dina styrkor',
    description: 'Gör vår intresseguide för att hitta yrken som passar just dig. Baserat på RIASEC och Big Five-personlighetstester.',
    icon: <Compass className="w-12 h-12 text-purple-600" />,
    action: {
      label: 'Gör testet',
      path: '/interest-guide'
    }
  },
  {
    id: 'support',
    title: 'Du är inte ensam',
    description: 'Har du frågor eller behöver stöd? Din arbetskonsulent finns här för dig. Du kan även hitta tips om välmående i jobbsökandet.',
    icon: <Target className="w-12 h-12 text-rose-600" />
  }
]

export default function Onboarding() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [, setHasSeenOnboarding] = useState(true)

  useEffect(() => {
    // Check if user has seen onboarding
    const seen = localStorage.getItem('has-seen-onboarding')
    if (!seen) {
      setHasSeenOnboarding(false)
      setIsOpen(true)
    }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem('has-seen-onboarding', 'true')
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleClose()
  }

  const handleStepClick = (index: number) => {
    setCurrentStep(index)
  }

  const currentStepData = steps[currentStep]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scale-in">
        {/* Header with progress */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium opacity-90">
              Steg {currentStep + 1} av {steps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-sm opacity-75 hover:opacity-100 transition-opacity"
            >
              Hoppa över
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => handleStepClick(index)}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  index <= currentStep ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center animate-bounce">
              {currentStepData.icon}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            {currentStepData.title}
          </h2>

          {/* Description */}
          <p className="text-slate-600 text-lg leading-relaxed max-w-md mx-auto mb-8">
            {currentStepData.description}
          </p>

          {/* Action button if exists */}
          {currentStepData.action && (
            <a
              href={currentStepData.action.path}
              onClick={handleClose}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors mb-6"
            >
              {currentStepData.action.label}
              <ChevronRight className="w-5 h-5" />
            </a>
          )}
        </div>

        {/* Footer with navigation */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Föregående
          </button>

          {/* Step indicators */}
          <div className="flex gap-2">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentStep 
                    ? 'bg-teal-600 w-6' 
                    : index < currentStep 
                      ? 'bg-teal-400' 
                      : 'bg-slate-300'
                }`}
                title={step.title}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            {currentStep === steps.length - 1 ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Kom igång
              </>
            ) : (
              <>
                Nästa
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Mini onboarding reminder for dashboard
export function OnboardingReminder() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-4 mb-6 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-teal-100 rounded-lg">
          <Sparkles className="w-5 h-5 text-teal-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-teal-900">Ny här?</h3>
          <p className="text-sm text-teal-700 mt-1">
            Ta en snabb rundtur för att lära dig hur portalen fungerar och kom igång med din jobbsökning.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              localStorage.removeItem('has-seen-onboarding')
              window.location.reload()
            }}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            Starta rundtur
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-2 text-teal-600 hover:bg-teal-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
