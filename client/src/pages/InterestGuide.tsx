import { useState, useEffect } from 'react'
import { 
  allQuestions, 
  sections,
  calculateUserProfile,
  type SectionId,
  type UserProfile,
} from '@/services/interestGuideData'
import { QuestionCard } from '@/components/interest-guide/QuestionCard'
import { SectionDots, SectionInfo } from '@/components/interest-guide/SectionDots'
import { IntroScreen } from '@/components/interest-guide/IntroScreen'
import { ResultsView } from '@/components/interest-guide/ResultsView'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, ArrowRight, Save, Trash2 } from 'lucide-react'

const STORAGE_KEY = 'interest-guide-progress'
const STORAGE_RESULT_KEY = 'interest-guide-result'

export default function InterestGuide() {
  const [screen, setScreen] = useState<'intro' | 'quiz' | 'results'>('intro')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [hasSavedProgress, setHasSavedProgress] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showSaveIndicator, setShowSaveIndicator] = useState(false)

  // Ladda sparad progress vid start
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.answers && Object.keys(data.answers).length > 0) {
          setHasSavedProgress(true)
        }
      } catch {
        // Ignorera fel
      }
    }

    const savedResult = localStorage.getItem(STORAGE_RESULT_KEY)
    if (savedResult) {
      try {
        const data = JSON.parse(savedResult)
        if (data.profile) {
          setProfile(data.profile)
        }
      } catch {
        // Ignorera fel
      }
    }
  }, [])

  // Spara progress automatiskt
  useEffect(() => {
    if (Object.keys(answers).length > 0 && screen === 'quiz') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        answers,
        currentQuestionIndex,
        timestamp: new Date().toISOString(),
      }))
      setShowSaveIndicator(true)
      const timer = setTimeout(() => setShowSaveIndicator(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [answers, currentQuestionIndex, screen])

  const currentQuestion = allQuestions[currentQuestionIndex]
  const currentSection = sections.find(s => s.id === currentQuestion?.section)
  
  const currentSectionQuestions = allQuestions.filter(q => q.section === currentSection?.id)
  const questionInSectionIndex = currentSectionQuestions.findIndex(q => q.id === currentQuestion?.id)

  const completedSections = sections.filter(s => {
    const sectionQuestions = allQuestions.filter(q => q.section === s.id)
    return sectionQuestions.every(q => answers[q.id] !== undefined)
  }).map(s => s.id)

  const handleStart = () => {
    setScreen('quiz')
    setCurrentQuestionIndex(0)
    setAnswers({})
  }

  const handleContinue = () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setAnswers(data.answers || {})
        setCurrentQuestionIndex(data.currentQuestionIndex || 0)
        setScreen('quiz')
      } catch {
        handleStart()
      }
    }
  }

  const handleAnswer = (value: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // Beräkna resultat
      const calculatedProfile = calculateUserProfile(answers)
      setProfile(calculatedProfile)
      localStorage.setItem(STORAGE_RESULT_KEY, JSON.stringify({
        profile: calculatedProfile,
        timestamp: new Date().toISOString(),
      }))
      setScreen('results')
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleClearProgress = () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_RESULT_KEY)
    setHasSavedProgress(false)
    setProfile(null)
    setAnswers({})
    setCurrentQuestionIndex(0)
    setScreen('intro')
  }

  const handleRestart = () => {
    setAnswers({})
    setCurrentQuestionIndex(0)
    setProfile(null)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_RESULT_KEY)
    setScreen('intro')
  }

  const goToSection = (sectionId: SectionId) => {
    const firstQuestionInSection = allQuestions.findIndex(q => q.section === sectionId)
    if (firstQuestionInSection >= 0) {
      setCurrentQuestionIndex(firstQuestionInSection)
    }
  }

  // Intro screen
  if (screen === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <IntroScreen
            onStart={handleStart}
            onContinue={hasSavedProgress ? handleContinue : undefined}
            hasSavedProgress={hasSavedProgress}
          />
          
          {hasSavedProgress && (
            <div className="mt-8 text-center">
              <button
                onClick={handleClearProgress}
                className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 mx-auto"
              >
                <Trash2 className="w-4 h-4" />
                Rensa sparad data
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Results screen
  if (screen === 'results' && profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
        <ResultsView 
          profile={profile} 
          onRestart={handleRestart}
        />
      </div>
    )
  }

  // Quiz screen
  const progress = Math.round((currentQuestionIndex / allQuestions.length) * 100)
  const canProceed = answers[currentQuestion.id] !== undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Intresseguide</h1>
          <div className="flex items-center gap-3">
            {/* Save indicator */}
            {showSaveIndicator && (
              <span className="flex items-center gap-1 text-sm text-green-600 animate-in fade-in">
                <Save className="w-4 h-4" />
                Sparat
              </span>
            )}
            
            {/* Clear data button */}
            <button
              onClick={handleClearProgress}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Rensa sparad data"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section dots */}
        <SectionDots
          currentSection={currentSection?.id as SectionId}
          completedSections={completedSections}
          onSectionClick={goToSection}
        />

        {/* Section info */}
        <SectionInfo sectionId={currentSection?.id as SectionId} />

        {/* Overall progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Totalt framsteg</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <QuestionCard
            question={currentQuestion}
            value={answers[currentQuestion.id] || 50}
            onChange={handleAnswer}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={allQuestions.length}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka
          </Button>

          <div className="text-sm text-gray-500">
            {currentQuestionIndex + 1} / {allQuestions.length}
          </div>

          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {currentQuestionIndex === allQuestions.length - 1 ? 'Se resultat' : 'Nästa'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Section progress */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            {currentSection?.name} - Fråga {questionInSectionIndex + 1} av {currentSectionQuestions.length}
          </p>
        </div>
      </div>
    </div>
  )
}
