import { useState, useEffect, useCallback, useRef } from 'react'
import { showToast } from '@/components/Toast'
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
  ChevronDown,
  Lightbulb,
  Cloud,
  AlertCircle
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card } from '@/components/ui/Card'
import { type Exercise } from '@/data/exercises'
import { contentExerciseApi, contentArticleApi } from '@/services/contentApi'
import { exerciseToArticleCategoryMap } from '@/services/articleData'
import { AIAssistant } from '@/components/ai'
import { supabase } from '@/lib/supabase'
import { Link, useSearchParams } from 'react-router-dom'
import { PageLayout } from '@/components/layout/index'
import { Dumbbell } from '@/components/ui/icons'
import { useFocusMode } from '@/components/FocusModeProvider'
import { ovningsLage } from '@/lib/ovningsLage'
import { FocusExercisesWizard } from '@/components/focus/pages/FocusExercisesWizard'
import { FokusVaxel } from '@/components/focus/shell/FokusVaxel'

import { anvandareFranSession } from '@/lib/anvandareFranSession'
// Extended category colors for all 38 categories
const categoryColors: { [key: string]: string } = {
  // Original categories
  'Självkännedom': 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-solid)]',
  'Jobbsökning': 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-blue-400',
  'Nätverkande': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
  'Digital närvaro': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
  'Arbetsrätt': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  'Karriärutveckling': 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-pink-400',
  'Välmående': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  // New categories from the 38 list
  'Arbetslivskunskap': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  'Arbetssökande': 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-solid)]',
  'Rehabilitering': 'bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/30 text-[var(--c-text)] dark:text-[var(--c-solid)]',
}

// Difficulty badge colors
const difficultyColors = {
  'Lätt': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  'Medel': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  'Utmanande': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
}

// Hur länge efter sista tangenttryckningen svaren skrivs till molnet.
const SPARA_EFTER_MS = 800

// Så många övningskort visas innan "Visa fler" (designpasset 2026-10-09).
const SIDSTORLEK = 12

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
  const { leaveWizard } = useFocusMode()

  return (
    <FokusVaxel
      title={t('exercises.title', 'Övningar')}
      icon={Dumbbell}
      domain="wellbeing"
      guide={<FocusExercisesWizard onExit={leaveWizard} />}
    >
      <ExercisesInner />
    </FokusVaxel>
  )
}

