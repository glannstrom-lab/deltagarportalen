import { useState, useMemo } from 'react'
import { 
  FileSearch, CheckCircle, AlertCircle, TrendingUp, BookOpen, Info, Eye, Sparkles,
  FileText, Type, Layout, Image, Download, Briefcase, Building, HeartPulse, 
  Hammer, ShoppingCart, GraduationCap, Code, Wrench, FileCheck, AlertTriangle
} from '@/components/ui/icons'
import type { CVData, Skill } from '@/services/supabaseApi'

interface ATSCheck {
  name: string
  passed: boolean
  description: string
  importance: 'high' | 'medium' | 'low'
  tip?: string
}

interface KeywordCategory {
  name: string
  keywords: string[]
  found: string[]
  missing: string[]
}

interface IndustryTemplate {
  id: string
  name: string
  icon: React.ReactNode
  keywords: string[]
  color: string
}

interface ATSAnalyzerProps {
  cvData: CVData
  hasImage?: boolean
  usesStandardFont?: boolean
  hasTableLayout?: boolean
}

// Svenska rekryteringsnyckelord
const SWEDISH_KEYWORDS = {
  competence: ['projektledning', 'kommunikation', 'samarbete', 'analys', 'kundservice', 'ledarskap', 'strategi', 'utveckling', 'kvalitet', 'effektivisering'],
  action: ['ledde', 'utvecklade', 'förbättrade', 'samordnade', 'genomförde', 'implementerade', 'hanterade', 'skapade', 'drev', 'effektiviserade', 'planerade', 'koordinerade'],
  results: ['%', 'procent', 'ökade', 'minskade', 'fördubblade', 'halverade', 'kr', 'miljoner', 'tusen', 'år', 'månader', 'veckor']
}

// Branschspecifika mallar med nyckelord
const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    id: 'it',
    name: 'IT & Teknik',
    icon: <Code size={18} />,
    keywords: ['programmering', 'utveckling', 'system', 'databas', 'nätverk', 'agil', 'scrum', 'devops', 'cloud', 'säkerhet', 'python', 'javascript', 'java', 'sql'],
    color: '#0891b2'
  },
  {
    id: 'healthcare',
    name: 'Vård & Hälsa',
    icon: <HeartPulse size={18} />,
    keywords: ['patientvård', 'omsorg', 'hälso- och sjukvård', 'legitimerad', 'vårdplan', 'medicinsk', 'rehabilitering', 'bemannings', 'diagnos', 'behandling'],
    color: '#e11d48'
  },
  {
    id: 'construction',
    name: 'Bygg & Anläggning',
    icon: <Hammer size={18} />,
    keywords: ['byggprojekt', 'konstruktion', 'projektering', 'byggledning', 'arbetsmiljö', 'bygglov', 'entreprenad', 'ritningsläsning', 'byggnation'],
    color: '#f97316'
  },
  {
    id: 'retail',
    name: 'Handel & Butik',
    icon: <ShoppingCart size={18} />,
    keywords: ['försäljning', 'kundservice', 'varuhantering', 'kassa', 'merchandising', 'detaljhandel', 'lager', 'order', 'leverans', 'butiksarbete'],
    color: '#10b981'
  },
  {
    id: 'education',
    name: 'Utbildning',
    icon: <GraduationCap size={18} />,
    keywords: ['undervisning', 'pedagogik', 'läroplan', 'betygssättning', ' handledning', 'klassrum', 'skola', 'utbildningsplan', 'kurs', 'examen'],
    color: '#7c3aed'
  },
  {
    id: 'finance',
    name: 'Ekonomi & Finans',
    icon: <Briefcase size={18} />,
    keywords: ['redovisning', 'bokföring', 'budget', 'analys', 'revision', 'ekonomi', 'finans', 'rapportering', 'beslut', 'prognos', 'excel'],
    color: '#059669'
  },
  {
    id: 'admin',
    name: 'Administration',
    icon: <Building size={18} />,
    keywords: ['administration', 'kundsupport', 'diarieföring', 'arkivering', 'mötesbokning', 'reception', 'växel', 'korrespondens', 'beställning'],
    color: '#6366f1'
  },
  {
    id: 'service',
    name: 'Service & Restaurang',
    icon: <Wrench size={18} />,
    keywords: ['service', 'gästbemötande', 'servering', 'köksarbete', 'städning', 'hotell', 'restaurang', 'catering', 'evenemang', 'gästvänlig'],
    color: '#ec4899'
  }
]

