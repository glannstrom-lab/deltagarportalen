/**
 * Brand Audit Tab - Analyze your personal brand
 * Features: Cloud sync, action buttons, progress tracking
 */
import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardCheck,
  CheckCircle,
  Circle,
  Star,
  TrendingUp,
  Sparkles,
  Linkedin,
  FileText,
  Users,
  Target,
  ChevronRight,
  RefreshCw,
  BarChart3,
  Loader2
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { personalBrandApi } from '@/services/cloudStorage'
import { motion, AnimatePresence } from 'framer-motion'

interface AuditQuestion {
  id: string
  question: string
  category: 'online' | 'content' | 'network' | 'consistency'
  actionLink?: string
  actionLabel?: string
  tip?: string
}

const AUDIT_QUESTIONS: AuditQuestion[] = [
  // Online presence
  {
    id: 'linkedin-profile',
    question: 'Har du en uppdaterad LinkedIn-profil?',
    category: 'online',
    actionLink: '/linkedin-optimizer',
    actionLabel: 'Optimera LinkedIn',
    tip: 'En komplett LinkedIn-profil är 40x mer sannolikt att få jobbförfrågningar'
  },
  {
    id: 'linkedin-photo',
    question: 'Har du ett professionellt profilfoto?',
    category: 'online',
    tip: 'Profiler med foto får 21x fler visningar och 9x fler kontaktförfrågningar'
  },
  {
    id: 'linkedin-headline',
    question: 'Beskriver din LinkedIn-rubrik vad du gör/söker?',
    category: 'online',
    actionLink: '/linkedin-optimizer',
    actionLabel: 'Skapa rubrik',
    tip: 'Din headline är det första rekryterare ser - gör den sökbar och intressant'
  },
  {
    id: 'google-search',
    question: 'Har du googlat ditt namn nyligen?',
    category: 'online',
    tip: '75% av rekryterare söker kandidater online - kontrollera vad de hittar'
  },
  {
    id: 'personal-website',
    question: 'Har du en egen hemsida eller portfolio?',
    category: 'online',
    actionLink: '/personal-brand/portfolio',
    actionLabel: 'Skapa portfolio',
    tip: 'En personlig sida stärker ditt varumärke och ger dig kontroll över din online-närvaro'
  },

  // Content
  {
    id: 'share-content',
    question: 'Delar du branschrelevant innehåll på LinkedIn?',
    category: 'content',
    actionLink: '/personal-brand/visibility',
    actionLabel: 'Se innehållsidéer',
    tip: 'Att dela innehåll 1-2 gånger i veckan ökar din synlighet markant'
  },
  {
    id: 'own-content',
    question: 'Skapar du eget innehåll (artiklar, inlägg)?',
    category: 'content',
    actionLink: '/linkedin-optimizer',
    actionLabel: 'Skapa inlägg',
    tip: 'Eget innehåll positionerar dig som expert i ditt område'
  },
  {
    id: 'engage-others',
    question: 'Engagerar du dig i andras inlägg regelbundet?',
    category: 'content',
    tip: 'Genuint engagemang bygger relationer och ökar din synlighet i andras nätverk'
  },
  {
    id: 'expertise-shown',
    question: 'Visar ditt innehåll din expertis?',
    category: 'content',
    tip: 'Dela konkreta erfarenheter och lärdomar - inte bara generella tips'
  },

  // Network
  {
    id: 'active-network',
    question: 'Nätverkar du aktivt (online eller offline)?',
    category: 'network',
    tip: '85% av alla jobb tillsätts via nätverk - aktivt nätverkande lönar sig'
  },
  {
    id: 'industry-events',
    question: 'Deltar du i branschevent eller meetups?',
    category: 'network',
    tip: 'Fysiska möten skapar starkare relationer än digitala kontakter'
  },
  {
    id: 'mentors',
    question: 'Har du mentorer eller rådgivare i din bransch?',
    category: 'network',
    tip: 'En mentor kan ge ovärderlig vägledning och öppna dörrar i din karriär'
  },
  {
    id: 'recommendations',
    question: 'Har du LinkedIn-rekommendationer?',
    category: 'network',
    tip: 'Rekommendationer från andra ger trovärdighet - be om dem från tidigare kollegor/chefer'
  },

  // Consistency
  {
    id: 'consistent-message',
    question: 'Är ditt budskap konsekvent över alla plattformar?',
    category: 'consistency',
    tip: 'Samma professionella bild på alla plattformar stärker igenkänningen'
  },
  {
    id: 'unique-value',
    question: 'Kan du tydligt beskriva ditt unika värde?',
    category: 'consistency',
    actionLink: '/personal-brand/pitch',
    actionLabel: 'Skapa pitch',
    tip: 'Vad skiljer dig från andra? Varför ska någon välja just dig?'
  },
  {
    id: 'target-audience',
    question: 'Vet du vem din målgrupp är?',
    category: 'consistency',
    tip: 'Att veta vem du vill nå hjälper dig skapa relevant innehåll och budskap'
  },
]

