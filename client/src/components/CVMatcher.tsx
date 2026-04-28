import { useState, useEffect } from 'react'
import { Target, CheckCircle, XCircle, AlertCircle, TrendingUp, Award } from '@/components/ui/icons'
import { cvMatcher, type CVData, type MatchResult } from '../services/cvMatcher'
import { type JobAd } from '../services/arbetsformedlingenApi'

interface CVMatcherProps {
  job: JobAd
  onClose: () => void
}

// Simulerad CV-data (i verkligheten skulle detta hämtas från användarens profil)
const mockCV: CVData = {
  skills: ['JavaScript', 'React', 'TypeScript', 'HTML', 'CSS', 'Node.js', 'Git'],
  experiences: [
    { title: 'Frontendutvecklare', description: 'Utvecklat webbapplikationer i React och TypeScript', years: 2 },
    { title: 'Webbutvecklare', description: 'Byggt responsiva webbplatser', years: 1 },
  ],
  education: [
    { degree: 'Yrkeshögskola', field: 'Webbutveckling' },
  ],
  languages: ['svenska', 'engelska'],
}

export default function CVMatcher({ job, onClose }: CVMatcherProps) {
  const [analysis, setAnalysis] = useState<MatchResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Analysera matchning
    const result = cvMatcher.analyzeMatch(mockCV, job)
    setAnalysis(result)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="w-16 h-16 border-4 border-[var(--c-accent)]/60 border-t-[var(--c-solid)] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-600">Analyserar din matchning...</p>
        </div>
      </div>
    )
  }

  if (!analysis) return null

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-[var(--c-text)]'
    if (score >= 40) return 'text-amber-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-[var(--c-accent)]/40'
    if (score >= 40) return 'bg-amber-100'
    return 'bg-red-100'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-stone-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${getScoreBg(analysis.score)}`}>
                <Target className={`w-6 h-6 ${getScoreColor(analysis.score)}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-900">CV-matchning</h2>
                <p className="text-stone-700">{job.headline}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-100 rounded-lg text-stone-600 hover:text-stone-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Score */}
          <div className="text-center p-6 bg-stone-50 rounded-xl">
            <div className={`text-5xl font-bold ${getScoreColor(analysis.score)} mb-2`}>
              {analysis.score}%
            </div>
            <p className="text-stone-600">Matchningspoäng</p>
            <div className="mt-4 w-full h-3 bg-stone-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${getScoreBg(analysis.score).replace('bg-', 'bg-').replace('100', '500')}`}
                style={{ width: `${analysis.score}%` }}
              />
            </div>
          </div>

          {/* Assessment */}
          <div className="p-4 bg-[var(--c-bg)] rounded-xl border border-[var(--c-accent)]/40">
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-[var(--c-text)] mt-0.5" />
              <div>
                <h3 className="font-semibold text-[var(--c-text)]">Bedömning</h3>
                <p className="text-[var(--c-text)] mt-1">{analysis.overallAssessment}</p>
              </div>
            </div>
          </div>

          {/* Matched Skills */}
          {analysis.matchedSkills.length > 0 && (
            <div>
              <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Matchande kompetenser ({analysis.matchedSkills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.matchedSkills.map((skill, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing Skills */}
          {analysis.missingSkills.length > 0 && (
            <div>
              <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Kompetenser att utveckla ({analysis.missingSkills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.missingSkills.slice(0, 8).map((skill, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
                {analysis.missingSkills.length > 8 && (
                  <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-sm">
                    +{analysis.missingSkills.length - 8} till
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div>
            <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[var(--c-solid)]" />
              Rekommendationer
            </h3>
            <ul className="space-y-2">
              {analysis.recommendations.map((rec, idx) => (
                <li 
                  key={idx}
                  className="flex items-start gap-2 text-stone-700"
                >
                  <span className="text-[var(--c-solid)] mt-1">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          {/* Tips */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900">Tips för din ansökan</h3>
                <ul className="mt-2 space-y-1 text-amber-800 text-sm">
                  <li>• Lyft fram dina matchande kompetenser i ansökan</li>
                  <li>• Om du saknar vissa kompetenser - nämn din vilja att lära</li>
                  <li>• Ge konkreta exempel från tidigare erfarenheter</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-stone-200 bg-stone-50">
          <p className="text-xs text-stone-700 text-center">
            Matchningen är baserad på ditt sparade CV. Uppdatera ditt CV för bättre träffsäkerhet.
          </p>
        </div>
      </div>
    </div>
  )
}
