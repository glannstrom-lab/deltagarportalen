import { useState } from 'react'
import { Target, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react'

interface JobMatcherProps {
  cvSkills: string
  cvSummary: string
}

export function JobMatcher({ cvSkills, cvSummary }: JobMatcherProps) {
  const [jobDescription, setJobDescription] = useState('')
  const [analysis, setAnalysis] = useState<{
    matchPercentage: number
    foundKeywords: string[]
    missingKeywords: string[]
    suggestions: string[]
  } | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  const analyzeJob = () => {
    setAnalyzing(true)
    
    // Simulera analys
    setTimeout(() => {
      // Extrahera vanliga nyckelord från jobbannonsen
      const commonKeywords = [
        'teamwork', 'kommunikation', 'ledarskap', 'projektledning',
        'kundservice', 'försäljning', 'marknadsföring', 'analys',
        'excel', 'powerpoint', 'engelska', 'svenska',
        'självständig', 'driven', 'noggrann', 'flexibel'
      ]
      
      const found: string[] = []
      const missing: string[] = []
      
      const cvText = (cvSkills + ' ' + cvSummary).toLowerCase()
      
      commonKeywords.forEach(keyword => {
        if (jobDescription.toLowerCase().includes(keyword)) {
          if (cvText.includes(keyword)) {
            found.push(keyword)
          } else {
            missing.push(keyword)
          }
        }
      })
      
      const percentage = Math.round((found.length / (found.length + missing.length)) * 100) || 0
      
      setAnalysis({
        matchPercentage: percentage,
        foundKeywords: found,
        missingKeywords: missing,
        suggestions: missing.length > 0 
          ? [`Överväg att lägga till: ${missing.slice(0, 3).join(', ')}`]
          : ['Bra jobbat! Ditt CV matchar väl med jobbannonsen.']
      })
      setAnalyzing(false)
    }, 1500)
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#4f46e5]/10 rounded-lg">
          <Target size={24} style={{ color: '#4f46e5' }} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">Jobbmatchning</h3>
          <p className="text-sm text-slate-500">Jämför ditt CV med en jobbannons</p>
        </div>
      </div>

      {!analysis ? (
        <div className="space-y-4">
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Klistra in jobbannonsen här..."
            className="w-full h-32 p-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          />
          <button
            onClick={analyzeJob}
            disabled={!jobDescription.trim() || analyzing}
            className="w-full py-3 bg-[#4f46e5] text-white rounded-xl font-medium hover:bg-[#4338ca] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyserar...
              </>
            ) : (
              <>
                <Target size={18} />
                Analysera matchning
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Match percentage */}
          <div className="flex items-center justify-center">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white"
              style={{ 
                backgroundColor: analysis.matchPercentage >= 70 
                  ? '#10b981' 
                  : analysis.matchPercentage >= 40 
                    ? '#f59e0b' 
                    : '#ef4444'
              }}
            >
              {analysis.matchPercentage}%
            </div>
          </div>

          {/* Keywords found */}
          {analysis.foundKeywords.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <CheckCircle size={16} className="text-green-500" />
                Nyckelord du har ({analysis.foundKeywords.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.foundKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing keywords */}
          {analysis.missingKeywords.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                <XCircle size={16} className="text-red-500" />
                Saknade nyckelord ({analysis.missingKeywords.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.missingKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1"
                  >
                    {keyword}
                    <Plus size={12} className="cursor-pointer" />
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          <div className="p-3 bg-[#eef2ff] rounded-lg">
            <p className="text-sm font-medium text-[#4f46e5] mb-1 flex items-center gap-1">
              <AlertCircle size={16} />
              Tips
            </p>
            {analysis.suggestions.map((suggestion, index) => (
              <p key={index} className="text-sm text-slate-700">{suggestion}</p>
            ))}
          </div>

          <button
            onClick={() => {
              setAnalysis(null)
              setJobDescription('')
            }}
            className="w-full py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
          >
            Analysera ny annons
          </button>
        </div>
      )}
    </div>
  )
}
