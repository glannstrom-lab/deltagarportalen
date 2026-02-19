import { useState } from 'react'
import { Sparkles, Wand2, RefreshCw, Check, AlertCircle, Globe, TrendingUp, Zap } from 'lucide-react'

interface AIWritingAssistantProps {
  text: string
  onApply: (newText: string) => void
  type: 'summary' | 'experience' | 'skills'
}

// OpenRouter API-konfiguration
const OPENROUTER_API_KEY = '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'
const OPENROUTER_MODEL = 'openai/gpt-oss-120b'

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

// Funktion för att anropa OpenRouter API
async function callOpenRouter(prompt: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Deltagarportalen CV Builder',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Du är en professionell CV-skrivare som hjälper jobbsökare att förbättra sina CV:n. Du skriver på svenska och ger konkreta, professionella förslag. Svara alltid kortfattat och direkt.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
    throw new Error(error.error?.message || `API-fel: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}

export function AIWritingAssistant({ text, onApply, type }: AIWritingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState('')
  const [activeFeature, setActiveFeature] = useState<'improve' | 'quantify' | 'translate' | null>(null)

  const analyzeText = () => {
    const foundWeakWords = powerWords.filter(pw => 
      text.toLowerCase().includes(pw.weak.toLowerCase())
    )
    return foundWeakWords
  }

  const improveWithAI = async () => {
    if (!text.trim()) {
      setError('Skriv något först innan du använder AI-förbättring.')
      return
    }

    setLoading(true)
    setError(null)
    setActiveFeature('improve')

    try {
      const prompt = `Förbättra följande CV-text för att göra den mer professionell och slagkraftig. Använd starka action-verb och konkreta formuleringar. Behåll samma betydelse men gör den mer övertygande:\n\n"${text}"\n\nGe bara den förbättrade texten, inga förklaringar. Max 3-4 meningar.`
      
      const improved = await callOpenRouter(prompt)
      setSuggestion(improved)
    } catch (err) {
      console.error('AI-fel:', err)
      setError(err instanceof Error ? err.message : 'Kunde inte kontakta AI-tjänsten.')
    } finally {
      setLoading(false)
    }
  }

  const quantifyWithAI = async () => {
    if (!text.trim()) {
      setError('Skriv något först innan du använder AI-förbättring.')
      return
    }

    setLoading(true)
    setError(null)
    setActiveFeature('quantify')

    try {
      const prompt = `Omskriv följande CV-text för att inkludera mätbara resultat och konkreta siffror där det är möjligt. Gör den mer resultatorienterad:\n\n"${text}"\n\nGe bara den förbättrade texten, inga förklaringar.`
      
      const quantified = await callOpenRouter(prompt)
      setSuggestion(quantified)
    } catch (err) {
      console.error('AI-fel:', err)
      setError(err instanceof Error ? err.message : 'Kunde inte kontakta AI-tjänsten.')
    } finally {
      setLoading(false)
    }
  }

  const translateToEnglish = async () => {
    if (!text.trim()) {
      setError('Skriv något först innan du översätter.')
      return
    }

    setLoading(true)
    setError(null)
    setActiveFeature('translate')

    try {
      const prompt = `Översätt följande CV-text från svenska till engelska. Använd professionell CV-terminologi:\n\n"${text}"\n\nGe bara den översatta texten, inga förklaringar.`
      
      const translated = await callOpenRouter(prompt)
      setSuggestion(translated)
    } catch (err) {
      console.error('AI-fel:', err)
      setError(err instanceof Error ? err.message : 'Kunde inte kontakta AI-tjänsten.')
    } finally {
      setLoading(false)
    }
  }

  const generateSuggestion = async () => {
    setLoading(true)
    setError(null)
    setActiveFeature(null)

    try {
      let prompt = ''
      
      if (type === 'summary') {
        prompt = `Skriv en professionell sammanfattning för ett CV baserat på följande information. Gör den slagkraftig och resultatorienterad:\n\n"${text}"\n\nGe bara texten, max 3-4 meningar.`
      } else if (type === 'experience') {
        prompt = `Skriv en professionell arbetsbeskrivning för ett CV baserat på följande. Använd starka verb och mätbara resultat:\n\n"${text}"\n\nGe bara texten, max 3-4 meningar.`
      } else if (type === 'skills') {
        prompt = `Formulera om följande kompetenser för ett CV. Gör dem mer professionella och CV-anpassade:\n\n"${text}"\n\nGe bara en komma-separerad lista.`
      }

      const result = await callOpenRouter(prompt)
      setSuggestion(result)
    } catch (err) {
      console.error('AI-fel:', err)
      setError(err instanceof Error ? err.message : 'Kunde inte kontakta AI-tjänsten.')
    } finally {
      setLoading(false)
    }
  }

  const applyPowerWords = () => {
    let improved = text
    powerWords.forEach(({ weak, strong }) => {
      improved = improved.replace(new RegExp(weak, 'gi'), strong)
    })
    onApply(improved)
  }

  const weakWords = analyzeText()

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-[#4f46e5] hover:text-[#4338ca] font-medium"
      >
        <Sparkles size={16} />
        AI-skrivhjälp
      </button>

      {isOpen && (
        <div className="mt-3 p-4 bg-[#eef2ff] rounded-xl border border-[#4f46e5]/20">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* AI Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            <button
              onClick={improveWithAI}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 hover:border-[#4f46e5]/30 transition-colors disabled:opacity-50"
            >
              <Zap size={16} className="text-amber-500" />
              Förbättra
            </button>
            <button
              onClick={quantifyWithAI}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 hover:border-[#4f46e5]/30 transition-colors disabled:opacity-50"
            >
              <TrendingUp size={16} className="text-green-500" />
              Kvantifiera
            </button>
            <button
              onClick={translateToEnglish}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 hover:border-[#4f46e5]/30 transition-colors disabled:opacity-50"
            >
              <Globe size={16} className="text-blue-500" />
              Översätt
            </button>
          </div>

          {/* Weak words detection */}
          {weakWords.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Hittade svaga formuleringar:
              </p>
              <div className="space-y-1">
                {weakWords.map((word, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className="text-red-500 line-through">{word.weak}</span>
                    <span>→</span>
                    <span className="text-green-600 font-medium">{word.strong}</span>
                  </div>
                ))}
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

          {/* Suggestion */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              {activeFeature === 'improve' && 'Förbättrad version:'}
              {activeFeature === 'quantify' && 'Med mätbara resultat:'}
              {activeFeature === 'translate' && 'Engelsk översättning:'}
              {!activeFeature && 'Förslag:'}
            </p>
            
            {suggestion ? (
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-700">{suggestion}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      onApply(suggestion)
                      setSuggestion('')
                      setActiveFeature(null)
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#4f46e5] text-white text-sm rounded-lg hover:bg-[#4338ca]"
                  >
                    <Check size={14} />
                    Använd
                  </button>
                  <button
                    onClick={generateSuggestion}
                    disabled={loading}
                    className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Nytt förslag
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={generateSuggestion}
                disabled={loading || !text.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    AI arbetar...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    {text.trim() ? 'Generera nytt förslag' : 'Skriv något först'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