const CATEGORIES = {
  online: { label: 'Digital närvaro', color: 'blue', icon: Linkedin },
  content: { label: 'Innehåll', color: 'violet', icon: FileText },
  network: { label: 'Nätverk', color: 'emerald', icon: Users },
  consistency: { label: 'Konsekvens', color: 'amber', icon: Target },
}

export default function BrandAuditTab() {
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [showResults, setShowResults] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedTip, setExpandedTip] = useState<string | null>(null)

  // Load saved answers from cloud
  useEffect(() => {
    loadAnswers()
  }, [])

  const loadAnswers = async () => {
    setIsLoading(true)
    try {
      const saved = await personalBrandApi.getAuditAnswers()
      setAnswers(saved)
    } finally {
      setIsLoading(false)
    }
  }

  // Save answers with debounce
  useEffect(() => {
    if (isLoading || Object.keys(answers).length === 0) return

    const timeout = setTimeout(async () => {
      setIsSaving(true)
      try {
        const categoryScores = Object.fromEntries(
          Object.keys(CATEGORIES).map(cat => [cat, getCategoryScore(cat)])
        )
        await personalBrandApi.saveAuditAnswers(answers, totalScore, categoryScores)
      } finally {
        setIsSaving(false)
      }
    }, 500)

    return () => clearTimeout(timeout)
  }, [answers])

  const toggleAnswer = (id: string) => {
    setAnswers(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const getCategoryScore = (category: string) => {
    const questions = AUDIT_QUESTIONS.filter(q => q.category === category)
    const answered = questions.filter(q => answers[q.id]).length
    return Math.round((answered / questions.length) * 100)
  }

  const totalScore = useMemo(() => {
    return Math.round(
      (Object.values(answers).filter(Boolean).length / AUDIT_QUESTIONS.length) * 100
    )
  }, [answers])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600'
    if (score >= 60) return 'text-amber-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-rose-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Starkt varumärke!'
    if (score >= 60) return 'Bra grund'
    if (score >= 40) return 'Potential att utveckla'
    return 'Behöver arbete'
  }

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return '🌟'
    if (score >= 60) return '👍'
    if (score >= 40) return '💪'
    return '🚀'
  }

  // Get recommended actions based on unchecked items
  const recommendedActions = useMemo(() => {
    return AUDIT_QUESTIONS
      .filter(q => !answers[q.id] && q.actionLink)
      .slice(0, 3)
  }, [answers])

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-12"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" aria-hidden="true" />
        <span className="sr-only">Laddar varumärkesaudit...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 border-violet-100 dark:border-violet-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 dark:from-violet-600 dark:to-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Varumärkesaudit</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Gå igenom frågorna för att analysera styrkan i ditt personliga varumärke.
              Dina svar sparas automatiskt i molnet.
            </p>
          </div>
          {isSaving && (
            <span className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Sparar...
            </span>
          )}
        </div>
      </Card>

      {/* Score overview */}
      <AnimatePresence>
        {Object.keys(answers).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-violet-200 dark:border-violet-700 bg-white dark:bg-stone-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  Din poäng
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResults(!showResults)}
                >
                  {showResults ? 'Dölj detaljer' : 'Visa detaljer'}
                </Button>
              </div>

              <div className="flex items-center gap-6">
                <div className="relative">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-slate-200 dark:text-stone-700"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * totalScore) / 100}
                      className={cn(
                        "transition-all duration-500",
                        totalScore >= 80 ? "text-emerald-500" :
                        totalScore >= 60 ? "text-amber-500" :
                        totalScore >= 40 ? "text-orange-500" : "text-rose-500"
                      )}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn("text-2xl font-bold", getScoreColor(totalScore))}>
                      {totalScore}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className={cn("text-lg font-semibold", getScoreColor(totalScore))}>
                    {getScoreEmoji(totalScore)} {getScoreLabel(totalScore)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {Object.values(answers).filter(Boolean).length} av {AUDIT_QUESTIONS.length} punkter uppfyllda
                  </p>
                </div>
              </div>

              {showResults && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-slate-100 dark:border-stone-700"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(CATEGORIES).map(([key, cat]) => {
                      const score = getCategoryScore(key)
                      const Icon = cat.icon
                      return (
                        <div key={key} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-stone-700">
                          <Icon className={cn(
                            "w-5 h-5 mx-auto mb-2",
                            score >= 70 ? "text-emerald-600 dark:text-emerald-400" :
                            score >= 40 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
                          )} />
                          <div className={cn(
                            "text-2xl font-bold",
                            score >= 70 ? "text-emerald-600 dark:text-emerald-400" :
                            score >= 40 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
                          )}>
                            {score}%
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300">{cat.label}</p>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recommended Actions */}
      {recommendedActions.length > 0 && totalScore < 80 && (
        <Card className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 border-violet-100 dark:border-violet-800">
          <h3 className="font-semibold text-violet-900 dark:text-violet-100 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            Rekommenderade nästa steg
          </h3>
          <div className="space-y-2">
            {recommendedActions.map((action) => (
              <Link
                key={action.id}
                to={action.actionLink!}
                className="flex items-center justify-between p-3 bg-white dark:bg-stone-800 rounded-xl border border-violet-100 dark:border-violet-700 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-sm transition-all group"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100">{action.actionLabel}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{action.question}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Questions by category */}
      {Object.entries(CATEGORIES).map(([categoryKey, category]) => {
        const Icon = category.icon
        const score = getCategoryScore(categoryKey)

        return (
          <Card key={categoryKey} className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Icon className={cn(
                  "w-5 h-5",
                  category.color === 'blue' && "text-blue-600 dark:text-blue-400",
                  category.color === 'violet' && "text-violet-600 dark:text-violet-400",
                  category.color === 'emerald' && "text-emerald-600 dark:text-emerald-400",
                  category.color === 'amber' && "text-amber-600 dark:text-amber-400"
                )} />
                {category.label}
              </span>
              <span className={cn(
                "text-sm font-medium px-3 py-1 rounded-full",
                score >= 70 ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300" :
                score >= 40 ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300" :
                "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300"
              )}>
                {score}%
              </span>
            </h3>

            <div className="space-y-3">
              {AUDIT_QUESTIONS.filter(q => q.category === categoryKey).map((question) => (
                <div key={question.id}>
                  <button
                    onClick={() => toggleAnswer(question.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                      answers[question.id]
                        ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700"
                        : "bg-slate-50 dark:bg-stone-700 border-slate-100 dark:border-stone-600 hover:border-slate-200 dark:hover:border-stone-500"
                    )}
                  >
                    {answers[question.id] ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-stone-500 shrink-0" />
                    )}
                    <span className={cn(
                      "flex-1 text-sm",
                      answers[question.id] ? "text-emerald-800 dark:text-emerald-200" : "text-gray-600 dark:text-gray-300"
                    )}>
                      {question.question}
                    </span>
                    {!answers[question.id] && question.actionLink && (
                      <Link
                        to={question.actionLink}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs px-2 py-1 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-full hover:bg-violet-200 dark:hover:bg-violet-800/50 transition-colors"
                      >
                        {question.actionLabel}
                      </Link>
                    )}
                  </button>

                  {/* Expandable tip */}
                  {question.tip && !answers[question.id] && (
                    <AnimatePresence>
                      {expandedTip === question.id ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="ml-8 mt-2 p-3 bg-violet-50 dark:bg-violet-900/30 rounded-lg border border-violet-100 dark:border-violet-700"
                        >
                          <p className="text-sm text-violet-800 dark:text-violet-200">
                            {question.tip}
                          </p>
                          <button
                            onClick={() => setExpandedTip(null)}
                            className="text-xs text-violet-600 dark:text-violet-400 mt-2 hover:underline"
                          >
                            Dölj tips
                          </button>
                        </motion.div>
                      ) : (
                        <button
                          onClick={() => setExpandedTip(question.id)}
                          className="ml-8 mt-1 text-xs text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400"
                        >
                          Visa tips
                        </button>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )
      })}

      {/* Reset button */}
      {Object.keys(answers).length > 0 && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm('Vill du återställa alla svar?')) {
                setAnswers({})
                setShowResults(false)
              }
            }}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Återställ audit
          </Button>
        </div>
      )}
    </div>
  )
}
