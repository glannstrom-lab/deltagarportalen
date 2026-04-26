import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageCircle, Send, User, Bot, RefreshCw, Lightbulb, Star, Clock, ChevronDown, ChevronUp, Zap, Download, ListTodo, TrendingUp, Mic, MicOff, Pause, Play, HelpCircle, Circle, Save } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAchievementTracker } from '@/hooks/useAchievementTracker'
import { callAI } from '@/services/aiApi'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'

interface FragaSvar {
  fraga: string
  svar: string
  rating?: number
  feedback?: string
}

// Isolated Timer Component with color-coding and pause functionality
interface TimerProps {
  seconds: number
  isRunning: boolean
  onTogglePause: () => void
}

interface InterviewTimerPropsExtended extends TimerProps {
  t: (key: string, options?: Record<string, unknown>) => string
}

const InterviewTimer = memo(function InterviewTimer({ seconds, isRunning, onTogglePause, t }: InterviewTimerPropsExtended) {
  // Color coding: green (0-30s), yellow (30-60s), orange (60-90s), red (90s+)
  const getTimerColor = () => {
    if (seconds < 30) return 'text-emerald-600 dark:text-emerald-400'
    if (seconds < 60) return 'text-yellow-600 dark:text-yellow-400'
    if (seconds < 90) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getTimerBgColor = () => {
    if (seconds < 30) return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
    if (seconds < 60) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    if (seconds < 90) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  }

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${getTimerBgColor()}`}
      role="timer"
      aria-live="off"
      aria-label={t('interviewSimulator.timer.ariaLabel', { seconds })}
    >
      <div className="flex items-center gap-2">
        <Clock className={`w-4 h-4 ${getTimerColor()}`} aria-hidden="true" />
        <span className="text-sm font-medium text-slate-700 dark:text-stone-300">{t('interviewSimulator.timer.timeForAnswer')}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-2xl font-bold ${getTimerColor()}`}>{seconds}s</span>
        <button
          onClick={onTogglePause}
          className="p-1.5 rounded-lg bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-600 transition-colors"
          aria-label={isRunning ? t('interviewSimulator.timer.pauseTimer') : t('interviewSimulator.timer.startTimer')}
          type="button"
        >
          {isRunning ? (
            <Pause className="w-4 h-4 text-slate-600 dark:text-stone-400" />
          ) : (
            <Play className="w-4 h-4 text-slate-600 dark:text-stone-400" />
          )}
        </button>
      </div>
    </div>
  )
})

interface QuestionCategory {
  name: string
  questions: string[]
}

const questionCategories: QuestionCategory[] = [
  {
    name: 'Om dig själv',
    questions: [
      'Berätta om dig själv och din bakgrund',
      'Vad är dina största styrkor?',
      'Vilka är dina svagaste sidor?'
    ]
  },
  {
    name: 'Erfarenhet & färdigheter',
    questions: [
      'Beskriv en utmaning du övervann i ett tidigare jobb',
      'Hur hanterar du konflikter på arbetsplatsen?',
      'Berätta om ett projekt du är stolt över'
    ]
  },
  {
    name: 'Motivation & mål',
    questions: [
      'Varför är du intresserad av denna position?',
      'Var ser du dig själv om 5 år?',
      'Vad motiverar dig mest på jobbet?'
    ]
  },
  {
    name: 'Tekniska frågor',
    questions: [
      'Beskriv en teknisk utmaning och hur du löste den',
      'Hur håller du dig uppdaterad med ny teknik?'
    ]
  }
]

const exampleAnswers: Record<string, string> = {
  'Berätta om dig själv och din bakgrund': 'Jag är en driven utvecklare med 5 års erfarenhet inom webbutveckling. Jag är specialiserad på React och backend-teknologier. Jag brinner för att skapa användbara applikationer och arbetar bäst i team.',
  'Varför är du intresserad av denna position?': 'Jag är fascinerad av ert företags innovativa produkter och er fokus på användarupplevelse. Jag ser denna roll som en perfekt match för mina färdigheter och framtida karriärmål.'
}

