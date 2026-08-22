import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, User, Bot, RefreshCw, Lightbulb, Star, Clock, ChevronDown, ChevronUp, Zap, Download, ListTodo, TrendingUp, Mic, MicOff, Pause, Play, HelpCircle, Circle, Save, CheckCircle2, AlertTriangle, History } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageLayout } from '@/components/layout/PageLayout'
import { useAchievementTracker } from '@/hooks/useAchievementTracker'
import { callAI } from '@/services/aiApi'
import { AIGeneratedWatermark } from '@/components/ai/AIBadge'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'
import { FocusInterviewWizard } from '@/components/focus/pages/FocusInterviewWizard'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  saveSimulatorSession,
  getSimulatorSessions,
  sparaSimulatorUtkast,
  lasSimulatorUtkast,
  rensaSimulatorUtkast,
  type SimulatorSession,
} from '@/services/interviewService'
import { IntervjuSimulatorResultSchema, safeParseAiResponse, type IntervjuResult } from '@/services/aiSchemas'
import { RadgivarTips } from '@/components/radgivare/RadgivarPanel'
import { Link } from 'react-router-dom'
import { useArticles } from '@/hooks/knowledge-base/useArticles'

interface FragaSvar {
  fraga: string
  svar: string
  rating?: number
  /**
   * Varifrån betyget kommer. B12 (2026-08-05): tidigare gick det inte att
   * skilja AI:ns betyg från deltagarens eget — historiken bar bara en siffra,
   * och gränssnittet kallade varje siffra "AI-betyg". Nu märks källan, och
   * saknas den finns inget betyg alls.
   */
  ratingSource?: 'ai' | 'user'
  feedback?: string
}

/**
 * AI:n instrueras (client/api/ai.js, 'intervju-simulator') att svara med
 * {"rating":1-5,...}. Allt utanför det intervallet — eller något som inte är
 * ett tal — är inget betyg, och då sätts inget betyg.
 */
function parseAiRating(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  const rounded = Math.round(value)
  if (rounded < 1 || rounded > 5) return undefined
  return rounded
}

/**
 * Svar som faktiskt har ett betyg — underlaget för varje snitt vi visar.
 *
 * Inte exporterad: react-refresh/only-export-components tillåter bara
 * komponentexporter ur den här filen. Beteendet täcks av
 * InterviewSimulator.rating.test.tsx via renderad komponent i stället.
 */
function betygsattaSvar(historik: FragaSvar[]): FragaSvar[] {
  return historik.filter(h => typeof h.rating === 'number' && h.rating > 0)
}

/**
 * Snittbetyg räknat på de svar som *har* ett betyg, eller null.
 *
 * B12 (2026-08-05): tidigare `historik.reduce((s, h) => s + (h.rating || 0), 0)
 * / historik.length` — obetygsatta svar räknades som nollor och drog ned
 * snittet. Ett femstjärnigt svar bland tre obedömda visades som "1.3/5".
 * Null betyder "inget att visa", inte "noll".
 */
