import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Signal,
  RotateCcw,
  BookOpen,
  ChevronLeft,
  Sparkles,
  Trophy,
  Lock,
  Lightbulb,
  Cloud,
  AlertCircle
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { type Exercise } from '@/data/exercises'
import { contentExerciseApi, contentArticleApi } from '@/services/contentApi'
import { exerciseToArticleCategoryMap } from '@/services/articleData'
import { AIAssistant } from '@/components/ai'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'
import { PageLayout } from '@/components/layout/index'

// Extended category colors for all 38 categories
const categoryColors: { [key: string]: string } = {
  // Original categories
  'Självkännedom': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  'Jobbsökning': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  'Nätverkande': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
  'Digital närvaro': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
  'Arbetsrätt': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  'Karriärutveckling': 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
  'Välmående': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  // New categories from the 38 list
  'Arbetslivskunskap': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  'Arbetssökande': 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400',
  'Rehabilitering': 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
}

// Difficulty badge colors
const difficultyColors = {
  'Lätt': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  'Medel': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  'Utmanande': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
}

interface ExerciseProgress {
  [exerciseId: string]: {
    [questionId: string]: string
  }
}

interface ExerciseAnswer {
  exercise_id: string
  answers: { [questionId: string]: string }
  is_completed: boolean
  completed_at: string | null
}