export default function InterviewSimulator() {
  const { t } = useTranslation()
  const [roll, setRoll] = useState('')
  const [foretag, setForetag] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [harStartat, setHarStartat] = useState(false)
  const [nuvarandeFraga, setNuvarandeFraga] = useState('')
  const [anvandarSvar, setAnvandarSvar] = useState('')
  const [historik, setHistorik] = useState<FragaSvar[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [antalFragor, setAntalFragor] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [expandedFeedback, setExpandedFeedback] = useState<number | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [supportPhrase, setSupportPhrase] = useState<string | null>(null)
  const [isLoadingSupportPhrase, setIsLoadingSupportPhrase] = useState(false)
  const { trackInterviewCompleted } = useAchievementTracker()

  // Audio recording for full session capture
  const {
    isRecording: isAudioRecording,
    isPaused: isAudioPaused,
    recordingTime: audioRecordingTime,
    audioSupported,
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording,
    pauseRecording: pauseAudioRecording,
    resumeRecording: resumeAudioRecording,
    downloadRecording: downloadAudioRecording,
    clearRecording: clearAudioRecording
  } = useAudioRecorder()

  // Ref for speech recognition cleanup
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = (window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
                              (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    setSpeechSupported(!!SpeechRecognition)
  }, [])

  // Cleanup speech recognition on unmount (fixes memory leak)
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    }
  }, [])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning])

  // Speech recognition with proper cleanup
  const toggleRecording = useCallback(() => {
    const SpeechRecognition = (window as Window & { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition ||
                              (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition

    if (!SpeechRecognition) return

    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
      setIsRecording(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'sv-SE'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setAnvandarSvar(transcript)
    }

    recognition.onerror = () => {
      setIsRecording(false)
      recognitionRef.current = null
    }

    recognition.onend = () => {
      setIsRecording(false)
      recognitionRef.current = null
    }

    recognition.start()
    setIsRecording(true)
    recognitionRef.current = recognition
  }, [isRecording])

  // Toggle timer pause
  const toggleTimerPause = useCallback(() => {
    setIsTimerRunning(prev => !prev)
  }, [])

  // AI-generated support phrase
  const getSupportPhrase = useCallback(async () => {
    if (!nuvarandeFraga || isLoadingSupportPhrase) return

    setIsLoadingSupportPhrase(true)
    setSupportPhrase(null)

    try {
      const data = await callAI<{ svar: string }>('chatbot', {
        meddelande: `Ge mig en kort startfras eller tips på max 1-2 meningar för att besvara denna intervjufråga: "${nuvarandeFraga}". Ge bara startfrasen, inget annat.`
      })
      setSupportPhrase((data as { svar?: string }).svar || 'Börja med att beskriva en konkret situation...')
    } catch {
      setSupportPhrase('Börja med att beskriva en konkret situation från din erfarenhet...')
    } finally {
      setIsLoadingSupportPhrase(false)
    }
  }, [nuvarandeFraga, isLoadingSupportPhrase])

  const startaIntervju = useCallback(async () => {
    if (!roll.trim()) return
    setHarStartat(true)
    setIsLoading(true)
    setTimerSeconds(0)
    setSupportPhrase(null)

    try {
      const data = await callAI<{ resultat: string }>('intervju-simulator', { roll, foretag, tidigareFragor: [] })
      setNuvarandeFraga((data as { resultat?: string }).resultat || 'Berätta om dig själv')
    } catch {
      const defaultQuestions = questionCategories[0]?.questions || []
      setNuvarandeFraga(defaultQuestions[0] || 'Berätta om dig själv')
    } finally {
      setIsLoading(false)
      setIsTimerRunning(true)
    }
  }, [roll, foretag])

  const svara = useCallback(async () => {
    if (!anvandarSvar.trim() || isLoading) return

    setIsLoading(true)
    setIsTimerRunning(false)
    setSupportPhrase(null)
    const nyFragaSvar: FragaSvar = {
      fraga: nuvarandeFraga,
      svar: anvandarSvar,
      rating: 0
    }

    try {
      const data = await callAI<{ resultat: { rating: number; feedback: string; nastaFraga: string } | string }>('intervju-simulator', {
        roll,
        foretag,
        anvandarSvar,
        tidigareFragor: [...historik, nyFragaSvar]
      })

      const resultat = (data as { resultat?: { rating: number; feedback: string; nastaFraga: string } | string }).resultat

      if (resultat && typeof resultat === 'object') {
        // AI returnerade JSON med betyg och feedback
        setHistorik([...historik, {
          ...nyFragaSvar,
          rating: resultat.rating || 3,
          feedback: resultat.feedback || 'Bra svar!'
        }])
        setNuvarandeFraga(resultat.nastaFraga || 'Vad är dina framtidsplaner?')
      } else {
        // Fallback om AI bara returnerade en sträng
        setHistorik([...historik, {
          ...nyFragaSvar,
          feedback: 'Bra svar!'
        }])
        setNuvarandeFraga(String(resultat) || 'Vad är dina framtidsplaner?')
      }

      setAnvandarSvar('')
      setAntalFragor(prev => prev + 1)
      setTimerSeconds(0)
      setIsTimerRunning(true)
    } catch {
      const allQuestions = questionCategories.flatMap(cat => cat.questions)
      const nextQuestion = allQuestions[antalFragor % allQuestions.length] || 'Vad är dina framtidsplaner?'

      setHistorik([...historik, nyFragaSvar])
      setNuvarandeFraga(nextQuestion)
      setAnvandarSvar('')
      setAntalFragor(prev => prev + 1)
      setIsTimerRunning(true)
    } finally {
      setIsLoading(false)
    }
  }, [anvandarSvar, isLoading, nuvarandeFraga, roll, foretag, historik, antalFragor])

  const handleSetRating = useCallback((index: number, rating: number) => {
    setHistorik(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], rating }
      return updated
    })
  }, [])

  const avslutaIntervju = useCallback(() => {
    // Cleanup speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    if (antalFragor >= 3) {
      trackInterviewCompleted()
    }

    setHarStartat(false)
    setRoll('')
    setForetag('')
    setSelectedCategory('')
    setNuvarandeFraga('')
    setAnvandarSvar('')
    setHistorik([])
    setAntalFragor(0)
    setIsTimerRunning(false)
    setSupportPhrase(null)
    setIsRecording(false)
  }, [antalFragor, trackInterviewCompleted])

  const downloadSessionSummary = useCallback(() => {
    const avgRatingValue = historik.length > 0 ? (historik.reduce((sum, h) => sum + (h.rating || 0), 0) / historik.length).toFixed(1) : 'N/A'
    const summary = `INTERVJUPRAKTIK SAMMANFATTNING
Datum: ${new Date().toLocaleDateString('sv-SE')}
Roll: ${roll}
Företag: ${foretag || 'Inte angiven'}

SESSIONÖVERSIKT:
- Totalt frågor: ${antalFragor}
- Genomsnittliga klassificering: ${avgRatingValue} / 5

FRÅGOR OCH SVAR:
${historik.map((h, idx) => `
${idx + 1}. FRÅGA: ${h.fraga}
   SVAR: ${h.svar}
   BETYG: ${h.rating || 0} / 5
`).join('')}

TIPS FÖR FÖRBÄTTRING:
- Använd STAR-metoden för bättre strukturerade svar
- Praktisera högljudd för att förbättra uttal och tempo
- Förbered konkreta exempel från din erfarenhet`

    const blob = new Blob([summary], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `intervju-session-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    window.URL.revokeObjectURL(url) // Clean up blob URL
  }, [roll, foretag, antalFragor, historik])

  // Memoized average rating calculation
  const avgRating = useMemo(() => {
    if (historik.length === 0) return '0'
    return (historik.reduce((sum, h) => sum + (h.rating || 0), 0) / historik.length).toFixed(1)
  }, [historik])

  // Related exercises and articles
  const relatedContent = useMemo(() => ({
    exercises: [
      { id: 'star-method', title: 'STAR-metoden i praktiken', description: 'Öva att strukturera dina svar', icon: '⭐' },
      { id: 'body-language', title: 'Kroppsspråk på intervju', description: 'Lär dig signalera självförtroende', icon: '💪' },
      { id: 'salary-talk', title: 'Löneförhandling', description: 'Förbered dig för lönediskussionen', icon: '💰' }
    ],
    articles: [
      { title: '10 vanligaste intervjufrågorna', url: '#', readTime: '5 min' },
      { title: 'Så hanterar du nervositet', url: '#', readTime: '3 min' },
      { title: 'Frågor att ställa till arbetsgivaren', url: '#', readTime: '4 min' }
    ]
  }), [])

  if (!harStartat) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-20 min-h-screen p-4 md:p-6">
        {/* Hero Section with soft gradient */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-50 via-cyan-50 to-sky-50 dark:from-brand-900/20 dark:via-cyan-900/20 dark:to-sky-900/20 p-8 border border-brand-100 dark:border-brand-900/50">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-brand-200/30 to-cyan-200/30 dark:from-brand-900/20 dark:to-cyan-700/20 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-sky-200/30 to-brand-200/30 dark:from-sky-700/20 dark:to-brand-900/20 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-brand-400 to-cyan-500 dark:from-brand-700 dark:to-cyan-600  dark:/50 mb-2">
              <MessageCircle className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-stone-100">{t('interviewSimulator.title')}</h1>
            <p className="text-lg text-slate-600 dark:text-stone-400 max-w-lg mx-auto">
              {t('interviewSimulator.description')}
            </p>
          </div>
        </div>

        {/* Setup Form */}
        <Card className="p-6 md:p-8 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-stone-100 mb-6">{t('interviewSimulator.setup.startTraining')}</h2>
          <div className="space-y-5">
            <div>
              <label htmlFor="roll-input" className="block text-sm font-medium text-slate-700 dark:text-stone-300 mb-2">
                {t('interviewSimulator.roleLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                id="roll-input"
                type="text"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                placeholder={t('interviewSimulator.rolePlaceholder')}
                aria-required="true"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 focus:border-brand-700 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 outline-none bg-white dark:bg-stone-700 text-slate-900 dark:text-stone-100 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="foretag-input" className="block text-sm font-medium text-slate-700 dark:text-stone-300 mb-2">
                {t('interviewSimulator.companyLabel')}
              </label>
              <input
                id="foretag-input"
                type="text"
                value={foretag}
                onChange={(e) => setForetag(e.target.value)}
                placeholder={t('interviewSimulator.companyPlaceholder')}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 focus:border-brand-700 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 outline-none bg-white dark:bg-stone-700 text-slate-900 dark:text-stone-100 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="category-select" className="block text-sm font-medium text-slate-700 dark:text-stone-300 mb-2 flex items-center gap-2">
                <ListTodo className="w-4 h-4" aria-hidden="true" />
                {t('interviewSimulator.setup.selectCategory')}
              </label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 focus:border-brand-700 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 outline-none bg-white dark:bg-stone-700 text-slate-900 dark:text-stone-100 transition-colors"
              >
                <option value="">{t('interviewSimulator.setup.randomQuestions')}</option>
                {questionCategories.map((cat) => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <Button
              onClick={startaIntervju}
              disabled={!roll.trim() || isLoading}
              className="w-full bg-gradient-to-r from-brand-700 to-cyan-500 hover:from-brand-900 hover:to-cyan-600 dark:from-brand-900 dark:to-cyan-600 dark:hover:from-brand-700 dark:hover:to-cyan-500 text-white font-medium py-3 rounded-xl  dark:/30 transition-all"
              aria-busy={isLoading}
            >
              {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" aria-label="Laddar" /> : t('interviewSimulator.startInterview')}
            </Button>
          </div>
        </Card>

        {/* Tips Section */}
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800/50">
          <h3 className="font-bold text-slate-800 dark:text-stone-100 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            {t('interviewSimulator.star.title')}
          </h3>
          <ul className="space-y-3 text-sm text-slate-700 dark:text-stone-300" role="list">
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-200 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200 font-bold text-xs flex-shrink-0">S</span>
              <span><strong>Situation</strong> - {t('interviewSimulator.star.situation')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-orange-200 dark:bg-orange-800/50 text-orange-800 dark:text-orange-200 font-bold text-xs flex-shrink-0">T</span>
              <span><strong>Task</strong> - {t('interviewSimulator.star.task')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-yellow-200 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-200 font-bold text-xs flex-shrink-0">A</span>
              <span><strong>Action</strong> - {t('interviewSimulator.star.action')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-lime-200 dark:bg-lime-800/50 text-lime-800 dark:text-lime-200 font-bold text-xs flex-shrink-0">R</span>
              <span><strong>Result</strong> - {t('interviewSimulator.star.result')}</span>
            </li>
          </ul>
        </Card>

        {/* Related Exercises */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-stone-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-900 dark:text-brand-400" aria-hidden="true" />
            {t('interviewSimulator.relatedExercises')}
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {relatedContent.exercises.map((exercise) => (
              <Card
                key={exercise.id}
                className="p-4 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-brand-300 dark:hover:border-brand-900 hover: transition-all cursor-pointer group"
              >
                <div className="text-2xl mb-2">{exercise.icon}</div>
                <h4 className="font-medium text-slate-800 dark:text-stone-100 group-hover:text-brand-900 dark:group-hover:text-brand-400 transition-colors">
                  {exercise.title}
                </h4>
                <p className="text-sm text-slate-600 dark:text-stone-400 mt-1">{exercise.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Related Articles */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-stone-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
            {t('interviewSimulator.readMore')}
          </h3>
          <div className="space-y-2">
            {relatedContent.articles.map((article, idx) => (
              <a
                key={idx}
                href={article.url}
                className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-sky-300 dark:hover:border-sky-600 hover: transition-all group"
              >
                <span className="font-medium text-slate-800 dark:text-stone-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  {article.title}
                </span>
                <span className="text-sm text-slate-500 dark:text-stone-500 bg-stone-100 dark:bg-stone-700 px-2 py-1 rounded-lg">
                  {article.readTime}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 min-h-screen p-4 md:p-6">
      {/* Header med progress - improved design */}
      <Card className="p-6 md:p-8 bg-gradient-to-br from-brand-50 via-cyan-50 to-sky-50 dark:from-brand-900/20 dark:via-cyan-900/20 dark:to-sky-900/20 border-brand-200 dark:border-brand-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-200/30 to-cyan-200/30 dark:from-brand-900/20 dark:to-cyan-700/20 rounded-full -translate-y-1/2 translate-x-1/2" />

        <div className="relative flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-stone-100">{t('interviewSimulator.interview')} {roll}</h1>
            <p className="text-sm text-slate-600 dark:text-stone-400">{foretag || t('interviewSimulator.genericPractice')}</p>
          </div>
          <Button variant="outline" size="sm" onClick={avslutaIntervju} aria-label={t('interviewSimulator.session.endInterviewAria')}>
            {t('interviewSimulator.session.endInterview')}
          </Button>
        </div>

        {/* Stats - improved grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm p-4 rounded-xl border border-brand-100 dark:border-brand-900/50">
            <p className="text-xs text-slate-600 dark:text-stone-400 mb-1">{t('interviewSimulator.session.questionsAnswered')}</p>
            <p className="text-3xl font-bold text-brand-900 dark:text-brand-400">{antalFragor}</p>
          </div>
          <div className="bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm p-4 rounded-xl border border-brand-100 dark:border-brand-900/50">
            <p className="text-xs text-slate-600 dark:text-stone-400 mb-1">{t('interviewSimulator.session.averageRating')}</p>
            <p className="text-3xl font-bold text-brand-900 dark:text-brand-400">{avgRating}/5</p>
          </div>
          <div className="col-span-2 md:col-span-1 bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm p-4 rounded-xl border border-brand-100 dark:border-brand-900/50">
            <p className="text-xs text-slate-600 dark:text-stone-400 mb-1">{t('interviewSimulator.timer.timeForAnswer')}</p>
            <p className={`text-3xl font-bold ${timerSeconds < 30 ? 'text-emerald-600 dark:text-emerald-400' : timerSeconds < 60 ? 'text-yellow-600 dark:text-yellow-400' : timerSeconds < 90 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`}>
              {timerSeconds}s
            </p>
          </div>
        </div>
      </Card>

      {/* Historik med expanderbar feedback - with aria-live */}
      {historik.length > 0 && (
        <div className="space-y-4" role="log" aria-live="polite" aria-label={t('interviewSimulator.session.previousAnswers')}>
          <h2 className="font-semibold text-slate-800 dark:text-stone-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-900 dark:text-brand-400" aria-hidden="true" />
            {t('interviewSimulator.session.previousAnswers')}
          </h2>
          {historik.map((fs, index) => (
            <Card key={index} className="p-5 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
              <div className="space-y-4">
                {/* Fråga */}
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-100 to-cyan-100 dark:from-brand-900/50 dark:to-cyan-900/50 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-brand-900 dark:text-brand-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-brand-900 dark:text-brand-400 mb-1">{t('interviewSimulator.session.question')}</p>
                    <p className="text-slate-800 dark:text-stone-200">{fs.fraga}</p>
                  </div>
                </div>

                {/* Svar */}
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-brand-100 dark:from-emerald-900/50 dark:to-brand-900/50 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">{t('interviewSimulator.session.yourAnswer')}</p>
                    <p className="text-slate-800 dark:text-stone-200">{fs.svar}</p>
                  </div>
                </div>

                {/* Rating och feedback */}
                <div className="bg-stone-50 dark:bg-stone-700/50 p-4 rounded-xl border border-stone-200 dark:border-stone-600">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-slate-700 dark:text-stone-300">
                      {fs.rating ? t('interviewSimulator.session.aiRating') : t('interviewSimulator.session.rateThisAnswer')}
                    </p>
                    <div className="flex gap-1" role="group" aria-label="Betygsättning">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleSetRating(index, star)}
                          className={`text-xl ${star <= (fs.rating || 0) ? 'text-yellow-400' : 'text-slate-300 dark:text-stone-500'} cursor-pointer hover:scale-125 transition-transform focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded`}
                          aria-label={`Betyg ${star} av 5`}
                          aria-pressed={star <= (fs.rating || 0)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Expanderbar feedback */}
                  <button
                    onClick={() => setExpandedFeedback(expandedFeedback === index ? null : index)}
                    className="flex items-center gap-2 text-sm text-brand-900 dark:text-brand-400 hover:text-brand-900 dark:hover:text-brand-300 transition font-medium"
                    aria-expanded={expandedFeedback === index}
                    aria-controls={`feedback-${index}`}
                  >
                    {expandedFeedback === index ? (
                      <>
                        <ChevronUp className="w-4 h-4" aria-hidden="true" />
                        {t('interviewSimulator.session.hideFeedback')}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" aria-hidden="true" />
                        {t('interviewSimulator.session.showFeedback')}
                      </>
                    )}
                  </button>

                  {expandedFeedback === index && (
                    <div id={`feedback-${index}`} className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-600 space-y-3" aria-live="polite">
                      {fs.feedback && (
                        <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-xl text-sm text-brand-900 dark:text-brand-300 border border-brand-100 dark:border-brand-900/50">
                          <strong>{t('interviewSimulator.session.aiFeedback')}</strong> {fs.feedback}
                        </div>
                      )}
                      <div className="bg-sky-50 dark:bg-sky-900/20 p-3 rounded-xl text-sm text-sky-800 dark:text-sky-300 border border-sky-100 dark:border-sky-800/50">
                        <strong>Tips:</strong> {t('interviewSimulator.session.starTip')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Nuvarande fråga - with aria-live for AI questions */}
      <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800/50" role="region" aria-label="Nuvarande fråga">
        <div className="flex gap-4" aria-live="polite">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-cyan-500 dark:from-brand-700 dark:to-cyan-600 flex items-center justify-center flex-shrink-0  dark:/30">
            <User className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" aria-hidden="true" />
              {t('interviewSimulator.session.questionNumber', { number: antalFragor + 1 })}
            </p>
            <p className="text-lg text-slate-800 dark:text-stone-100 font-medium">{nuvarandeFraga}</p>
          </div>
        </div>
      </Card>

      {/* Timer & Answer Input */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="space-y-5">
          {/* Isolated Timer Component */}
          <InterviewTimer
            seconds={timerSeconds}
            isRunning={isTimerRunning}
            onTogglePause={toggleTimerPause}
            t={t}
          />

          {/* Support phrase button */}
          <div className="flex items-center gap-2">
            <button
              onClick={getSupportPhrase}
              disabled={isLoadingSupportPhrase || !nuvarandeFraga}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-all disabled:opacity-50"
              aria-busy={isLoadingSupportPhrase}
            >
              {isLoadingSupportPhrase ? (
                <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <HelpCircle className="w-4 h-4" aria-hidden="true" />
              )}
              {t('interviewSimulator.input.giveStart')}
            </button>
            {supportPhrase && (
              <div className="flex-1 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-sm text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50" aria-live="polite">
                "{supportPhrase}"
              </div>
            )}
          </div>

          {/* Answer Textarea */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="svar-textarea" className="text-sm font-medium text-slate-700 dark:text-stone-300">{t('interviewSimulator.input.yourAnswerLabel')}</label>
              {speechSupported && (
                <button
                  onClick={toggleRecording}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isRecording
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse border border-red-200 dark:border-red-800/50'
                      : 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 border border-stone-200 dark:border-stone-600'
                  }`}
                  aria-pressed={isRecording}
                  aria-label={isRecording ? t('interviewSimulator.input.stopRecording') : t('interviewSimulator.input.recordAnswer')}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4" aria-hidden="true" />
                      {t('interviewSimulator.input.stopRecording')}
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" aria-hidden="true" />
                      {t('interviewSimulator.input.recordAnswer')}
                    </>
                  )}
                </button>
              )}
            </div>
            <textarea
              id="svar-textarea"
              value={anvandarSvar}
              onChange={(e) => setAnvandarSvar(e.target.value)}
              placeholder={isRecording ? t('interviewSimulator.input.speakNow') : t('interviewSimulator.input.writeOrRecord')}
              rows={5}
              aria-describedby="svar-hints"
              className={`w-full px-4 py-3 rounded-xl border focus:border-brand-700 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900 outline-none resize-y bg-white dark:bg-stone-700 text-slate-900 dark:text-stone-100 transition-colors ${
                isRecording ? 'border-red-300 dark:border-red-700' : 'border-stone-200 dark:border-stone-600'
              }`}
            />
            <div id="svar-hints" className="flex justify-between items-center text-xs text-slate-500 dark:text-stone-500">
              <span>{t('interviewSimulator.input.characters', { count: anvandarSvar.length })}</span>
              <span>{t('interviewSimulator.input.recommended')}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={svara}
              disabled={!anvandarSvar.trim() || isLoading}
              className="flex-1 bg-gradient-to-r from-brand-700 to-cyan-500 hover:from-brand-900 hover:to-cyan-600 dark:from-brand-900 dark:to-cyan-600 dark:hover:from-brand-700 dark:hover:to-cyan-500 text-white font-medium py-3 rounded-xl  dark:/30"
              aria-busy={isLoading}
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" aria-label={t('common.loading')} /> : <><Send className="w-4 h-4 mr-2" aria-hidden="true" /> {t('interviewSimulator.input.nextQuestion')}</>}
            </Button>

            {/* Audio Recording Controls */}
            {audioSupported && (
              <Button
                variant="outline"
                onClick={isAudioRecording ? (isAudioPaused ? resumeAudioRecording : pauseAudioRecording) : () => startAudioRecording()}
                size="sm"
                className={`px-4 rounded-xl ${isAudioRecording ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400' : ''}`}
                aria-label={isAudioRecording ? (isAudioPaused ? t('interviewSimulator.recording.resumeRecording') : t('interviewSimulator.recording.pauseRecording')) : t('interviewSimulator.recording.recordSession')}
                title={isAudioRecording ? t('interviewSimulator.recording.recorded', { time: `${Math.floor(audioRecordingTime / 60)}:${(audioRecordingTime % 60).toString().padStart(2, '0')}` }) : t('interviewSimulator.recording.recordSession')}
              >
                {isAudioRecording ? (
                  isAudioPaused ? (
                    <Play className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <>
                      <Circle className="w-3 h-3 fill-red-500 text-red-500 animate-pulse" aria-hidden="true" />
                    </>
                  )
                ) : (
                  <Circle className="w-4 h-4" aria-hidden="true" />
                )}
              </Button>
            )}

            {/* Stop and save recording */}
            {isAudioRecording && (
              <Button
                variant="outline"
                onClick={async () => {
                  await stopAudioRecording()
                  downloadAudioRecording(`intervju-${roll.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.webm`)
                }}
                size="sm"
                className="px-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400"
                aria-label={t('interviewSimulator.recording.saveRecording')}
              >
                <Save className="w-4 h-4" aria-hidden="true" />
              </Button>
            )}

            <Button
              variant="outline"
              onClick={downloadSessionSummary}
              size="sm"
              className="px-4 rounded-xl"
              aria-label={t('interviewSimulator.download.downloadSummary')}
            >
              <Download className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Example Answer - improved design */}
      {exampleAnswers[nuvarandeFraga] && (
        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-brand-50 dark:from-emerald-900/20 dark:to-brand-900/20 border-emerald-200 dark:border-emerald-800/50">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-brand-700 dark:from-emerald-500 dark:to-brand-900 flex items-center justify-center flex-shrink-0  dark:/30">
              <Zap className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-2">{t('interviewSimulator.example.goodAnswer')}</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 italic leading-relaxed">"{exampleAnswers[nuvarandeFraga]}"</p>
            </div>
          </div>
        </Card>
      )}

      {/* Related content for active session */}
      <div className="grid gap-4 sm:grid-cols-2 pt-4">
        <Card className="p-5 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <h3 className="font-semibold text-slate-800 dark:text-stone-100 mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            {t('interviewSimulator.quickTips.title')}
          </h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-stone-400">
            <li className="flex items-start gap-2">
              <span className="text-brand-700 mt-1">•</span>
              <span>{t('interviewSimulator.quickTips.tip1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-700 mt-1">•</span>
              <span>{t('interviewSimulator.quickTips.tip2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-700 mt-1">•</span>
              <span>{t('interviewSimulator.quickTips.tip3')}</span>
            </li>
          </ul>
        </Card>
        <Card className="p-5 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <h3 className="font-semibold text-slate-800 dark:text-stone-100 mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 dark:text-yellow-400" aria-hidden="true" />
            {t('interviewSimulator.progress.title')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-stone-400">{t('interviewSimulator.progress.answered')}</span>
              <span className="font-medium text-slate-800 dark:text-stone-200">{antalFragor} {t('interviewSimulator.progress.questionsUnit')}</span>
            </div>
            <div className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-400 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(antalFragor * 20, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-stone-500">
              {antalFragor < 5 ? t('interviewSimulator.progress.questionsLeft', { count: 5 - antalFragor }) : t('interviewSimulator.progress.goalAchieved')}
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
