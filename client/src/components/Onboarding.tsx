import { useState, useEffect, useCallback } from 'react'
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Zap,
  User,
  Mail,
  Upload,
  Award,
  Clock,
  RotateCcw,
  Play,
  CheckCircle,
  ArrowRight,
  SkipForward,
  PartyPopper,
  Target
} from 'lucide-react'

type EnergyLevel = 'high' | 'medium' | 'low' | null

interface StepInfo {
  id: string
  title: string
  description: string
  estimatedMinutes: number
  icon: React.ReactNode
}

const STEPS: StepInfo[] = [
  {
    id: 'welcome-energy',
    title: 'Välkommen! Hur mår du idag?',
    description: 'Vi anpassar upplevelsen efter din energinivå. Allt sparas automatiskt.',
    estimatedMinutes: 3,
    icon: <Sparkles className="w-10 h-10 text-amber-500" />
  },
  {
    id: 'quick-profile',
    title: 'Skapa din profil',
    description: 'Bara det viktigaste för att komma igång. Du kan fylla på mer senare.',
    estimatedMinutes: 5,
    icon: <User className="w-10 h-10 text-teal-600" />
  },
  {
    id: 'first-win',
    title: 'Ditt första steg',
    description: 'Du är nästan klar! Här är en liten vinst att börja med.',
    estimatedMinutes: 2,
    icon: <Award className="w-10 h-10 text-purple-600" />
  }
]

const TOTAL_MINUTES = 10

