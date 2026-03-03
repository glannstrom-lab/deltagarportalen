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
import { ArrowLeft, ArrowRight, Save, Trash2, Loader2 } from 'lucide-react'
import { interestGuideApi } from '@/services/cloudStorage'

interface SavedProgress {
  answers: Record<string, number>
  currentQuestionIndex: number
  timestamp: string
}

interface SavedResult {
  profile: UserProfile
  timestamp: string
}

export default function InterestGuide() {
  const [screen, setScreen] = useState<'intro' | 'quiz' | 'results'>('intro')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [hasSavedProgress, setHasSavedProgress] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showSaveIndicator, setShowSaveIndicator] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ladda sparad progress från molnet vid start
  useEffect(() => {
    const loadProgress = async () => {
      try {
        setIsLoading(true)
        const data = await interestGuideApi.getProgress()
        
        if (data) {
          // Kolla om det finns sparade svar
          if (data.answers && Object.keys(data.answers).length > 0) {
            setHasSavedProgress(true)
            setAnswers(data.answers)
            setCurrentQuestionIndex(data.current_step || 0)
          }
          
          // Om guiden är markerad som slutförd, visa resultat
          if (data.is_completed && data.answers) {
            const calculatedProfile = calculateUserProfile(data.answers)
            setProfile(calculatedProfile)
          }
        }
      } catch (err) {
        console.error('Failed to load interest guide progress:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadProgress()
  }, [])

  // Spara progress automatiskt till molnet
  useEffect(() => {
    if (Object.keys(answers).length > 0 && screen === 'quiz' && !isLoading) {
      const saveProgress = async () => {
        try {
          setIsSaving(true)
          await interestGuideApi.saveProgress({
            current_step: currentQuestionIndex,
            answers: answers,
            is_completed: false
          })
          setShowSaveIndicator(true)
          const timer = setTimeout(() => setShowSaveIndicator(false), 2000)
          return () => clearTimeout(timer)
        } catch (err) {
          console.error('Failed to save progress:', err)
        } finally {
          setIsSaving(false)
        }
      }

      saveProgress()
    }
  }, [answers, currentQuestionIndex, screen, isLoading])

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
    // Använd redan laddade svar
    if (hasSavedProgress && Object.keys(answers).length > 0) {
      setScreen('quiz')
    } else {
      handleStart()
    }
  }

  const handleAnswer = (value: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }))
  }

  const handleNext = async () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // Beräkna resultat och spara
      try {
        setIsSaving(true)
        const calculatedProfile = calculateUserProfile(answers)
        setProfile(calculatedProfile)
        
        // Spara som slutförd i molnet
        await interestGuideApi.saveProgress({
          current_step: currentQuestionIndex,
          answers: answers,
          is_completed: true
        })
        
        setScreen('results')
      } catch (err) {
        console.error('Failed to save final result:', err)
        setError('Kunde inte spara resultatet')
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleClearProgress = async () => {
    try {
      setIsSaving(true)
      await interestGuideApi.reset()
      setHasSavedProgress(false)
      setProfile(null)
      setAnswers({})
      setCurrentQuestionIndex(0)
      setScreen('intro')
    } catch (err) {
      console.error('Failed to clear progress:', err)
      setError('Kunde inte rensa sparad data')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRestart = async () => {
    try {
      setIsSaving(true)
      await interestGuideApi.reset()
      setAnswers({})
      setCurrentQuestionIndex(0)
      setProfile(null)
      setScreen('intro')
    } catch (err) {
      console.error('Failed to restart:', err)
      setError('Kunde inte starta om')
    } finally {
      setIsSaving(false)
    }
  }

  const goToSection = (sectionId: SectionId) => {
    const firstQuestionInSection = allQuestions.findIndex(q => q.section === sectionId)
    if (firstQuestionInSection >= 0) {
      setCurrentQuestionIndex(firstQuestionInSection)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Laddar...</p>
        </div>
      </div>
    )
  }

  // Intro screen
  if (screen === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}
          <IntroScreen
            onStart={handleStart}
            onContinue={hasSavedProgress ? handleContinue : undefined}
            hasSavedProgress={hasSavedProgress}
          />
          
          {hasSavedProgress && (
            <div className="mt-8 text-center">
              <button
                onClick={handleClearProgress}
                disabled={isSaving}
                className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 mx-auto disabled:opacity-50"
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
        {error && (
          <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}
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
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}
        
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
            
            {isSaving && (
              <span className="flex items-center gap-1 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Sparar...
              </span>
            )}
            
            {/* Clear data button */}
            <button
              onClick={handleClearProgress}
              disabled={isSaving}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
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
            disabled={currentQuestionIndex === 0 || isSaving}
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
            disabled={!canProceed || isSaving}
            className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sparar...
              </>
            ) : (
              <>
                {currentQuestionIndex === allQuestions.length - 1 ? 'Se resultat' : 'Nästa'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
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
