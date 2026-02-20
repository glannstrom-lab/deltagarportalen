import { useState, useEffect } from 'react'
import { 
  Target, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Sparkles,
  TrendingUp,
  Lightbulb,
  Loader2,
  Award,
  BookOpen,
  Languages,
  Briefcase,
  GraduationCap,
} from 'lucide-react'
import { afApi, type CVMatchAnalysis } from '@/services/arbetsformedlingenApi'
import type { CVData } from '@/services/mockApi'

interface JobMatchAnalyzerProps {
  jobId: string
  cvData: CVData
  onClose?: () => void
}

export default function JobMatchAnalyzer({ jobId, cvData, onClose }: JobMatchAnalyzerProps) {
  const [analysis, setAnalysis] = useState<CVMatchAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'improvements'>('overview')

  useEffect(() => {
    analyzeMatch()
  }, [jobId, cvData])

  const analyzeMatch = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const userSkills = cvData.skills.map(s => s.name)
      const result = await afApi.analyzeJobMatch(jobId, userSkills)
      
      setAnalysis(result)
    } catch (err) {
      console.error('Match analysis error:', err)
      setError('Kunde inte analysera matchningen. Försök igen senare.')
    } finally {
      setLoading(false)
    }
  }

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (percentage >= 40) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getMatchLabel = (percentage: number) => {
    if (percentage >= 80) return 'Utmärkt match!'
    if (percentage >= 60) return 'Bra match'
    if (percentage >= 40) return 'Okej match'
    return 'Behöver utvecklas'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center">
        <Loader2 size={48} className="mx-auto text-teal-600 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-slate-800">Analyserar matchning...</h3>
        <p className="text-slate-500">Vi jämför ditt CV med jobbets krav</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-8">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertCircle size={32} />
          <h3 className="text-lg font-semibold">Något gick fel</h3>
        </div>
        <p className="text-slate-600 mb-4">{error}</p>
        <button
          onClick={analyzeMatch}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          Försök igen
        </button>
      </div>
    )
  }

  if (!analysis) return null

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className={`p-6 border-b ${getMatchColor(analysis.match_percentage)}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Target size={24} className="text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Matchningsanalys</h3>
              <p className="text-sm opacity-80">{analysis.job_title}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-black/5 rounded-lg transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-black/10"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="text-current"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${analysis.match_percentage}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{analysis.match_percentage}%</span>
            </div>
          </div>
          <div>
            <p className="text-xl font-semibold">{getMatchLabel(analysis.match_percentage)}</p>
            <p className="text-sm opacity-80">
              {analysis.matching_skills.length} av {analysis.matching_skills.length + analysis.missing_skills.length} kompetenser matchar
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {[
          { id: 'overview', label: 'Översikt', icon: Sparkles },
          { id: 'skills', label: 'Kompetenser', icon: Target },
          { id: 'improvements', label: 'Förbättringar', icon: TrendingUp },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <CheckCircle2 size={20} />
                  <span className="font-medium">Detta har du</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{analysis.matching_skills.length}</p>
                <p className="text-sm text-slate-500">Matchande kompetenser</p>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <BookOpen size={20} />
                  <span className="font-medium">Att utveckla</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{analysis.missing_skills.length}</p>
                <p className="text-sm text-slate-500">Saknade kompetenser</p>
              </div>
            </div>

            {/* Suggestions */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Lightbulb size={18} className="text-amber-500" />
                Rekommendationer
              </h4>
              <ul className="space-y-2">
                {analysis.suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700">
                    <span className="text-teal-600 mt-1">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>

            {/* Priority Actions */}
            {analysis.priority_improvements.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <AlertCircle size={18} />
                  Prioritera att utveckla
                </h4>
                <ul className="space-y-1">
                  {analysis.priority_improvements.map((improvement, i) => (
                    <li key={i} className="text-amber-700 text-sm">
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-6">
            {/* Matching Skills */}
            {analysis.matching_skills.length > 0 && (
              <div>
                <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                  <Award size={18} />
                  Matchande kompetenser ({analysis.matching_skills.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.matching_skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                    >
                      <CheckCircle2 size={14} className="inline mr-1" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Skills */}
            {analysis.missing_skills.length > 0 && (
              <div>
                <h4 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
                  <BookOpen size={18} />
                  Kompetenser att utveckla ({analysis.missing_skills.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.missing_skills.slice(0, 10).map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                  {analysis.missing_skills.length > 10 && (
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
                      +{analysis.missing_skills.length - 10} till
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Languages */}
            {(analysis.matching_languages.length > 0 || analysis.missing_languages.length > 0) && (
              <div>
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Languages size={18} />
                  Språkkrav
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.matching_languages.map((lang, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                    >
                      <CheckCircle2 size={14} className="inline mr-1" />
                      {lang}
                    </span>
                  ))}
                  {analysis.missing_languages.map((lang, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements Check */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Briefcase size={18} />
                Kravcheck
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">Erfarenhet</span>
                  {analysis.experience_match ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle2 size={16} /> Uppfyllt
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-orange-600 text-sm">
                      <XCircle size={16} /> Kolla kraven
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">Utbildning</span>
                  {analysis.education_match ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle2 size={16} /> Uppfyllt
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-orange-600 text-sm">
                      <GraduationCap size={16} /> Se utbildningskrav
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'improvements' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-6">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-teal-600" />
                Så här ökar du dina chanser
              </h4>
              
              <div className="space-y-4">
                {analysis.match_percentage < 60 && (
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h5 className="font-medium text-slate-800 mb-2">1. Fyll på med kompetenser</h5>
                    <p className="text-sm text-slate-600 mb-3">
                      Jobbet kräver fler kompetenser än du har just nu. Överväg:
                    </p>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Korta online-kurser (t.ex. LinkedIn Learning, Coursera)</li>
                      <li>• Arbetsmarknadsutbildningar via Arbetsförmedlingen</li>
                      <li>• Praktik för att lära dig praktiskt</li>
                    </ul>
                  </div>
                )}

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h5 className="font-medium text-slate-800 mb-2">
                    {analysis.match_percentage >= 60 ? '1' : '2'}. Anpassa ditt CV
                  </h5>
                  <p className="text-sm text-slate-600 mb-3">
                    Använd nyckelord från jobbannonsen i ditt CV:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missing_skills.slice(0, 5).map((skill, i) => (
                      <span key={i} className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h5 className="font-medium text-slate-800 mb-2">
                    {analysis.match_percentage >= 60 ? '2' : '3'}. Sök brett
                  </h5>
                  <p className="text-sm text-slate-600">
                    Även om denna matchning är {analysis.match_percentage < 60 ? 'lägre' : 'bra'}, 
                    sök även på relaterade yrken för att öka dina chanser. 
                    Använd vår intresseguide för att hitta alternativa vägar!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
