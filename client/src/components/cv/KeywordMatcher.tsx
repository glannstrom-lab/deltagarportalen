import { useState, useMemo } from 'react'
import { FileSearch, CheckCircle, XCircle, Copy, Lightbulb, ArrowRight } from 'lucide-react'
import type { CVData } from '@/services/mockApi'

interface KeywordMatcherProps {
  cvData: CVData
  jobDescription?: string
}

interface MatchResult {
  keyword: string
  found: boolean
  matchedIn: string[]
}

export function KeywordMatcher({ cvData, jobDescription = '' }: KeywordMatcherProps) {
  const [jobText, setJobText] = useState(jobDescription)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)

  // Extract keywords from job description
  const extractKeywords = (text: string): string[] => {
    // Common skill keywords and job requirements
    const commonKeywords = [
      'kommunikation', 'samarbete', 'ledarskap', 'organisering', 'problemlösning',
      'kundservice', 'försäljning', 'administration', 'ekonomi', 'marknadsföring',
      'projektledning', 'teamwork', 'självständig', 'ansvarsfull', 'noggrann',
      'flexibel', 'driven', 'positiv', 'serviceinriktad', 'lösningorienterad',
      'svenska', 'engelska', 'excel', 'word', 'powerpoint', 'office',
      'datorvana', 'b-körkort', 'körkort', 'språkkunskaper',
      'erfarenhet', 'utbildning', 'kompetens', 'kvalifikationer'
    ]
    
    const found: string[] = []
    const lowerText = text.toLowerCase()
    
    commonKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        found.push(keyword)
      }
    })
    
    return [...new Set(found)] // Remove duplicates
  }

  // Check if keyword exists in CV
  const checkKeywordInCV = (keyword: string): { found: boolean; locations: string[] } => {
    const locations: string[] = []
    const lowerKeyword = keyword.toLowerCase()
    
    // Check summary
    if (cvData.summary?.toLowerCase().includes(lowerKeyword)) {
      locations.push('Profil')
    }
    
    // Check work experience
    cvData.workExperience?.forEach((job, i) => {
      if (job.description?.toLowerCase().includes(lowerKeyword) ||
          job.title?.toLowerCase().includes(lowerKeyword)) {
        locations.push(`Erfarenhet ${i + 1}`)
      }
    })
    
    // Check skills
    cvData.skills?.forEach(skill => {
      if (skill.name?.toLowerCase().includes(lowerKeyword)) {
        locations.push('Kompetenser')
      }
    })
    
    // Check education
    cvData.education?.forEach((edu, i) => {
      if (edu.field?.toLowerCase().includes(lowerKeyword) ||
          edu.degree?.toLowerCase().includes(lowerKeyword)) {
        locations.push(`Utbildning ${i + 1}`)
      }
    })
    
    return { found: locations.length > 0, locations }
  }

  const analysis = useMemo(() => {
    if (!jobText.trim()) return null
    
    const keywords = extractKeywords(jobText)
    const matches: MatchResult[] = keywords.map(keyword => {
      const { found, locations } = checkKeywordInCV(keyword)
      return { keyword, found, matchedIn: locations }
    })
    
    const foundCount = matches.filter(m => m.found).length
    const missingCount = matches.length - foundCount
    const matchPercentage = keywords.length > 0 ? Math.round((foundCount / keywords.length) * 100) : 0
    
    // Generate suggestions
    const suggestions: string[] = []
    if (matchPercentage < 50) {
      suggestions.push('Överväg att lägga till fler nyckelord från annonsen i ditt CV')
    }
    if (missingCount > 0) {
      suggestions.push('De saknade nyckelorden kan läggas i kompetens- eller erfarenhetsavsnittet')
    }
    if (matchPercentage >= 80) {
      suggestions.push('Bra matchning! Ditt CV innehåller många av de efterfrågade kompetenserna')
    }
    
    return {
      keywords,
      matches,
      foundCount,
      missingCount,
      matchPercentage,
      suggestions
    }
  }, [jobText, cvData])

  const copyMissingKeywords = () => {
    if (!analysis) return
    const missing = analysis.matches
      .filter(m => !m.found)
      .map(m => m.keyword)
      .join(', ')
    navigator.clipboard.writeText(missing)
  }

  const getAlternativePhrasings = (keyword: string): string[] => {
    const alternatives: Record<string, string[]> = {
      'kommunikation': ['kommunikationsförmåga', 'kommunikativ', 'talar och skriver'],
      'samarbete': ['teamwork', 'samarbeta', 'lagarbete'],
      'ledarskap': ['leda', 'ledare', 'projektledning'],
      'organisering': ['organisera', 'strukturerad', 'administrativ'],
      'problemlösning': ['lösa problem', 'lösningorienterad', 'analytisk'],
      'kundservice': ['kundbemötande', 'serviceinriktad', 'kundorienterad'],
      'försäljning': ['sälja', 'säljare', 'försäljningserfarenhet'],
    }
    return alternatives[keyword] || []
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-teal-50 rounded-lg">
          <FileSearch className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">Matcha mot jobbannons</h3>
          <p className="text-sm text-slate-500">Klistra in en jobbannons för att se matchning</p>
        </div>
      </div>

      {/* Job Description Input */}
      <div className="mb-4">
        <textarea
          value={jobText}
          onChange={(e) => {
            setJobText(e.target.value)
            setHasAnalyzed(false)
          }}
          placeholder="Klistra in texten från en jobbannons här..."
          className="w-full p-3 border border-slate-200 rounded-xl resize-y min-h-[120px] text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        <button
          onClick={() => setHasAnalyzed(true)}
          disabled={!jobText.trim()}
          className="mt-2 w-full py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:bg-slate-200 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <FileSearch className="w-4 h-4" />
          Analysera matchning
        </button>
      </div>

      {/* Analysis Results */}
      {hasAnalyzed && analysis && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Match Score */}
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-2 ${
              analysis.matchPercentage >= 80 ? 'bg-green-100 text-green-600' :
              analysis.matchPercentage >= 50 ? 'bg-amber-100 text-amber-600' :
              'bg-rose-100 text-rose-600'
            }`}>
              <span className="text-2xl font-bold">{analysis.matchPercentage}%</span>
            </div>
            <p className="text-sm text-slate-600">
              {analysis.foundCount} av {analysis.keywords.length} nyckelord hittade
            </p>
          </div>

          {/* Keyword Matches */}
          {analysis.keywords.length > 0 && (
            <div>
              <h4 className="font-medium text-slate-700 mb-2">Nyckelordsmatchning</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {analysis.matches.map((match) => (
                  <div 
                    key={match.keyword}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      match.found ? 'bg-green-50' : 'bg-rose-50'
                    }`}
                  >
                    {match.found ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    )}
                    <span className={`text-sm flex-1 ${
                      match.found ? 'text-green-800' : 'text-rose-800'
                    }`}>
                      {match.keyword}
                    </span>
                    {match.found && match.matchedIn.length > 0 && (
                      <span className="text-xs text-green-600">
                        {match.matchedIn.join(', ')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Keywords Action */}
          {analysis.missingCount > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-amber-800">
                  {analysis.missingCount} saknade nyckelord
                </span>
                <button
                  onClick={copyMissingKeywords}
                  className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Kopiera
                </button>
              </div>
              <p className="text-xs text-amber-700">
                {analysis.matches
                  .filter(m => !m.found)
                  .map(m => m.keyword)
                  .join(', ')}
              </p>
            </div>
          )}

          {/* Alternative Phrasings */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Alternativa formuleringar</span>
            </div>
            <p className="text-xs text-blue-700 mb-2">
              Om du har erfarenheten men inte exakt de orden:
            </p>
            <div className="space-y-1">
              {analysis.matches
                .filter(m => !m.found)
                .slice(0, 3)
                .map(match => {
                  const alternatives = getAlternativePhrasings(match.keyword)
                  if (alternatives.length === 0) return null
                  return (
                    <div key={match.keyword} className="text-xs text-blue-700">
                      <span className="font-medium">{match.keyword}:</span>{' '}
                      {alternatives.join(', ')}
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-teal-600" />
                Rekommendationer
              </h4>
              <ul className="space-y-1">
                {analysis.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-teal-500 mt-1">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default KeywordMatcher
