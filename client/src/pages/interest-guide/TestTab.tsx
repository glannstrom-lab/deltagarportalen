/**
 * Test Tab - The main interest guide quiz
 */
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
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
import { ArrowLeft, ArrowRight, Trash2, Loader2, Sparkles, CheckCircle2, BarChart3, RotateCcw, Briefcase } from 'lucide-react'
import { interestGuideApi } from '@/services/cloudStorage'
import { userApi } from '@/services/supabaseApi'

export default function TestTab() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [screen, setScreen] = useState<'intro' | 'quiz' | 'completed'>('intro')
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

          // If already completed, show completed state (don't redirect)
          if (data.is_completed) {
            setScreen('completed')
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

        // Mark onboarding step as complete in cloud
        await userApi.updateOnboardingStep('interest', true).catch(err => {
          console.error('Error updating onboarding progress:', err)
        })

        // Also set localStorage for backwards compatibility
        localStorage.setItem('interest-result', 'true')

        // Navigate to results
        navigate('/interest-guide/results')
      } catch (err) {
        console.error('Failed to save final result:', err)
        setError(t('interestGuide.test.couldNotSaveResult'))
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
      setError(t('interestGuide.test.couldNotClearProgress'))
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
        <LoadingState title={t('interestGuide.test.loading')} size="lg" />
      </div>
    )
  }

  // Completed screen - test is done, show options
  if (screen === 'completed') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          {/* Success icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {t('interestGuide.test.testComplete')}
          </h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {t('interestGuide.test.alreadyCompleted')}
          </p>

          {/* Action cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Link
              to="/interest-guide/results"
              className="group p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-100 hover:border-indigo-300 transition-all hover:shadow-lg"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{t('interestGuide.test.seeResults')}</h3>
              <p className="text-sm text-gray-500">{t('interestGuide.test.exploreProfile')}</p>
            </Link>

            <Link
              to="/interest-guide/occupations"
              className="group p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-100 hover:border-amber-300 transition-all hover:shadow-lg"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{t('interestGuide.test.exploreOccupations')}</h3>
              <p className="text-sm text-gray-500">{t('interestGuide.test.seeOccupationSuggestions')}</p>
            </Link>
          </div>

          {/* Redo test option */}
          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              {t('interestGuide.test.wantToUpdate')}
            </p>
            <Button
              variant="outline"
              onClick={handleClearProgress}
              disabled={isSaving}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              {t('interestGuide.test.redoTest')}
            </Button>
          </div>
        </div>
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
              {t('interestGuide.test.clearAndRestart')}
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
      case 'riasec': return t('interestGuide.test.sections.riasec.title')
      case 'bigfive': return t('interestGuide.test.sections.bigfive.title')
      case 'strong': return t('interestGuide.test.sections.strong.title')
      case 'icf': return t('interestGuide.test.sections.icf.title')
      default: return currentSection?.name
    }
  }

  const getSectionDescription = () => {
    switch (currentSection?.id) {
      case 'riasec': return t('interestGuide.test.sections.riasec.description')
      case 'bigfive': return t('interestGuide.test.sections.bigfive.description')
      case 'strong': return t('interestGuide.test.sections.strong.description')
      case 'icf': return t('interestGuide.test.sections.icf.description')
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
            <h1 className="font-bold text-gray-900">{t('interestGuide.test.interestTest')}</h1>
            <p className="text-xs text-gray-500">{t('interestGuide.test.questionOf', { current: currentQuestionIndex + 1, total: allQuestions.length })}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showSaveIndicator && (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              {t('interestGuide.test.saved')}
            </span>
          )}
          {isSaving && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              {t('interestGuide.test.saving')}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>{t('interestGuide.test.yourProgress')}</span>
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
          {t('interestGuide.test.previous')}
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
              {t('interestGuide.test.saving')}
            </>
          ) : (
            <>
              {isLastQuestion ? t('interestGuide.test.seeMyResult') : t('interestGuide.test.nextQuestion')}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      {/* Section progress */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 text-xs text-gray-500">
          <span>{t('interestGuide.test.questionInSection', { current: questionInSectionIndex + 1, total: currentSectionQuestions.length })}</span>
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
          {t('interestGuide.test.cancelAndRestart')}
        </button>
      </div>
    </div>
  )
}
