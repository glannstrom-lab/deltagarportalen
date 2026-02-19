import { useState } from 'react'
import { FileSearch, CheckCircle, AlertCircle, XCircle, TrendingUp, BookOpen, Info } from 'lucide-react'
import type { CVData } from '@/services/mockApi'

interface ATSCheck {
  name: string
  passed: boolean
  description: string
  importance: 'high' | 'medium' | 'low'
}

interface ATSAnalyzerProps {
  cvData: CVData
}

export function ATSAnalyzer({ cvData }: ATSAnalyzerProps) {
  const [showDetails, setShowDetails] = useState(false)

  // Beräkna läsbarhet (Flesch-Kincaid simplifierad)
  const calculateReadability = (text: string) => {
    if (!text) return { score: 0, level: 'Ingen text' }
    const words = text.split(/\s+/).length
    const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length
    const syllables = text.split(/[aeiouåäöAEIOUÅÄÖ]/).length - 1
    
    if (sentences === 0 || words === 0) return { score: 0, level: 'Ingen text' }
    
    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
    
    let level = 'Mycket svår'
    if (score > 90) level = 'Mycket lätt'
    else if (score > 80) level = 'Lätt'
    else if (score > 70) level = 'Medel'
    else if (score > 60) level = 'Medelsvår'
    
    return { score: Math.round(score), level }
  }

  const summaryReadability = calculateReadability(cvData.summary || '')
  const totalWordCount = (cvData.summary || '').split(/\s+/).length +
    cvData.workExperience?.reduce((acc, w) => acc + (w.description?.split(/\s+/).length || 0), 0) || 0

  // ATS-kontroller
  const checks: ATSCheck[] = [
    {
      name: 'Kontaktinformation',
      passed: !!(cvData.email && cvData.phone),
      description: 'E-post och telefon finns',
      importance: 'high',
    },
    {
      name: 'Sammanfattning',
      passed: (cvData.summary?.length || 0) >= 50,
      description: 'Minst 50 tecken rekommenderas',
      importance: 'high',
    },
    {
      name: 'Erfarenhet',
      passed: (cvData.workExperience?.length || 0) > 0,
      description: 'Minst en anställning',
      importance: 'high',
    },
    {
      name: 'Utbildning',
      passed: (cvData.education?.length || 0) > 0,
      description: 'Minst en utbildning',
      importance: 'medium',
    },
    {
      name: 'Mätbara resultat',
      passed: cvData.workExperience?.some(w => 
        /\d+%|\d+\s+(å|mån|år|månader)|ökade|minskade|förbättrade|ökade|reducerade/.test(w.description || '')
      ) || false,
      description: 'Använder siffror och procent',
      importance: 'high',
    },
    {
      name: 'Färdigheter',
      passed: (cvData.skills?.length || 0) >= 3,
      description: 'Minst 3 färdigheter',
      importance: 'medium',
    },
    {
      name: 'CV-längd',
      passed: totalWordCount >= 150 && totalWordCount <= 800,
      description: '150-800 ord rekommenderas',
      importance: 'medium',
    },
    {
      name: 'Läslighet',
      passed: summaryReadability.score >= 60,
      description: `Nivå: ${summaryReadability.level}`,
      importance: 'medium',
    },
    {
      name: 'Språk',
      passed: (cvData.languages?.length || 0) >= 1,
      description: 'Språkkunskaper angivna',
      importance: 'low',
    },
    {
      name: 'Referenser',
      passed: (cvData.references?.length || 0) >= 1,
      description: 'Minst en referens',
      importance: 'low',
    },
  ]

  const passedChecks = checks.filter(c => c.passed).length
  const score = Math.round((passedChecks / checks.length) * 100)

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-600'
    if (s >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (s: number) => {
    if (s >= 80) return 'bg-green-100'
    if (s >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const suggestions = [
    !checks.find(c => c.name === 'Mätbara resultat')?.passed && 'Lägg till mätbara resultat med siffror och procent',
    (cvData.skills?.length || 0) < 5 && 'Utöka din lista med färdigheter',
    !cvData.summary && 'Skriv en sammanfattande profiltext',
    totalWordCount < 150 && 'Utveckla dina beskrivningar mer',
    totalWordCount > 800 && 'Förkorta vissa sektioner för bättre läsbarhet',
    summaryReadability.score < 60 && 'Använd enklare språk i sammanfattningen',
  ].filter(Boolean) as string[]

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#4f46e5]/10 rounded-lg">
          <FileSearch size={24} style={{ color: '#4f46e5' }} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">ATS-analys</h3>
          <p className="text-sm text-slate-500">Optimera för rekryteringssystem</p>
        </div>
      </div>

      {/* Score */}
      <div className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreBg(score)} mb-2`}>
          <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
        </div>
        <p className="text-sm text-slate-500">av 100 poäng</p>
        <p className="text-xs text-slate-400 mt-1">
          {passedChecks} av {checks.length} kontroller godkända
        </p>
      </div>

      {/* Readability Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-slate-50 rounded-lg text-center">
          <BookOpen size={16} className="mx-auto mb-1 text-slate-400" />
          <p className="text-lg font-semibold text-slate-800">{totalWordCount}</p>
          <p className="text-xs text-slate-500">ord totalt</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg text-center">
          <TrendingUp size={16} className="mx-auto mb-1 text-slate-400" />
          <p className="text-lg font-semibold text-slate-800">{summaryReadability.level}</p>
          <p className="text-xs text-slate-500">läsnivå</p>
        </div>
      </div>

      {/* Checks */}
      <div className="space-y-2 mb-4">
        {checks.slice(0, showDetails ? undefined : 5).map((check) => (
          <div
            key={check.name}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50"
          >
            {check.passed ? (
              <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
            ) : check.importance === 'high' ? (
              <XCircle size={18} className="text-red-500 flex-shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-yellow-500 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${check.passed ? 'text-slate-600' : 'text-slate-800'}`}>
                {check.name}
              </p>
              <p className="text-xs text-slate-400">{check.description}</p>
            </div>
            {check.importance === 'high' && !check.passed && (
              <span className="text-xs text-red-600 font-medium">Viktig!</span>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-sm text-[#4f46e5] hover:underline mb-4"
      >
        {showDetails ? 'Visa färre' : 'Visa alla kontroller'}
      </button>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="border-t border-slate-200 pt-4">
          <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
            <Info size={16} className="text-[#4f46e5]" />
            Förbättringsförslag:
          </p>
          <ul className="space-y-1">
            {suggestions.slice(0, 4).map((suggestion, index) => (
              <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                <span className="text-[#4f46e5] mt-1">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Best Practices */}
      <div className="mt-4 p-3 bg-[#eef2ff] rounded-lg">
        <p className="text-xs text-slate-600">
          <strong>Tips:</strong> ATS-system (Applicant Tracking Systems) används av 
          de flesta större företag för att filtrera CV:n. Använd nyckelord från 
          jobbannonser och undvik tabeller, bilder och komplicerad formatering.
        </p>
      </div>
    </div>
  )
}
