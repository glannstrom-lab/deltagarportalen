/**
 * Negotiation Tab - Salary negotiation guide and tips
 * Features: interactive checklist with progress, scenario simulator, tips carousel, localStorage persistence
 */
import { useState, useEffect } from 'react'
import { TrendingUp, CheckCircle, AlertCircle, MessageSquare, Target, Clock, Sparkles, ChevronDown, ChevronUp, RotateCcw, Play, BarChart3, TrendingDown } from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface NegotiationStep {
  id: number
  title: string
  description: string
  tips: string[]
  phrases: string[]
}

const NEGOTIATION_STEPS: NegotiationStep[] = [
  {
    id: 1,
    title: 'Förberedelse',
    description: 'Grunden för en lyckad förhandling läggs innan mötet.',
    tips: [
      'Undersök marknadslön för din roll och erfarenhet',
      'Dokumentera dina prestationer och resultat',
      'Bestäm ditt mål och din lägsta acceptabla nivå',
      'Förbered konkreta exempel på ditt värde',
    ],
    phrases: [
      '"Jag har undersökt marknaden och ser att liknande roller ligger på X-Y kr..."',
      '"Under senaste året har jag bidragit till..."',
    ],
  },
  {
    id: 2,
    title: 'Inledning',
    description: 'Börja samtalet på rätt sätt.',
    tips: [
      'Tacka för möjligheten att diskutera lön',
      'Uttryck entusiasm för rollen/företaget',
      'Var tydlig med att du vill diskutera kompensation',
      'Lyssna aktivt på arbetsgivarens perspektiv',
    ],
    phrases: [
      '"Jag uppskattar möjligheten att diskutera min kompensation..."',
      '"Jag trivs verkligen här och vill gärna prata om hur min lön speglar mitt bidrag..."',
    ],
  },
  {
    id: 3,
    title: 'Argumentation',
    description: 'Presentera ditt case med fakta och resultat.',
    tips: [
      'Fokusera på värdet du tillför, inte vad du behöver',
      'Använd konkreta siffror och exempel',
      'Jämför med marknadslöner objektivt',
      'Var beredd att motivera varje punkt',
    ],
    phrases: [
      '"Baserat på mina resultat där jag ökade försäljningen med X%..."',
      '"Jag tog på mig ansvar för Y-projektet som sparade företaget Z kr..."',
    ],
  },
  {
    id: 4,
    title: 'Förhandling',
    description: 'Hantera motbud och kompromisser.',
    tips: [
      'Be aldrig om ursäkt för att förhandla',
      'Var beredd på motbud - det är normalt',
      'Överväg hela paketet: bonus, förmåner, semester',
      'Ta tid på dig att överväga om det behövs',
    ],
    phrases: [
      '"Jag förstår budgeten är begränsad. Kan vi titta på andra förmåner?"',
      '"Kan vi komma överens om en utvärdering om 6 månader?"',
    ],
  },
  {
    id: 5,
    title: 'Avslutning',
    description: 'Avsluta professionellt oavsett utfall.',
    tips: [
      'Sammanfatta vad ni kommit överens om',
      'Be om skriftlig bekräftelse',
      'Tacka för samtalet och möjligheten',
      'Sätt datum för uppföljning om relevant',
    ],
    phrases: [
      '"Kan vi sammanfatta vad vi kommit överens om skriftligt?"',
      '"Tack för ett konstruktivt samtal. Jag ser fram emot att fortsätta bidra."',
    ],
  },
]

const DO_AND_DONT = {
  do: [
    'Var förberedd med fakta och siffror',
    'Fokusera på värdet du tillför',
    'Lyssna aktivt och ställ frågor',
    'Var professionell och lugn',
    'Ha en BATNA (bästa alternativ)',
    'Dokumentera allt skriftligt',
  ],
  dont: [
    'Nämn inte personliga ekonomiska behov',
    'Jämför dig inte med kollegor',
    'Ge inte ultimatum tidigt',
    'Acceptera inte första erbjudandet direkt',
    'Bli inte defensiv vid motbud',
    'Glöm inte bort förmåner utöver lön',
  ],
}

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

interface NegotiationScenario {
  id: string
  title: string
  description: string
  targetSalary: number
  currentSalary: number
  marketRate: number
  recommendation: string
}