function beraknaSnittbetyg(historik: FragaSvar[]): string | null {
  const rated = betygsattaSvar(historik)
  if (rated.length === 0) return null
  return (rated.reduce((sum, h) => sum + (h.rating as number), 0) / rated.length).toFixed(1)
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
  /*
   * Timern räknar, den dömer inte.
   *
   * Färgen gick grön → gul → orange → röd på 90 sekunder — utan att det
   * fanns någon tidsgräns, och utan ett ord om vad rött betyder. För en
   * målgrupp som ofta varit utan jobb länge är det en stressignal utan syfte:
   * den som behöver längre tid får veta att hon är sen till något som inte
   * finns. Gult läge mätte dessutom 2,84:1 mot vitt.
   */
  const getTimerColor = () => 'text-stone-800 dark:text-stone-100'
  const getTimerBgColor = () =>
    'bg-stone-50 dark:bg-stone-700/50 border-stone-200 dark:border-stone-600'

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${getTimerBgColor()}`}
      role="timer"
      aria-live="off"
      aria-label={t('interviewSimulator.timer.ariaLabel', { seconds })}
    >
      <div className="flex items-center gap-2">
        <Clock className={`w-4 h-4 ${getTimerColor()}`} aria-hidden="true" />
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('interviewSimulator.timer.timeForAnswer')}</span>
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
            <Pause className="w-4 h-4 text-stone-600 dark:text-stone-400" />
          ) : (
            <Play className="w-4 h-4 text-stone-600 dark:text-stone-400" />
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

/**
 * Ett läsbart besked ur ett AI-fel.
 *
 * `aiApi.ts` producerar redan fyra skilda och begripliga svenska meddelanden
 * — utloggad, för många anrop, AI avstängd i inställningarna, och modellen
 * svarade inte i tid. Fram till 2026-08-19 fångades de av tre nakna
 * `catch {}` här, så inget av dem nådde skärmen.
 */
function aiFelText(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim()
  return 'Vi fick inget svar från AI:n just nu. Din övning fortsätter — svaren sparas som vanligt.'
}

/**
 * En fråga ur reservlistan när AI:n inte svarar.
 *
 * Följer deltagarens valda kategori om hon valt en. Tidigare togs frågan alltid
 * ur `questionCategories.flatMap(...)`, och HÄMTADES INNAN `antalFragor` ökades
 * — så två AI-fel i rad gav samma fråga en gång till.
 */
function reservfraga(index: number, kategori?: string): string {
  const valda = kategori
    ? questionCategories.find((c) => c.name === kategori)?.questions ?? []
    : []
  const alla = valda.length ? valda : questionCategories.flatMap((c) => c.questions)
  return alla[index % alla.length] || 'Berätta om dig själv'
}

/**
 * Exempel som visar STRUKTUR, inte innehåll.
 *
 * Här låg två exempelsvar skrivna för en webbutvecklare — "driven utvecklare
 * med 5 års erfarenhet", "specialiserad på React och backend-teknologier".
 * De visades under rubriken "Exempel på bra svar" för ALLA, oavsett roll.
 * Uppmätt i prod 2026-08-19: en blivande vaktmästare fick React-svaret.
 *
 * För portalens målgrupp — arbetssökande som ofta varit utan jobb länge — är
 * det särskilt illa. Exemplet blir ett facit man inte kan leva upp till,
 * och det handlar om ett yrke man inte söker.
 *
 * De nya exemplen nämner inget yrke och ingen siffra. De visar hur ett svar
 * kan byggas: konkret situation, vad du gjorde, vad det ledde till.
 */
const exampleAnswers: Record<string, string> = {
  'Berätta om dig själv och din bakgrund':
    'Börja med var du står i dag, ta sedan en eller två saker du gjort som hör ihop med jobbet du söker, och avsluta med varför du söker just nu. Tre meningar räcker — den som lyssnar vill ha en tråd att dra i, inte hela din historia.',
  'Varför är du intresserad av denna position?':
    'Peka på något konkret i annonsen som fick dig att reagera, och koppla det till något du själv vill eller kan: "Ni skriver att ni jobbar i team — det är så jag trivs bäst, och det märktes när jag …". Beröm om företaget säger ingenting om dig, så lägg tiden på kopplingen i stället.',
}

/**
 * Fokuslägesväxeln raderade en pågående intervju.
 *
 * Hela tillståndet — frågor, svar, betyg, AI-feedback — bor i
 * `InterviewSimulatorInner`. Fram till 2026-08-19 låg `if (isFocusMode)` i
 * den YTTRE komponenten, så när flaggan slog om byttes `Inner` ut mot
 * `FocusInterviewWizard`, avmonterades, och allt försvann. Utan bekräftelse,
 * utan sparning.
 *
 * Växeln sitter dessutom på två ställen som båda syns på just den här sidan:
 * toppnavens alltid synliga knapp (`TopBar.tsx`) och "Lugnare läge"-panelen
 * (`LugnarePanel.tsx`, monterad på rutten via `radgivarRutter.ts`). Det är en
 * TILLGÄNGLIGHETSFUNKTION — den finns för den som behöver lugn — och den
 * orsakade portalens dyraste dataförlust.
 *
 * Fixen är att flytta grenen INUTI `Inner`. Komponenten förblir monterad,
 * `useState` behåller sitt innehåll, och att växla fram och tillbaka lämnar
 * övningen orörd.
 */
export default function InterviewSimulator() {
  return <InterviewSimulatorInner />
}

/**
 * Tidigare övningar — läsaren som gjorde löftet sant.
 *
 * Betygets källa skrivs ut, aldrig bara siffran: `ratingSource` skiljer AI:ns
 * bedömning från deltagarens eget betyg (B12). Saknas källan står inget betyg
 * — inte en nolla.
 */
function TidigareOvningar({ sessioner }: { sessioner: SimulatorSession[] }) {
  const { t } = useTranslation()
  const [oppen, setOppen] = useState<string | null>(null)

  return (
    <section className="space-y-3" aria-labelledby="tidigare-ovningar">
      <h2
        id="tidigare-ovningar"
        className="font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2"
      >
        <History className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-solid)]" aria-hidden="true" />
        {t('interviewSimulator.history.title', 'Dina tidigare övningar')}
      </h2>
      {sessioner.slice(0, 5).map((session) => {
        const arOppen = oppen === session.id
        const betygsatta = session.historik.filter(
          (q) => typeof q.rating === 'number' && q.rating > 0
        )
        return (
          <Card
            key={session.id}
            className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 shadow-sm overflow-hidden"
          >
            <button
              onClick={() => setOppen(arOppen ? null : session.id)}
              aria-expanded={arOppen}
              aria-controls={`ovning-${session.id}`}
              className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-stone-50 dark:hover:bg-stone-700/40 transition-colors"
            >
              <span className="min-w-0">
                <span className="block font-medium text-stone-800 dark:text-stone-100 truncate">
                  {session.roll}
                  {session.foretag ? ` — ${session.foretag}` : ''}
                </span>
                <span className="block text-sm text-stone-600 dark:text-stone-400">
                  {new Date(session.endedAt).toLocaleDateString('sv-SE')}
                  {' · '}
                  {t('interviewSimulator.history.answers', {
                    defaultValue: '{{count}} besvarade frågor',
                    count: session.historik.length,
                  })}
                </span>
              </span>
              {arOppen ? (
                <ChevronUp className="w-5 h-5 text-stone-500 dark:text-stone-400 flex-shrink-0" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-5 h-5 text-stone-500 dark:text-stone-400 flex-shrink-0" aria-hidden="true" />
              )}
            </button>

            {arOppen && (
              <div
                id={`ovning-${session.id}`}
                className="px-4 pb-4 space-y-4 border-t border-stone-200 dark:border-stone-700 pt-4"
              >
                {/* Ett snitt över noll bedömningar finns inte — då står det så. */}
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  {betygsatta.length > 0
                    ? t('interviewSimulator.session.ratedCount', {
                        defaultValue: 'Baserat på {{count}} betygsatta svar',
                        count: betygsatta.length,
                      })
                    : t('interviewSimulator.session.noRatingsYet', 'Inget svar är betygsatt än')}
                </p>
                {session.historik.map((qa, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-solid)]">
                      {qa.fraga}
                    </p>
                    <p className="text-sm text-stone-800 dark:text-stone-200 whitespace-pre-wrap">
                      {qa.svar}
                    </p>
                    {typeof qa.rating === 'number' && qa.rating > 0 && (
                      <p className="text-xs text-stone-600 dark:text-stone-400">
                        {qa.ratingSource === 'ai'
                          ? t('interviewSimulator.history.aiRating', {
                              defaultValue: 'AI:s bedömning: {{rating}} av 5',
                              rating: qa.rating,
                            })
                          : t('interviewSimulator.history.ownRating', {
                              defaultValue: 'Ditt eget betyg: {{rating}} av 5',
                              rating: qa.rating,
                            })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )
      })}
    </section>
  )
}

function InterviewSimulatorInner() {
  const { t } = useTranslation()
  const { isFocusMode, leaveWizard } = useFocusMode()
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
  const [visarSammanfattning, setVisarSammanfattning] = useState(false)
  // G11: AI-helhetsbedömning av hela sessionen. `null` = inte hämtad/ej möjlig.
  const [aiSammanfattning, setAiSammanfattning] = useState<IntervjuResult | null>(null)
  const [sammanfattningLoading, setSammanfattningLoading] = useState(false)
  const [sammanfattningFel, setSammanfattningFel] = useState<string | null>(null)
  /**
   * Vad som gick fel senast vi bad AI:n om något. `null` = inget fel.
   *
   * Fram till 2026-08-19 fanns tre nakna `catch {}` här. `aiApi.ts` skiljer
   * på fyra fall — utloggad, för många anrop, AI avstängd i inställningarna,
   * och modellen svarade inte — och inget av dem nådde skärmen. Har man stängt
   * av AI (art. 21) fick man en full "intervju" av reservfrågor utan att
   * någonsin få veta varför den kändes generisk.
   */
  const [aiFel, setAiFel] = useState<string | null>(null)
  /**
   * Kommer frågan på skärmen från AI:n eller ur den hårdkodade reservlistan?
   * Skillnaden gick inte att se: reservfrågan renderades i samma kort, med
   * samma rubrik "Fråga 1", som om en rekryterare ställt den.
   */
  const [fragaKalla, setFragaKalla] = useState<'ai' | 'reserv'>('ai')
  /** Mikrofonfel — `onerror` tog inte ens emot event-objektet tidigare. */
  const [talFel, setTalFel] = useState<string | null>(null)
  /** Tidigare övningar, för löftet i sammanfattningen. Se `TidigareOvningar`. */
  const [tidigareOvningar, setTidigareOvningar] = useState<SimulatorSession[]>([])
  const { trackInterviewCompleted } = useAchievementTracker()
  const { confirm } = useConfirmDialog()

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
  } = useAudioRecorder()

  // Ref for speech recognition cleanup
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  /**
   * Texten som redan stod i rutan när inspelningen startade.
   *
   * `onresult` summerade hela `event.results` och skrev resultatet rakt över
   * `anvandarSvar`. Två följder: det man skrivit för hand raderades när man
   * tryckte på mikrofonen, och eftersom igenkänningen aldrig stoppades vid
   * "Nästa fråga" fortsatte `event.results` att växa — så talet från fråga 1
   * kröp in i svaret på fråga 2.
   */
  const talBasRef = useRef('')
  /** Textrutan, för att kunna lämna tillbaka fokus efter ett svar. */
  const svarRef = useRef<HTMLTextAreaElement | null>(null)

  // Läs in tidigare övningar en gång. localStorage är källan (se
  // interviewService); molnspegeln finns för Översiktens nyckeltal.
  useEffect(() => {
    setTidigareOvningar(getSimulatorSessions())
  }, [])

  /**
   * Återuppta en avbruten övning.
   *
   * Mätt i prod: ett klick i toppnaven mitt i en intervju raderade allt utan
   * en fråga, och bakåtknappen gav ett tomt formulär. Nu ligger övningen kvar
   * och deltagaren får välja — fortsätta eller börja om. Ingen spärrdialog:
   * den hindrar en från att gå men räddar ingenting.
   */
  const [utkast, setUtkast] = useState<ReturnType<typeof lasSimulatorUtkast>>(null)
  useEffect(() => {
    setUtkast(lasSimulatorUtkast())
  }, [])

  const aterupptaUtkast = useCallback(() => {
    if (!utkast) return
    setRoll(utkast.roll)
    setForetag(utkast.foretag)
    setSelectedCategory(utkast.kategori)
    setHistorik(utkast.historik)
    setNuvarandeFraga(utkast.nuvarandeFraga)
    setAnvandarSvar(utkast.anvandarSvar)
    setAntalFragor(utkast.antalFragor)
    setHarStartat(true)
    setIsTimerRunning(true)
    setTimerSeconds(0)
    setUtkast(null)
  }, [utkast])

  const forkastaUtkast = useCallback(() => {
    rensaSimulatorUtkast()
    setUtkast(null)
  }, [])

  // Skriv utkastet vid varje ändring som är värd att rädda.
  useEffect(() => {
    if (!harStartat) return
    if (historik.length === 0 && !anvandarSvar.trim()) return
    sparaSimulatorUtkast({
      roll,
      foretag,
      kategori: selectedCategory,
      historik,
      nuvarandeFraga,
      anvandarSvar,
      antalFragor,
    })
  }, [harStartat, roll, foretag, selectedCategory, historik, nuvarandeFraga, anvandarSvar, antalFragor])

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

  // Sista utvägen för ljudinspelningen: lämnar man sidan mitt i en övning ska
  // mikrofonen släppas. Utan det står inspelningsindikatorn kvar i webbläsaren
  // efter att man navigerat vidare.
  useEffect(() => {
    return () => { void stopAudioRecording() }
  }, [stopAudioRecording])

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

  // Varna vid sidladdning/stängning mitt i en intervju så man inte tappar
  // svar man redan lagt ner möda på (UX3 — tidigare försvann allt tyst).
  useEffect(() => {
    if (!harStartat) return
    const harOsparatFramsteg = historik.length > 0 || anvandarSvar.trim().length > 0
    if (!harOsparatFramsteg) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [harStartat, historik.length, anvandarSvar])

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
      // Lägg till efter det som redan stod där i stället för att ersätta det.
      const bas = talBasRef.current
      setAnvandarSvar(bas ? `${bas.replace(/\s+$/, '')} ${transcript}` : transcript)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsRecording(false)
      recognitionRef.current = null
      // Nekad mikrofon var helt tyst förut — knappen slog bara om tillbaka och
      // ingenting hände. Den som inte förstår varför slutar försöka.
      const felkod = event?.error
      setTalFel(
        felkod === 'not-allowed' || felkod === 'service-not-allowed'
          ? t('interviewSimulator.input.micDenied', 'Webbläsaren släppte inte fram mikrofonen. Du kan tillåta den i adressfältet — eller skriva ditt svar i rutan nedan, det fungerar lika bra.')
          : felkod === 'no-speech'
            ? t('interviewSimulator.input.micNoSpeech', 'Vi hörde inget. Prova igen, eller skriv svaret i rutan.')
            : t('interviewSimulator.input.micFailed', 'Mikrofonen slutade fungera. Du kan skriva ditt svar i rutan nedan i stället.')
      )
    }

    recognition.onend = () => {
      setIsRecording(false)
      recognitionRef.current = null
    }

    talBasRef.current = anvandarSvar
    setTalFel(null)
    recognition.start()
    setIsRecording(true)
    recognitionRef.current = recognition
  }, [isRecording, anvandarSvar, t])

  /** Stoppar tal-till-text om den är igång. Anropas när frågan byts. */
  const stoppaTal = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsRecording(false)
    talBasRef.current = ''
  }, [])

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
      const svar = (data as { svar?: string }).svar?.trim()
      // Ett tomt AI-svar maskerades av `|| 'Börja med…'`, vilket fick en
      // hårdkodad mening att se ut som AI:ns tips.
      setSupportPhrase(svar || null)
      if (!svar) setAiFel(t('interviewSimulator.errors.noStartPhrase', 'AI:n hade ingen startfras just nu. Börja gärna med en konkret situation du varit med om.'))
    } catch (error) {
      setSupportPhrase(null)
      setAiFel(aiFelText(error))
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

    setAiFel(null)
    setTalFel(null)

    try {
      // `kategori` skickas nu vidare. Menyn var död: `selectedCategory`
      // sattes, nollställdes — och lästes aldrig. Den lovade "Tekniska frågor"
      // och gjorde ingenting.
      const data = await callAI<{ resultat: string }>('intervju-simulator', {
        roll,
        foretag,
        kategori: selectedCategory || undefined,
        tidigareFragor: [],
      })
      const fraga = (data as { resultat?: string }).resultat?.trim()
      if (fraga) {
        setNuvarandeFraga(fraga)
        setFragaKalla('ai')
      } else {
        setNuvarandeFraga(reservfraga(0, selectedCategory))
        setFragaKalla('reserv')
        setAiFel(t('interviewSimulator.errors.emptyQuestion', 'AI:n svarade inte den här gången. Du kan öva på en vanlig intervjufråga så länge.'))
      }
    } catch (error) {
      setNuvarandeFraga(reservfraga(0, selectedCategory))
      setFragaKalla('reserv')
      setAiFel(aiFelText(error))
    } finally {
      setIsLoading(false)
      setIsTimerRunning(true)
    }
  }, [roll, foretag, selectedCategory, t])

  const svara = useCallback(async () => {
    if (!anvandarSvar.trim() || isLoading) return

    setIsLoading(true)
    setIsTimerRunning(false)
    setSupportPhrase(null)
    setAiFel(null)
    // Stoppa tal-till-text innan frågan byts. Utan det fortsatte
    // `event.results` att växa och talet från förra frågan kröp in i nästa.
    stoppaTal()
    // Inget betyg innan någon faktiskt satt ett — varken AI eller deltagare.
    const nyFragaSvar: FragaSvar = {
      fraga: nuvarandeFraga,
      svar: anvandarSvar
    }

    try {
      const data = await callAI<{ resultat: { rating: number; feedback: string; nastaFraga: string } | string }>('intervju-simulator', {
        roll,
        foretag,
        anvandarSvar,
        kategori: selectedCategory || undefined,
        tidigareFragor: [...historik, nyFragaSvar]
      })

      const resultat = (data as { resultat?: { rating: number; feedback: string; nastaFraga: string } | string }).resultat

      if (resultat && typeof resultat === 'object') {
        // AI returnerade JSON med betyg och feedback.
        //
        // B12 (2026-08-05): här stod `rating: resultat.rating || 3` och
        // `feedback: resultat.feedback || 'Bra svar!'`. Saknade AI:n betyg fick
        // deltagaren en trea — märkt "AI-betyg" i historiken och inräknad i
        // snittbetyget — och ett beröm som ingen bedömning låg bakom.
        // Nu: finns inget betyg sätts inget betyg, och deltagaren får i stället
        // stjärnraden att sätta sitt eget. Saknas feedback visas ingen feedback.
        const aiRating = parseAiRating(resultat.rating)
        const aiFeedback = typeof resultat.feedback === 'string' && resultat.feedback.trim()
          ? resultat.feedback.trim()
          : undefined

        // Funktionell form. Stjärnorna är klickbara medan AI:n tänker, och
        // ett anrop kan ta upp till 60 s — `[...historik, …]` skrev då över
        // listan med en kopia från innan betyget sattes, så betyget försvann
        // i samma ögonblick som svaret kom tillbaka.
        setHistorik(prev => [...prev, {
          ...nyFragaSvar,
          rating: aiRating,
          ratingSource: aiRating !== undefined ? 'ai' : undefined,
          feedback: aiFeedback
        }])
        const nasta = typeof resultat.nastaFraga === 'string' ? resultat.nastaFraga.trim() : ''
        if (nasta) {
          setNuvarandeFraga(nasta)
          setFragaKalla('ai')
        } else {
          setNuvarandeFraga(reservfraga(antalFragor + 1, selectedCategory))
          setFragaKalla('reserv')
        }
      } else {
        // AI:n returnerade bara en sträng — varken betyg eller feedback finns.
        setHistorik(prev => [...prev, nyFragaSvar])
        const rå = typeof resultat === 'string' ? resultat.trim() : ''
        if (rå) {
          setNuvarandeFraga(rå)
          setFragaKalla('ai')
        } else {
          setNuvarandeFraga(reservfraga(antalFragor + 1, selectedCategory))
          setFragaKalla('reserv')
        }
      }

      setAnvandarSvar('')
      setAntalFragor(prev => prev + 1)
      setTimerSeconds(0)
      setIsTimerRunning(true)
    } catch (error) {
      // Svaret är kvar och räknas — men deltagaren får veta att bedömningen
      // uteblev. Förut såg "AI:n svarade inte" exakt likadant ut som
      // "AI:n valde att inte betygsätta", och båda som ett tomt betygsfält.
      setHistorik(prev => [...prev, nyFragaSvar])
      // +1 eftersom frågan som kommer är nästa i ordningen — förut användes
      // `antalFragor` innan det ökades, så samma fråga kom igen.
      setNuvarandeFraga(reservfraga(antalFragor + 1, selectedCategory))
      setFragaKalla('reserv')
      setAiFel(aiFelText(error))
      setAnvandarSvar('')
      setAntalFragor(prev => prev + 1)
      setTimerSeconds(0)
      setIsTimerRunning(true)
    } finally {
      setIsLoading(false)
      // Skicka-knappen är `disabled` medan anropet pågår, och en disabled knapp
      // med fokus dumpar fokus till <body>. Den som navigerar med tangentbord
      // eller skärmläsare tappade sin plats efter varje svar.
      requestAnimationFrame(() => svarRef.current?.focus())
    }
  }, [anvandarSvar, isLoading, nuvarandeFraga, roll, foretag, historik, antalFragor, selectedCategory, stoppaTal])

  const handleSetRating = useCallback((index: number, rating: number) => {
    setHistorik(prev => {
      const updated = [...prev]
      // Sätter deltagaren om betyget är det deltagarens, inte AI:ns.
      updated[index] = { ...updated[index], rating, ratingSource: 'user' }
      return updated
    })
  }, [])

  const avslutaIntervju = useCallback(() => {
    stoppaTal()
    // Ljudinspelningen stoppades ALDRIG vid avslut. Kontrollerna renderas bara
    // i intervjuvyn, så på sammanfattningsskärmen låg mikrofonen kvar och
    // spelade in utan någon knapp att stänga av den med. `stopRecording` är
    // idempotent nog att anropas när inget spelas in.
    void stopAudioRecording()

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
    setVisarSammanfattning(false)
    setAiSammanfattning(null)
    setSammanfattningFel(null)
    setAiFel(null)
    setTalFel(null)
    setFragaKalla('ai')
    // Övningen är avslutad och sparad — utkastet ska inte erbjudas igen.
    rensaSimulatorUtkast()
    setUtkast(null)
    // Listan över tidigare övningar ska visa den vi just avslutade.
    setTidigareOvningar(getSimulatorSessions())
  }, [antalFragor, trackInterviewCompleted, stoppaTal, stopAudioRecording])

  // G11: hämta AI:ns helhetsbedömning av sessionen. Vid fel visas ett ärligt
  // meddelande — sammanfattningsskärmens egna siffror (antal svar, snittbetyg)
  // står kvar och är oberoende av AI:n.
  const hamtaAiSammanfattning = useCallback(async (session: FragaSvar[]) => {
    setSammanfattningLoading(true)
    setSammanfattningFel(null)
    try {
      // Prompten i client/api/ai.js kallar `rating` för "Deltagarens eget
      // betyg". Skicka därför bara betyg som deltagaren faktiskt satt — AI:ns
      // egna betyg får den inte tillbaka som om det vore deltagarens.
      const response = await callAI<unknown>('intervju-sammanfattning', {
        roll,
        foretag,
        historik: session.map(h => ({
          fraga: h.fraga,
          svar: h.svar,
          rating: h.ratingSource === 'user' ? h.rating : undefined,
        })),
      })
      const parsed = safeParseAiResponse(
        IntervjuSimulatorResultSchema,
        (response as { sammanfattning?: unknown }).sammanfattning
      )
      // Alla fält i IntervjuSimulatorResultSchema är `.optional()`, så ett tomt
      // `{}` är ett GILTIGT svar. Renderat blev det rubriken "Helhetsbedömning"
      // följd av vattenstämpeln "genererat med AI-stöd" — och ingenting
      // däremellan. Ett efterlevnadspåstående om text som inte finns; exakt
      // brevsidans fel (B21).
      const harInnehall = Boolean(
        parsed.data &&
        (parsed.data.summary?.trim() ||
          parsed.data.strengths?.length ||
          parsed.data.improvements?.length)
      )
      if (!parsed.success || !parsed.data || !harInnehall) {
        setSammanfattningFel(t('interviewSimulator.summary.aiFailed', 'Vi kunde inte skapa en helhetsbedömning just nu. Dina svar och betyg finns kvar nedan.'))
        return
      }
      setAiSammanfattning(parsed.data)
    } catch {
      setSammanfattningFel(t('interviewSimulator.summary.aiFailed', 'Vi kunde inte skapa en helhetsbedömning just nu. Dina svar och betyg finns kvar nedan.'))
    } finally {
      setSammanfattningLoading(false)
    }
  }, [roll, foretag, t])

  // Bekräfta innan avslut om något skulle gå förlorat, spara sessionen
  // (svar + betyg + AI-feedback) och visa en sammanfattning innan man lämnar
  // — istället för att tyst nollställa allt (UX3-fixet).
  const handleAvslutaKlick = useCallback(async () => {
    const harNagotAttForlora = historik.length > 0 || anvandarSvar.trim().length > 0

    if (harNagotAttForlora) {
      const confirmed = await confirm({
        title: t('interviewSimulator.session.endConfirmTitle', 'Vill du avsluta intervjun?'),
        message: t('interviewSimulator.session.endConfirmMessage', 'Din övning sparas så du kan se den igen. Ett obesparat svar i textrutan går förlorat om du avslutar nu.'),
        confirmText: t('interviewSimulator.session.endConfirmCta', 'Ja, avsluta'),
        cancelText: t('common.cancel'),
        variant: 'warning',
      })
      if (!confirmed) return
    }

    if (historik.length > 0) {
      // Snittet räknas bara på betygsatta svar. 0 sparas när inget svar har
      // betyg — fältet läses inte av något gränssnitt i dag, och ett snitt
      // över noll bedömningar finns inte.
      const snitt = beraknaSnittbetyg(historik)
      saveSimulatorSession({
        roll,
        foretag,
        historik,
        antalFragor,
        avgRating: snitt !== null ? Number(snitt) : 0,
      })
      setTidigareOvningar(getSimulatorSessions())
      setVisarSammanfattning(true)
      void hamtaAiSammanfattning(historik)
    } else {
      avslutaIntervju()
    }
  }, [historik, anvandarSvar, confirm, t, roll, foretag, antalFragor, avslutaIntervju, hamtaAiSammanfattning])

  const downloadSessionSummary = useCallback(() => {
    // B12: texten skrev tidigare ut ett snitt över alla svar (obetygsatta som
    // nollor) och "BETYG: 0 / 5" för svar som ingen bedömt. Nu står det bara
    // ett betyg där det finns ett, och källan anges.
    //
    // 2026-08-19: hela filen var dessutom HÅRDKODAD SVENSKA trots att båda
    // språkfilerna har 17 färdiga `download.*`-nycklar. En engelsk deltagare
    // fick svensk text i sin nedladdning. Etiketten "Praktisera högljudd"
    // (tip2) är inte svenska heller — den är omskriven i sv.json.
    const snitt = beraknaSnittbetyg(historik)
    const antalBetygsatta = betygsattaSvar(historik).length
    const snittRad = snitt !== null
      ? `- ${t('interviewSimulator.download.averageClassification')}: ${snitt} / 5 (${t('interviewSimulator.session.ratedCount', { count: antalBetygsatta, defaultValue: 'Baserat på {{count}} betygsatta svar' })})`
      : `- ${t('interviewSimulator.download.averageClassification')}: ${t('interviewSimulator.session.noRatingsYet', 'Inget svar är betygsatt än')}`
    const summary = `${t('interviewSimulator.download.title')}
${t('interviewSimulator.download.date')}: ${new Date().toLocaleDateString()}
${t('interviewSimulator.download.role')}: ${roll}
${t('interviewSimulator.download.company')}: ${foretag || t('interviewSimulator.download.notSpecified')}

${t('interviewSimulator.download.sessionOverview')}:
- ${t('interviewSimulator.download.totalQuestions')}: ${antalFragor}
${snittRad}

${t('interviewSimulator.download.questionsAndAnswers')}:
${historik.map((h, idx) => `
${idx + 1}. ${t('interviewSimulator.download.questionLabel')}: ${h.fraga}
   ${t('interviewSimulator.download.answerLabel')}: ${h.svar}${typeof h.rating === 'number' && h.rating > 0
     ? `
   ${t('interviewSimulator.download.ratingLabel')}: ${h.rating} / 5 (${h.ratingSource === 'ai'
         ? t('interviewSimulator.download.ratingByAi', 'AI:s bedömning')
         : t('interviewSimulator.download.ratingByYou', 'ditt eget betyg')})`
     : `
   ${t('interviewSimulator.download.ratingLabel')}: ${t('interviewSimulator.download.ratingNotSet', 'inte satt')}`}
`).join('')}

${t('interviewSimulator.download.tipsForImprovement')}:
- ${t('interviewSimulator.download.tip1')}
- ${t('interviewSimulator.download.tip2')}
- ${t('interviewSimulator.download.tip3')}`

    // G11: lägg AI:ns helhetsbedömning sist när den finns. Märkt som
    // AI-genererad även i textfilen (AI Act art. 50).
    //
    // Raderna byggs som en lista i stället för en enda mastodonttemplate:
    // den gamla varianten var en rad på 600 tecken med fem nästlade
    // ternärer, och det gick inte att se vad den producerade.
    const aiRader: string[] = []
    if (aiSammanfattning) {
      aiRader.push('', t('interviewSimulator.download.aiSection', 'HELHETSBEDÖMNING (AI-genererad)'))
      if (aiSammanfattning.summary) aiRader.push(aiSammanfattning.summary)
      if (aiSammanfattning.strengths?.length) {
        aiRader.push('', `${t('interviewSimulator.summary.aiStrengths')}:`)
        aiRader.push(...aiSammanfattning.strengths.map((x) => `- ${x}`))
      }
      if (aiSammanfattning.improvements?.length) {
        aiRader.push('', `${t('interviewSimulator.summary.aiImprovements')}:`)
        aiRader.push(...aiSammanfattning.improvements.map((x) => `- ${x}`))
      }
    }
    const aiDel = aiRader.length ? aiRader.join(String.fromCharCode(10)) : ''

    const blob = new Blob([summary + aiDel], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `intervju-session-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    window.URL.revokeObjectURL(url) // Clean up blob URL
  }, [roll, foretag, antalFragor, historik, aiSammanfattning, t])

  // Snittbetyg och underlag — se beraknaSnittbetyg() överst i filen.
  const avgRating = useMemo(() => beraknaSnittbetyg(historik), [historik])
  const ratedCount = useMemo(() => betygsattaSvar(historik).length, [historik])

  /**
   * Vidare lasning — riktiga artiklar, inte pahittade.
   *
   * Har lag tre hardkodade "artiklar" med pahittade titlar, pahittade lastider
   * ("5 min") och `url: '#'`. Uppmatt i prod: ett klick kastade ut deltagaren
   * till `/#/oversikt` mitt i intervjun. Bredvid dem tre "ovningskort" med
   * `cursor-pointer` och ingen `onClick` alls.
   *
   * Kunskapsbanken har tio riktiga artiklar om intervjuer i prod. Nu visas de.
   */
  const { data: allaArtiklar } = useArticles()
  const intervjuArtiklar = useMemo(() => {
    const lista = (allaArtiklar ?? []) as Array<{ id: string; title: string; readingTime?: number }>
    return lista.filter((a) => /intervju/i.test(a.title ?? '')).slice(0, 4)
  }, [allaArtiklar])

  // Efter alla hooks — se kommentaren vid InterviewSimulator ovan. Grenen
  // ligger här i stället för i den yttre komponenten just för att `Inner`
  // ska förbli monterad och behålla en pågående övning.
  if (isFocusMode) {
    return (
      <PageFocusShell
        title={t('interviewSimulator.title', 'Intervjusimulator')}
        icon={Mic}
        domain="activity"
      >
        <FocusInterviewWizard onExit={leaveWizard} />
      </PageFocusShell>
    )
  }

  if (!harStartat) {
    return (
      <PageLayout
        title={t('interviewSimulator.title')}
        subtitle={t('interviewSimulator.description')}
        domain="activity"
        showTabs={false}
        className="sidbredd"
        contentClassName="space-y-6"
      >
        {/* Avbruten övning — se kommentaren vid utkastlagret. */}
        {utkast && (
          <Card className="p-5 bg-[var(--c-bg)] border-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/20 dark:border-[var(--c-accent)]/50 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <h2 className="font-semibold text-[var(--c-text)] dark:text-[var(--c-text)]">
                  {t('interviewSimulator.draft.title', 'Du har en övning som inte blev klar')}
                </h2>
                <p className="text-sm text-stone-700 dark:text-stone-300 mt-1">
                  {t('interviewSimulator.draft.body', {
                    defaultValue: '{{roll}} — {{count}} besvarade frågor. Vill du fortsätta där du var?',
                    roll: utkast.roll,
                    count: utkast.historik.length,
                  })}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  onClick={aterupptaUtkast}
                  className="bg-[var(--c-solid)] hover:brightness-[1.08] text-white font-medium rounded-xl"
                >
                  {t('interviewSimulator.draft.resume', 'Fortsätt')}
                </Button>
                <Button variant="outline" onClick={forkastaUtkast} className="rounded-xl">
                  {t('interviewSimulator.draft.discard', 'Börja om')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Setup Form */}
        <Card className="p-6 md:p-8 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-6">{t('interviewSimulator.setup.startTraining')}</h2>
          <div className="space-y-5">
            <div>
              <label htmlFor="roll-input" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                {t('interviewSimulator.roleLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                id="roll-input"
                type="text"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                placeholder={t('interviewSimulator.rolePlaceholder')}
                aria-required="true"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 focus:border-[var(--c-solid)] dark:focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] outline-none bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="foretag-input" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                {t('interviewSimulator.companyLabel')}
              </label>
              <input
                id="foretag-input"
                type="text"
                value={foretag}
                onChange={(e) => setForetag(e.target.value)}
                placeholder={t('interviewSimulator.companyPlaceholder')}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 focus:border-[var(--c-solid)] dark:focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] outline-none bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="category-select" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2 flex items-center gap-2">
                <ListTodo className="w-4 h-4" aria-hidden="true" />
                {t('interviewSimulator.setup.selectCategory')}
              </label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 focus:border-[var(--c-solid)] dark:focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] outline-none bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 transition-colors"
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
              className="w-full bg-[var(--c-solid)] hover:brightness-[1.08] text-white font-medium py-3 rounded-xl shadow-md transition-all"
              aria-busy={isLoading}
            >
              {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" aria-label={t('common.loadingStatus', 'Laddar')} /> : t('interviewSimulator.startInterview')}
            </Button>
          </div>
        </Card>

        {/*
          Tidigare övningar.

          Sammanfattningen har hela tiden sagt "Din övning är sparad så du kan
          titta på den igen". `getSimulatorSessions()` hade noll läsare i hela
          repot — datan sparades, men gick aldrig att se. Samma felklass som
          rådgivarrundan 2026-08-17: ett löfte utan täckning. Nu finns läsaren.
        */}
        {tidigareOvningar.length > 0 && (
          <TidigareOvningar sessioner={tidigareOvningar} />
        )}

        <RadgivarTips pathname="/interview-simulator" index={1} />

        {/* Tips Section */}
        <Card className="p-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50">
          <h3 className="font-bold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            {t('interviewSimulator.star.title')}
          </h3>
          <ul className="space-y-3 text-sm text-stone-700 dark:text-stone-300" role="list">
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

          {/*
            Räddat ur `components/interview/StarMethodGuide.tsx`, som aldrig
            monterats i portalen (noll importörer, bekräftat med
            nåbarhetsanalys från main.tsx). De fem punkterna fanns ingen
            annanstans; STAR-avsnittet här var fyra meningar.
          */}
          <details className="mt-5 group">
            <summary className="cursor-pointer text-sm font-medium text-stone-800 dark:text-stone-200 hover:text-[var(--c-text)] dark:hover:text-[var(--c-solid)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-solid)] rounded">
              {t('interviewSimulator.star.mistakesTitle', 'Fem misstag som är lätta att göra')}
            </summary>
            <ul className="mt-3 space-y-2 text-sm text-stone-700 dark:text-stone-300 list-disc list-inside">
              {(t('interviewSimulator.star.mistakes', { returnObjects: true }) as unknown as string[]).map((rad, i) => (
                <li key={i}>{rad}</li>
              ))}
            </ul>
          </details>
        </Card>

        {/* Vidare lasning — se kommentaren vid intervjuArtiklar. */}
        {intervjuArtiklar.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-solid)]" aria-hidden="true" />
              {t('interviewSimulator.readMore')}
            </h3>
            <div className="space-y-2">
              {intervjuArtiklar.map((artikel) => (
                <Link
                  key={artikel.id}
                  to={`/knowledge-base/article/${artikel.id}`}
                  className="flex items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-[var(--c-accent)] dark:hover:border-[var(--c-solid)] hover:shadow-md transition-all group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-solid)]"
                >
                  <span className="font-medium text-stone-800 dark:text-stone-100 group-hover:text-[var(--c-text)] dark:group-hover:text-[var(--c-solid)] transition-colors">
                    {artikel.title}
                  </span>
                  {typeof artikel.readingTime === 'number' && artikel.readingTime > 0 && (
                    <span className="text-sm text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-700 px-2 py-1 rounded-lg flex-shrink-0">
                      {t('interviewSimulator.readingTime', {
                        defaultValue: '{{count}} min',
                        count: artikel.readingTime,
                      })}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </PageLayout>
    )
  }

  if (visarSammanfattning) {
    return (
      <PageLayout
        title={t('interviewSimulator.title')}
        subtitle={`${roll}${foretag ? ' — ' + foretag : ''}`}
        domain="activity"
        showTabs={false}
        className="sidbredd"
        contentClassName="space-y-6"
      >
        <Card className="p-6 md:p-8 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 shadow-sm" role="status" aria-live="polite">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">
                {t('interviewSimulator.summary.title', 'Bra jobbat!')}
              </h2>
              <p className="text-stone-600 dark:text-stone-400 mt-1">
                {t('interviewSimulator.summary.subtitle', 'Din övning är sparad så du kan titta på den igen. Här är en snabb sammanfattning.')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-stone-50 dark:bg-stone-700/50 p-4 rounded-xl border border-stone-200 dark:border-stone-600">
              <p className="text-xs text-stone-600 dark:text-stone-400 mb-1">{t('interviewSimulator.session.questionsAnswered')}</p>
              <p className="text-3xl font-bold text-[var(--c-text)] dark:text-[var(--c-solid)]">{antalFragor}</p>
              {/* Sammanfattningen visas bara efter minst ett svar, sa nagon
                  nolla kan inte na hit. */}
            </div>
            <div className="bg-stone-50 dark:bg-stone-700/50 p-4 rounded-xl border border-stone-200 dark:border-stone-600">
              <p className="text-xs text-stone-600 dark:text-stone-400 mb-1">{t('interviewSimulator.session.averageRating')}</p>
              {avgRating !== null ? (
                <>
                  <p className="text-3xl font-bold text-[var(--c-text)] dark:text-[var(--c-solid)]">{avgRating}/5</p>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                    {t('interviewSimulator.session.ratedCount', {
                      count: ratedCount,
                      defaultValue: 'Baserat på {{count}} betygsatta svar',
                    })}
                  </p>
                </>
              ) : (
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                  {t('interviewSimulator.session.noRatingsYet', 'Inget svar är betygsatt än')}
                </p>
              )}
            </div>
          </div>

          {/* G11: AI:ns helhetsbedömning av hela sessionen */}
          {sammanfattningLoading && (
            <div className="mb-6 p-4 rounded-xl bg-stone-50 dark:bg-stone-700/50 border border-stone-200 dark:border-stone-600">
              <p className="text-sm text-stone-600 dark:text-stone-400 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                {t('interviewSimulator.summary.aiLoading', 'Vi tittar igenom hela övningen …')}
              </p>
            </div>
          )}

          {sammanfattningFel && !sammanfattningLoading && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">{sammanfattningFel}</p>
            </div>
          )}

          {aiSammanfattning && !sammanfattningLoading && (
            <div
              data-ai-generated="true"
              className="mb-6 p-5 rounded-xl bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20 border border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50"
            >
              <h2 className="font-semibold text-[var(--c-text)] dark:text-[var(--c-text)] mb-2">
                {t('interviewSimulator.summary.aiTitle', 'Helhetsbedömning')}
              </h2>

              {aiSammanfattning.summary && (
                <p className="text-stone-800 dark:text-stone-200 mb-4">{aiSammanfattning.summary}</p>
              )}

              {/*
                Här stod "Sammanvägt omdöme: {{score}}/10" — en ANDRA
                betygsskala, på samma kort som snittbetyget "x/5", om samma
                övning. Två tal, två skalor, under rubriken "Bra jobbat!".

                Siffran är borta ur både gränssnittet och nedladdningen. Orden
                AI:n skriver — sammanfattning, styrkor, att öva vidare på — är
                det som hjälper; ett sammanvägt betyg på en människas intervju
                är just den prestationsmätning Manifestet håller borta från
                deltagarvyer. Fältet finns kvar i schemat.
              */}

              {!!aiSammanfattning.strengths?.length && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">
                    {t('interviewSimulator.summary.aiStrengths', 'Det här gjorde du bra')}
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-stone-800 dark:text-stone-200">
                    {aiSammanfattning.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}

              {!!aiSammanfattning.improvements?.length && (
                <div className="mb-2">
                  <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {t('interviewSimulator.summary.aiImprovements', 'Att öva vidare på')}
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-stone-800 dark:text-stone-200">
                    {aiSammanfattning.improvements.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}

              <AIGeneratedWatermark contentType="omdöme" />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={avslutaIntervju}
              className="flex-1 bg-[var(--c-solid)] hover:brightness-[1.08] text-white font-medium py-3 rounded-xl shadow-md transition-all"
            >
              {/* Hette "Starta intervjun" men nollstaller allt och gar till
                  startskarmen — knappen beskrev inte vad den gjorde. */}
              {t('interviewSimulator.session.practiceAgain', 'Ova en gang till')}
            </Button>
            <Button
              variant="outline"
              onClick={downloadSessionSummary}
              className="flex-1 rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" aria-hidden="true" />
              {t('interviewSimulator.download.downloadSummary')}
            </Button>
          </div>
        </Card>

        {historik.length > 0 && (
          <div className="space-y-4" role="log" aria-label={t('interviewSimulator.session.previousAnswers')}>
            <h2 className="font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-solid)]" aria-hidden="true" />
              {t('interviewSimulator.session.previousAnswers')}
            </h2>
            {historik.map((fs, index) => (
              <Card key={index} className="p-5 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 shadow-sm">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-solid)] mb-1">{t('interviewSimulator.session.question')}</p>
                    <p className="text-stone-800 dark:text-stone-200">{fs.fraga}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">{t('interviewSimulator.session.yourAnswer')}</p>
                    <p className="text-stone-800 dark:text-stone-200">{fs.svar}</p>
                  </div>
                  {fs.feedback && (
                    <div data-ai-generated="true" className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20 p-3 rounded-xl text-sm text-[var(--c-text)] dark:text-[var(--c-text)] border border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50">
                      <strong>{t('interviewSimulator.session.aiFeedback')}</strong> {fs.feedback}
                      <AIGeneratedWatermark contentType="omdöme" />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={t('interviewSimulator.title')}
      subtitle={`${roll}${foretag ? ' — ' + foretag : ''}`}
      domain="activity"
      showTabs={false}
      className="sidbredd"
      contentClassName="space-y-6"
    >
      {/* Progress-card — neutralt vitt kort med persika-progress */}
      <Card className="p-6 md:p-8 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 relative overflow-hidden">

        <div className="relative flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">{t('interviewSimulator.interview')} {roll}</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">{foretag || t('interviewSimulator.genericPractice')}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleAvslutaKlick} aria-label={t('interviewSimulator.session.endInterviewAria')}>
            {t('interviewSimulator.session.endInterview')}
          </Button>
        </div>

        {/* Stats - improved grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm p-4 rounded-xl border border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50 shadow-sm">
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-1">{t('interviewSimulator.session.questionsAnswered')}</p>
            {/* Ett tomt falt ar inte en nolla. En stor fet 0 i hjalteposition
                sa "du har presterat noll" till nagon som just borjat, och
                DESIGN.md 7 forbjuder den uttryckligen. Grannkortet gjorde
                redan ratt — nu gor bada det. */}
            {antalFragor > 0 ? (
              <p className="text-3xl font-bold text-[var(--c-text)] dark:text-[var(--c-solid)]">{antalFragor}</p>
            ) : (
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-2">
                {t('interviewSimulator.session.noAnswersYet', 'Din forsta fraga vantar nedan')}
              </p>
            )}
          </div>
          <div className="bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm p-4 rounded-xl border border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50 shadow-sm">
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-1">{t('interviewSimulator.session.averageRating')}</p>
            {avgRating !== null ? (
              <p className="text-3xl font-bold text-[var(--c-text)] dark:text-[var(--c-solid)]">{avgRating}/5</p>
            ) : (
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-2">
                {t('interviewSimulator.session.noRatingsYet', 'Inget svar är betygsatt än')}
              </p>
            )}
          </div>
          <div className="col-span-2 md:col-span-1 bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm p-4 rounded-xl border border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50 shadow-sm">
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-1">{t('interviewSimulator.timer.timeForAnswer')}</p>
            <p className="text-3xl font-bold text-stone-800 dark:text-stone-100">
              {timerSeconds}s
            </p>
          </div>
        </div>
      </Card>

      {/* Milstolpe-hälsning (Fas 5 — success-spot) — visas efter 3 besvarade frågor */}
      {antalFragor >= 3 && (
        <Card className="p-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left bg-white dark:bg-stone-800 border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50 shadow-sm">
          <img
            src="/illustrations/success-intervju.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="w-20 h-20 flex-shrink-0 select-none"
          />
          <div>
            <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">
              {t('interviewSimulator.milestone.title', {
                defaultValue: 'Du har svarat på {{count}} frågor',
                count: antalFragor,
              })}
            </h3>
            <p className="text-stone-600 dark:text-stone-300 mt-1">
              {t('interviewSimulator.milestone.body', 'Varje övning gör dig tryggare inför den riktiga intervjun. Fortsätt så länge du vill, eller ladda ner din sammanfattning.')}
            </p>
          </div>
        </Card>
      )}

      {/* Historik med expanderbar feedback - with aria-live */}
      {historik.length > 0 && (
        <div className="space-y-4" role="log" aria-live="polite" aria-label={t('interviewSimulator.session.previousAnswers')}>
          <h2 className="font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-solid)]" aria-hidden="true" />
            {t('interviewSimulator.session.previousAnswers')}
          </h2>
          {historik.map((fs, index) => (
            <Card key={index} className="p-5 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 shadow-sm">
              <div className="space-y-4">
                {/* Fråga */}
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/50 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-solid)]" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--c-text)] dark:text-[var(--c-solid)] mb-1">{t('interviewSimulator.session.question')}</p>
                    <p className="text-stone-800 dark:text-stone-200">{fs.fraga}</p>
                  </div>
                </div>

                {/* Svar */}
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">{t('interviewSimulator.session.yourAnswer')}</p>
                    <p className="text-stone-800 dark:text-stone-200">{fs.svar}</p>
                  </div>
                </div>

                {/* Rating och feedback */}
                <div className="bg-stone-50 dark:bg-stone-700/50 p-4 rounded-xl border border-stone-200 dark:border-stone-600">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                      {/*
                        B12: etiketten sa "AI-betyg" så fort en siffra fanns —
                        även när siffran var fallback-trean eller deltagarens
                        eget betyg. Nu styr ratingSource vad som påstås.
                      */}
                      {fs.ratingSource === 'ai'
                        ? t('interviewSimulator.session.aiRating')
                        : fs.ratingSource === 'user'
                          ? t('interviewSimulator.session.yourRating', 'Ditt betyg (klicka för att ändra):')
                          : t('interviewSimulator.session.rateThisAnswer')}
                    </p>
                    <div className="flex gap-1" role="group" aria-label={t('interviewSimulator.ratingAria', 'Betygsättning')}>
                      {/*
                        Tre fel pa samma fem knappar, alla uppmatta 2026-08-19:

                        · Fylld stjarna `yellow-400` mot `stone-50` matte
                          **1,47:1**, tom stjarna 1,43:1 — langt under SC 1.4.11.
                        · BADA tillstanden ritade samma glyf `★`, sa FARG var
                          enda skillnaden mellan satt och osatt betyg (SC 1.4.1).
                          Nu skiljer sig formen: ★ mot ☆.
                        · Fokusringen var `ring-yellow-400` — alltsa osynlig av
                          exakt samma skal, och hardkodad mot DESIGN.md §6.

                        Nya varden mot verkliga tokens: fylld 4,81:1 ljust /
                        8,17:1 morkt, tom 4,59:1 / 4,96:1. Ytan ar minst 44 px.
                      */}
                      {[1, 2, 3, 4, 5].map((star) => {
                        const satt = star <= (fs.rating || 0)
                        return (
                          <button
                            key={star}
                            onClick={() => handleSetRating(index, star)}
                            className={`min-w-11 min-h-11 flex items-center justify-center text-xl leading-none ${satt ? 'text-amber-700 dark:text-yellow-400' : 'text-stone-500 dark:text-stone-400'} cursor-pointer hover:scale-110 transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--c-solid)] rounded`}
                            aria-label={t('interviewSimulator.ratingStarAria', {
                              defaultValue: 'Betyg {{star}} av 5',
                              star,
                            })}
                            aria-pressed={satt}
                            type="button"
                          >
                            <span aria-hidden="true">{satt ? '★' : '☆'}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Expanderbar feedback */}
                  <button
                    onClick={() => setExpandedFeedback(expandedFeedback === index ? null : index)}
                    className="flex items-center gap-2 text-sm text-[var(--c-text)] dark:text-[var(--c-solid)] hover:text-[var(--c-text)] transition font-medium"
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
                        <div data-ai-generated="true" className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/20 p-4 rounded-xl text-sm text-[var(--c-text)] dark:text-[var(--c-text)] border border-[var(--c-accent)]/40 dark:border-[var(--c-accent)]/50">
                          <strong>{t('interviewSimulator.session.aiFeedback')}</strong> {fs.feedback}
                          <AIGeneratedWatermark contentType="omdöme" />
                        </div>
                      )}
                      <div className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 p-3 rounded-xl text-sm text-[var(--c-text)] dark:text-[var(--c-text)] border border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/40">
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

      {/*
        AI-fel syns nu. Tidigare fanns tre nakna `catch {}` och deltagaren fick
        en reservfråga presenterad som om en rekryterare ställt den — även när
        orsaken var att hon själv stängt av AI i sina inställningar.
      */}
      {aiFel && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
        >
          <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-amber-900 dark:text-amber-100">{aiFel}</p>
        </div>
      )}

      {/* Nuvarande fråga - with aria-live for AI questions */}
      <Card className="p-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 shadow-sm" role="region" aria-label={t('interviewSimulator.currentQuestionAria', 'Nuvarande fråga')}>
        <div className="flex gap-4" aria-live="polite">
          <div className="w-12 h-12 rounded-xl bg-[var(--c-solid)] flex items-center justify-center flex-shrink-0 shadow-md">
            {/* Ikonerna var omkastade: roboten satt på deltagarens eget svar
                och människan på AI:ns fråga. */}
            <Bot className="w-6 h-6 text-[var(--c-on-solid)]" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" aria-hidden="true" />
              {t('interviewSimulator.session.questionNumber', { number: antalFragor + 1 })}
            </p>
            {/*
              Tre lägen, inte två. Frågan skrevs förut rått, utan laddgren — så
              efter "Starta intervju" stod ett tomt kort med rubriken "Fråga 1"
              i 3,7–11,7 s (uppmätt i prod; AI-svar tog 2,8–20,4 s). Tomhet såg
              ut som ett svar.
            */}
            {isLoading && !nuvarandeFraga ? (
              <p className="text-lg text-stone-600 dark:text-stone-300 font-medium flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                {t('interviewSimulator.session.questionLoading', 'Förbereder din första fråga …')}
              </p>
            ) : (
              <>
                <p data-testid="nuvarande-fraga" className="text-lg text-stone-800 dark:text-stone-100 font-medium">{nuvarandeFraga}</p>
                {fragaKalla === 'reserv' && (
                  <p className="text-sm text-stone-700 dark:text-stone-300 mt-2">
                    {t('interviewSimulator.session.fallbackQuestion', 'Den här frågan kommer ur vår egen lista, inte från AI:n.')}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Timer & Answer Input */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 shadow-sm">
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
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700/60 hover:border-[var(--c-accent)] transition-all disabled:opacity-50"
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
              <div className="flex-1 p-3 rounded-xl bg-stone-50 dark:bg-stone-700/40 text-sm text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-600 italic" aria-live="polite">
                "{supportPhrase}"
              </div>
            )}
          </div>

          {/* Answer Textarea */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="svar-textarea" className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('interviewSimulator.input.yourAnswerLabel')}</label>
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
            {talFel && (
              <p
                role="status"
                aria-live="polite"
                className="text-sm text-amber-900 dark:text-amber-100 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3"
              >
                {talFel}
              </p>
            )}
            <textarea
              id="svar-textarea"
              ref={svarRef}
              value={anvandarSvar}
              onChange={(e) => setAnvandarSvar(e.target.value)}
              placeholder={isRecording ? t('interviewSimulator.input.speakNow') : t('interviewSimulator.input.writeOrRecord')}
              rows={5}
              aria-describedby="svar-hints"
              className={`w-full px-4 py-3 rounded-xl border focus:border-[var(--c-solid)] dark:focus:border-[var(--c-solid)] focus:ring-2 focus:ring-[var(--c-accent)] dark:focus:ring-[var(--c-solid)] outline-none resize-y bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 transition-colors ${
                isRecording ? 'border-red-300 dark:border-red-700' : 'border-stone-200 dark:border-stone-600'
              }`}
            />
            <div id="svar-hints" className="flex justify-between items-center text-xs text-stone-500 dark:text-stone-500">
              <span>{t('interviewSimulator.input.characters', { count: anvandarSvar.length })}</span>
              <span>{t('interviewSimulator.input.recommended')}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={svara}
              disabled={!anvandarSvar.trim() || isLoading}
              className="flex-1 bg-[var(--c-solid)] hover:brightness-[1.08] text-white font-medium py-3 rounded-xl shadow-md transition-all"
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
                className="px-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400"
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
        <Card className="p-5 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 dark:bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md">
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
        <Card className="p-5 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 shadow-sm">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            {t('interviewSimulator.quickTips.title')}
          </h3>
          <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
            <li className="flex items-start gap-2">
              <span className="text-[var(--c-solid)] mt-1">•</span>
              <span>{t('interviewSimulator.quickTips.tip1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--c-solid)] mt-1">•</span>
              <span>{t('interviewSimulator.quickTips.tip2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--c-solid)] mt-1">•</span>
              <span>{t('interviewSimulator.quickTips.tip3')}</span>
            </li>
          </ul>
        </Card>
        <Card className="p-5 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 shadow-sm">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 dark:text-yellow-400" aria-hidden="true" />
            {t('interviewSimulator.progress.title')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-stone-600 dark:text-stone-400">{t('interviewSimulator.progress.answered')}</span>
              <span className="font-medium text-stone-800 dark:text-stone-200">{antalFragor} {t('interviewSimulator.progress.questionsUnit')}</span>
            </div>
            <div className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--c-solid)] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(antalFragor * 20, 100)}%` }}
              />
            </div>
            {/*
              Har stod "{{count}} fragor kvar till utmarkelse" och "Du har
              klarat malet!". Tva problem: utmarkelsen finns inte nagonstans i
              koden — den var ett lofte utan tackning — och Manifestet forbjuder
              prestationssprak i deltagarvyer. Ovningen har inget malantal;
              man ovar sa lange man vill.
            */}
            <p className="text-xs text-stone-600 dark:text-stone-400">
              {t('interviewSimulator.progress.encouragement', 'Du bestammer sjalv hur manga fragor du vill ova pa.')}
            </p>
          </div>
        </Card>
      </div>
    </PageLayout>
  )
}