function ExercisesInner() {
  const { t } = useTranslation()
  const { confirm } = useConfirmDialog()
  const [searchParams] = useSearchParams()
  const deepLinkId = searchParams.get('id')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<ExerciseProgress>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [filter, setFilter] = useState<string>('alla')
  const [antalVisade, setAntalVisade] = useState(SIDSTORLEK)
  const [visaAmnen, setVisaAmnen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // i18n-NYCKEL, inte färdig text: översätts vid rendering så att ett fel följer
  // språkbytet, och så att effekterna inte behöver `t` som beroende.
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<Array<{ id: string; title: string; summary?: string; readingTime?: number }>>([])

  // Djuplänk: ?id=X öppnar en viss övning (Article.tsx länkar hit). Justeras
  // under renderingen i stället för i en effekt, så att den följer URL:en även
  // när sidan redan är monterad — /exercises?id=a → ?id=b byter inte rutt.
  // Förr lästes den bara i monteringseffekten (2026-09-24).
  const [tillampadLank, setTillampadLank] = useState<string | null>(null)
  if (deepLinkId && deepLinkId !== tillampadLank && exercises.length > 0) {
    setTillampadLank(deepLinkId)
    const match = exercises.find((e) => e.id === deepLinkId)
    if (match) {
      setSelectedExercise(match)
      setCurrentStep(0)
      setIsCompleted(false)
    }
  }

  // Check authentication and load user + exercises
  useEffect(() => {
    const init = async () => {
      // Get user
      const { data: { user } } = await anvandareFranSession()
      setUser(user)

      // Load exercises from database (with mock fallback)
      try {
        const exercisesData = await contentExerciseApi.getAll()
        setExercises(exercisesData)
      } catch (err) {
        console.error('Error loading exercises:', err)
        setError('exercises.errorLoadingExercises')
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
          setError('exercises.couldNotLoadCloud')
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
        setError('exercises.errorLoadingAnswers')
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
        setError('exercises.couldNotSaveCloud')
      }
    } catch (err) {
      console.error('Failed to save answers:', err)
      setError('exercises.errorSaving')
    } finally {
      setSaving(false)
    }
  }, [user])

  /*
    Skrivningarna till molnet (2026-09-22, kvalitetsgenomgången).

    Förr sparades VARJE tangenttryckning — 11 765 skrivningar för 20 rader i
    prod — med kommentaren "debounced in real implementation", men ingen
    debounce fanns. Värre: anropen gick parallellt, så en äldre skrivning kunde
    komma fram efter en nyare, och då vann den gamla texten i databasen.

    Nu:
     · bara det SENASTE svaret per övning väntar (en karta, inte en kö),
     · skrivningarna körs i tur och ordning genom en promise-kedja, så en
       äldre skrivning kan aldrig landa efter en nyare,
     · det som väntar skrivs direkt när man lämnar övningen, klarmarkerar,
       rensar eller när sidan avmonteras.
  */
  const vantandeRef = useRef(new Map<string, { [questionId: string]: string }>())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const kedjaRef = useRef<Promise<void>>(Promise.resolve())
  const sparaRef = useRef(saveToCloud)
  useEffect(() => {
    sparaRef.current = saveToCloud
  }, [saveToCloud])

  const skrivVantande = useCallback((): Promise<void> => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const poster = [...vantandeRef.current.entries()]
    vantandeRef.current.clear()
    for (const [id, svar] of poster) {
      // saveToCloud fångar sina egna fel, så kedjan bryts aldrig.
      kedjaRef.current = kedjaRef.current.then(() => sparaRef.current(id, svar))
    }
    return kedjaRef.current
  }, [])

  // Osparat skrivs när sidan lämnas (avmontering).
  useEffect(() => () => { void skrivVantande() }, [skrivVantande])

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
    void skrivVantande()
    setSelectedExercise(null)
    setCurrentStep(0)
    setIsCompleted(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAnswerChange = (questionId: string, value: string) => {
    if (!selectedExercise) return
    const id = selectedExercise.id

    // Basen är det som redan väntar på att skrivas, annars det som visas.
    const bas = vantandeRef.current.get(id) ?? answers[id] ?? {}
    const nyaSvar = { ...bas, [questionId]: value }

    setAnswers(prev => ({ ...prev, [id]: { ...prev[id], [questionId]: value } }))

    vantandeRef.current.set(id, nyaSvar)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { void skrivVantande() }, SPARA_EFTER_MS)
  }

  const handleNext = async () => {
    if (!selectedExercise) return
    
    if (currentStep < selectedExercise.steps.length - 1) {
      setCurrentStep(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setIsCompleted(true)

      // Det som väntar skrivs först — annars kunde en fördröjd skrivning av
      // svaren landa EFTER klarmarkeringen nedan och skriva över den.
      await skrivVantande()

      // Markera som klar i molnet.
      //
      // Felet kontrollerades inte tidigare, och setIsCompleted(true) körs före
      // skrivningen: deltagaren fick en bekräftelse på något som kanske aldrig
      // sparades, och vid nästa inloggning var övningen ogjord. Hon har gjort
      // övningen — det tas inte ifrån henne — men hon ska få veta att den inte
      // kom fram, i stället för att upptäcka det själv senare.
      if (user) {
        const { error } = await supabase
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

        if (error) {
          console.error('Kunde inte spara övningen:', error)
          showToast.warning(
            t('exercises.completeSaveFailedTitle', 'Övningen sparades inte'),
            t('exercises.completeSaveFailedText', 'Du är klar med den, men vi kunde inte spara det just nu. Prova igen när du har uppkoppling.')
          )
        }
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
    const ok = await confirm({
      title: t('exercises.clearProgressTitle', 'Rensa dina svar?'),
      message: t('exercises.clearProgressConfirm'),
      confirmText: t('common.clear'),
      cancelText: t('common.cancel'),
      variant: 'danger',
    })
    if (!ok) return

    // En väntande skrivning får inte återuppliva svaren efter raderingen.
    vantandeRef.current.delete(selectedExercise.id)
    await skrivVantande()

    // Delete from cloud
    const { error } = await supabase
      .from('exercise_answers')
      .delete()
      .eq('user_id', user.id)
      .eq('exercise_id', selectedExercise.id)

    if (error) {
      console.error('Error deleting answers:', error)
      setError('exercises.couldNotClear')
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
        className="sidbredd"
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
    const arKategori = filter !== 'alla' && filter !== 'påbörjade' && filter !== 'ej-påbörjade'

    // EX1 (2026-09-29, Mikaels beslut): "Alla" visar alla — men inte på en
    // gång. 119 kort var 18 700 px sida (designpasset 2026-10-09); nu
    // SIDSTORLEK åt gången och en knapp för resten. Inget döljs, bara senare.
    const displayedExercises = filtered.slice(0, antalVisade)
    const kvar = filtered.length - displayedExercises.length

    const valjFilter = (f: string) => {
      setFilter(f)
      setAntalVisade(SIDSTORLEK)
    }

    const chipKlass = (aktiv: boolean) =>
      `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        aktiv
          ? 'bg-[var(--c-solid)] text-white'
          : 'bg-gray-100 dark:bg-stone-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-stone-600'
      }`

    const lage = ovningsLage(exercises.length, answers)

    return (
      <PageLayout
        title={t('exercises.title')}
        description={t('exercises.description')}
        showTabs={false}
        className="sidbredd"
>
      <div className="space-y-5">
        {/* Status: syns bara när något händer. "Synkad med molnet" i vila var
            en rad brus på en redan tung sida. */}
        {(saving || error) && (
          <div className="flex flex-wrap items-center gap-3" role="status" aria-live="polite">
            {saving && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <Cloud className="w-4 h-4 animate-pulse" aria-hidden="true" />
                <span>{t('exercises.saving')}</span>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 rounded-full px-3 py-1.5">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                <span>{t(error)}</span>
              </div>
            )}
          </div>
        )}

        {!user && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <p className="text-amber-800 dark:text-amber-300 text-sm">
              <strong>{t('exercises.notLoggedIn.label', 'Obs!')}</strong> {t('exercises.notLoggedIn.text', 'Du är inte inloggad. Dina svar sparas endast tillfälligt i webbläsaren.')}
              <a href="/login" className="underline ml-1">{t('exercises.notLoggedIn.logIn', 'Logga in')}</a> {t('exercises.notLoggedIn.tail', 'för att spara permanent i molnet.')}
            </p>
          </div>
        )}

        {/* PG9 (2026-09-12): inga nollor som nyckeltal. Inget påbörjat = ingen
            rad alls (rådgivaren hälsar redan överst); annars EN mening i
            stället för tre talkort. */}
        {lage.lage === 'rakning' && (
          <p className="text-sm text-[var(--c-text)] dark:text-[var(--c-solid)]">
            {t('exercises.stats.rad', 'Du har börjat på {{paborjade}} av {{totalt}} övningar.', { paborjade: lage.paborjade, totalt: lage.totalt })}
          </p>
        )}

        {/* Filter: tre lägen alltid synliga, ämnena bakom ett klick.
            Fjorton knappar i rad var det första man såg. */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => valjFilter('alla')} aria-pressed={filter === 'alla'} className={chipKlass(filter === 'alla')}>
              {t('exercises.filters.all')}
            </button>
            <button onClick={() => valjFilter('påbörjade')} aria-pressed={filter === 'påbörjade'} className={chipKlass(filter === 'påbörjade')}>
              {t('exercises.filters.started')}
            </button>
            <button onClick={() => valjFilter('ej-påbörjade')} aria-pressed={filter === 'ej-påbörjade'} className={chipKlass(filter === 'ej-påbörjade')}>
              {t('exercises.filters.notStarted')}
            </button>
            <button
              onClick={() => setVisaAmnen((v) => !v)}
              aria-expanded={visaAmnen}
              aria-controls="ovningar-amnen"
              className={`${chipKlass(arKategori)} inline-flex items-center gap-1`}
            >
              {arKategori
                ? t(`exercises.categories.${filter}`, filter)
                : t('exercises.filters.topics', 'Välj ämne')}
              <ChevronDown className={`w-4 h-4 transition-transform ${visaAmnen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          </div>

          {visaAmnen && (
            <div id="ovningar-amnen" className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => { valjFilter(cat); setVisaAmnen(false) }}
                  aria-pressed={filter === cat}
                  className={chipKlass(filter === cat)}
                >
                  {/* `cat` är den svenska nyckeln (den filtrerar) — texten går genom
                      samma översättning som kortens kategori. */}
                  {t(`exercises.categories.${cat}`, cat)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Exercise Cards Grid — lugnare kort: ikon och rubrik på en rad,
            en rad beskrivning, svårighet och tid som en rad text. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4">
          {displayedExercises.map((exercise) => {
            const Icon = exercise.icon
            const progress = getProgressForExercise(exercise.id)
            const isStarted = progress > 0

            return (
              <Card
                key={exercise.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 ${
                  isStarted ? 'border-l-4 border-l-emerald-500 dark:border-l-emerald-400' : ''
                }`}
                onClick={() => handleSelectExercise(exercise)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${categoryColors[exercise.category] || 'bg-gray-100 dark:bg-stone-700'}`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 line-clamp-2">
                      {exercise.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                      {exercise.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 whitespace-nowrap">
                        <span>{t(`exercises.difficulties.${exercise.difficulty}`, exercise.difficulty)}</span>
                        <span aria-hidden="true">·</span>
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        <span>{exercise.duration}</span>
                      </p>
                      {isStarted && (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 dark:bg-stone-600 rounded-full overflow-hidden" aria-hidden="true">
                            <div className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{progress}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {kvar > 0 && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setAntalVisade((n) => n + SIDSTORLEK)}>
              {t('exercises.showMore', 'Visa fler ({{kvar}} till)', { kvar })}
            </Button>
          </div>
        )}

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
        title={t('exercises.title')}
        description={t('exercises.description')}
        showTabs={false}
        className="sidbredd"
>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          {t('exercises.backToExercises', 'Tillbaka till övningar')}
        </button>

        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <Trophy className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{t('exercises.wellDone', 'Bra jobbat!')}</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {t('exercises.completedExercise', 'Du har genomfört övningen "{{title}}"', { title: selectedExercise.title })}
          </p>

          {/* Cloud saved indicator */}
          <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Cloud className="w-5 h-5" />
            <span>{t('exercises.answersSavedCloud')}</span>
          </div>
        </div>

        <Card className="p-6 space-y-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            {t('exercises.yourAnswers', 'Dina svar')}
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
                        {answer || <span className="text-gray-400 dark:text-gray-500 italic">{t('exercises.notAnswered', 'Ej besvarat')}</span>}
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
            {t('exercises.doAgain', 'Gör om övningen')}
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            {t('exercises.printResult', 'Skriv ut resultat')}
          </Button>
          <Button onClick={handleBackToList}>
            <CheckCircle className="w-4 h-4 mr-2" />
            {t('exercises.backToAll', 'Tillbaka till alla övningar')}
          </Button>
        </div>
      </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={t('exercises.title')}
      description={t('exercises.description')}
      showTabs={false}
      className="sidbredd"
>
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={handleBackToList}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        {t('exercises.backToExercises', 'Tillbaka till övningar')}
      </button>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${categoryColors[selectedExercise.category] || 'bg-gray-100 dark:bg-stone-700'}`}>
            <selectedExercise.icon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{selectedExercise.title}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className={`px-2 py-0.5 rounded-full text-xs ${categoryColors[selectedExercise.category] || 'bg-gray-100 dark:bg-stone-700'}`}>
                {t(`exercises.categories.${selectedExercise.category}`, selectedExercise.category)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {selectedExercise.duration}
              </span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded-full text-xs border ${difficultyColors[selectedExercise.difficulty]}`}>
                {t(`exercises.difficulties.${selectedExercise.difficulty}`, selectedExercise.difficulty)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">{t('exercises.stepOf', 'Steg {{current}} av {{total}}', { current: currentStep + 1, total: selectedExercise.steps.length })}</span>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <Cloud className="w-4 h-4 animate-pulse" />
                {t('exercises.saving')}
              </span>
            )}
            <button
              onClick={handleClearProgress}
              className="text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
            >
              {t('exercises.clearProgress', 'Rensa mina svar')}
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
              {t('exercises.tipKort', 'Ta den tid du behöver. Svaren sparas medan du skriver.')}
            </p>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {currentStepData.questions.map((question) => (
            <div key={question.id} className="space-y-2">
              <label htmlFor={`exercise-q-${question.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                {question.text}
              </label>
              <textarea
                id={`exercise-q-${question.id}`}
                value={currentAnswers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder={question.placeholder}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 transition-colors resize-y text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              {/* AI Help Button
                  2026-09-22: `AIAssistant` (components/ai/AIAssistant.tsx)
                  tar INGA props — den är en global flytande knapp som öppnar
                  en generisk instrumentpanel-liknande modal, inte ett
                  kontextuellt hjälp-widget för en specifik övningsfråga.
                  `mode`/`context`/`buttonText`/`compact` skickades hit men
                  har aldrig lästs av komponenten; TS fällde det nu (tidigare
                  osynligt typfel). Detta är en produktlucka, inte ett rent
                  typfel: knappen påstod "Få hjälp från AI" för just den här
                  frågan men öppnade i praktiken samma generella AI-panel som
                  resten av appen. Tar bort de döda propsen här utan att
                  bygga om funktionen — kontextuell AI-hjälp per övningsfråga
                  finns inte och kräver ett produktbeslut om den ska byggas.
                  2026-10-10: knappen ritades en gång per fråga — alla som
                  `position: fixed` på samma ställe, fem staplade knappar utan
                  namn på mobil. Den enda kvar står i AI-coach-kortet nedan. */}
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
            {t('exercises.previous', 'Föregående')}
          </Button>

          <Button
            onClick={handleNext}
            className="flex items-center gap-2"
          >
            {currentStep === selectedExercise.steps.length - 1 ? t('exercises.finish', 'Avsluta') : t('exercises.next', 'Nästa')}
            {currentStep === selectedExercise.steps.length - 1 ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </Button>
        </div>
      </Card>

      {/* AI Coach Card */}
      <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-emerald-900 dark:text-emerald-100">{t('exercises.aiCoach', 'AI Coach')}</h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1 mb-3">
              {t('exercises.aiCoachText', 'Behöver du hjälp med denna övning? AI:n kan ge vägledning, exempel och följdfrågor.')}
            </p>
            {/* Samma fynd som "AI Help Button" ovan — AIAssistant tar inga
                props och är en generell flytande knapp/modal, inte
                kontextuell hjälp för den här övningen. */}
            <AIAssistant />
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-4 bg-gray-50 dark:bg-stone-800 border-gray-200 dark:border-stone-700">
        <div className="flex items-start gap-3">
          <Signal className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-800 dark:text-gray-100">{t('exercises.aboutThisExercise')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {selectedExercise.description}
            </p>
          </div>
        </div>
      </Card>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <Card className="p-4 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-solid)] mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-[var(--c-text)] dark:text-white">{t('exercises.relatedArticles')}</h3>
              <p className="text-sm text-[var(--c-text)] mt-1 mb-3">
                {t('exercises.readMoreIn')}{' '}
                {t(`exercises.categories.${selectedExercise.category}`, selectedExercise.category).toLowerCase()}{' '}
                {t('exercises.inKnowledgeBase')}
              </p>
              <div className="space-y-2">
                {relatedArticles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/knowledge-base/article/${article.id}`}
                    className="block p-3 bg-white dark:bg-stone-700 rounded-lg hover:shadow-sm transition-shadow border border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50"
                  >
                    <h4 className="font-medium text-gray-800 dark:text-gray-100 text-sm">{article.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{article.summary}</p>
                  </Link>
                ))}
              </div>
              <Link
                to="/knowledge-base"
                className="inline-flex items-center gap-1 text-sm text-[var(--c-text)] dark:text-[var(--c-solid)] hover:text-[var(--c-text)] mt-3 font-medium"
              >
                {t('exercises.seeAllArticles', 'Se alla artiklar')}
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
