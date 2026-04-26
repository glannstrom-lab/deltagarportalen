/**
 * ATSAnalyzer - Detailed ATS analysis component
 * Refactored with i18n, accessibility fixes, and improved UX
 */

import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  FileSearch, CheckCircle, AlertCircle, TrendingUp, BookOpen, Info, Eye, Sparkles,
  FileText, Download, Briefcase, Building, HeartPulse,
  Hammer, ShoppingCart, GraduationCap, Code, Wrench, FileCheck, AlertTriangle,
  ArrowRight, Lightbulb
} from '@/components/ui/icons'
import type { CVData, Skill } from '@/services/supabaseApi'

interface ATSCheck {
  id: string
  name: string
  passed: boolean
  description: string
  importance: 'high' | 'medium' | 'low'
  tip?: string
  fixStep?: number // CV builder step to fix this
}

interface KeywordCategory {
  name: string
  keywords: string[]
  found: string[]
  missing: string[]
}

interface IndustryTemplate {
  id: string
  nameKey: string
  icon: React.ReactNode
  keywords: string[]
  color: string
}

interface ATSAnalyzerProps {
  cvData: CVData
  hasImage?: boolean
  usesStandardFont?: boolean
  hasTableLayout?: boolean
  hideScore?: boolean // M2: Option to hide score (shown in parent)
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
    nameKey: 'cv.ats.analyzer.industries.it',
    icon: <Code size={18} />,
    keywords: ['programmering', 'utveckling', 'system', 'databas', 'nätverk', 'agil', 'scrum', 'devops', 'cloud', 'säkerhet', 'python', 'javascript', 'java', 'sql'],
    color: '#0891b2'
  },
  {
    id: 'healthcare',
    nameKey: 'cv.ats.analyzer.industries.healthcare',
    icon: <HeartPulse size={18} />,
    keywords: ['patientvård', 'omsorg', 'hälso- och sjukvård', 'legitimerad', 'vårdplan', 'medicinsk', 'rehabilitering', 'bemannings', 'diagnos', 'behandling'],
    color: '#e11d48'
  },
  {
    id: 'construction',
    nameKey: 'cv.ats.analyzer.industries.construction',
    icon: <Hammer size={18} />,
    keywords: ['byggprojekt', 'konstruktion', 'projektering', 'byggledning', 'arbetsmiljö', 'bygglov', 'entreprenad', 'ritningsläsning', 'byggnation'],
    color: '#f97316'
  },
  {
    id: 'retail',
    nameKey: 'cv.ats.analyzer.industries.retail',
    icon: <ShoppingCart size={18} />,
    keywords: ['försäljning', 'kundservice', 'varuhantering', 'kassa', 'merchandising', 'detaljhandel', 'lager', 'order', 'leverans', 'butiksarbete'],
    color: '#10b981'
  },
  {
    id: 'education',
    nameKey: 'cv.ats.analyzer.industries.education',
    icon: <GraduationCap size={18} />,
    keywords: ['undervisning', 'pedagogik', 'läroplan', 'betygssättning', 'handledning', 'klassrum', 'skola', 'utbildningsplan', 'kurs', 'examen'],
    color: '#7c3aed'
  },
  {
    id: 'finance',
    nameKey: 'cv.ats.analyzer.industries.finance',
    icon: <Briefcase size={18} />,
    keywords: ['redovisning', 'bokföring', 'budget', 'analys', 'revision', 'ekonomi', 'finans', 'rapportering', 'beslut', 'prognos', 'excel'],
    color: '#059669'
  },
  {
    id: 'admin',
    nameKey: 'cv.ats.analyzer.industries.admin',
    icon: <Building size={18} />,
    keywords: ['administration', 'kundsupport', 'diarieföring', 'arkivering', 'mötesbokning', 'reception', 'växel', 'korrespondens', 'beställning'],
    color: '#6366f1'
  },
  {
    id: 'service',
    nameKey: 'cv.ats.analyzer.industries.service',
    icon: <Wrench size={18} />,
    keywords: ['service', 'gästbemötande', 'servering', 'köksarbete', 'städning', 'hotell', 'restaurang', 'catering', 'evenemang', 'gästvänlig'],
    color: '#ec4899'
  }
]