// Standardtypsnitt som fungerar med ATS
const ATS_FRIENDLY_FONTS = [
  'arial', 'helvetica', 'times new roman', 'georgia', 'garamond', 
  'calibri', 'cambria', 'verdana', 'tahoma', 'trebuchet ms',
  'inter', 'roboto', 'open sans', 'montserrat'
]

export function ATSAnalyzer({ 
  cvData, 
  hasImage = false, 
  usesStandardFont = true, 
  hasTableLayout = false 
}: ATSAnalyzerProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [showKeywords, setShowKeywords] = useState(false)
  const [showATSChecks, setShowATSChecks] = useState(false)
  const [showRecruiterView, setShowRecruiterView] = useState(false)
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [showExportCheck, setShowExportCheck] = useState(false)

  // Samla all CV-text för nyckelordsanalys
  const allCVText = useMemo(() => {
    const parts: string[] = []
    if (cvData.summary) parts.push(cvData.summary)
    cvData.workExperience?.forEach(w => {
      if (w.description) parts.push(w.description)
      if (w.title) parts.push(w.title)
    })
    cvData.education?.forEach(e => {
      if (e.description) parts.push(e.description)
      if (e.degree) parts.push(e.degree)
    })
    if (cvData.skills) parts.push(cvData.skills.map((s: Skill) => s.name).filter(Boolean).join(' '))
    return parts.join(' ').toLowerCase()
  }, [cvData])

  // Analysera nyckelord
  const keywordAnalysis = useMemo((): KeywordCategory[] => {
    const analyzeCategory = (name: string, keywords: string[]): KeywordCategory => {
      const found = keywords.filter(kw => allCVText.includes(kw.toLowerCase()))
      return {
        name,
        keywords,
        found,
        missing: keywords.filter(kw => !allCVText.includes(kw.toLowerCase()))
      }
    }

    return [
      analyzeCategory('Kompetensord', SWEDISH_KEYWORDS.competence),
      analyzeCategory('Aktivitetsord', SWEDISH_KEYWORDS.action),
      analyzeCategory('Resultatindikatorer', SWEDISH_KEYWORDS.results)
    ]
  }, [allCVText])

  // Rekryterarens ögonblicks-test (vad ser man på 6 sekunder?)
  const recruiterSnapshot = useMemo(() => {
    const snapshot = {
      hasName: !!(cvData.firstName || cvData.lastName),
      hasClearTitle: !!(cvData.summary && cvData.summary.length > 10),
      hasExperienceCount: (cvData.workExperience?.length || 0) > 0,
      hasKeySkills: (cvData.skills?.length || 0) >= 3,
      yearsOfExperience: 0,
      topSkills: cvData.skills?.slice(0, 3) || [],
      latestRole: cvData.workExperience?.[0]?.title || '',
      latestCompany: cvData.workExperience?.[0]?.company || ''
    }

    // Beräkna år av erfarenhet
    let totalYears = 0
    cvData.workExperience?.forEach(exp => {
      if (exp.startDate) {
        const start = new Date(exp.startDate)
        const end = exp.endDate ? new Date(exp.endDate) : new Date()
        totalYears += (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365)
      }
    })
    snapshot.yearsOfExperience = Math.round(totalYears)

    return snapshot
  }, [cvData])

  // Beräkna skannbarhetspoäng (hur lätt är det att skanna CV:t?)
  const scanabilityScore = useMemo(() => {
    let score = 100
    
    // Avdrag för för mycket text utan uppdelning
    const avgDescLength = cvData.workExperience?.reduce((acc, w) => 
      acc + (w.description?.length || 0), 0) / (cvData.workExperience?.length || 1) || 0
    if (avgDescLength > 500) score -= 15
    if (avgDescLength > 800) score -= 15
    
    // Avdrag för för få eller för många skills
    const skillCount = cvData.skills?.length || 0
    if (skillCount < 3) score -= 10
    if (skillCount > 15) score -= 10
    
    // Avdrag för lång sammanfattning
    if ((cvData.summary?.length || 0) > 600) score -= 10
    
    // Avdrag om viktig info saknas högst upp
    if (!cvData.summary || cvData.summary.length < 50) score -= 15
    
    return Math.max(0, Math.min(100, score))
  }, [cvData])

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

  // ATS-kontroller (grundläggande)
  const basicChecks: ATSCheck[] = [
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

  // Nya ATS-kontroller för teknisk kompatibilitet
  const technicalChecks: ATSCheck[] = [
    {
      name: 'Inga bilder',
      passed: !hasImage,
      description: 'Bilder kan inte läsas av de flesta ATS',
      importance: 'high',
      tip: 'Ta bort profilbilden - de flesta ATS-system kan inte tolka bilder'
    },
    {
      name: 'Standardtypsnitt',
      passed: usesStandardFont,
      description: 'Använder ATS-vänligt typsnitt',
      importance: 'medium',
      tip: 'Använd Arial, Calibri, Georgia eller Times New Roman för bästa kompatibilitet'
    },
    {
      name: 'Inga tabeller',
      passed: !hasTableLayout,
      description: 'Tabeller kan förvrängas i ATS',
      importance: 'high',
      tip: 'Använd vanlig textformatering istället för tabeller'
    },
    {
      name: 'Filformat',
      passed: true, // Vi antar PDF
      description: 'PDF rekommenderas för bästa kompatibilitet',
      importance: 'medium',
      tip: 'Spara alltid som PDF för att bevara formateringen'
    },
    {
      name: 'Filnamn',
      passed: !!(cvData.firstName && cvData.lastName),
      description: 'Använd förnamn-efternamn-cv.pdf',
      importance: 'low',
      tip: `Rekommenderat filnamn: ${cvData.firstName || 'fornamn'}-${cvData.lastName || 'efternamn'}-cv.pdf`
    },
  ]

  // Kombinera alla kontroller
  const allChecks = [...basicChecks, ...technicalChecks]
  const passedChecks = allChecks.filter(c => c.passed).length
  const score = Math.round((passedChecks / allChecks.length) * 100)

  // Totalt nyckelordsgenomslag
  const totalKeywordsFound = keywordAnalysis.reduce((acc, cat) => acc + cat.found.length, 0)
  const totalKeywords = keywordAnalysis.reduce((acc, cat) => acc + cat.keywords.length, 0)
  const keywordScore = Math.round((totalKeywordsFound / totalKeywords) * 100)

  // Branschspecifik analys
  const industryMatch = useMemo(() => {
    if (!selectedIndustry) return null
    const industry = INDUSTRY_TEMPLATES.find(i => i.id === selectedIndustry)
    if (!industry) return null
    
    const found = industry.keywords.filter(kw => allCVText.includes(kw.toLowerCase()))
    const percentage = Math.round((found.length / industry.keywords.length) * 100)
    
    return {
      industry,
      found,
      missing: industry.keywords.filter(kw => !allCVText.includes(kw.toLowerCase())),
      percentage
    }
  }, [selectedIndustry, allCVText])

  // Export-kontroller
  const exportReadiness = useMemo(() => {
    const issues: string[] = []
    
    if (hasImage) issues.push('Innehåller bild som ATS kanske inte kan läsa')
    if (hasTableLayout) issues.push('Använder tabellayout som kan förvrängas')
    if (!usesStandardFont) issues.push('Använder icke-standard typsnitt')
    if ((cvData.skills?.length || 0) < 3) issues.push('För få färdigheter listade')
    if (!cvData.summary || cvData.summary.length < 50) issues.push('Saknar eller har för kort sammanfattning')
    if (scanabilityScore < 70) issues.push('Låg skannbarhetspoäng')
    
    return {
      ready: issues.length === 0,
      issues,
      score: Math.max(0, 100 - issues.length * 15)
    }
  }, [hasImage, hasTableLayout, usesStandardFont, cvData, scanabilityScore])

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

  const getKeywordProgressColor = (found: number, total: number) => {
    const ratio = found / total
    if (ratio >= 0.6) return 'bg-green-500'
    if (ratio >= 0.3) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // Nästa steg förslag (positivt formulerade)
  const nextSteps = [
    !basicChecks.find(c => c.name === 'Mätbara resultat')?.passed && 'Förstärk med mätbara resultat – siffror visar din påverkan',
    (cvData.skills?.length || 0) < 5 && 'Utforska fler färdigheter du har som kan tillföra värde',
    !cvData.summary && 'Skapa en sammanfattning som visar vem du är professionellt',
    totalWordCount < 150 && 'Utveckla dina beskrivningar för att visa mer av din erfarenhet',
    totalWordCount > 800 && 'Förfina dina texter för att göra dem mer koncisa och lättsmälta',
    summaryReadability.score < 60 && 'Förenkla språket något för att nå fler läsare',
    keywordScore < 50 && 'Låt oss hitta fler nyckelord som matchar dina styrkor',
    hasImage && 'Överväg att ta bort profilbilden för bättre ATS-kompatibilitet',
    hasTableLayout && 'Ersätt tabeller med vanlig text för bättre läsbarhet i ATS',
    scanabilityScore < 70 && 'Förbättra skannbarheten genom att korta ner långa texter',
  ].filter(Boolean) as string[]

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#4f46e5]/10 rounded-lg">
          <FileSearch size={24} style={{ color: '#4f46e5' }} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">ATS-analys</h3>
          <p className="text-sm text-slate-700">Optimera för rekryteringssystem</p>
        </div>
      </div>

      {/* Score */}
      <div className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreBg(score)} mb-2`}>
          <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
        </div>
        <p className="text-sm text-slate-700">av 100 poäng</p>
        <p className="text-xs text-slate-600 mt-1">
          Du har {passedChecks} av {allChecks.length} på plats
        </p>
      </div>

      {/* Rekryterarens ögonblicks-test */}
      <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-indigo-600" />
            <h4 className="font-medium text-indigo-900">Rekryterarens ögonblicks-test</h4>
          </div>
          <button
            onClick={() => setShowRecruiterView(!showRecruiterView)}
            className="text-xs text-[#4f46e5] hover:underline"
          >
            {showRecruiterView ? 'Dölj' : 'Visa detaljer'}
          </button>
        </div>
        <p className="text-xs text-indigo-700 mb-3">
          En rekryterare skannar ditt CV på 6 sekunder. Så här ser det ut:
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className={`p-2 rounded-lg ${recruiterSnapshot.hasName ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <span className="text-xs">{recruiterSnapshot.hasName ? '✓' : '○'} Namn synligt</span>
          </div>
          <div className={`p-2 rounded-lg ${recruiterSnapshot.hasClearTitle ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            <span className="text-xs">{recruiterSnapshot.hasClearTitle ? '✓' : '○'} Tydlig profil</span>
          </div>
          <div className={`p-2 rounded-lg ${recruiterSnapshot.hasExperienceCount ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            <span className="text-xs">{recruiterSnapshot.yearsOfExperience > 0 ? `${recruiterSnapshot.yearsOfExperience} år` : '○'} Erfarenhet</span>
          </div>
          <div className={`p-2 rounded-lg ${recruiterSnapshot.hasKeySkills ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            <span className="text-xs">{recruiterSnapshot.topSkills.length > 0 ? `${recruiterSnapshot.topSkills.length} styrkor` : '○'} Nyckelkompetenser</span>
          </div>
        </div>
        {recruiterSnapshot.latestRole && (
          <p className="text-xs text-indigo-600 mt-2">
            Senaste roll: <strong>{recruiterSnapshot.latestRole}</strong> {recruiterSnapshot.latestCompany && `på ${recruiterSnapshot.latestCompany}`}
          </p>
        )}

        {/* Skannbarhetspoäng */}
        {showRecruiterView && (
          <div className="mt-4 pt-4 border-t border-indigo-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-indigo-900">Skannbarhetspoäng</span>
              <span className={`text-lg font-bold ${getScoreColor(scanabilityScore)}`}>
                {scanabilityScore}/100
              </span>
            </div>
            <div className="w-full h-2 bg-white rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  scanabilityScore >= 80 ? 'bg-green-500' :
                  scanabilityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${scanabilityScore}%` }}
              />
            </div>
            <p className="text-xs text-indigo-700 mt-2">
              {scanabilityScore >= 80 ? 'Mycket lättskannat CV - rekryterare ser snabbt dina styrkor!' :
               scanabilityScore >= 60 ? 'Acceptabel skannbarhet - några justeringar kan hjälpa' :
               'Svårskannat CV - viktig information kan missas av rekryterare'}
            </p>

            {/* Rekommendationer för vad som bör lyftas högre upp */}
            <div className="mt-3 p-3 bg-white rounded-lg">
              <p className="text-xs font-medium text-slate-700 mb-2">Rekommendationer för bättre skannbarhet:</p>
              <ul className="space-y-1 text-xs text-slate-600">
                {scanabilityScore < 80 && (
                  <li>• Placera dina 3-5 viktigaste kompetenser högst upp i CV:t</li>
                )}
                {(cvData.summary?.length || 0) > 400 && (
                  <li>• Korta ner din sammanfattning till max 3-4 meningar</li>
                )}
                {cvData.workExperience?.some(w => (w.description?.length || 0) > 400) && (
                  <li>• Dela upp långa arbetsbeskrivningar i kortare punkter</li>
                )}
                {(cvData.skills?.length || 0) > 12 && (
                  <li>• Fokusera på 8-10 mest relevanta färdigheter</li>
                )}
                {scanabilityScore >= 80 && (
                  <li>✓ Ditt CV har en utmärkt struktur för snabb skanning!</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Branschspecifika mallar */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase size={18} className="text-slate-700" />
          <h4 className="font-medium text-slate-700">Branschspecifika nyckelord</h4>
        </div>
        <p className="text-xs text-slate-700 mb-3">
          Välj din bransch för att se vilka nyckelord som är vanliga
        </p>
        <div className="grid grid-cols-4 gap-2">
          {INDUSTRY_TEMPLATES.map((industry) => (
            <button
              key={industry.id}
              onClick={() => setSelectedIndustry(selectedIndustry === industry.id ? null : industry.id)}
              className={`p-2 rounded-lg border text-center transition-all ${
                selectedIndustry === industry.id
                  ? 'border-[#4f46e5] bg-[#eef2ff]'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div 
                className="mx-auto mb-1"
                style={{ color: selectedIndustry === industry.id ? industry.color : '#64748b' }}
              >
                {industry.icon}
              </div>
              <span className="text-xs font-medium text-slate-700">{industry.name}</span>
            </button>
          ))}
        </div>

        {/* Branschmatchning */}
        {industryMatch && (
          <div className="mt-3 p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                Matchning för {industryMatch.industry.name}
              </span>
              <span className={`text-sm font-bold ${getScoreColor(industryMatch.percentage)}`}>
                {industryMatch.percentage}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full transition-all"
                style={{ 
                  width: `${industryMatch.percentage}%`,
                  backgroundColor: industryMatch.percentage >= 60 ? industryMatch.industry.color : '#ef4444'
                }}
              />
            </div>
            {industryMatch.found.length > 0 && (
              <p className="text-xs text-green-600 mb-1">
                ✓ Hittade: {industryMatch.found.slice(0, 5).join(', ')}
                {industryMatch.found.length > 5 && ` +${industryMatch.found.length - 5} till`}
              </p>
            )}
            {industryMatch.missing.length > 0 && (
              <p className="text-xs text-slate-700">
                Saknas: {industryMatch.missing.slice(0, 4).join(', ')}
                {industryMatch.missing.length > 4 && ` +${industryMatch.missing.length - 4}`}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Nyckelordsanalys */}
      <div className="mb-6">
        <button
          onClick={() => setShowKeywords(!showKeywords)}
          className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            <span className="font-medium text-slate-700">Nyckelordsanalys</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${keywordScore >= 60 ? 'bg-green-100 text-green-700' : keywordScore >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
              {totalKeywordsFound}/{totalKeywords}
            </span>
          </div>
          <span className="text-sm text-[#4f46e5]">{showKeywords ? 'Dölj' : 'Visa'}</span>
        </button>

        {showKeywords && (
          <div className="mt-3 space-y-3">
            {keywordAnalysis.map((category) => (
              <div key={category.name} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">{category.name}</span>
                  <span className="text-xs text-slate-700">{category.found.length}/{category.keywords.length}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full mb-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${getKeywordProgressColor(category.found.length, category.keywords.length)}`}
                    style={{ width: `${(category.found.length / category.keywords.length) * 100}%` }}
                  />
                </div>
                {category.found.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs text-green-600">✓ Hittade: </span>
                    <span className="text-xs text-slate-600">{category.found.join(', ')}</span>
                  </div>
                )}
                {category.missing.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-700">Förslag: </span>
                    <span className="text-xs text-slate-600">{category.missing.slice(0, 4).join(', ')}{category.missing.length > 4 && '...'}</span>
                  </div>
                )}
              </div>
            ))}
            <p className="text-xs text-slate-700 italic">
              💡 Tips: Använd nyckelorden naturligt i dina beskrivningar – koppla dem till dina faktiska erfarenheter
            </p>
          </div>
        )}
      </div>

      {/* ATS-kontroller */}
      <div className="mb-6">
        <button
          onClick={() => setShowATSChecks(!showATSChecks)}
          className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-slate-700" />
            <span className="font-medium text-slate-700">ATS-kompatibilitet</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              technicalChecks.filter(c => c.passed).length === technicalChecks.length 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {technicalChecks.filter(c => c.passed).length}/{technicalChecks.length}
            </span>
          </div>
          <span className="text-sm text-[#4f46e5]">{showATSChecks ? 'Dölj' : 'Visa'}</span>
        </button>

        {showATSChecks && (
          <div className="mt-3 space-y-2">
            {technicalChecks.map((check) => (
              <div
                key={check.name}
                className={`flex items-start gap-2 p-3 rounded-lg ${
                  check.passed ? 'bg-green-50' : 'bg-amber-50'
                }`}
              >
                {check.passed ? (
                  <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${check.passed ? 'text-green-800' : 'text-amber-800'}`}>
                    {check.name}
                  </p>
                  <p className="text-xs text-slate-600">{check.description}</p>
                  {!check.passed && check.tip && (
                    <p className="text-xs text-amber-700 mt-1 italic">💡 {check.tip}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Readability Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-slate-50 rounded-lg text-center">
          <BookOpen size={16} className="mx-auto mb-1 text-slate-600" />
          <p className="text-lg font-semibold text-slate-800">{totalWordCount}</p>
          <p className="text-xs text-slate-700">ord totalt</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg text-center">
          <TrendingUp size={16} className="mx-auto mb-1 text-slate-600" />
          <p className="text-lg font-semibold text-slate-800">{summaryReadability.level}</p>
          <p className="text-xs text-slate-700">läsnivå</p>
        </div>
      </div>

      {/* Basic Checks */}
      <div className="space-y-2 mb-4">
        {basicChecks.slice(0, showDetails ? undefined : 5).map((check) => (
          <div
            key={check.name}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50"
          >
            {check.passed ? (
              <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
            ) : check.importance === 'high' ? (
              <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-yellow-500 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${check.passed ? 'text-slate-600' : 'text-slate-800'}`}>
                {check.name}
              </p>
              <p className="text-xs text-slate-600">{check.description}</p>
            </div>
            {check.importance === 'high' && !check.passed && (
              <span className="text-xs text-amber-600 font-medium">Viktigt</span>
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

      {/* Export-förberedelse */}
      <div className="mb-6">
        <button
          onClick={() => setShowExportCheck(!showExportCheck)}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-colors border border-blue-100"
        >
          <div className="flex items-center gap-2">
            <Download size={18} className="text-blue-600" />
            <span className="font-medium text-blue-900">Export-förberedelse</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              exportReadiness.ready 
                ? 'bg-green-100 text-green-700' 
                : exportReadiness.score >= 60 
                  ? 'bg-yellow-100 text-yellow-700' 
                  : 'bg-red-100 text-red-700'
            }`}>
              {exportReadiness.ready ? 'Klar' : `${exportReadiness.score}%`}
            </span>
          </div>
          <span className="text-sm text-blue-700">{showExportCheck ? 'Dölj' : 'Visa'}</span>
        </button>

        {showExportCheck && (
          <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
            {exportReadiness.ready ? (
              <div className="flex items-start gap-3">
                <FileCheck size={20} className="text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-800">Ditt CV är redo att exporteras!</p>
                  <p className="text-sm text-green-700 mt-1">
                    Alla kontroller är godkända. Ditt CV bör vara väl läsbart för både ATS och rekryterare.
                  </p>
                  <p className="text-xs text-blue-600 mt-3">
                    💡 Filnamn att använda: <strong>{cvData.firstName || 'Fornamn'}-{cvData.lastName || 'Efternamn'}-CV.pdf</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-800">Åtgärda innan export</p>
                    <p className="text-sm text-amber-700">
                      Följande problem kan påverka hur väl ditt CV läses av ATS-system:
                    </p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {exportReadiness.issues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-amber-800">
                      <span className="text-amber-500">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-blue-600 mt-3">
                  💡 Filnamn att använda: <strong>{cvData.firstName || 'Fornamn'}-{cvData.lastName || 'Efternamn'}-CV.pdf</strong>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nästa steg */}
      {nextSteps.length > 0 && (
        <div className="border-t border-slate-200 pt-4">
          <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
            <Info size={16} className="text-[#4f46e5]" />
            Nästa steg för att stärka ditt CV:
          </p>
          <ul className="space-y-2">
            {nextSteps.slice(0, 4).map((step, index) => (
              <li key={index} className="text-sm text-slate-600 flex items-start gap-2 bg-slate-50 p-2 rounded-lg">
                <span className="text-green-500 mt-0.5 flex-shrink-0">→</span>
                {step}
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

export default ATSAnalyzer
