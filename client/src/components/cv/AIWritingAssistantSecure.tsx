/**
 * AI Writing Assistant - Säker version
 * Använder server-side Edge Function istället för direkt API-nyckel
 * Kräver AI-samtycke för att fungera
 */

import { useState } from 'react'
import { Sparkles, Wand2, RefreshCw, Check, AlertCircle, Globe, TrendingUp, Zap, Shield } from '@/components/ui/icons'
import { AiConsentGate } from '@/components/ai/AiConsentGate'
import { useAiConsent } from '@/hooks/useAiConsent'

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

// Feature-konfiguration
const features = {
  improve: {
    label: 'Förbättra',
    icon: Zap,
    color: 'text-amber-500',
    description: 'Gör texten mer professionell och slagkraftig'
  },
  quantify: {
    label: 'Kvantifiera',
    icon: TrendingUp,
    color: 'text-brand-700',
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
    color: 'text-brand-700',
    description: 'Skapa ny text baserat på din input'
  }
}

export function AIWritingAssistantSecure({ content, onChange, type }: AIWritingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState('')
  const [activeFeature, setActiveFeature] = useState<keyof typeof features | null>(null)
  const [requestCount, setRequestCount] = useState(0)
  const [lastRequestTime, setLastRequestTime] = useState(0)
  const { hasConsent } = useAiConsent()

  // Client-side rate limiting
  const checkClientRateLimit = (): boolean => {
    const now = Date.now()
    const windowStart = now - 60000 // 1 minute window
    
    if (lastRequestTime < windowStart) {
      setRequestCount(1)
      setLastRequestTime(now)
      return true
    }
    
    if (requestCount >= 10) {
      return false
    }
    
    setRequestCount(prev => prev + 1)
    return true
  }

  // Använd den säkra Edge Function
  const callSecureAI = async (feature: keyof typeof features) => {
    if (!content?.trim()) {
      setError('Skriv något först innan du använder AI-förbättring.')
      return
    }

    // Client-side rate limiting
    if (!checkClientRateLimit()) {
      setError('Du har nått gränsen för AI-anrop. Vänta en minut och försök igen.')
      return
    }

    setLoading(true)
    setError(null)
    setActiveFeature(feature)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Du måste vara inloggad för att använda AI-funktioner.')
      }

      const response = await fetch('/functions/ai-cv-writing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          content,
          type,
          feature
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 429) {
          throw new Error('För många förfrågningar. Vänta en stund och försök igen.')
        }
        if (response.status === 401) {
          throw new Error('Din session har gått ut. Logga in igen.')
        }
        
        throw new Error(errorData.error || `Serverfel: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error('AI kunde inte generera ett svar.')
      }

      setSuggestion(data.result)
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
        className="flex items-center gap-2 text-sm text-brand-900 hover:text-brand-900 font-medium"
      >
        <Shield size={16} />
        <Sparkles size={16} />
        <span>AI-skrivhjälp (Säker)</span>
      </button>

      {isOpen && (
        <div className="mt-3">
          {/* Check for AI consent */}
          {!hasConsent ? (
            <AiConsentGate compact featureName="AI-skrivhjälp" />
          ) : (
          <div className="p-4 bg-brand-50 rounded-xl border border-brand-200">
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
            {(Object.keys(features) as Array<keyof typeof features>).map((key) => {
              const feat = features[key]
              const Icon = feat.icon
              return (
                <button
                  key={key}
                  onClick={() => callSecureAI(key)}
                  disabled={loading}
                  className="flex flex-col items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 hover:border-brand-300 transition-colors disabled:opacity-50"
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
                className="mt-2 flex items-center gap-1 px-3 py-1.5 bg-brand-900 text-white text-sm rounded-lg hover:bg-brand-900"
              >
                <Wand2 size={14} />
                Ersätt automatiskt
              </button>
            </div>
          )}

          {/* Suggestion */}
          {loading && (
            <div className="p-4 bg-white rounded-lg border border-slate-200 text-center">
              <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-brand-900" />
              <p className="text-sm text-slate-600">AI arbetar...</p>
              <p className="text-xs text-slate-600 mt-1">Detta kan ta några sekunder</p>
            </div>
          )}

          {!loading && suggestion && (
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <p className="text-xs font-medium text-slate-700 mb-2 uppercase tracking-wide">
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
                  className="flex items-center gap-1 px-3 py-1.5 bg-brand-900 text-white text-sm rounded-lg hover:bg-brand-900"
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

          {!loading && !suggestion && (
            <div className="text-center py-4 text-slate-700 text-sm">
              Välj en funktion ovan för att få hjälp av AI
            </div>
          )}
        </div>
          )}
        </div>
      )}
    </div>
  )
}

// Import supabase
import { supabase } from '@/lib/supabase'

export default AIWritingAssistantSecure