const SCENARIOS: NegotiationScenario[] = [
  {
    id: '1',
    title: 'Jobstart',
    description: 'Du får ett jobboffert och kan förhandla innan du börjar',
    targetSalary: 45000,
    currentSalary: 0,
    marketRate: 50000,
    recommendation: 'Förhandla från ett starkt läge - marknadsraten är 50k, men börja lite under för att visa flexibilitet.',
  },
  {
    id: '2',
    title: 'Årligt lönesamtal',
    description: 'Det är lönesamtal och du vill ha en höjning',
    targetSalary: 55000,
    currentSalary: 50000,
    marketRate: 54000,
    recommendation: 'Du är redan över marknaden. Fokusera på dina bidrag och undvik att jämföra med andra.',
  },
  {
    id: '3',
    title: 'Efter stor framgång',
    description: 'Du avslutade ett projekt som sparade företaget pengar',
    targetSalary: 60000,
    currentSalary: 52000,
    marketRate: 55000,
    recommendation: 'Du har bevisbara resultat. Använd detta konkret i förhandlingen.',
  },
  {
    id: '4',
    title: 'Ny roll',
    description: 'Du fick nya ansvar och vill ha motsvarande höjning',
    targetSalary: 58000,
    currentSalary: 50000,
    marketRate: 56000,
    recommendation: 'Tydliga nya ansvar = tydlig grund för förhandling. Dokumentera skillnaden.',
  },
]

const TIPS_CAROUSEL = [
  'Hämta fram branschrapporter som stöd för dina siffror',
  'Träna på att presentera dina argument innan mötet',
  'Kom ihåg att det är normalt med motbud - det är en dialog',
  'Tänk på hela paketet: bonus, hemarbetstid, utbildning, pension',
  'Följ upp skriftligt: "Som vi diskuterade, från och med..."',
  'Var redo att säga att du behöver tid för att tänka',
]

