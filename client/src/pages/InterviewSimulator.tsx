import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageCircle, Send, User, Bot, RefreshCw, Lightbulb, Star, Clock, ChevronDown, ChevronUp, Zap, Download, ListTodo, TrendingUp, Mic, MicOff } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAchievementTracker } from '@/hooks/useAchievementTracker'
import { callAI } from '@/services/aiApi'

interface FragaSvar {
  fraga: string
  svar: string
  rating?: number
  feedback?: string
}

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
  const { trackInterviewCompleted } = useAchievementTracker()

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = (window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
                              (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    setSpeechSupported(!!SpeechRecognition)
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

  // Speech recognition
  const toggleRecording = () => {
    const SpeechRecognition = (window as Window & { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition ||
                              (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition

    if (!SpeechRecognition) return

    if (isRecording) {
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
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognition.start()
    setIsRecording(true)

    // Store recognition instance to stop it later
    ;(window as Window & { currentRecognition?: SpeechRecognition }).currentRecognition = recognition
  }

  // Stop recording when toggled off
  useEffect(() => {
    if (!isRecording) {
      const recognition = (window as Window & { currentRecognition?: SpeechRecognition }).currentRecognition
      if (recognition) {
        recognition.stop()
      }
    }
  }, [isRecording])

  const startaIntervju = async () => {
    if (!roll.trim()) return
    setHarStartat(true)
    setIsLoading(true)
    setTimerSeconds(0)

    try {
      const data = await callAI<{ resultat: string }>('intervju-simulator', { roll, foretag, tidigareFragor: [] })
      setNuvarandeFraga((data as { resultat?: string }).resultat || 'Berätta om dig själv')
    } catch (error) {
      const defaultQuestions = questionCategories[0]?.questions || []
      setNuvarandeFraga(defaultQuestions[0] || 'Berätta om dig själv')
    } finally {
      setIsLoading(false)
      setIsTimerRunning(true)
    }
  }

  const svara = async () => {
    if (!anvandarSvar.trim() || isLoading) return

    setIsLoading(true)
    setIsTimerRunning(false)
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
    } catch (error) {
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
  }

  const setRating = (index: number, rating: number) => {
    const updated = [...historik]
    updated[index].rating = rating
    setHistorik(updated)
  }

  const avslutaIntervju = () => {
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
  }

  const downloadSessionSummary = () => {
    const summary = `INTERVJUPRAKTIK SAMMANFATTNING
Datum: ${new Date().toLocaleDateString('sv-SE')}
Roll: ${roll}
Företag: ${foretag || 'Inte angiven'}

SESSIONÖVERSIKT:
- Totalt frågor: ${antalFragor}
- Genomsnittliga klassificering: ${historik.length > 0 ? (historik.reduce((sum, h) => sum + (h.rating || 0), 0) / historik.length).toFixed(1) : 'N/A'} / 5

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
  }

  if (!harStartat) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-20 bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 min-h-screen p-4">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 mb-2">
            <MessageCircle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-stone-100">{t('interviewSimulator.title')}</h1>
          <p className="text-slate-600 dark:text-stone-400">
            {t('interviewSimulator.description')}
          </p>
        </div>

        <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-stone-300 mb-2">{t('interviewSimulator.roleLabel')}</label>
              <input
                type="text"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                placeholder={t('interviewSimulator.rolePlaceholder')}
                className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-900 outline-none bg-white dark:bg-stone-700 text-slate-900 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-stone-300 mb-2">{t('interviewSimulator.companyLabel')}</label>
              <input
                type="text"
                value={foretag}
                onChange={(e) => setForetag(e.target.value)}
                placeholder={t('interviewSimulator.companyPlaceholder')}
                className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-900 outline-none bg-white dark:bg-stone-700 text-slate-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-stone-300 mb-2 flex items-center gap-2">
                <ListTodo className="w-4 h-4" />
                Välj frågekategori (valfritt)
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-900 outline-none bg-white dark:bg-stone-700 text-slate-900 dark:text-stone-100"
              >
                <option value="">Slumpmässiga frågor</option>
                {questionCategories.map((cat) => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <Button
              onClick={startaIntervju}
              disabled={!roll.trim() || isLoading}
              className="w-full bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500"
            >
              {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : t('interviewSimulator.startInterview')}
            </Button>
          </div>
        </Card>

        {/* Tips Section */}
        <Card className="p-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <h3 className="font-bold text-slate-800 dark:text-stone-100 mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            STAR-metoden för bättre svar
          </h3>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-stone-300">
            <li><strong>S</strong>ituation - Beskriv sammanhanget</li>
            <li><strong>T</strong>ask - Förklara vad som behövde göras</li>
            <li><strong>A</strong>ction - Vad gjorde du specifikt?</li>
            <li><strong>R</strong>esult - Vad blev resultatet?</li>
          </ul>
        </Card>
      </div>
    )
  }

  const avgRating = historik.length > 0 ? (historik.reduce((sum, h) => sum + (h.rating || 0), 0) / historik.length).toFixed(1) : 0

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 min-h-screen p-4">
      {/* Header med progress */}
      <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-stone-100">{t('interviewSimulator.interview')} {roll}</h1>
            <p className="text-sm text-slate-700 dark:text-stone-400">{foretag || t('interviewSimulator.genericPractice')}</p>
          </div>
          <Button variant="outline" size="sm" onClick={avslutaIntervju}>
            Avsluta
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-stone-800 p-3 rounded-lg border border-amber-100 dark:border-amber-800/50">
            <p className="text-xs text-slate-600 dark:text-stone-400">Frågor besvarade</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{antalFragor}</p>
          </div>
          <div className="bg-white dark:bg-stone-800 p-3 rounded-lg border border-amber-100 dark:border-amber-800/50">
            <p className="text-xs text-slate-600 dark:text-stone-400">Genomsnittligt betyg</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{avgRating}/5</p>
          </div>
          <div className="bg-white dark:bg-stone-800 p-3 rounded-lg border border-amber-100 dark:border-amber-800/50">
            <p className="text-xs text-slate-600 dark:text-stone-400">Tid för svar</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{timerSeconds}s</p>
          </div>
        </div>
      </Card>

      {/* Historik med expanderbar feedback */}
      {historik.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-800 dark:text-stone-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Tidigare svar
          </h3>
          {historik.map((fs, index) => (
            <Card key={index} className="p-4 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700">
              <div className="space-y-3">
                {/* Fråga */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 dark:text-stone-400 mb-1">Fråga</p>
                    <p className="text-slate-800 dark:text-stone-200">{fs.fraga}</p>
                  </div>
                </div>

                {/* Svar */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 dark:text-stone-400 mb-1">Ditt svar</p>
                    <p className="text-slate-800 dark:text-stone-200">{fs.svar}</p>
                  </div>
                </div>

                {/* Rating och feedback */}
                <div className="bg-white dark:bg-stone-700 p-3 rounded border border-stone-200 dark:border-stone-600">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-700 dark:text-stone-300">
                      {fs.rating ? 'AI-betyg (klicka för att justera):' : 'Betygsätt detta svar:'}
                    </p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(index, star)}
                          className={`text-lg ${star <= (fs.rating || 0) ? 'text-yellow-400' : 'text-slate-300 dark:text-stone-500'} cursor-pointer hover:scale-110 transition-transform`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Expanderbar feedback */}
                  <button
                    onClick={() => setExpandedFeedback(expandedFeedback === index ? null : index)}
                    className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition"
                  >
                    {expandedFeedback === index ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Dölj feedback
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Visa feedback och tips
                      </>
                    )}
                  </button>

                  {expandedFeedback === index && (
                    <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-600 space-y-2">
                      {fs.feedback && (
                        <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded text-sm text-teal-800 dark:text-teal-300">
                          <strong>AI-feedback:</strong> {fs.feedback}
                        </div>
                      )}
                      <div className="bg-sky-50 dark:bg-sky-900/20 p-2 rounded text-sm text-sky-800 dark:text-sky-300">
                        <strong>Tips:</strong> Försök strukturera dina svar med STAR-metoden (Situation, Task, Action, Result).
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Nuvarande fråga */}
      <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-500 dark:bg-teal-600 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Fråga {antalFragor + 1}
            </p>
            <p className="text-lg text-slate-800 dark:text-stone-100">{nuvarandeFraga}</p>
          </div>
        </div>
      </Card>

      {/* Timer & Answer Input */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="space-y-4">
          {/* Timer */}
          <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-700 rounded-lg border border-stone-200 dark:border-stone-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600 dark:text-stone-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-stone-300">Tid för svar:</span>
            </div>
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{timerSeconds}s</span>
          </div>

          {/* Answer Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-stone-300">Ditt svar</label>
              {speechSupported && (
                <button
                  onClick={toggleRecording}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isRecording
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse'
                      : 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      Stoppa inspelning
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      Spela in svar
                    </>
                  )}
                </button>
              )}
            </div>
            <textarea
              value={anvandarSvar}
              onChange={(e) => setAnvandarSvar(e.target.value)}
              placeholder={isRecording ? "Tala nu... ditt svar visas här" : "Skriv ditt svar här eller använd mikrofonen..."}
              rows={5}
              className={`w-full px-4 py-3 rounded-lg border focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-900 outline-none resize-y bg-white dark:bg-stone-700 text-slate-900 dark:text-stone-100 ${
                isRecording ? 'border-red-300 dark:border-red-700' : 'border-stone-200 dark:border-stone-600'
              }`}
            />
            <div className="flex justify-between items-center text-xs text-slate-700 dark:text-stone-400">
              <span>{anvandarSvar.length} tecken</span>
              <span>Rekommenderat: 100-300 tecken</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={svara}
              disabled={!anvandarSvar.trim() || isLoading}
              className="flex-1 bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Nästa fråga</>}
            </Button>
            <Button variant="outline" onClick={downloadSessionSummary} size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Example Answer */}
      {exampleAnswers[nuvarandeFraga] && (
        <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-300 mb-2">Exempel på bra svar:</p>
              <p className="text-sm text-emerald-800 dark:text-emerald-300 italic">"{exampleAnswers[nuvarandeFraga]}"</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
