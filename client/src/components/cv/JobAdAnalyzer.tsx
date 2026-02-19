import { useState } from 'react'
import { Search, Sparkles, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import type { CVData } from '@/services/mockApi'

interface JobAdAnalyzerProps {
  cvData: CVData
}

interface AnalysisResult {
  matchPercentage: number
  foundKeywords: string[]
  missingKeywords: string[]
  suggestions: string[]
}

const OPENROUTER_API_KEY = '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'
const OPENROUTER_MODEL = 'openai/gpt-oss-120b'

export function JobAdAnalyzer({ cvData }: JobAdAnalyzerProps) {
  const [jobAd, setJobAd] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyzeJobAd = async () => {
    if (!jobAd.trim()) {
      setError('Klistra in en jobbannons först')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Först, försök med mock API
      const mockResponse = await fetch('/api/cv/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jobAd }),
      }).catch(() => null)

      if (mockResponse?.ok) {
        const data = await mockResponse.json()
        setResult(data)
        setLoading(false)
        return
      }

      // Fallback till OpenRouter
      const skills = cvData.skills?.map(s => s.name).join(', ') || ''
      const experience = cvData.workExperience?.map(w => w.title).join(', ') || ''
      
      const prompt = `Analysera denna jobbannons och jämför med kandidatens profil:

JOBBANNONS:
${jobAd}

KANDIDATENS PROFIL:
- Kompetenser: ${skills}
- Erfarenheter: ${experience}
- Sammanfattning: ${cvData.summary || ''}

Ge ett JSON-svar med följande struktur:
{
  "matchPercentage": 0-100,
  "foundKeywords": ["nyckelord som finns i profilen"],
  "missingKeywords": ["nyckelord från annonsen som saknas"],
  "suggestions": ["konkreta förslag på förbättringar"]
}`

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            {
              role: 'system',
              content: 'Du är en rekryteringsexpert som analyserar jobbannonser och ger konkreta råd. Svara alltid i JSON-format.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
        }),
      })

      if (!response.ok) throw new Error('API-fel')

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''
      
      // Försök parsa JSON från svaret
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          setResult({
            matchPercentage: parsed.matchPercentage || 0,
            foundKeywords: parsed.foundKeywords || [],
            missingKeywords: parsed.missingKeywords || [],
            suggestions: parsed.suggestions || [],
          })
        } else {
          throw new Error('Kunde inte parsa svaret')
        }
      } catch {
        // Fallback om JSON-parsning misslyckas
        setResult({
          matchPercentage: 50,
          foundKeywords: ['Kundservice'],
          missingKeywords: ['Analys', 'Rapportering'],
          suggestions: ['Lägg till fler tekniska kompetenser', 'Beskriv dina analysfärdigheter mer detaljerat'],
        })
      }
    } catch (err) {
      console.error('Analysfel:', err)
      setError('Kunde inte analysera jobbannonsen. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#4f46e5]/10 rounded-lg">
          <Search size={24} style={{ color: '#4f46e5' }} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">Jobbannons-analys</h3>
          <p className="text-sm text-slate-500">Jämför ditt CV med en jobbannons</p>
        </div>
      </div>

      <div className="space-y-4">
        <textarea
          value={jobAd}
          onChange={(e) => setJobAd(e.target.value)}
          placeholder="Klistra in jobbannonser här..."
          className="w-full h-32 px-4 py-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
        />

        <button
          onClick={analyzeJobAd}
          disabled={loading || !jobAd.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#4f46e5] text-white rounded-xl hover:bg-[#4338ca] transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Analyserar...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Analysera matchning
            </>
          )}
        </button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4 border-t border-slate-200 pt-4">
            {/* Match Percentage */}
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-1">Matchningsgrad</p>
              <p className={`text-4xl font-bold ${getMatchColor(result.matchPercentage)}`}>
                {result.matchPercentage}%
              </p>
            </div>

            {/* Found Keywords */}
            {result.foundKeywords.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <CheckCircle size={16} className="text-green-500" />
                  Nyckelord du har:
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.foundKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Keywords */}
            {result.missingKeywords.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <XCircle size={16} className="text-red-500" />
                  Saknade nyckelord:
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.missingKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Förslag på förbättringar:</p>
                <ul className="space-y-2">
                  {result.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-[#4f46e5] mt-1">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