export function ATSAnalyzer({
  cvData,
  hasImage = false,
  usesStandardFont = true,
  hasTableLayout = false,
  hideScore = true // M2: Default hide score since parent shows it
}: ATSAnalyzerProps) {
  const { t } = useTranslation()
  const [showRecruiterView, setShowRecruiterView] = useState(false)
  const [showKeywords, setShowKeywords] = useState(false)
  const [showATSChecks, setShowATSChecks] = useState(false)
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
      analyzeCategory(t('cv.ats.analyzer.keywords.competence', 'Kompetensord'), SWEDISH_KEYWORDS.competence),
      analyzeCategory(t('cv.ats.analyzer.keywords.action', 'Aktivitetsord'), SWEDISH_KEYWORDS.action),
      analyzeCategory(t('cv.ats.analyzer.keywords.results', 'Resultatindikatorer'), SWEDISH_KEYWORDS.results)
    ]
  }, [allCVText, t])

  // Rekryterarens ögonblicks-test
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

  // Beräkna skannbarhetspoäng
  const scanabilityScore = useMemo(() => {
    let score = 100

    const avgDescLength = cvData.workExperience?.reduce((acc, w) =>
      acc + (w.description?.length || 0), 0) / (cvData.workExperience?.length || 1) || 0
    if (avgDescLength > 500) score -= 15
    if (avgDescLength > 800) score -= 15

    const skillCount = cvData.skills?.length || 0
    if (skillCount < 3) score -= 10
    if (skillCount > 15) score -= 10

    if ((cvData.summary?.length || 0) > 600) score -= 10
    if (!cvData.summary || cvData.summary.length < 50) score -= 15

    return Math.max(0, Math.min(100, score))
  }, [cvData])

  // Beräkna läsbarhet
  const calculateReadability = useCallback((text: string) => {
    if (!text) return { score: 0, level: t('cv.ats.analyzer.readability.noText', 'Ingen text') }
    const words = text.split(/\s+/).length
    const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length
    const syllables = text.split(/[aeiouåäöAEIOUÅÄÖ]/).length - 1

    if (sentences === 0 || words === 0) return { score: 0, level: t('cv.ats.analyzer.readability.noText', 'Ingen text') }

    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)

    let level = t('cv.ats.analyzer.readability.veryHard', 'Mycket svår')
    if (score > 90) level = t('cv.ats.analyzer.readability.veryEasy', 'Mycket lätt')
    else if (score > 80) level = t('cv.ats.analyzer.readability.easy', 'Lätt')
    else if (score > 70) level = t('cv.ats.analyzer.readability.medium', 'Medel')
    else if (score > 60) level = t('cv.ats.analyzer.readability.mediumHard', 'Medelsvår')

    return { score: Math.round(score), level }
  }, [t])

  const summaryReadability = calculateReadability(cvData.summary || '')
  const totalWordCount = (cvData.summary || '').split(/\s+/).length +
    cvData.workExperience?.reduce((acc, w) => acc + (w.description?.split(/\s+/).length || 0), 0) || 0

  // ATS-kontroller med CV-builder step links (M1)
  const basicChecks: ATSCheck[] = useMemo(() => [
    {
      id: 'contact',
      name: t('cv.ats.analyzer.checks.contact', 'Kontaktinformation'),
      passed: !!(cvData.email && cvData.phone),
      description: t('cv.ats.analyzer.checks.contactDesc', 'E-post och telefon finns'),
      importance: 'high',
      fixStep: 2
    },
    {
      id: 'summary',
      name: t('cv.ats.analyzer.checks.summary', 'Sammanfattning'),
      passed: (cvData.summary?.length || 0) >= 50,
      description: t('cv.ats.analyzer.checks.summaryDesc', 'Minst 50 tecken rekommenderas'),
      importance: 'high',
      fixStep: 3
    },
    {
      id: 'experience',
      name: t('cv.ats.analyzer.checks.experience', 'Erfarenhet'),
      passed: (cvData.workExperience?.length || 0) > 0,
      description: t('cv.ats.analyzer.checks.experienceDesc', 'Minst en anställning'),
      importance: 'high',
      fixStep: 4
    },
    {
      id: 'education',
      name: t('cv.ats.analyzer.checks.education', 'Utbildning'),
      passed: (cvData.education?.length || 0) > 0,
      description: t('cv.ats.analyzer.checks.educationDesc', 'Minst en utbildning'),
      importance: 'medium',
      fixStep: 4
    },
    {
      id: 'measurable',
      name: t('cv.ats.analyzer.checks.measurable', 'Mätbara resultat'),
      passed: cvData.workExperience?.some(w =>
        /\d+%|\d+\s+(å|mån|år|månader)|ökade|minskade|förbättrade|reducerade/.test(w.description || '')
      ) || false,
      description: t('cv.ats.analyzer.checks.measurableDesc', 'Använder siffror och procent'),
      importance: 'high',
      fixStep: 4
    },
    {
      id: 'skills',
      name: t('cv.ats.analyzer.checks.skills', 'Färdigheter'),
      passed: (cvData.skills?.length || 0) >= 3,
      description: t('cv.ats.analyzer.checks.skillsDesc', 'Minst 3 färdigheter'),
      importance: 'medium',
      fixStep: 5
    },
    {
      id: 'length',
      name: t('cv.ats.analyzer.checks.length', 'CV-längd'),
      passed: totalWordCount >= 150 && totalWordCount <= 800,
      description: t('cv.ats.analyzer.checks.lengthDesc', '150-800 ord rekommenderas'),
      importance: 'medium',
      fixStep: 3
    },
    {
      id: 'readability',
      name: t('cv.ats.analyzer.checks.readability', 'Läslighet'),
      passed: summaryReadability.score >= 60,
      description: `${t('cv.ats.analyzer.checks.readabilityLevel', 'Nivå')}: ${summaryReadability.level}`,
      importance: 'medium',
      fixStep: 3
    },
    {
      id: 'languages',
      name: t('cv.ats.analyzer.checks.languages', 'Språk'),
      passed: (cvData.languages?.length || 0) >= 1,
      description: t('cv.ats.analyzer.checks.languagesDesc', 'Språkkunskaper angivna'),
      importance: 'low',
      fixStep: 5
    },
    {
      id: 'references',
      name: t('cv.ats.analyzer.checks.references', 'Referenser'),
      passed: (cvData.references?.length || 0) >= 1,
      description: t('cv.ats.analyzer.checks.referencesDesc', 'Minst en referens'),
      importance: 'low',
      fixStep: 5
    },
  ], [cvData, t, summaryReadability, totalWordCount])

  // Tekniska ATS-kontroller
  const technicalChecks: ATSCheck[] = useMemo(() => [
    {
      id: 'noImages',
      name: t('cv.ats.analyzer.technical.noImages', 'Inga bilder'),
      passed: !hasImage,
      description: t('cv.ats.analyzer.technical.noImagesDesc', 'Bilder kan inte läsas av de flesta ATS'),
      importance: 'high',
      tip: t('cv.ats.analyzer.technical.noImagesTip', 'Ta bort profilbilden - de flesta ATS-system kan inte tolka bilder'),
      fixStep: 2
    },
    {
      id: 'standardFont',
      name: t('cv.ats.analyzer.technical.standardFont', 'Standardtypsnitt'),
      passed: usesStandardFont,
      description: t('cv.ats.analyzer.technical.standardFontDesc', 'Använder ATS-vänligt typsnitt'),
      importance: 'medium',
      tip: t('cv.ats.analyzer.technical.standardFontTip', 'Använd Arial, Calibri, Georgia eller Times New Roman för bästa kompatibilitet'),
      fixStep: 1
    },
    {
      id: 'noTables',
      name: t('cv.ats.analyzer.technical.noTables', 'Inga tabeller'),
      passed: !hasTableLayout,
      description: t('cv.ats.analyzer.technical.noTablesDesc', 'Tabeller kan förvrängas i ATS'),
      importance: 'high',
      tip: t('cv.ats.analyzer.technical.noTablesTip', 'Använd vanlig textformatering istället för tabeller'),
      fixStep: 1
    },
    {
      id: 'fileFormat',
      name: t('cv.ats.analyzer.technical.fileFormat', 'Filformat'),
      passed: true,
      description: t('cv.ats.analyzer.technical.fileFormatDesc', 'PDF rekommenderas för bästa kompatibilitet'),
      importance: 'medium',
      tip: t('cv.ats.analyzer.technical.fileFormatTip', 'Spara alltid som PDF för att bevara formateringen')
    },
    {
      id: 'fileName',
      name: t('cv.ats.analyzer.technical.fileName', 'Filnamn'),
      passed: !!(cvData.firstName && cvData.lastName),
      description: t('cv.ats.analyzer.technical.fileNameDesc', 'Använd förnamn-efternamn-cv.pdf'),
      importance: 'low',
      tip: t('cv.ats.analyzer.technical.fileNameTip', 'Rekommenderat filnamn: {{name}}-cv.pdf', { name: `${cvData.firstName || 'fornamn'}-${cvData.lastName || 'efternamn'}` }),
      fixStep: 2
    },
  ], [cvData, hasImage, usesStandardFont, hasTableLayout, t])

  const allChecks = [...basicChecks, ...technicalChecks]
  const passedChecks = allChecks.filter(c => c.passed).length
  const score = Math.round((passedChecks / allChecks.length) * 100)

  // Nyckelordsgenomslag
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

    if (hasImage) issues.push(t('cv.ats.analyzer.export.issueImage', 'Innehåller bild som ATS kanske inte kan läsa'))
    if (hasTableLayout) issues.push(t('cv.ats.analyzer.export.issueTable', 'Använder tabellayout som kan förvrängas'))
    if (!usesStandardFont) issues.push(t('cv.ats.analyzer.export.issueFont', 'Använder icke-standard typsnitt'))
    if ((cvData.skills?.length || 0) < 3) issues.push(t('cv.ats.analyzer.export.issueSkills', 'För få färdigheter listade'))
    if (!cvData.summary || cvData.summary.length < 50) issues.push(t('cv.ats.analyzer.export.issueSummary', 'Saknar eller har för kort sammanfattning'))
    if (scanabilityScore < 70) issues.push(t('cv.ats.analyzer.export.issueScanability', 'Låg skannbarhetspoäng'))

    return {
      ready: issues.length === 0,
      issues,
      score: Math.max(0, 100 - issues.length * 15)
    }
  }, [hasImage, hasTableLayout, usesStandardFont, cvData, scanabilityScore, t])

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-brand-900 dark:text-brand-400'
    if (s >= 60) return 'text-amber-700 dark:text-amber-400'
    return 'text-red-700 dark:text-red-400'
  }

  const getScoreBg = (s: number) => {
    if (s >= 80) return 'bg-brand-100 dark:bg-brand-900/30'
    if (s >= 60) return 'bg-amber-100 dark:bg-amber-900/30'
    return 'bg-red-100 dark:bg-red-900/30'
  }

  const getKeywordProgressColor = (found: number, total: number) => {
    const ratio = found / total
    if (ratio >= 0.6) return 'bg-brand-700'
    if (ratio >= 0.3) return 'bg-amber-500'
    return 'bg-red-500'
  }

  // M3: Nästa steg förslag - positivt formulerade, med fix-links
  const nextSteps = useMemo(() => {
    const steps: { text: string; step: number }[] = []

    if (!basicChecks.find(c => c.id === 'measurable')?.passed) {
      steps.push({ text: t('cv.ats.analyzer.nextSteps.measurable', 'Förstärk med mätbara resultat – siffror visar din påverkan'), step: 4 })
    }
    if ((cvData.skills?.length || 0) < 5) {
      steps.push({ text: t('cv.ats.analyzer.nextSteps.skills', 'Utforska fler färdigheter du har som kan tillföra värde'), step: 5 })
    }
    if (!cvData.summary) {
      steps.push({ text: t('cv.ats.analyzer.nextSteps.summary', 'Skapa en sammanfattning som visar vem du är professionellt'), step: 3 })
    }
    if (totalWordCount < 150) {
      steps.push({ text: t('cv.ats.analyzer.nextSteps.moreContent', 'Utveckla dina beskrivningar för att visa mer av din erfarenhet'), step: 4 })
    }
    if (totalWordCount > 800) {
      steps.push({ text: t('cv.ats.analyzer.nextSteps.lessContent', 'Förfina dina texter för att göra dem mer koncisa'), step: 3 })
    }
    if (keywordScore < 50) {
      steps.push({ text: t('cv.ats.analyzer.nextSteps.keywords', 'Lägg till fler nyckelord som matchar dina styrkor'), step: 5 })
    }
    if (scanabilityScore < 70) {
      steps.push({ text: t('cv.ats.analyzer.nextSteps.scanability', 'Förbättra skannbarheten genom att korta ner långa texter'), step: 3 })
    }

    return steps
  }, [basicChecks, cvData, totalWordCount, keywordScore, scanabilityScore, t])

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl p-6 border border-stone-200 dark:border-stone-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-brand-700/10 dark:bg-brand-400/10 rounded-lg">
          <FileSearch size={24} className="text-brand-900 dark:text-brand-400" />
        </div>
        <div>
          <h3 className="font-semibold text-stone-800 dark:text-stone-200">
            {t('cv.ats.analyzer.title', 'ATS-analys')}
          </h3>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {t('cv.ats.analyzer.subtitle', 'Optimera för rekryteringssystem')}
          </p>
        </div>
      </div>

      {/* M2: Score visas bara om hideScore är false */}
      {!hideScore && (
        <div className="text-center mb-6">
          <div
            className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreBg(score)} mb-2`}
            role="img"
            aria-label={t('cv.ats.analyzer.scoreLabel', 'ATS-poäng: {{score}} av 100', { score })}
          >
            <span className={`text-3xl font-bold ${getScoreColor(score)}`} aria-hidden="true">{score}</span>
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400" aria-hidden="true">
            {t('cv.ats.analyzer.outOf100', 'av 100 poäng')}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">
            {t('cv.ats.analyzer.checksCompleted', 'Du har {{passed}} av {{total}} på plats', { passed: passedChecks, total: allChecks.length })}
          </p>
        </div>
      )}

      {/* M3: Nästa steg - FLYTTAT HÖGRE UPP */}
      {nextSteps.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-sky-50 to-brand-50 dark:from-sky-900/20 dark:to-brand-900/20 rounded-xl border border-sky-100 dark:border-sky-800/50">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={18} className="text-sky-600 dark:text-sky-400" />
            <h4 className="font-medium text-sky-900 dark:text-sky-200">
              {t('cv.ats.analyzer.nextSteps.title', 'Nästa steg för att stärka ditt CV')}
            </h4>
          </div>
          <ul className="space-y-2">
            {nextSteps.slice(0, 3).map((step, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-brand-700 dark:text-brand-400 mt-0.5 flex-shrink-0">→</span>
                <span className="text-stone-700 dark:text-stone-300 flex-1">{step.text}</span>
                {/* M1: "Fixa nu"-knapp */}
                <Link
                  to={`/cv?step=${step.step}`}
                  className="text-xs px-2 py-1 bg-brand-900 text-white rounded-lg hover:bg-brand-900 transition-colors flex-shrink-0"
                >
                  {t('cv.ats.analyzer.fixNow', 'Fixa nu')}
                </Link>
              </li>
            ))}
          </ul>
          {nextSteps.length > 3 && (
            <p className="text-xs text-sky-600 dark:text-sky-400 mt-2">
              {t('cv.ats.analyzer.moreSteps', '+{{count}} fler förbättringsförslag', { count: nextSteps.length - 3 })}
            </p>
          )}
        </div>
      )}

      {/* Rekryterarens ögonblicks-test */}
      <div className="mb-6 p-4 bg-gradient-to-r from-brand-50 to-sky-50 dark:from-brand-900/20 dark:to-sky-900/20 rounded-xl border border-brand-100 dark:border-brand-900/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-brand-900 dark:text-brand-400" />
            <h4 className="font-medium text-brand-900 dark:text-brand-200">
              {t('cv.ats.analyzer.recruiterTest.title', 'Rekryterarens ögonblicks-test')}
            </h4>
          </div>
          {/* M4: aria-expanded */}
          <button
            onClick={() => setShowRecruiterView(!showRecruiterView)}
            aria-expanded={showRecruiterView}
            aria-controls="recruiter-view-details"
            className="text-xs text-brand-900 dark:text-brand-400 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-2 rounded"
          >
            {showRecruiterView ? t('common.hide', 'Dölj') : t('common.showDetails', 'Visa detaljer')}
          </button>
        </div>
        <p className="text-xs text-brand-900 dark:text-brand-300 mb-3">
          {t('cv.ats.analyzer.recruiterTest.description', 'En rekryterare skannar ditt CV på 6 sekunder. Så här ser det ut:')}
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm" role="list" aria-label={t('cv.ats.analyzer.recruiterTest.listLabel', 'Checklista för snabbskanning')}>
          <div role="listitem" className={`p-2 rounded-lg ${recruiterSnapshot.hasName ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-900 dark:text-brand-300' : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'}`}>
            <span className="text-xs">
              <span aria-hidden="true">{recruiterSnapshot.hasName ? '✓' : '○'}</span>
              <span className="sr-only">{recruiterSnapshot.hasName ? t('common.passed', 'Godkänt') : t('common.missing', 'Saknas')}: </span>
              {' '}{t('cv.ats.analyzer.recruiterTest.name', 'Namn synligt')}
            </span>
          </div>
          <div role="listitem" className={`p-2 rounded-lg ${recruiterSnapshot.hasClearTitle ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-900 dark:text-brand-300' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'}`}>
            <span className="text-xs">
              <span aria-hidden="true">{recruiterSnapshot.hasClearTitle ? '✓' : '○'}</span>
              <span className="sr-only">{recruiterSnapshot.hasClearTitle ? t('common.passed', 'Godkänt') : t('common.missing', 'Saknas')}: </span>
              {' '}{t('cv.ats.analyzer.recruiterTest.profile', 'Tydlig profil')}
            </span>
          </div>
          <div role="listitem" className={`p-2 rounded-lg ${recruiterSnapshot.hasExperienceCount ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-900 dark:text-brand-300' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'}`}>
            <span className="text-xs">
              {recruiterSnapshot.yearsOfExperience > 0
                ? t('cv.ats.analyzer.recruiterTest.yearsExp', '{{years}} år erfarenhet', { years: recruiterSnapshot.yearsOfExperience })
                : <><span aria-hidden="true">○</span> {t('cv.ats.analyzer.recruiterTest.experience', 'Erfarenhet')}</>
              }
            </span>
          </div>
          <div role="listitem" className={`p-2 rounded-lg ${recruiterSnapshot.hasKeySkills ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-900 dark:text-brand-300' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'}`}>
            <span className="text-xs">
              {recruiterSnapshot.topSkills.length > 0
                ? t('cv.ats.analyzer.recruiterTest.skillsCount', '{{count}} styrkor', { count: recruiterSnapshot.topSkills.length })
                : <><span aria-hidden="true">○</span> {t('cv.ats.analyzer.recruiterTest.keySkills', 'Nyckelkompetenser')}</>
              }
            </span>
          </div>
        </div>
        {recruiterSnapshot.latestRole && (
          <p className="text-xs text-brand-900 dark:text-brand-400 mt-2">
            {t('cv.ats.analyzer.recruiterTest.latestRole', 'Senaste roll')}: <strong>{recruiterSnapshot.latestRole}</strong> {recruiterSnapshot.latestCompany && t('cv.ats.analyzer.recruiterTest.at', 'på {{company}}', { company: recruiterSnapshot.latestCompany })}
          </p>
        )}

        {/* Skannbarhetspoäng - expanderbar */}
        {showRecruiterView && (
          <div id="recruiter-view-details" className="mt-4 pt-4 border-t border-brand-200 dark:border-brand-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-brand-900 dark:text-brand-200">
                {t('cv.ats.analyzer.scanability.title', 'Skannbarhetspoäng')}
              </span>
              <span className={`text-lg font-bold ${getScoreColor(scanabilityScore)}`}>
                {scanabilityScore}/100
              </span>
            </div>
            <div
              className="w-full h-2 bg-white dark:bg-stone-700 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={scanabilityScore}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('cv.ats.analyzer.scanability.label', 'Skannbarhetspoäng: {{score}} av 100', { score: scanabilityScore })}
            >
              <div
                className={`h-full transition-all ${
                  scanabilityScore >= 80 ? 'bg-brand-700' :
                  scanabilityScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${scanabilityScore}%` }}
                aria-hidden="true"
              />
            </div>
            <p className="text-xs text-brand-900 dark:text-brand-300 mt-2">
              {scanabilityScore >= 80
                ? t('cv.ats.analyzer.scanability.excellent', 'Mycket lättskannat CV - rekryterare ser snabbt dina styrkor!')
                : scanabilityScore >= 60
                  ? t('cv.ats.analyzer.scanability.good', 'Acceptabel skannbarhet - några justeringar kan hjälpa')
                  : t('cv.ats.analyzer.scanability.poor', 'Svårskannat CV - viktig information kan missas av rekryterare')
              }
            </p>
          </div>
        )}
      </div>

      {/* Branschspecifika nyckelord */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase size={18} className="text-stone-600 dark:text-stone-400" />
          <h4 className="font-medium text-stone-700 dark:text-stone-300">
            {t('cv.ats.analyzer.industries.title', 'Branschspecifika nyckelord')}
          </h4>
        </div>
        <p className="text-xs text-stone-600 dark:text-stone-400 mb-3">
          {t('cv.ats.analyzer.industries.description', 'Välj din bransch för att se vilka nyckelord som är vanliga')}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label={t('cv.ats.analyzer.industries.selectLabel', 'Välj bransch')}>
          {INDUSTRY_TEMPLATES.map((industry) => (
            <button
              key={industry.id}
              onClick={() => setSelectedIndustry(selectedIndustry === industry.id ? null : industry.id)}
              role="radio"
              aria-checked={selectedIndustry === industry.id}
              className={`p-2 rounded-lg border text-center transition-all focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-2 ${
                selectedIndustry === industry.id
                  ? 'border-brand-700 bg-brand-50 dark:bg-brand-900/30'
                  : 'border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500'
              }`}
            >
              <div
                className="mx-auto mb-1"
                style={{ color: selectedIndustry === industry.id ? industry.color : undefined }}
              >
                {industry.icon}
              </div>
              <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                {t(industry.nameKey, industry.id)}
              </span>
            </button>
          ))}
        </div>

        {/* Branschmatchning */}
        {industryMatch && (
          <div className="mt-3 p-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                {t('cv.ats.analyzer.industries.matchFor', 'Matchning för {{industry}}', { industry: t(industryMatch.industry.nameKey) })}
              </span>
              <span className={`text-sm font-bold ${getScoreColor(industryMatch.percentage)}`}>
                {industryMatch.percentage}%
              </span>
            </div>
            <div
              className="w-full h-2 bg-stone-200 dark:bg-stone-600 rounded-full overflow-hidden mb-2"
              role="progressbar"
              aria-valuenow={industryMatch.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full transition-all"
                style={{
                  width: `${industryMatch.percentage}%`,
                  backgroundColor: industryMatch.percentage >= 60 ? industryMatch.industry.color : '#ef4444'
                }}
                aria-hidden="true"
              />
            </div>
            {industryMatch.found.length > 0 && (
              <p className="text-xs text-brand-900 dark:text-brand-400 mb-1">
                <span aria-hidden="true">✓</span> {t('cv.ats.analyzer.industries.found', 'Hittade')}: {industryMatch.found.slice(0, 5).join(', ')}
                {industryMatch.found.length > 5 && ` +${industryMatch.found.length - 5} ${t('common.more', 'till')}`}
              </p>
            )}
            {industryMatch.missing.length > 0 && (
              <p className="text-xs text-stone-600 dark:text-stone-400">
                {t('cv.ats.analyzer.industries.missing', 'Saknas')}: {industryMatch.missing.slice(0, 4).join(', ')}
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
          aria-expanded={showKeywords}
          aria-controls="keyword-analysis-section"
          className="w-full flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-700"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            <span className="font-medium text-stone-700 dark:text-stone-300">
              {t('cv.ats.analyzer.keywords.title', 'Nyckelordsanalys')}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${keywordScore >= 60 ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-900 dark:text-brand-300' : keywordScore >= 40 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
              {totalKeywordsFound}/{totalKeywords}
            </span>
          </div>
          <ArrowRight className={`w-4 h-4 text-brand-900 dark:text-brand-400 transition-transform ${showKeywords ? 'rotate-90' : ''}`} />
        </button>

        {showKeywords && (
          <div id="keyword-analysis-section" className="mt-3 space-y-3">
            {keywordAnalysis.map((category) => (
              <div key={category.name} className="p-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{category.name}</span>
                  <span className="text-xs text-stone-600 dark:text-stone-400">{category.found.length}/{category.keywords.length}</span>
                </div>
                <div
                  className="w-full h-2 bg-stone-200 dark:bg-stone-600 rounded-full mb-2"
                  role="progressbar"
                  aria-valuenow={category.found.length}
                  aria-valuemin={0}
                  aria-valuemax={category.keywords.length}
                >
                  <div
                    className={`h-2 rounded-full transition-all ${getKeywordProgressColor(category.found.length, category.keywords.length)}`}
                    style={{ width: `${(category.found.length / category.keywords.length) * 100}%` }}
                    aria-hidden="true"
                  />
                </div>
                {category.found.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs text-brand-900 dark:text-brand-400"><span aria-hidden="true">✓</span> {t('cv.ats.analyzer.keywords.found', 'Hittade')}: </span>
                    <span className="text-xs text-stone-600 dark:text-stone-400">{category.found.join(', ')}</span>
                  </div>
                )}
                {category.missing.length > 0 && (
                  <div>
                    <span className="text-xs text-stone-500 dark:text-stone-400">{t('cv.ats.analyzer.keywords.suggestions', 'Förslag')}: </span>
                    <span className="text-xs text-stone-600 dark:text-stone-400">{category.missing.slice(0, 4).join(', ')}{category.missing.length > 4 && '...'}</span>
                  </div>
                )}
              </div>
            ))}
            <p className="text-xs text-stone-500 dark:text-stone-400 italic">
              <span aria-hidden="true">💡</span> {t('cv.ats.analyzer.keywords.tip', 'Tips: Använd nyckelorden naturligt i dina beskrivningar – koppla dem till dina faktiska erfarenheter')}
            </p>
          </div>
        )}
      </div>

      {/* ATS-kontroller */}
      <div className="mb-6">
        <button
          onClick={() => setShowATSChecks(!showATSChecks)}
          aria-expanded={showATSChecks}
          aria-controls="ats-checks-section"
          className="w-full flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-700"
        >
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-stone-600 dark:text-stone-400" />
            <span className="font-medium text-stone-700 dark:text-stone-300">
              {t('cv.ats.analyzer.technical.title', 'ATS-kompatibilitet')}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              technicalChecks.filter(c => c.passed).length === technicalChecks.length
                ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-900 dark:text-brand-300'
                : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
            }`}>
              {technicalChecks.filter(c => c.passed).length}/{technicalChecks.length}
            </span>
          </div>
          <ArrowRight className={`w-4 h-4 text-brand-900 dark:text-brand-400 transition-transform ${showATSChecks ? 'rotate-90' : ''}`} />
        </button>

        {showATSChecks && (
          <div id="ats-checks-section" className="mt-3 space-y-2">
            {technicalChecks.map((check) => (
              <div
                key={check.id}
                className={`flex items-start gap-2 p-3 rounded-lg ${
                  check.passed ? 'bg-brand-50 dark:bg-brand-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
                }`}
              >
                {check.passed ? (
                  <CheckCircle size={18} className="text-brand-900 dark:text-brand-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <Lightbulb size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${check.passed ? 'text-brand-900 dark:text-brand-300' : 'text-amber-800 dark:text-amber-300'}`}>
                    <span className="sr-only">{check.passed ? t('common.passed', 'Godkänt') : t('common.needsAttention', 'Behöver uppmärksamhet')}: </span>
                    {check.name}
                  </p>
                  <p className="text-xs text-stone-600 dark:text-stone-400">{check.description}</p>
                  {!check.passed && check.tip && (
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 italic">
                      <span aria-hidden="true">💡</span> {check.tip}
                    </p>
                  )}
                </div>
                {/* M1: Fix-knapp för varje check */}
                {!check.passed && check.fixStep && (
                  <Link
                    to={`/cv?step=${check.fixStep}`}
                    className="text-xs px-2 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors flex-shrink-0"
                  >
                    {t('cv.ats.analyzer.fixNow', 'Fixa')}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Läsbarhet */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg text-center">
          <BookOpen size={16} className="mx-auto mb-1 text-stone-600 dark:text-stone-400" aria-hidden="true" />
          <p className="text-lg font-semibold text-stone-800 dark:text-stone-200">{totalWordCount}</p>
          <p className="text-xs text-stone-600 dark:text-stone-400">{t('cv.ats.analyzer.stats.words', 'ord totalt')}</p>
        </div>
        <div className="p-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg text-center">
          <TrendingUp size={16} className="mx-auto mb-1 text-stone-600 dark:text-stone-400" aria-hidden="true" />
          <p className="text-lg font-semibold text-stone-800 dark:text-stone-200">{summaryReadability.level}</p>
          <p className="text-xs text-stone-600 dark:text-stone-400">{t('cv.ats.analyzer.stats.readLevel', 'läsnivå')}</p>
        </div>
      </div>

      {/* Export-förberedelse */}
      <div className="mb-6">
        <button
          onClick={() => setShowExportCheck(!showExportCheck)}
          aria-expanded={showExportCheck}
          aria-controls="export-check-section"
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 rounded-lg hover:from-blue-100 hover:to-sky-100 dark:hover:from-blue-900/30 dark:hover:to-sky-900/30 transition-colors border border-blue-100 dark:border-blue-800/50 focus:outline-none focus:ring-2 focus:ring-brand-700"
        >
          <div className="flex items-center gap-2">
            <Download size={18} className="text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-900 dark:text-blue-200">
              {t('cv.ats.analyzer.export.title', 'Export-förberedelse')}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              exportReadiness.ready
                ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-900 dark:text-brand-300'
                : exportReadiness.score >= 60
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                  : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
            }`}>
              {exportReadiness.ready ? t('cv.ats.analyzer.export.ready', 'Klar') : `${exportReadiness.score}%`}
            </span>
          </div>
          <ArrowRight className={`w-4 h-4 text-blue-600 dark:text-blue-400 transition-transform ${showExportCheck ? 'rotate-90' : ''}`} />
        </button>

        {showExportCheck && (
          <div id="export-check-section" className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
            {exportReadiness.ready ? (
              <div className="flex items-start gap-3">
                <FileCheck size={20} className="text-brand-900 dark:text-brand-400 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-medium text-brand-900 dark:text-brand-300">
                    {t('cv.ats.analyzer.export.readyTitle', 'Ditt CV är redo att exporteras!')}
                  </p>
                  <p className="text-sm text-brand-900 dark:text-brand-400 mt-1">
                    {t('cv.ats.analyzer.export.readyDescription', 'Alla kontroller är godkända. Ditt CV bör vara väl läsbart för både ATS och rekryterare.')}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                    <span aria-hidden="true">💡</span> {t('cv.ats.analyzer.export.fileNameSuggestion', 'Filnamn att använda')}: <strong>{cvData.firstName || 'Fornamn'}-{cvData.lastName || 'Efternamn'}-CV.pdf</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-300">
                      {t('cv.ats.analyzer.export.needsWorkTitle', 'Åtgärda innan export')}
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      {t('cv.ats.analyzer.export.needsWorkDescription', 'Följande problem kan påverka hur väl ditt CV läses av ATS-system:')}
                    </p>
                  </div>
                </div>
                <ul className="space-y-2" role="list">
                  {exportReadiness.issues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
                      <span className="text-amber-500" aria-hidden="true">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                  <span aria-hidden="true">💡</span> {t('cv.ats.analyzer.export.fileNameSuggestion', 'Filnamn att använda')}: <strong>{cvData.firstName || 'Fornamn'}-{cvData.lastName || 'Efternamn'}-CV.pdf</strong>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Best Practices */}
      <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-100 dark:border-brand-900/50">
        <p className="text-xs text-stone-600 dark:text-stone-400">
          <strong>{t('cv.ats.analyzer.tips.label', 'Tips')}:</strong> {t('cv.ats.analyzer.tips.description', 'ATS-system (Applicant Tracking Systems) används av de flesta större företag för att filtrera CV:n. Använd nyckelord från jobbannonser och undvik tabeller, bilder och komplicerad formatering.')}
        </p>
      </div>
    </div>
  )
}

export default ATSAnalyzer
