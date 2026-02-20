import { useState } from 'react'
import { 
  Sparkles, 
  Target, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react'
import { afApi } from '@/services/arbetsformedlingenApi'
import type { CVData } from '@/services/mockApi'

interface CVOptimizerProps {
  cvData: CVData
}

export default function CVOptimizer({ cvData }: CVOptimizerProps) {
  const [targetJob, setTargetJob] = useState('')
  const [optimization, setOptimization] = useState<{
    suggestions: string[]
    keywords_to_add: string[]
    skills_to_highlight: string[]
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null)

  const optimize = async () => {
    if (!targetJob.trim()) return
    
    try {
      setLoading(true)
      setError(null)
      
      const cvText = `
        ${cvData.summary}
        ${cvData.workExperience.map(w => w.description).join(' ')}
        ${cvData.skills.map(s => s.name).join(' ')}
      `
      
      const result = await afApi.optimizeCV(cvText, targetJob)
      setOptimization(result)
    } catch (err) {
      console.error('Optimization error:', err)
      setError('Kunde inte optimera CV:t. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  const copyKeyword = (keyword: string) => {
    navigator.clipboard.writeText(keyword)
    setCopiedKeyword(keyword)
    setTimeout(() => setCopiedKeyword(null), 2000)
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles size={28} />
          <h3 className="text-xl font-bold">CV-optimerare</h3>
        </div>
        <p className="text-white/80">
          Få förslag på hur du kan förbättra ditt CV för specifika jobb
        </p>
      </div>

      <div className="p-6">
        {/* Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Vilket jobb siktar du på?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={targetJob}
              onChange={(e) => setTargetJob(e.target.value)}
              placeholder="t.ex. Systemutvecklare, Sjuksköterska..."
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyPress={(e) => e.key === 'Enter' && optimize()}
            />
            <button
              onClick={optimize}
              disabled={loading || !targetJob.trim()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analyserar...
                </>
              ) : (
                <>
                  <Target size={18} />
                  Optimera
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {optimization && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
              <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                <Lightbulb size={18} className="text-amber-500" />
                Sammanfattning
              </h4>
              <ul className="space-y-2">
                {optimization.suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-2 text-indigo-800 text-sm">
                    <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>

            {/* Keywords to add */}
            {optimization.keywords_to_add.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Target size={18} className="text-teal-600" />
                  Nyckelord att lägga till
                </h4>
                <p className="text-sm text-slate-600 mb-3">
                  Dessa ord nämns ofta i jobbannonser för {targetJob}. 
                  Klicka för att kopiera och klistra in i ditt CV.
                </p>
                <div className="flex flex-wrap gap-2">
                  {optimization.keywords_to_add.map((keyword, i) => (
                    <button
                      key={i}
                      onClick={() => copyKeyword(keyword)}
                      className="group flex items-center gap-1.5 px-3 py-1.5 bg-teal-100 text-teal-800 rounded-lg text-sm hover:bg-teal-200 transition-colors"
                    >
                      {keyword}
                      {copiedKeyword === keyword ? (
                        <Check size={14} className="text-green-600" />
                      ) : (
                        <Copy size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Skills to highlight */}
            {optimization.skills_to_highlight.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  Kompetenser att lyfta fram
                </h4>
                <p className="text-sm text-slate-600 mb-3">
                  Om du har dessa kompetenser, se till att de syns tydligt i ditt CV:
                </p>
                <div className="flex flex-wrap gap-2">
                  {optimization.skills_to_highlight.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-4 border-t flex flex-wrap gap-3">
              <a
                href="/cv-builder"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
              >
                Öppna CV-generatorn
                <ArrowRight size={16} />
              </a>
              <button
                onClick={() => {
                  setOptimization(null)
                  setTargetJob('')
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Ny optimering
              </button>
            </div>
          </div>
        )}

        {!optimization && !loading && (
          <div className="text-center py-8 text-slate-500">
            <Target size={48} className="mx-auto mb-4 opacity-30" />
            <p>Ange ett yrke ovan för att få personliga optimeringsförslag</p>
          </div>
        )}
      </div>
    </div>
  )
}
