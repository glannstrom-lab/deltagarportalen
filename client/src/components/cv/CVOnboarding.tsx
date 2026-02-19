import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles, FileText, Wand2, Download, Check } from 'lucide-react'

interface CVOnboardingProps {
  onComplete: () => void
  onSkip: () => void
}

const steps = [
  {
    title: 'Välkommen till CV-generatorn!',
    description: 'Här kan du skapa ett professionellt CV med hjälp av AI och smarta verktyg.',
    icon: Sparkles,
  },
  {
    title: 'Välj en mall',
    description: 'Börja med att välja en CV-mall som passar din bransch och stil. Du kan ändra detta senare.',
    icon: FileText,
  },
  {
    title: 'Fyll i din information',
    description: 'Gå igenom stegen och fyll i dina personuppgifter, erfarenheter och utbildning.',
    icon: Check,
  },
  {
    title: 'Använd AI-hjälp',
    description: 'Klicka på "AI-skrivhjälp" för att förbättra dina formuleringar och få förslag.',
    icon: Wand2,
  },
  {
    title: 'Exportera ditt CV',
    description: 'När du är nöjd, ladda ner ditt CV som PDF eller dela det via en länk.',
    icon: Download,
  },
]

export function CVOnboarding({ onComplete, onSkip }: CVOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [visible, setVisible] = useState(true)

  // Check if user has seen onboarding before
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('cv-onboarding-completed')
    if (hasSeenOnboarding) {
      setVisible(false)
    }
  }, [])

  if (!visible) return null

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeOnboarding()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeOnboarding = () => {
    localStorage.setItem('cv-onboarding-completed', 'true')
    onComplete()
    setVisible(false)
  }

  const skipOnboarding = () => {
    localStorage.setItem('cv-onboarding-completed', 'true')
    onSkip()
    setVisible(false)
  }

  const CurrentIcon = steps[currentStep].icon

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={skipOnboarding}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X size={20} className="text-slate-400" />
        </button>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors ${
                index <= currentStep ? 'bg-[#4f46e5]' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#4f46e5]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CurrentIcon size={40} className="text-[#4f46e5]" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">
            {steps[currentStep].title}
          </h2>
          <p className="text-slate-600">
            {steps[currentStep].description}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={skipOnboarding}
            className="text-slate-500 hover:text-slate-700 text-sm"
          >
            Hoppa över
          </button>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors flex items-center gap-2"
            >
              {currentStep === steps.length - 1 ? (
                <>Kom igång!</>
              ) : (
                <>
                  Nästa
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step indicator */}
        <p className="text-center text-sm text-slate-400 mt-4">
          Steg {currentStep + 1} av {steps.length}
        </p>
      </div>
    </div>
  )
}

// Tooltips for specific features
interface TooltipProps {
  children: React.ReactNode
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  show?: boolean
}

export function Tooltip({ children, text, position = 'top', show = true }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  if (!show) return <>{children}</>

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute ${positionClasses[position]} z-50 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap`}>
          {text}
          <div className={`absolute w-2 h-2 bg-slate-800 rotate-45 ${
            position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' :
            position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' :
            position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' :
            'right-full top-1/2 -translate-y-1/2 -mr-1'
          }`} />
        </div>
      )}
    </div>
  )
}
