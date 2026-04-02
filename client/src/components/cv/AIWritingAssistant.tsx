/**
 * AI Writing Assistant - Säker version
 * Använder server-side Vercel API med autentisering
 */

import { useState } from 'react'
import { Sparkles, Wand2, RefreshCw, Check, AlertCircle, Globe, TrendingUp, Zap, Shield } from '@/components/ui/icons'
import { callAI } from '@/services/aiApi'

interface AIWritingAssistantProps {
  content: string
  onChange: (newText: string) => void
  type: 'summary' | 'experience' | 'skills'
}

const powerWords = [
  { weak: 'var ansvarig för', strong: 'ledde' },
  { weak: 'hjälpte till med', strong: 'drev' },
  { weak: 'gjorde', strong: 'utförde' },
  { weak: 'arbetade med', strong: 'specialiserade mig på' },
  { weak: 'fick', strong: 'uppnådde' },
  { weak: 'bra på', strong: 'expert inom' },
  { weak: 'assisterade', strong: 'stödjade' },
  { weak: 'gick med på', strong: 'åtog mig' },
  { weak: 'tittade på', strong: 'analyserade' },
  { weak: 'fixade', strong: 'löste' },
]

type FeatureType = 'improve' | 'quantify' | 'translate' | 'generate'

const features: Record<FeatureType, { label: string; icon: typeof Zap; color: string; description: string }> = {
  improve: {
    label: 'Förbättra',
    icon: Zap,
    color: 'text-amber-500',
    description: 'Gör texten mer professionell och slagkraftig'
  },
  quantify: {
    label: 'Kvantifiera',
    icon: TrendingUp,
    color: 'text-green-500',
    description: 'Lägg till mätbara resultat och siffror'
  },
  translate: {
    label: 'Översätt',
    icon: Globe,
    color: 'text-blue-500',
    description: 'Översätt till engelska'
  },
  generate: {
    label: 'Generera',
    icon: Sparkles,
    color: 'text-violet-500',
    description: 'Skapa ny text baserat på din input'
  }
}

export function AIWritingAssistant({ content, onChange, type }: AIWritingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState('')
  const [activeFeature, setActiveFeature] = useState<FeatureType | null>(null)

  // SÄKER implementation - anropa autentiserat API
  const callSecureAI = async (feature: FeatureType) => {
    if (!content?.trim()) {
      setError('Skriv något först innan du använder AI-förbättring.')
      return
    }

    setLoading(true)
    setError(null)
    setActiveFeature(feature)

    try {
      const data = await callAI<{ result: string }>('cv-writing', {
        content,
        type,
        feature
      })

      if (!data.success) {
        throw new Error('AI kunde inte generera ett svar.')
      }

      setSuggestion((data as { result?: string }).result || '')
    } catch (err) {
      console.error('AI-fel:', err)
      setError(err instanceof Error ? err.message : 'Kunde inte kontakta AI-tjänsten.')
    } finally {
      setLoading(false)
    }
  }

  const analyzeText = () => {
    if (!content) return [];
    const foundWeakWords = powerWords.filter(pw => 
      content.toLowerCase().includes(pw.weak?.toLowerCase())
    )
    return foundWeakWords
  }

  const applyPowerWords = () => {
    let improved = content || ''
    powerWords.forEach(({ weak, strong }) => {
      improved = improved.replace(new RegExp(weak, 'gi'), strong)
    })
    onChange(improved)
  }

  const weakWords = analyzeText()

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-[#4f46e5] hover:text-[#4338ca] font-medium"
      >
        <Shield size={16} />
        <Sparkles size={16} />
        <span>AI-skrivhjälp</span>
      </button>

      {isOpen && (
        <div className="mt-3 p-4 bg-[#eef2ff] rounded-xl border border-[#4f46e5]/20">
          {/* Säkerhetsbadge */}
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-emerald-700">
              Säker anslutning via server
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* AI Features */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {(Object.keys(features) as FeatureType[]).map((key) => {
              const feat = features[key]
              const Icon = feat.icon
              return (
                <button
                  key={key}
                  onClick={() => callSecureAI(key)}
                  disabled={loading}
                  className="flex flex-col items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 hover:border-[#4f46e5]/30 transition-colors disabled:opacity-50"
                  title={feat.description}
                >
                  <Icon size={18} className={feat.color} />
                  <span className="text-xs">{feat.label}</span>
                </button>
              )
            })}
          </div>

          {/* Weak words detection */}
          {weakWords.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-800 mb-2">
                Hittade svaga formuleringar:
              </p>
              <div className="space-y-1">
                {weakWords.slice(0, 3).map((word, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className="text-amber-700 line-through">{word.weak}</span>
                    <span className="text-amber-600">→</span>
                    <span className="text-emerald-700 font-medium">{word.strong}</span>
                  </div>
                ))}
                {weakWords.length > 3 && (
                  <p className="text-xs text-amber-600">
                    +{weakWords.length - 3} till...
                  </p>
                )}
              </div>
              <button
                onClick={applyPowerWords}
                className="mt-2 flex items-center gap-1 px-3 py-1.5 bg-[#4f46e5] text-white text-sm rounded-lg hover:bg-[#4338ca]"
              >
                <Wand2 size={14} />
                Ersätt automatiskt
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="p-4 bg-white rounded-lg border border-slate-200 text-center">
              <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[#4f46e5]" />
              <p className="text-sm text-slate-600">AI arbetar...</p>
              <p className="text-xs text-slate-400 mt-1">Detta kan ta några sekunder</p>
            </div>
          )}

          {/* Suggestion */}
          {!loading && suggestion && (
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                {activeFeature && features[activeFeature]?.label}
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{suggestion}</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    onChange(suggestion)
                    setSuggestion('')
                    setActiveFeature(null)
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#4f46e5] text-white text-sm rounded-lg hover:bg-[#4338ca]"
                >
                  <Check size={14} />
                  Använd
                </button>
                <button
                  onClick={() => {
                    setSuggestion('')
                    setActiveFeature(null)
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50"
                >
                  Avbryt
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !suggestion && !error && (
            <div className="text-center py-4 text-slate-500 text-sm">
              Välj en funktion ovan för att få hjälp av AI
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AIWritingAssistant