export default function Onboarding() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [, setHasSeenOnboarding] = useState(true)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(null)
  const [startTime] = useState<number>(Date.now())
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [isResuming, setIsResuming] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [stepCompleted, setStepCompleted] = useState<boolean[]>([false, false, false])
  const [cvFile, setCvFile] = useState<File | null>(null)

  // Load saved progress
  useEffect(() => {
    const savedProgress = localStorage.getItem('onboarding-progress-v2')
    const savedName = localStorage.getItem('onboarding-name')
    const savedEmail = localStorage.getItem('onboarding-email')
    const savedEnergy = localStorage.getItem('onboarding-energy') as EnergyLevel
    const seen = localStorage.getItem('has-seen-onboarding-v2')
    const savedSteps = localStorage.getItem('onboarding-steps-completed')
    
    if (savedProgress) {
      const step = parseInt(savedProgress, 10)
      setCurrentStep(step)
      if (step > 0) setIsResuming(true)
    }
    if (savedName) setUserName(savedName)
    if (savedEmail) setUserEmail(savedEmail)
    if (savedEnergy) setEnergyLevel(savedEnergy)
    if (savedSteps) setStepCompleted(JSON.parse(savedSteps))
    
    if (!seen) {
      setHasSeenOnboarding(false)
      setIsOpen(true)
    }
  }, [])

  // Save progress on change
  useEffect(() => {
    localStorage.setItem('onboarding-progress-v2', currentStep.toString())
    if (userName) localStorage.setItem('onboarding-name', userName)
    if (userEmail) localStorage.setItem('onboarding-email', userEmail)
    if (energyLevel) localStorage.setItem('onboarding-energy', energyLevel)
    localStorage.setItem('onboarding-steps-completed', JSON.stringify(stepCompleted))
  }, [currentStep, userName, userEmail, energyLevel, stepCompleted])

  // Timer for time-to-value measurement
  useEffect(() => {
    if (!isOpen) return
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [isOpen, startTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins} min ${secs} sek` : `${secs} sek`
  }

  const getRemainingMinutes = () => {
    let remaining = TOTAL_MINUTES
    for (let i = currentStep; i < STEPS.length; i++) {
      remaining -= STEPS[i].estimatedMinutes
    }
    return Math.max(0, remaining)
  }

  const getTotalProgress = () => {
    let completed = 0
    for (let i = 0; i < STEPS.length; i++) {
      if (i < currentStep || stepCompleted[i]) {
        completed += STEPS[i].estimatedMinutes
      }
    }
    return completed
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleComplete = () => {
    localStorage.setItem('has-seen-onboarding-v2', 'true')
    localStorage.removeItem('onboarding-progress-v2')
    localStorage.removeItem('onboarding-steps-completed')
    setIsOpen(false)
  }

  const celebrateStep = () => {
    setShowCelebration(true)
    const newCompleted = [...stepCompleted]
    newCompleted[currentStep] = true
    setStepCompleted(newCompleted)
    setTimeout(() => setShowCelebration(false), 1500)
  }

  const handleNext = () => {
    celebrateStep()
    
    if (currentStep < STEPS.length - 1) {
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
      }, currentStep === 0 ? 500 : 300)
    } else {
      setTimeout(() => {
        handleComplete()
      }, 500)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    // Save that user skipped, but remember their progress
    localStorage.setItem('onboarding-skipped-v2', 'true')
    handleClose()
  }

  const handleQuickStart = () => {
    localStorage.setItem('has-seen-onboarding-v2', 'true')
    localStorage.removeItem('onboarding-progress-v2')
    window.location.href = '/cv'
  }

  const handleEnergySelect = (level: EnergyLevel) => {
    setEnergyLevel(level)
    // Small delay to show selection before moving on
    setTimeout(() => handleNext(), 400)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCvFile(file)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return energyLevel !== null
      case 1:
        return userName.trim().length > 0 && userEmail.trim().length > 0
      case 2:
        return true
      default:
        return false
    }
  }

  const currentStepData = STEPS[currentStep]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden animate-scale-in">
        {/* Header with progress */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            title="Stäng (du kan återuppta senare)"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                Steg {currentStep + 1} av {STEPS.length}
              </span>
              {isResuming && currentStep > 0 && (
                <span className="text-xs bg-amber-500/80 px-2 py-1 rounded-full flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  Fortsätter
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm opacity-90">
              <Clock className="w-4 h-4" />
              <span>{getRemainingMinutes()} min kvar</span>
            </div>
          </div>

          {/* Progress bar with time */}
          <div className="relative">
            <div className="flex gap-2 mb-2">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex-1">
                  <button
                    onClick={() => index < currentStep && setCurrentStep(index)}
                    disabled={index >= currentStep}
                    className={`w-full h-2 rounded-full transition-all duration-500 ${
                      index <= currentStep 
                        ? 'bg-white' 
                        : 'bg-white/30'
                    } ${index < currentStep ? 'cursor-pointer hover:opacity-80' : ''}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs opacity-75">
              <span>{getTotalProgress()} min gjort</span>
              <span>Totalt {TOTAL_MINUTES} min</span>
            </div>
          </div>
        </div>

        {/* Celebration overlay */}
        {showCelebration && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="bg-white/90 rounded-2xl p-6 shadow-2xl animate-bounce">
              <PartyPopper className="w-12 h-12 text-amber-500 mx-auto" />
              <p className="text-center font-bold text-teal-700 mt-2">Steg klart! 🎉</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
              {currentStepData.icon}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-slate-900 mb-3 text-center">
            {currentStepData.title}
          </h2>

          {/* Description */}
          <p className="text-slate-600 text-center mb-8 max-w-md mx-auto">
            {currentStepData.description}
          </p>

          {/* Step 1: Welcome + Energy selector */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                <button
                  onClick={() => handleEnergySelect('high')}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    energyLevel === 'high' 
                      ? 'border-green-500 bg-green-50 shadow-md' 
                      : 'border-slate-200 hover:border-green-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-3xl mb-2">🟢</div>
                  <div className="font-semibold text-slate-700 text-sm">Bra</div>
                  <div className="text-xs text-slate-500">Mycket energi</div>
                </button>
                <button
                  onClick={() => handleEnergySelect('medium')}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    energyLevel === 'medium' 
                      ? 'border-yellow-500 bg-yellow-50 shadow-md' 
                      : 'border-slate-200 hover:border-yellow-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-3xl mb-2">🟡</div>
                  <div className="font-semibold text-slate-700 text-sm">Okej</div>
                  <div className="text-xs text-slate-500">Lagom</div>
                </button>
                <button
                  onClick={() => handleEnergySelect('low')}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    energyLevel === 'low' 
                      ? 'border-orange-500 bg-orange-50 shadow-md' 
                      : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-3xl mb-2">🟠</div>
                  <div className="font-semibold text-slate-700 text-sm">Låg</div>
                  <div className="text-xs text-slate-500">Behöver vila</div>
                </button>
              </div>

              {/* Quick start option */}
              <div className="text-center pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-500 mb-3">Vill du komma igång direkt?</p>
                <button
                  onClick={handleQuickStart}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-100 text-amber-700 rounded-xl font-medium hover:bg-amber-200 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Snabbstart - hoppa till CV
                </button>
              </div>

              <p className="text-xs text-center text-slate-400">
                Allt du gör sparas automatiskt. Du kan alltid återkomma senare.
              </p>
            </div>
          )}

          {/* Step 2: Quick Profile */}
          {currentStep === 1 && (
            <div className="space-y-5 max-w-sm mx-auto">
              {/* Name input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  Ditt namn
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="För- och efternamn"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Email input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  E-postadress
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="din@email.se"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Optional CV upload */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-600 mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-slate-400" />
                  Har du redan ett CV? (valfritt)
                </p>
                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {cvFile ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-green-600">{cvFile.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-sm text-slate-500">Ladda upp befintligt CV</span>
                    </>
                  )}
                </label>
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Vi kan importera informationen automatiskt
                </p>
              </div>
            </div>
          )}

          {/* Step 3: First Win */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6 border border-teal-100">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-teal-100 rounded-xl">
                    <Target className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-teal-900 mb-1">
                      Dagens lilla steg
                    </h3>
                    <p className="text-teal-700 text-sm">
                      {energyLevel === 'low' 
                        ? 'Ta en titt på ditt nya CV. Du har redan kommit långt!'
                        : energyLevel === 'medium'
                        ? 'Utforska ditt nya CV och lägg till en sak du är bra på.'
                        : 'Perfekt! Utforska ditt nya CV och börja bygga din profil.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress summary */}
              <div className="bg-slate-50 rounded-xl p-5">
                <h4 className="font-semibold text-slate-700 mb-4 text-center">Din progress</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-600">Valt energinivå: <span className="font-medium text-slate-800">
                      {energyLevel === 'high' ? 'Bra' : energyLevel === 'medium' ? 'Okej' : 'Låg'}
                    </span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-600">Skapat profil: <span className="font-medium text-slate-800">{userName}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-600">Tid till första resultat: <span className="font-medium text-slate-800">{formatTime(elapsedTime)}</span></span>
                  </div>
                </div>
              </div>

              <p className="text-center text-sm text-slate-500">
                Du kan alltid återkomma och fortsätta bygga din profil. 
                Allt sparas automatiskt.
              </p>
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        <div className="p-6 bg-slate-50 border-t border-slate-100">
          {/* Navigation buttons */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Föregående
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Nästa
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <a
                href="/cv"
                onClick={handleComplete}
                className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Se mitt CV
                <ArrowRight className="w-5 h-5" />
              </a>
            )}
          </div>

          {/* Skip option - respectful */}
          <div className="text-center">
            <button
              onClick={handleSkip}
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors py-2"
            >
              <SkipForward className="w-4 h-4" />
              Hoppa över - du kan alltid återkomma till detta senare
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Mini onboarding reminder for dashboard - less intrusive
export function OnboardingReminder() {
  const [isVisible, setIsVisible] = useState(true)
  const [hasProgress, setHasProgress] = useState(false)
  const [progressStep, setProgressStep] = useState(0)

  useEffect(() => {
    const completed = localStorage.getItem('has-seen-onboarding-v2')
    const skipped = localStorage.getItem('onboarding-skipped-v2')
    const progress = localStorage.getItem('onboarding-progress-v2')
    
    // Don't show if completed or dismissed
    if (completed || skipped) {
      setIsVisible(false)
      return
    }
    
    if (progress) {
      const step = parseInt(progress, 10)
      if (step > 0) {
        setHasProgress(true)
        setProgressStep(step)
      }
    }
  }, [])

  const handleResume = () => {
    localStorage.removeItem('onboarding-skipped-v2')
    window.location.reload()
  }

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('onboarding-reminder-dismissed', Date.now().toString())
  }

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-r from-teal-50/80 to-emerald-50/80 border border-teal-100 rounded-xl p-4 mb-4 animate-fade-in backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-teal-100/50 rounded-lg">
          <Sparkles className="w-5 h-5 text-teal-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-teal-900">
            {hasProgress 
              ? `Fortsätt där du slutade (steg ${progressStep} av 3)` 
              : 'Välkommen! Vill du se en snabb introduktion?'}
          </p>
          <p className="text-xs text-teal-700/70 mt-0.5">
            Tar bara 10 minuter - du kan hoppa av när som helst
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleResume}
            className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            {hasProgress ? 'Fortsätt' : 'Starta'}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-teal-600/60 hover:text-teal-600 hover:bg-teal-100/50 rounded-lg transition-colors"
            title="Stäng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook to check if onboarding is in progress
export function useOnboardingProgress() {
  const [progress, setProgress] = useState({
    hasStarted: false,
    currentStep: 0,
    totalSteps: 3,
    userName: '',
    energyLevel: null as EnergyLevel,
    isCompleted: false,
    isSkipped: false
  })

  useEffect(() => {
    const savedProgress = localStorage.getItem('onboarding-progress-v2')
    const savedName = localStorage.getItem('onboarding-name')
    const savedEnergy = localStorage.getItem('onboarding-energy') as EnergyLevel
    const completed = localStorage.getItem('has-seen-onboarding-v2')
    const skipped = localStorage.getItem('onboarding-skipped-v2')

    setProgress({
      hasStarted: !!savedProgress && parseInt(savedProgress, 10) > 0,
      currentStep: savedProgress ? parseInt(savedProgress, 10) : 0,
      totalSteps: 3,
      userName: savedName || '',
      energyLevel: savedEnergy,
      isCompleted: !!completed,
      isSkipped: !!skipped
    })
  }, [])

  return progress
}
