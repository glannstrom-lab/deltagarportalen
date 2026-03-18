/**
 * Brand Audit Tab - Analyze your personal brand
 */
import { useState, useEffect } from 'react'
import { ClipboardCheck, CheckCircle, Circle, AlertCircle, Star, TrendingUp, Sparkles } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface AuditQuestion {
  id: string
  question: string
  category: 'online' | 'content' | 'network' | 'consistency'
}

const AUDIT_QUESTIONS: AuditQuestion[] = [
  // Online presence
  { id: 'linkedin-profile', question: 'Har du en uppdaterad LinkedIn-profil?', category: 'online' },
  { id: 'linkedin-photo', question: 'Har du ett professionellt profilfoto?', category: 'online' },
  { id: 'linkedin-headline', question: 'Beskriver din LinkedIn-rubrik vad du gör/söker?', category: 'online' },
  { id: 'google-search', question: 'Har du googlat ditt namn nyligen?', category: 'online' },
  { id: 'personal-website', question: 'Har du en egen hemsida eller portfolio?', category: 'online' },

  // Content
  { id: 'share-content', question: 'Delar du branschrelevant innehåll på LinkedIn?', category: 'content' },
  { id: 'own-content', question: 'Skapar du eget innehåll (artiklar, inlägg)?', category: 'content' },
  { id: 'engage-others', question: 'Engagerar du dig i andras inlägg regelbundet?', category: 'content' },
  { id: 'expertise-shown', question: 'Visar ditt innehåll din expertis?', category: 'content' },

  // Network
  { id: 'active-network', question: 'Nätverkar du aktivt (online eller offline)?', category: 'network' },
  { id: 'industry-events', question: 'Deltar du i branschevent eller meetups?', category: 'network' },
  { id: 'mentors', question: 'Har du mentorer eller rådgivare i din bransch?', category: 'network' },
  { id: 'recommendations', question: 'Har du LinkedIn-rekommendationer?', category: 'network' },

  // Consistency
  { id: 'consistent-message', question: 'Är ditt budskap konsekvent över alla plattformar?', category: 'consistency' },
  { id: 'unique-value', question: 'Kan du tydligt beskriva ditt unika värde?', category: 'consistency' },
  { id: 'target-audience', question: 'Vet du vem din målgrupp är?', category: 'consistency' },
]

const CATEGORIES = {
  online: { label: 'Digital närvaro', color: 'blue' },
  content: { label: 'Innehåll', color: 'violet' },
  network: { label: 'Nätverk', color: 'emerald' },
  consistency: { label: 'Konsekvens', color: 'amber' },
}

export default function BrandAuditTab() {
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [showResults, setShowResults] = useState(false)

  // Load saved answers
  useEffect(() => {
    const saved = localStorage.getItem('brand-audit-answers')
    if (saved) {
      setAnswers(JSON.parse(saved))
    }
  }, [])

  // Save answers
  useEffect(() => {
    localStorage.setItem('brand-audit-answers', JSON.stringify(answers))
  }, [answers])

  const toggleAnswer = (id: string) => {
    setAnswers(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const getCategoryScore = (category: string) => {
    const questions = AUDIT_QUESTIONS.filter(q => q.category === category)
    const answered = questions.filter(q => answers[q.id]).length
    return Math.round((answered / questions.length) * 100)
  }

  const totalScore = Math.round(
    (Object.values(answers).filter(Boolean).length / AUDIT_QUESTIONS.length) * 100
  )

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Varumärkesaudit</h2>
            <p className="text-slate-600 mt-1">
              Gå igenom frågorna för att analysera styrkan i ditt personliga varumärke.
              Dina svar sparas automatiskt.
            </p>
          </div>
        </div>
      </Card>

      {/* Quick score overview */}
      {Object.keys(answers).length > 0 && (
        <Card className="border-violet-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Din poäng
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResults(!showResults)}
            >
              {showResults ? 'Dölj resultat' : 'Visa resultat'}
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className={cn("text-4xl font-bold", getScoreColor(totalScore))}>
              {totalScore}%
            </div>
            <div>
              <p className={cn("font-medium", getScoreColor(totalScore))}>
                {getScoreLabel(totalScore)}
              </p>
              <p className="text-sm text-slate-500">
                {Object.values(answers).filter(Boolean).length} av {AUDIT_QUESTIONS.length} punkter
              </p>
            </div>
          </div>

          {showResults && (
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(CATEGORIES).map(([key, cat]) => {
                const score = getCategoryScore(key)
                return (
                  <div key={key} className="text-center">
                    <div className={cn(
                      "text-2xl font-bold",
                      score >= 70 ? "text-emerald-600" :
                      score >= 40 ? "text-amber-600" : "text-rose-600"
                    )}>
                      {score}%
                    </div>
                    <p className="text-xs text-slate-500">{cat.label}</p>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {/* Questions by category */}
      {Object.entries(CATEGORIES).map(([categoryKey, category]) => (
        <Card key={categoryKey}>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center justify-between">
            <span>{category.label}</span>
            <span className={cn(
              "text-sm font-medium px-2 py-1 rounded-full",
              getCategoryScore(categoryKey) >= 70 ? "bg-emerald-100 text-emerald-700" :
              getCategoryScore(categoryKey) >= 40 ? "bg-amber-100 text-amber-700" :
              "bg-rose-100 text-rose-700"
            )}>
              {getCategoryScore(categoryKey)}%
            </span>
          </h3>

          <div className="space-y-3">
            {AUDIT_QUESTIONS.filter(q => q.category === categoryKey).map((question) => (
              <button
                key={question.id}
                onClick={() => toggleAnswer(question.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                  answers[question.id]
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-slate-50 border-slate-100 hover:border-slate-200"
                )}
              >
                {answers[question.id] ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                )}
                <span className={cn(
                  "text-sm",
                  answers[question.id] ? "text-emerald-800" : "text-slate-700"
                )}>
                  {question.question}
                </span>
              </button>
            ))}
          </div>
        </Card>
      ))}

      {/* Recommendations */}
      {totalScore > 0 && totalScore < 70 && (
        <Card className="bg-blue-50 border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Rekommenderade nästa steg
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            {getCategoryScore('online') < 60 && (
              <li className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Uppdatera din LinkedIn-profil med professionellt foto och tydlig rubrik</span>
              </li>
            )}
            {getCategoryScore('content') < 60 && (
              <li className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Börja dela branschrelevant innehåll minst en gång i veckan</span>
              </li>
            )}
            {getCategoryScore('network') < 60 && (
              <li className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Delta i ett branschevent eller nätverksträff denna månad</span>
              </li>
            )}
            {getCategoryScore('consistency') < 60 && (
              <li className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Definiera ditt unika värde - vad skiljer dig från andra?</span>
              </li>
            )}
          </ul>
        </Card>
      )}

      {/* Reset button */}
      {Object.keys(answers).length > 0 && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAnswers({})
              setShowResults(false)
            }}
          >
            Återställ audit
          </Button>
        </div>
      )}
    </div>
  )
}