export default function NegotiationTab() {
  const [expandedStep, setExpandedStep] = useState<number | null>(1)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [selectedScenario, setSelectedScenario] = useState<NegotiationScenario | null>(null)
  const [showScenario, setShowScenario] = useState(false)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)

  // Load checklist from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('negotiationChecklist')
    if (saved) {
      setChecklist(JSON.parse(saved))
    } else {
      // Initialize with preparation checklist
      const initialChecklist: ChecklistItem[] = [
        { id: '1', text: 'Undersök marknadslön för min roll', completed: false },
        { id: '2', text: 'Samla dokumentation på mina resultat', completed: false },
        { id: '3', text: 'Bestäm målön och lägsta acceptabel nivå', completed: false },
        { id: '4', text: 'Förbered konkreta exempel på mitt värde', completed: false },
        { id: '5', text: 'Planera mitt öppningsargument', completed: false },
        { id: '6', text: 'Träna på att presentera mitt case', completed: false },
      ]
      setChecklist(initialChecklist)
      localStorage.setItem('negotiationChecklist', JSON.stringify(initialChecklist))
    }
  }, [])

  // Save checklist to localStorage whenever it changes
  useEffect(() => {
    if (checklist.length > 0) {
      localStorage.setItem('negotiationChecklist', JSON.stringify(checklist))
    }
  }, [checklist])

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  const resetChecklist = () => {
    const initialChecklist: ChecklistItem[] = [
      { id: '1', text: 'Undersök marknadslön för min roll', completed: false },
      { id: '2', text: 'Samla dokumentation på mina resultat', completed: false },
      { id: '3', text: 'Bestäm målön och lägsta acceptabel nivå', completed: false },
      { id: '4', text: 'Förbered konkreta exempel på mitt värde', completed: false },
      { id: '5', text: 'Planera mitt öppningsargument', completed: false },
      { id: '6', text: 'Träna på att presentera mitt case', completed: false },
    ]
    setChecklist(initialChecklist)
  }

  const completedCount = checklist.filter(item => item.completed).length
  const progressPercent = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0

  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % TIPS_CAROUSEL.length)
  }

  const prevTip = () => {
    setCurrentTipIndex((prev) => (prev - 1 + TIPS_CAROUSEL.length) % TIPS_CAROUSEL.length)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200 dark:border-teal-700">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Löneförhandlingsguide</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Steg-för-steg guide för att förhandla lön i svensk arbetskultur.
              Förberedd förhandling ger bättre resultat.
            </p>
          </div>
        </div>
      </Card>

      {/* Swedish context note */}
      <Card className="bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-teal-900 dark:text-teal-100">Svensk arbetsmarknad</p>
            <p className="text-sm text-teal-700 dark:text-teal-300 mt-1">
              I Sverige är löneförhandling ofta mer strukturerad än i andra länder.
              Många branscher har kollektivavtal som sätter ramarna.
              Individuella förhandlingar sker ofta vid årliga lönesamtal.
            </p>
          </div>
        </div>
      </Card>

      {/* Step-by-step guide */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          Förhandlingens 5 steg
        </h3>

        <div className="space-y-3">
          {NEGOTIATION_STEPS.map((step) => (
            <div
              key={step.id}
              className={cn(
                "border rounded-xl overflow-hidden transition-all",
                expandedStep === step.id ? "border-teal-200 dark:border-teal-600 bg-teal-50/30 dark:bg-teal-900/10" : "border-stone-200 dark:border-stone-600"
              )}
            >
              <button
                onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-50/50 dark:hover:bg-stone-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    expandedStep === step.id
                      ? "bg-teal-600 dark:bg-teal-500 text-white"
                      : "bg-stone-100 dark:bg-stone-700 text-gray-600 dark:text-gray-400"
                  )}>
                    {step.id}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{step.title}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-400">{step.description}</p>
                  </div>
                </div>
                {expandedStep === step.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              {expandedStep === step.id && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Tips */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tips:</p>
                    <ul className="space-y-2">
                      {step.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <CheckCircle className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0 mt-0.5" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Phrases */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      Exempelfraser:
                    </p>
                    <div className="space-y-2">
                      {step.phrases.map((phrase, idx) => (
                        <div key={idx} className="p-3 bg-white dark:bg-stone-700 rounded-lg border border-teal-100 dark:border-teal-800 text-sm text-gray-700 dark:text-gray-300 italic">
                          {phrase}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Do and Don't */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-teal-200 dark:border-teal-700 bg-white dark:bg-stone-800">
          <h3 className="font-semibold text-teal-800 dark:text-teal-200 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Gör detta
          </h3>
          <ul className="space-y-3">
            {DO_AND_DONT.do.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="w-5 h-5 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="border-rose-200 dark:border-rose-800 bg-white dark:bg-stone-800">
          <h3 className="font-semibold text-rose-800 dark:text-rose-200 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            Undvik detta
          </h3>
          <ul className="space-y-3">
            {DO_AND_DONT.dont.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="w-5 h-5 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center shrink-0">
                  <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Preparation Checklist */}
      <Card className="border-teal-200 dark:border-teal-700 bg-white dark:bg-stone-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Förberedelschecklista
          </h3>
          <Button
            onClick={resetChecklist}
            size="sm"
            variant="ghost"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Färdiggrad</span>
            <span className="text-sm font-bold text-teal-600 dark:text-teal-400">{completedCount}/{checklist.length}</span>
          </div>
          <div className="h-2 bg-stone-200 dark:bg-stone-600 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-teal-500 dark:bg-teal-400"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Checklist items */}
        <div className="space-y-2">
          {checklist.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleChecklistItem(item.id)}
              className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-teal-50/50 dark:hover:bg-teal-900/20 transition-colors text-left group"
            >
              <div className={cn(
                'w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all mt-0.5',
                item.completed
                  ? 'bg-teal-500 dark:bg-teal-400 border-teal-500 dark:border-teal-400'
                  : 'border-stone-300 dark:border-stone-500 group-hover:border-teal-500 dark:group-hover:border-teal-400'
              )}>
                {item.completed && <CheckCircle className="w-4 h-4 text-white" />}
              </div>
              <span className={cn(
                'text-sm transition-all',
                item.completed
                  ? 'text-gray-700 dark:text-gray-400 line-through'
                  : 'text-gray-700 dark:text-gray-300'
              )}>
                {item.text}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Scenario Simulator */}
      <Card className="border-violet-200 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-900/10">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Play className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          Scenariosimulatör
        </h3>

        {!showScenario ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => {
                  setSelectedScenario(scenario)
                  setShowScenario(true)
                }}
                className="p-4 bg-white dark:bg-stone-700 rounded-xl border border-violet-200 dark:border-violet-700 hover:border-violet-400 dark:hover:border-violet-500 hover:shadow-md transition-all text-left group"
              >
                <p className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{scenario.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{scenario.description}</p>
              </button>
            ))}
          </div>
        ) : selectedScenario ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <button
              onClick={() => setShowScenario(false)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
            >
              ← Tillbaka till scenarion
            </button>

            <div className="bg-white dark:bg-stone-700 rounded-xl p-4 border border-violet-200 dark:border-violet-700">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{selectedScenario.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{selectedScenario.description}</p>

              {/* Salary comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {selectedScenario.currentSalary > 0 && (
                  <div className="bg-teal-50 dark:bg-teal-900/30 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Nuvarande</p>
                    <p className="font-bold text-gray-900 dark:text-gray-100">{selectedScenario.currentSalary.toLocaleString('sv-SE')} kr</p>
                  </div>
                )}
                <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Marknad</p>
                  <p className="font-bold text-gray-900 dark:text-gray-100">{selectedScenario.marketRate.toLocaleString('sv-SE')} kr</p>
                </div>
                <div className="bg-teal-50 dark:bg-teal-900/30 rounded-lg p-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Målön</p>
                  <p className="font-bold text-gray-900 dark:text-gray-100">{selectedScenario.targetSalary.toLocaleString('sv-SE')} kr</p>
                </div>
              </div>

              {/* Analysis */}
              <div className="p-3 bg-gradient-to-r from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 rounded-lg border border-violet-200 dark:border-violet-700 mb-4">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Rekommendation</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedScenario.recommendation}</p>
              </div>

              {/* Salary gap visualization */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Löneintervall</p>
                {selectedScenario.currentSalary > 0 && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Från nuvarande</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        +{selectedScenario.targetSalary - selectedScenario.currentSalary} kr
                        ({(((selectedScenario.targetSalary - selectedScenario.currentSalary) / selectedScenario.currentSalary) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-stone-100 dark:bg-stone-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 dark:bg-teal-400"
                        style={{
                          width: `${Math.min(100, ((selectedScenario.targetSalary - selectedScenario.currentSalary) / selectedScenario.currentSalary) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Jämfört med marknad</span>
                    <span className={cn(
                      'font-medium',
                      selectedScenario.targetSalary > selectedScenario.marketRate
                        ? 'text-teal-600 dark:text-teal-400'
                        : selectedScenario.targetSalary < selectedScenario.marketRate
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-gray-600 dark:text-gray-400'
                    )}>
                      {selectedScenario.targetSalary > selectedScenario.marketRate
                        ? `+${selectedScenario.targetSalary - selectedScenario.marketRate} kr över marknad`
                        : selectedScenario.targetSalary < selectedScenario.marketRate
                        ? `${selectedScenario.marketRate - selectedScenario.targetSalary} kr under marknad`
                        : 'I nivå med marknad'
                      }
                    </span>
                  </div>
                  <div className="h-2 bg-stone-100 dark:bg-stone-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 dark:bg-violet-400"
                      style={{
                        width: `${(selectedScenario.targetSalary / selectedScenario.marketRate) * 100}%`,
                        maxWidth: '100%'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </Card>

      {/* Tips Carousel */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          Tips för dagen
        </h3>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTipIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-white dark:bg-stone-700 rounded-xl border border-amber-200 dark:border-amber-700 text-center min-h-24 flex items-center justify-center"
            >
              <p className="text-gray-800 dark:text-gray-100 font-medium">{TIPS_CAROUSEL[currentTipIndex]}</p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={prevTip}
              className="px-3 py-1 text-sm text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
            >
              ← Tidigare
            </button>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {currentTipIndex + 1} / {TIPS_CAROUSEL.length}
            </span>
            <button
              onClick={nextTip}
              className="px-3 py-1 text-sm text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
            >
              Nästa →
            </button>
          </div>
        </div>
      </Card>

      {/* Timing advice */}
      <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          När ska du förhandla?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
            <p className="font-medium text-amber-900 dark:text-amber-100">Vid jobbstart</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Bästa tillfället att sätta rätt nivå</p>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
            <p className="font-medium text-amber-900 dark:text-amber-100">Årligt lönesamtal</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Planerat tillfälle - var förberedd</p>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
            <p className="font-medium text-amber-900 dark:text-amber-100">Efter stora framgångar</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Dokumentera och kapitalisera</p>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
            <p className="font-medium text-amber-900 dark:text-amber-100">Vid nya ansvar</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Mer ansvar = mer kompensation</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
