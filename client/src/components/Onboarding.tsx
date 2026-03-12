import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
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
  RotateCcw,
  Play,
  CheckCircle,
  ArrowRight,
  SkipForward,
  PartyPopper,
  Target,
  Compass,
  FileText,
  Briefcase,
  Turtle,
  Walk,
  Running
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
    title: 'Vilket tempo passar dig idag?',
    description: 'Vi anpassar upplevelsen efter ditt val. Allt sparas automatiskt och du kan pausa när du vill.',
    estimatedMinutes: 2,
    icon: <Sparkles className="w-10 h-10 text-amber-500" />
  },
  {
    id: 'choose-path',
    title: 'Välj din väg',
    description: 'Vad vill du börja med? Du kan alltid byta senare.',
    estimatedMinutes: 1,
    icon: <Compass className="w-10 h-10 text-teal-600" />
  },
  {
    id: 'first-win',
    title: 'Du är redo!',
    description: 'Bra start! Här är ditt första steg.',
    estimatedMinutes: 1,
    icon: <Award className="w-10 h-10 text-purple-600" />
  }
]

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
  const [selectedPath, setSelectedPath] = useState<'interest' | 'cv' | 'jobs' | null>(null)

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

  const navigate = useNavigate()
  const { user } = useAuthStore()

  const handleQuickStart = () => {
    localStorage.setItem('has-seen-onboarding-v2', 'true')
    localStorage.removeItem('onboarding-progress-v2')
    navigate('/cv')
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
        return selectedPath !== null
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
              <span>Du kan pausa när du vill</span>
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
              <span>Steg {currentStep + 1} av {STEPS.length}</span>
              <span>Allt sparas automatiskt</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                <button
                  onClick={() => handleEnergySelect('low')}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    energyLevel === 'low' 
                      ? 'border-teal-500 bg-teal-50 shadow-md' 
                      : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    <Turtle className="w-8 h-8 text-teal-600" />
                  </div>
                  <div className="font-semibold text-slate-700 text-sm">Utforska lugnt</div>
                  <div className="text-xs text-slate-500 mt-1">Visa mig bara det viktigaste</div>
                </button>
                <button
                  onClick={() => handleEnergySelect('medium')}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    energyLevel === 'medium' 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    <Walk className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="font-semibold text-slate-700 text-sm">Steg för steg</div>
                  <div className="text-xs text-slate-500 mt-1">Jag vill ha guidad hjälp</div>
                </button>
                <button
                  onClick={() => handleEnergySelect('high')}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    energyLevel === 'high' 
                      ? 'border-orange-500 bg-orange-50 shadow-md' 
                      : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    <Running className="w-8 h-8 text-orange-600" />
                  </div>
                  <div className="font-semibold text-slate-700 text-sm">Kom igång snabbt</div>
                  <div className="text-xs text-slate-500 mt-1">Jag vet vad jag vill</div>
                </button>
              </div>

              <p className="text-xs text-center text-slate-400">
                Du kan alltid ändra tempo senare. Allt sparas automatiskt.
              </p>
            </div>
          )}

          {/* Step 2: Choose Your Path */}
          {currentStep === 1 && (
            <div className="space-y-5 max-w-lg mx-auto">
              {/* Welcome message with user's name */}
              {user?.firstName && (
                <div className="bg-teal-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-teal-700">
                    Hej <strong>{user.firstName}</strong>! Din profil är redo.
                  </p>
                </div>
              )}

              <p className="text-sm text-slate-600 text-center">
                Var befinner du dig i din jobbsökarresa? Välj det som passar dig bäst:
              </p>

              <div className="space-y-3">
                {/* Path 1: Interest Guide */}
                <button
                  onClick={() => setSelectedPath('interest')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                    selectedPath === 'interest'
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedPath === 'interest' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-600'
                  }`}>
                    <Compass className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800">Jag vet inte vad jag vill jobba med</div>
                    <div className="text-sm text-slate-500">Gör intresseguiden för att upptäcka yrken som passar dig</div>
                  </div>
                  {selectedPath === 'interest' && <CheckCircle className="w-5 h-5 text-purple-500" />}
                </button>

                {/* Path 2: CV Builder */}
                <button
                  onClick={() => setSelectedPath('cv')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                    selectedPath === 'cv'
                      ? 'border-teal-500 bg-teal-50 shadow-md'
                      : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedPath === 'cv' ? 'bg-teal-500 text-white' : 'bg-teal-100 text-teal-600'
                  }`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800">Jag vet vad jag vill men behöver CV</div>
                    <div className="text-sm text-slate-500">Använd vår CV-byggare för att skapa ett professionellt CV</div>
                  </div>
                  {selectedPath === 'cv' && <CheckCircle className="w-5 h-5 text-teal-500" />}
                </button>

                {/* Path 3: Job Search */}
                <button
                  onClick={() => setSelectedPath('jobs')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                    selectedPath === 'jobs'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedPath === 'jobs' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'
                  }`}>
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800">Jag är redo att börja söka jobb</div>
                    <div className="text-sm text-slate-500">Hoppa direkt till jobbsökningen om du redan har CV</div>
                  </div>
                  {selectedPath === 'jobs' && <CheckCircle className="w-5 h-5 text-blue-500" />}
                </button>
              </div>

              <p className="text-xs text-slate-400 text-center">
                Du kan alltid byta väg senare. Alla verktyg finns tillgängliga i din dashboard.
              </p>
            </div>
          )}

          {/* Step 3: First Win - Based on selected path */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6 border border-teal-100">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-teal-100 rounded-xl">
                    <PartyPopper className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-teal-900 mb-1">
                      {selectedPath === 'interest' && 'Bra val att börja med intressen!'}
                      {selectedPath === 'cv' && 'Dags att skapa ett CV som sticker ut!'}
                      {selectedPath === 'jobs' && 'Redo att hitta ditt nya jobb!'}
                    </h3>
                    <p className="text-teal-700 text-sm">
                      {energyLevel === 'low' 
                        ? 'Ta det i din takt. Du kan alltid pausa och fortsätta senare.'
                        : energyLevel === 'medium'
                        ? 'Vi guidar dig steg för steg. Du gör det i din takt.'
                        : 'Perfekt! Du kan komma igång direkt.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Selected path summary */}
              <div className="bg-slate-50 rounded-xl p-5">
                <h4 className="font-semibold text-slate-700 mb-4 text-center">Dina val</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-600">Tempo: <span className="font-medium text-slate-800">
                      {energyLevel === 'high' ? 'Kom igång snabbt' : energyLevel === 'medium' ? 'Steg för steg' : 'Utforska lugnt'}
                    </span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-600">Din väg: <span className="font-medium text-slate-800">
                      {selectedPath === 'interest' && 'Upptäcka yrken med intresseguiden'}
                      {selectedPath === 'cv' && 'Skapa professionellt CV'}
                      {selectedPath === 'jobs' && 'Söka jobb direkt'}
                    </span></span>
                  </div>
                  {user?.firstName && (
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-slate-600">Profil: <span className="font-medium text-slate-800">{user.firstName}</span></span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-center text-sm text-slate-500">
                Kom ihåg: Du kan alltid byta väg eller pausa. Allt sparas automatiskt.
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
              <button
                onClick={() => {
                  handleComplete()
                  if (selectedPath === 'interest') navigate('/interest-guide')
                  else if (selectedPath === 'cv') navigate('/cv')
                  else if (selectedPath === 'jobs') navigate('/job-search')
                  else navigate('/')
                }}
                className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                {selectedPath === 'interest' && 'Starta intresseguiden'}
                {selectedPath === 'cv' && 'Skapa mitt CV'}
                {selectedPath === 'jobs' && 'Sök jobb'}
                {!selectedPath && 'Kom igång'}
                <ArrowRight className="w-5 h-5" />
              </button>
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
              : 'Välkommen! Vill du komma igång med din jobbsökarresa?'}
          </p>
          <p className="text-xs text-teal-700/70 mt-0.5">
            Välj ditt tempo och kom igång med din jobbsökarresa
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
