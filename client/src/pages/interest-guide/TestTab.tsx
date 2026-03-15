/**
 * Test Tab - The main interest guide quiz
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  allQuestions,
  sections,
  calculateUserProfile,
  type SectionId,
} from '@/services/interestGuideData'
import { QuestionCard } from '@/components/interest-guide/QuestionCard'
import { SectionDots } from '@/components/interest-guide/SectionDots'
import { IntroScreen } from '@/components/interest-guide/IntroScreen'
import { Button, LoadingState, InfoCard } from '@/components/ui'
import { ArrowLeft, ArrowRight, Trash2, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import { interestGuideApi } from '@/services/cloudStorage'

export default function TestTab() {
  const navigate = useNavigate()
  const [screen, setScreen] = useState<'intro' | 'quiz'>('intro')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [hasSavedProgress, setHasSavedProgress] = useState(false)
  const [showSaveIndicator, setShowSaveIndicator] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load saved progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        setIsLoading(true)
        const data = await interestGuideApi.getProgress()

        if (data) {
          if (data.answers && Object.keys(data.answers).length > 0) {
            setHasSavedProgress(true)
            setAnswers(data.answers)
            setCurrentQuestionIndex(data.current_step || 0)
          }

          // If already completed, redirect to results
          if (data.is_completed) {
            navigate('/interest-guide/results')
            return
          }
        }
      } catch (err) {
        console.error('Failed to load interest guide progress:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadProgress()
  }, [navigate])

  // Auto-save progress
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
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      try {
        setIsSaving(true)
        const calculatedProfile = calculateUserProfile(answers)

        await interestGuideApi.saveProgress({
          current_step: currentQuestionIndex,
          answers: answers,
          is_completed: true
        })

        // Navigate to results
        navigate('/interest-guide/results')
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
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleClearProgress = async () => {
    try {
      setIsSaving(true)
      await interestGuideApi.reset()
      setHasSavedProgress(false)
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

  const goToSection = (sectionId: SectionId) => {
    const firstQuestionInSection = allQuestions.findIndex(q => q.section === sectionId)
    if (firstQuestionInSection >= 0) {
      setCurrentQuestionIndex(firstQuestionInSection)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingState title="Laddar..." size="lg" />
      </div>
    )
  }

  // Intro screen
  if (screen === 'intro') {
    return (
      <div className="max-w-4xl mx-auto">
        {error && (
          <InfoCard variant="error" className="mb-6">
            {error}
          </InfoCard>
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
              className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 mx-auto disabled:opacity-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Rensa all sparad data och börja om
            </button>
          </div>
        )}
      </div>
    )
  }

  // Quiz screen
  const progress = Math.round((currentQuestionIndex / allQuestions.length) * 100)
  const canProceed = answers[currentQuestion.id] !== undefined
  const isLastQuestion = currentQuestionIndex === allQuestions.length - 1

  const getSectionTitle = () => {
    switch (currentSection?.id) {
      case 'riasec': return 'Dina arbetsintressen'
      case 'bigfive': return 'Din personlighet'
      case 'strong': return 'Vad intresserar dig?'
      case 'icf': return 'Dina förutsättningar'
      default: return currentSection?.name
    }
  }

  const getSectionDescription = () => {
    switch (currentSection?.id) {
      case 'riasec': return 'Vilka typer av arbete tilltalar dig mest?'
      case 'bigfive': return 'Hur skulle du beskriva dig själv som person?'
      case 'strong': return 'Vilka områden tycker du är intressanta?'
      case 'icf': return 'Hur upplever du dina förutsättningar för arbete?'
      default: return currentSection?.subtitle
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {error && (
        <InfoCard variant="error" className="mb-6">
          {error}
        </InfoCard>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Intressetest</h1>
            <p className="text-xs text-gray-500">Fråga {currentQuestionIndex + 1} av {allQuestions.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showSaveIndicator && (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Sparat
            </span>
          )}
          {isSaving && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              Sparar...
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Din progress</span>
          <span className="font-medium text-indigo-600">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Section indicator */}
      <div className="mb-6">
        <SectionDots
          currentSection={currentSection?.id as SectionId}
          completedSections={completedSections}
          onSectionClick={goToSection}
        />
      </div>

      {/* Section header */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium mb-2">
          {currentSection?.name}
        </span>
        <h2 className="text-xl font-bold text-gray-900 mb-1">{getSectionTitle()}</h2>
        <p className="text-sm text-gray-500">{getSectionDescription()}</p>
      </div>

      {/* Question */}
      <div className="mb-8">
        <QuestionCard
          question={currentQuestion}
          value={answers[currentQuestion.id] || 50}
          onChange={handleAnswer}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={allQuestions.length}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0 || isSaving}
          className="gap-2 px-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Föregående
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canProceed || isSaving}
          className="gap-2 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sparar...
            </>
          ) : (
            <>
              {isLastQuestion ? 'Se mitt resultat' : 'Nästa fråga'}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      {/* Section progress */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 text-xs text-gray-500">
          <span>Fråga {questionInSectionIndex + 1} av {currentSectionQuestions.length}</span>
          <span className="text-gray-300">|</span>
          <span>{currentSection?.name}</span>
        </div>
      </div>

      {/* Exit option */}
      <div className="mt-6 text-center">
        <button
          onClick={handleClearProgress}
          disabled={isSaving}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Avbryt och börja om
        </button>
      </div>
    </div>
  )
}
