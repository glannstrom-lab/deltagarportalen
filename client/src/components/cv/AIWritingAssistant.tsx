import { useState } from 'react'
import { Sparkles, Wand2, RefreshCw, Check } from 'lucide-react'

interface AIWritingAssistantProps {
  text: string
  onApply: (newText: string) => void
  type: 'summary' | 'experience' | 'skills'
}

const suggestions: Record<string, string[]> = {
  summary: [
    'Erfaren [yrke] med stark bakgrund inom [område]. Skicklig på att [färdighet] med ett track record av [resultat].',
    'Driven och resultatorienterad [yrke] med [X] års erfarenhet av [område]. Specialiserad på [specialitet].',
    'Kreativ problemlösare med bred kompetens inom [område]. Brinner för att [vad du gör] och skapar [resultat].',
  ],
  experience: [
    'Ledde och utvecklade ett team om [antal] personer, vilket resulterade i [resultat].',
    'Ansvarade för [område] och ökade [mätbarhet] med [procent]% under [tidsperiod].',
    'Implementerade [system/process] som förbättrade [aspekt] och sparade [antal] timmar per vecka.',
    'Drev framgångsrika projekt från start till mål, inklusive [specifikt projekt] som [resultat].',
  ],
  skills: [
    'Projektledning, Teamledning, Kommunikation, Problemlösning, Tidsplanering',
    'Kundservice, Försäljning, Förhandling, Relationsbyggande, Kundvård',
    'Dataanalys, Rapportskrivning, Excel, PowerPoint, Kvalitetssäkring',
    'Digital marknadsföring, Sociala medier, SEO, Innehållsproduktion, Analys',
  ],
}

const powerWords = [
  { weak: 'var ansvarig för', strong: 'ledde' },
  { weak: 'hjälpte till med', strong: 'drev' },
  { weak: 'gjorde', strong: 'utförde' },
  { weak: 'arbetade med', strong: 'specialiserade mig på' },
  { weak: 'fick', strong: 'uppnådde' },
  { weak: 'bra på', strong: 'expert inom' },
]

export function AIWritingAssistant({ text, onApply, type }: AIWritingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState('')

  const analyzeText = () => {
    // Hitta svaga ord
    const foundWeakWords = powerWords.filter(pw => 
      text.toLowerCase().includes(pw.weak.toLowerCase())
    )
    
    return foundWeakWords
  }

  const generateSuggestion = () => {
    setLoading(true)
    // Simulera AI-anrop
    setTimeout(() => {
      const typeSuggestions = suggestions[type]
      const random = typeSuggestions[Math.floor(Math.random() * typeSuggestions.length)]
      setSuggestion(random)
      setLoading(false)
    }, 1000)
  }

  const improveText = () => {
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
                onClick={improveText}
                className="mt-2 flex items-center gap-1 px-3 py-1.5 bg-[#4f46e5] text-white text-sm rounded-lg hover:bg-[#4338ca]"
              >
                <Wand2 size={14} />
                Förbättra automatiskt
              </button>
            </div>
          )}

          {/* Suggestions */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              Förslag på formuleringar:
            </p>
            
            {suggestion ? (
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-700">{suggestion}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      onApply(suggestion)
                      setSuggestion('')
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#4f46e5] text-white text-sm rounded-lg hover:bg-[#4338ca]"
                  >
                    <Check size={14} />
                    Använd
                  </button>
                  <button
                    onClick={generateSuggestion}
                    className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50"
                  >
                    <RefreshCw size={14} />
                    Nytt förslag
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={generateSuggestion}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Genererar...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generera förslag
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