export default function Exercises() {
  const { t } = useTranslation()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<ExerciseProgress>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [filter, setFilter] = useState<string>('alla')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [relatedArticles, setRelatedArticles] = useState<any[]>([])

  // Check authentication and load user + exercises
  useEffect(() => {
    const init = async () => {
      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Load exercises from database (with mock fallback)
      try {
        const exercisesData = await contentExerciseApi.getAll()
        setExercises(exercisesData)
      } catch (err) {
        console.error('Error loading exercises:', err)
        setError(t('exercises.errorLoadingExercises'))
      }

      if (!user) {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Load saved answers from Supabase (cloud)
  useEffect(() => {
    const loadAnswers = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('exercise_answers')
          .select('*')
          .eq('user_id', user.id)

        if (error) {
          console.error('Error loading answers:', error)
          setError(t('exercises.couldNotLoadCloud'))
          return
        }

        // Convert array to object format
        const progress: ExerciseProgress = {}
        data?.forEach((item: ExerciseAnswer) => {
          progress[item.exercise_id] = item.answers
        })

        setAnswers(progress)
      } catch (err) {
        console.error('Failed to load answers:', err)
        setError(t('exercises.errorLoadingAnswers'))
      } finally {
        setLoading(false)
      }
    }

    loadAnswers()
  }, [user])

  // Save answers to Supabase (cloud) when they change
  const saveToCloud = useCallback(async (exerciseId: string, exerciseAnswers: { [questionId: string]: string }) => {
    if (!user) return

    try {
      setSaving(true)
      
      const isComplete = Object.values(exerciseAnswers).some(a => a && a.trim().length > 0)
      
      const { error } = await supabase
        .from('exercise_answers')
        .upsert({
          user_id: user.id,
          exercise_id: exerciseId,
          answers: exerciseAnswers,
          is_completed: isComplete,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,exercise_id'
        })

      if (error) {
        console.error('Error saving answers:', error)
        setError(t('exercises.couldNotSaveCloud'))
      }
    } catch (err) {
      console.error('Failed to save answers:', err)
      setError(t('exercises.errorSaving'))
    } finally {
      setSaving(false)
    }
  }, [user])

  const getFilteredExercises = () => {
    if (filter === 'alla') return exercises
    if (filter === 'påbörjade') {
      return exercises.filter(ex => {
        const progress = answers[ex.id]
        return progress && Object.keys(progress).length > 0
      })
    }
    if (filter === 'ej-påbörjade') {
      return exercises.filter(ex => {
        const progress = answers[ex.id]
        return !progress || Object.keys(progress).length === 0
      })
    }
    return exercises.filter(ex => ex.category === filter)
  }

  const getProgressForExercise = (exerciseId: string) => {
    const exerciseAnswers = answers[exerciseId] || {}
    const exercise = exercises.find(e => e.id === exerciseId)
    if (!exercise) return 0
    
    const totalQuestions = exercise.steps.reduce((sum, step) => sum + step.questions.length, 0)
    const answeredQuestions = Object.values(exerciseAnswers).filter(a => a && a.trim()).length
    
    return Math.round((answeredQuestions / totalQuestions) * 100)
  }

  const handleSelectExercise = async (exercise: Exercise) => {
    setSelectedExercise(exercise)
    setCurrentStep(0)
    setIsCompleted(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // Load related articles
    const articleCategory = exerciseToArticleCategoryMap[exercise.category]
    if (articleCategory) {
      try {
        const articles = await contentArticleApi.getByCategory(articleCategory)
        setRelatedArticles(articles.slice(0, 2))
      } catch (err) {
        console.error('Error loading related articles:', err)
        setRelatedArticles([])
      }
    } else {
      setRelatedArticles([])
    }
  }

  const handleBackToList = () => {
    setSelectedExercise(null)
    setCurrentStep(0)
    setIsCompleted(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAnswerChange = async (questionId: string, value: string) => {
    if (!selectedExercise) return
    
    const newAnswers = {
      ...answers,
      [selectedExercise.id]: {
        ...answers[selectedExercise.id],
        [questionId]: value
      }
    }
    
    setAnswers(newAnswers)
    
    // Save to cloud (debounced in real implementation)
    await saveToCloud(selectedExercise.id, newAnswers[selectedExercise.id])
  }

  const handleNext = async () => {
    if (!selectedExercise) return
    
    if (currentStep < selectedExercise.steps.length - 1) {
      setCurrentStep(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setIsCompleted(true)
      
      // Mark as completed in cloud
      if (user) {
        await supabase
          .from('exercise_answers')
          .upsert({
            user_id: user.id,
            exercise_id: selectedExercise.id,
            answers: answers[selectedExercise.id] || {},
            is_completed: true,
            completed_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,exercise_id'
          })
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleRestart = () => {
    setCurrentStep(0)
    setIsCompleted(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleClearProgress = async () => {
    if (!selectedExercise || !user) return
    if (!confirm(t('exercises.clearProgressConfirm'))) return

    // Delete from cloud
    const { error } = await supabase
      .from('exercise_answers')
      .delete()
      .eq('user_id', user.id)
      .eq('exercise_id', selectedExercise.id)

    if (error) {
      console.error('Error deleting answers:', error)
      setError(t('exercises.couldNotClear'))
      return
    }
    
    setAnswers(prev => {
      const newAnswers = { ...prev }
      delete newAnswers[selectedExercise.id]
      return newAnswers
    })
    setCurrentStep(0)
    setIsCompleted(false)
  }

  const getUniqueCategories = () => {
    const categories = [...new Set(exercises.map(e => e.category))]
    return categories
  }

  if (loading) {
    return (
      <PageLayout
        title={t('exercises.title')}
        description={t('exercises.description')}
        showTabs={false}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 dark:border-emerald-400"></div>
          <p className="ml-3 text-gray-600 dark:text-gray-300">{t('exercises.loadingAnswers')}</p>
        </div>
      </PageLayout>
    )
  }

  // Exercise List View
  if (!selectedExercise) {
    const filtered = getFilteredExercises()
    const categories = getUniqueCategories()

    return (
      <PageLayout
        title={t('exercises.title')}
        description={t('exercises.description')}
        showTabs={false}
      >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-2">
            <BookOpen className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('exercises.title')}</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Arbeta dig igenom praktiska övningar för att utveckla dina jobbsökar-skills.
            Dina svar sparas automatiskt i molnet så du kan fortsätta från vilken enhet som helst.
          </p>

          {/* Cloud sync indicator */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <Cloud className={`w-4 h-4 ${saving ? 'text-amber-500 dark:text-amber-400 animate-pulse' : 'text-emerald-500 dark:text-emerald-400'}`} />
            <span className={saving ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
              {saving ? t('exercises.saving') : t('exercises.cloudSynced')}
            </span>
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {!user && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
              <p className="text-amber-800 dark:text-amber-300 text-sm">
                <strong>Obs!</strong> Du är inte inloggad. Dina svar sparas endast tillfälligt i webbläsaren.
                <a href="/login" className="underline ml-1">Logga in</a> för att spara permanent i molnet.
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800">
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{exercises.length}</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{t('exercises.stats.totalExercises')}</p>
          </Card>
          <Card className="p-4 text-center bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              {Object.keys(answers).length}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">{t('exercises.stats.started')}</p>
          </Card>
          <Card className="p-4 text-center bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800">
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {Object.entries(answers).filter(([_, ans]) =>
                Object.values(ans).filter(v => v && v.trim()).length > 0
              ).length}
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400">{t('exercises.stats.active')}</p>
          </Card>
          <Card className="p-4 text-center bg-teal-50 dark:bg-teal-900/20 border-teal-100 dark:border-teal-800">
            <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">
              {exercises.length - Object.keys(answers).length}
            </p>
            <p className="text-sm text-teal-600 dark:text-teal-400">{t('exercises.stats.notStarted')}</p>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setFilter('alla')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'alla'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
                : 'bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-stone-600'
            }`}
          >
            {t('exercises.filters.all')}
          </button>
          <button
            onClick={() => setFilter('påbörjade')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'påbörjade'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
                : 'bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-stone-600'
            }`}
          >
            {t('exercises.filters.started')}
          </button>
          <button
            onClick={() => setFilter('ej-påbörjade')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'ej-påbörjade'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
                : 'bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-stone-600'
            }`}
          >
            {t('exercises.filters.notStarted')}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === cat
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-stone-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Exercise Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((exercise) => {
            const Icon = exercise.icon
            const progress = getProgressForExercise(exercise.id)
            const isStarted = progress > 0

            return (
              <Card
                key={exercise.id}
                className={`p-6 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 ${
                  isStarted ? 'border-l-4 border-l-emerald-500 dark:border-l-emerald-400' : ''
                }`}
                onClick={() => handleSelectExercise(exercise)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${categoryColors[exercise.category] || 'bg-gray-100 dark:bg-stone-700'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  {isStarted && (
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-medium">{progress}%</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
                  {exercise.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {exercise.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`text-xs px-2 py-1 rounded-full border ${difficultyColors[exercise.difficulty]}`}>
                    {exercise.difficulty}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-stone-700 text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {exercise.duration}
                  </span>
                </div>

                {/* Category & Progress */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[exercise.category] || 'bg-gray-100 dark:bg-stone-700'}`}>
                    {exercise.category}
                  </span>
                  {isStarted ? (
                    <div className="w-16 h-2 bg-gray-200 dark:bg-stone-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  ) : (
                    <Lock className="w-4 h-4 text-gray-300 dark:text-gray-500" />
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">{t('exercises.noMatch')}</p>
          </div>
        )}
      </div>
      </PageLayout>
    )
  }

  // Exercise Detail View
  const currentStepData = selectedExercise.steps[currentStep]
  const currentAnswers = answers[selectedExercise.id] || {}

  if (isCompleted) {
    return (
      <PageLayout
        title="Övningar"
        description="Praktiska övningar för att utveckla dina jobbsökar-skills"
        showTabs={false}
      >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Tillbaka till övningar
        </button>

        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <Trophy className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Bra jobbat!</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Du har genomfört övningen "{selectedExercise.title}"
          </p>

          {/* Cloud saved indicator */}
          <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Cloud className="w-5 h-5" />
            <span>Dina svar är sparade i molnet</span>
          </div>
        </div>

        <Card className="p-6 space-y-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            Dina svar
          </h2>

          {selectedExercise.steps.map((step) => (
            <div key={step.id} className="space-y-4">
              <h3 className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center justify-center">
                  {step.id}
                </span>
                {step.title}
              </h3>
              <div className="space-y-3 pl-8">
                {step.questions.map((question) => {
                  const answer = currentAnswers[question.id]
                  return (
                    <div key={question.id} className="bg-gray-50 dark:bg-stone-700 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{question.text}</p>
                      <p className="text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
                        {answer || <span className="text-gray-400 dark:text-gray-500 italic">Ej besvarat</span>}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </Card>

        <div className="flex flex-wrap justify-center gap-4">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Gör om övningen
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            Skriv ut resultat
          </Button>
          <Button onClick={handleBackToList}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Tillbaka till alla övningar
          </Button>
        </div>
      </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Övningar"
      description="Praktiska övningar för att utveckla dina jobbsökar-skills"
      showTabs={false}
    >
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={handleBackToList}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        Tillbaka till övningar
      </button>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${categoryColors[selectedExercise.category] || 'bg-gray-100 dark:bg-stone-700'}`}>
            <selectedExercise.icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{selectedExercise.title}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className={`px-2 py-0.5 rounded-full text-xs ${categoryColors[selectedExercise.category] || 'bg-gray-100 dark:bg-stone-700'}`}>
                {selectedExercise.category}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {selectedExercise.duration}
              </span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded-full text-xs border ${difficultyColors[selectedExercise.difficulty]}`}>
                {selectedExercise.difficulty}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Steg {currentStep + 1} av {selectedExercise.steps.length}</span>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Cloud className="w-4 h-4 animate-pulse" />
                Sparar...
              </span>
            )}
            <button
              onClick={handleClearProgress}
              className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
            >
              Rensa progress
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedExercise.steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex-1 h-2 rounded-full transition-colors ${
                index <= currentStep ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-gray-200 dark:bg-stone-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Exercise Card */}
      <Card className="p-6 space-y-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {currentStepData.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">{currentStepData.description}</p>

          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
            <p className="text-sm text-emerald-800 dark:text-emerald-300">
              <strong>Tips:</strong> Ta dig tid att verkligen tänka igenom dina svar.
              Dina svar sparas automatiskt i molnet så du kan fortsätta från vilken enhet som helst.
            </p>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {currentStepData.questions.map((question) => (
            <div key={question.id} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                {question.text}
              </label>
              <textarea
                value={currentAnswers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder={question.placeholder}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 transition-colors resize-y text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              {/* AI Help Button */}
              <div className="flex justify-end">
                <AIAssistant
                  mode="exercise-help"
                  context={{
                    ovningId: selectedExercise.id,
                    steg: currentStep + 1,
                    fraga: question.text,
                    anvandarSvar: currentAnswers[question.id]
                  }}
                  buttonText="Få hjälp från AI"
                  compact={true}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t border-stone-200 dark:border-stone-700">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Föregående
          </Button>

          <Button
            onClick={handleNext}
            className="flex items-center gap-2"
          >
            {currentStep === selectedExercise.steps.length - 1 ? 'Avsluta' : 'Nästa'}
            {currentStep === selectedExercise.steps.length - 1 ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </Button>
        </div>
      </Card>

      {/* AI Coach Card */}
      <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-emerald-900 dark:text-emerald-100">AI Coach</h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1 mb-3">
              Behöver du hjälp med denna övning? AI:n kan ge vägledning, exempel och följdfrågor.
            </p>
            <AIAssistant
              mode="exercise-help"
              context={{
                ovningId: selectedExercise.id,
                steg: currentStep + 1,
                fraga: `Generell hjälp med ${selectedExercise.title} - ${currentStepData.title}`,
                anvandarSvar: ''
              }}
              buttonText="Be AI:n om hjälp"
              compact={true}
            />
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-4 bg-gray-50 dark:bg-stone-800 border-gray-200 dark:border-stone-700">
        <div className="flex items-start gap-3">
          <Signal className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-800 dark:text-gray-100">Om denna övning</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {selectedExercise.description}
            </p>
          </div>
        </div>
      </Card>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <Card className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-teal-200 dark:border-teal-800">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-teal-900 dark:text-teal-100">Relaterade artiklar</h3>
              <p className="text-sm text-teal-700 dark:text-teal-300 mt-1 mb-3">
                Läs mer om {selectedExercise.category.toLowerCase()} i kunskapsbanken.
              </p>
              <div className="space-y-2">
                {relatedArticles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/knowledge-base/article/${article.id}`}
                    className="block p-3 bg-white dark:bg-stone-700 rounded-lg hover:shadow-sm transition-shadow border border-teal-100 dark:border-teal-800"
                  >
                    <h4 className="font-medium text-gray-800 dark:text-gray-100 text-sm">{article.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{article.summary}</p>
                  </Link>
                ))}
              </div>
              <Link
                to="/knowledge-base"
                className="inline-flex items-center gap-1 text-sm text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 mt-3 font-medium"
              >
                Se alla artiklar
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
    </PageLayout>
  )
}
