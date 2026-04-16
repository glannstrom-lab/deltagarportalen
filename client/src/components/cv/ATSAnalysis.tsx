/**
 * ATS Analysis Component
 * Check how well CV passes through recruitment systems
 */

import { useState, useEffect } from 'react'
import { 
  Target, 
  Check, 
  AlertCircle, 
  X, 
  RefreshCw,
  FileText,
  Sparkles,
  ArrowRight,
  Lightbulb,
  Award,
  Loader2
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { ATSAnalyzer } from './ATSAnalyzer'
import { cvApi } from '@/services/supabaseApi'
import type { CVData } from '@/services/supabaseApi'

interface ATSCheck {
  id: string
  category: 'content' | 'format' | 'keywords' | 'technical'
  title: string
  description: string
  status: 'pass' | 'warning' | 'fail' | 'neutral'
  score: number
  tips: string[]
}

const defaultChecks: ATSCheck[] = [
  {
    id: '1',
    category: 'content',
    title: 'Kontaktinformation',
    description: 'Har du fyllt i namn, e-post och telefon?',
    status: 'pass',
    score: 10,
    tips: ['Se till att din e-post är professionell', 'Dubbelkolla att telefonnumret är korrekt']
  },
  {
    id: '2',
    category: 'content',
    title: 'Sammanfattning/Profil',
    description: 'En kort sammanfattning ökar chanserna avsevärt',
    status: 'pass',
    score: 15,
    tips: ['Skriv 2-3 meningar om vem du är', 'Nämn vad du söker för typ av roll']
  },
  {
    id: '3',
    category: 'content',
    title: 'Arbetslivserfarenhet',
    description: 'Har du listat dina tidigare jobb?',
    status: 'pass',
    score: 20,
    tips: ['Börja med det senaste jobbet', 'Använd bullet points för arbetsuppgifter']
  },
  {
    id: '4',
    category: 'content',
    title: 'Utbildning',
    description: 'Har du med din utbildning?',
    status: 'warning',
    score: 10,
    tips: ['Lista även pågående utbildningar', 'Inkludera relevanta kurser']
  },
  {
    id: '5',
    category: 'keywords',
    title: 'Nyckelord från annonsen',
    description: 'Matchar ditt CV jobbannonsens nyckelord?',
    status: 'warning',
    score: 15,
    tips: ['Läs jobbannonsen noggrant', 'Inkludera viktiga kompetenser de efterfrågar']
  },
  {
    id: '6',
    category: 'format',
    title: 'Filformat',
    description: 'Är ditt CV sparat i rätt format?',
    status: 'pass',
    score: 10,
    tips: ['PDF är säkrast för formatering', 'Word (.docx) fungerar också bra']
  },
  {
    id: '7',
    category: 'format',
    title: 'Typsnitt och design',
    description: 'Använder du läsbara typsnitt?',
    status: 'pass',
    score: 10,
    tips: ['Undvik konstiga typsnitt', 'Ha tillräckligt med whitespace']
  },
  {
    id: '8',
    category: 'technical',
    title: 'Bilder och grafik',
    description: 'ATS-system kan ha svårt med bilder',
    status: 'neutral',
    score: 5,
    tips: ['Undvik för mycket grafik', 'Se till att texten är välstrukturerad']
  },
  {
    id: '9',
    category: 'technical',
    title: 'Rubriker och sektioner',
    description: 'Tydliga rubriker hjälper ATS att parsa innehållet',
    status: 'pass',
    score: 5,
    tips: ['Använd standardrubriker', 'Undvik kreativa rubriker som systemet inte förstår']
  }
]

export function ATSAnalysis() {
  const [checks, setChecks] = useState<ATSCheck[]>(defaultChecks)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showDetails, setShowDetails] = useState<string | null>(null)
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [loadingCV, setLoadingCV] = useState(true)

  // Hämta användarens CV-data
  useEffect(() => {
    const loadCV = async () => {
      try {
        const cv = await cvApi.getCV()
        if (cv) {
          setCvData(cv)
        }
      } catch (e) {
        console.error('Kunde inte ladda CV:', e)
      } finally {
        setLoadingCV(false)
      }
    }
    loadCV()
  }, [])

  // Calculate actual ATS score based on CV data
  const calculateChecks = (cv: CVData | null): ATSCheck[] => {
    if (!cv) return defaultChecks

    return [
      {
        id: '1',
        category: 'content',
        title: 'Kontaktinformation',
        description: 'Har du fyllt i namn, e-post och telefon?',
        status: (cv.firstName && cv.lastName && cv.email && cv.phone) ? 'pass' :
                (cv.firstName || cv.email) ? 'warning' : 'fail',
        score: (cv.firstName && cv.lastName ? 5 : 0) + (cv.email ? 3 : 0) + (cv.phone ? 2 : 0),
        tips: ['Se till att din e-post är professionell', 'Dubbelkolla att telefonnumret är korrekt']
      },
      {
        id: '2',
        category: 'content',
        title: 'Sammanfattning/Profil',
        description: 'En kort sammanfattning ökar chanserna avsevärt',
        status: cv.summary && cv.summary.length > 100 ? 'pass' :
                cv.summary && cv.summary.length > 30 ? 'warning' : 'fail',
        score: cv.summary ? Math.min(15, Math.floor(cv.summary.length / 20)) : 0,
        tips: ['Skriv 2-3 meningar om vem du är', 'Nämn vad du söker för typ av roll']
      },
      {
        id: '3',
        category: 'content',
        title: 'Arbetslivserfarenhet',
        description: 'Har du listat dina tidigare jobb?',
        status: cv.workExperience && cv.workExperience.length >= 2 ? 'pass' :
                cv.workExperience && cv.workExperience.length === 1 ? 'warning' : 'fail',
        score: cv.workExperience ? Math.min(25, cv.workExperience.length * 10) : 0,
        tips: ['Börja med det senaste jobbet', 'Använd bullet points för arbetsuppgifter']
      },
      {
        id: '4',
        category: 'content',
        title: 'Utbildning',
        description: 'Har du med din utbildning?',
        status: cv.education && cv.education.length > 0 ? 'pass' : 'warning',
        score: cv.education ? Math.min(15, cv.education.length * 7) : 0,
        tips: ['Lista även pågående utbildningar', 'Inkludera relevanta kurser']
      },
      {
        id: '5',
        category: 'keywords',
        title: 'Kompetenser',
        description: 'Har du listat dina kompetenser?',
        status: cv.skills && cv.skills.length >= 5 ? 'pass' :
                cv.skills && cv.skills.length > 0 ? 'warning' : 'fail',
        score: cv.skills ? Math.min(15, cv.skills.length * 3) : 0,
        tips: ['Lägg till både tekniska och mjuka kompetenser', 'Inkludera kompetenser som efterfrågas i annonser']
      },
      {
        id: '6',
        category: 'format',
        title: 'Profilbild',
        description: 'En professionell bild ökar chanserna',
        status: cv.profileImage ? 'pass' : 'neutral',
        score: cv.profileImage ? 5 : 0,
        tips: ['Använd en professionell bild', 'Se till att bakgrunden är neutral']
      },
      {
        id: '7',
        category: 'format',
        title: 'Mall vald',
        description: 'Använder du en modern CV-mall?',
        status: cv.template ? 'pass' : 'warning',
        score: cv.template ? 10 : 5,
        tips: ['Välj en mall som passar din bransch', 'Undvik för kreativa mallar för traditionella jobb']
      },
      {
        id: '8',
        category: 'technical',
        title: 'Språkkunskaper',
        description: 'Har du angett dina språkkunskaper?',
        status: cv.languages && cv.languages.length > 0 ? 'pass' : 'neutral',
        score: cv.languages ? Math.min(10, cv.languages.length * 5) : 0,
        tips: ['Ange språknivå för varje språk', 'Svenska och engelska är ofta krav']
      },
      {
        id: '9',
        category: 'technical',
        title: 'Certifieringar',
        description: 'Certifieringar stärker din profil',
        status: cv.certificates && cv.certificates.length > 0 ? 'pass' : 'neutral',
        score: cv.certificates ? Math.min(5, cv.certificates.length * 2) : 0,
        tips: ['Lägg till relevanta certifikat', 'Körkort räknas också!']
      }
    ]
  }

  // Recalculate checks when CV data changes
  useEffect(() => {
    if (cvData) {
      setChecks(calculateChecks(cvData))
    }
  }, [cvData])

  const totalScore = checks.reduce((sum, check) => sum + check.score, 0)
  const maxScore = 100
  const percentage = Math.min(100, Math.round((totalScore / maxScore) * 100))

  const runAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      // Reload CV data and recalculate
      const cv = await cvApi.getCV()
      if (cv) {
        setCvData(cv)
        setChecks(calculateChecks(cv))
      }
    } catch (e) {
      console.error('Kunde inte ladda om CV:', e)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-amber-600 bg-amber-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreText = (score: number) => {
    if (score >= 80) return 'Utmärkt'
    if (score >= 60) return 'Godkänd'
    if (score >= 40) return 'Behöver förbättras'
    return 'Kritisk - åtgärda omgående'
  }

  const categoryLabels: Record<string, string> = {
    content: 'Innehåll',
    format: 'Format & Design',
    keywords: 'Nyckelord',
    technical: 'Tekniskt'
  }

  return (
    <div className="space-y-6">
      {/* ATS Analyzer Widget - Hämtar och analyserar användarens CV */}
      {loadingCV ? (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 p-6">
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600 dark:text-teal-400" />
            <span className="text-stone-600 dark:text-stone-400">Laddar CV-data...</span>
          </div>
        </div>
      ) : cvData ? (
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-stone-800 dark:text-stone-100">ATS-analys av ditt CV</h3>
          </div>
          <p className="text-sm text-stone-700 dark:text-stone-300 mb-4">
            Se hur väl ditt nuvarande CV klarar automatisk screening i rekryteringssystem
          </p>
          <ATSAnalyzer cvData={cvData} />
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">Inget CV hittades</h3>
              <p className="text-amber-800 dark:text-amber-300 text-sm mb-3">
                Du behöver skapa ett CV innan du kan göra en ATS-analys.
              </p>
              <a
                href="/cv"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
              >
                Skapa CV
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Score Card */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Score Circle */}
          <div className="flex items-center justify-center">
            <div className={cn(
              'w-32 h-32 rounded-full flex flex-col items-center justify-center border-4',
              percentage >= 80 ? 'border-green-500 bg-green-50 dark:bg-green-900/30' :
              percentage >= 60 ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30' :
              'border-red-500 bg-red-50 dark:bg-red-900/30'
            )}>
              <span className={cn(
                'text-4xl font-bold',
                percentage >= 80 ? 'text-green-600 dark:text-green-400' :
                percentage >= 60 ? 'text-amber-600 dark:text-amber-400' :
                'text-red-600 dark:text-red-400'
              )}>
                {percentage}%
              </span>
              <span className="text-xs text-stone-700 dark:text-stone-300 mt-1">ATS-score</span>
            </div>
          </div>

          {/* Score Info */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">
              {getScoreText(percentage)}
            </h2>
            <p className="text-stone-600 dark:text-stone-400 mb-4">
              Ditt CV kommer att klara sig {percentage >= 60 ? 'bra' : 'svårt'} i de flesta 
              rekryteringssystem (ATS). {percentage < 80 && 'Det finns dock utrymme för förbättring.'}
            </p>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn('w-4 h-4', isAnalyzing && 'animate-spin')} />
                {isAnalyzing ? 'Analyserar...' : 'Kör ny analys'}
              </button>
              
              {percentage < 80 && (
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-xl font-medium hover:bg-amber-200 transition-colors">
                  <Lightbulb className="w-4 h-4" />
                  Se förbättringsförslag
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 min-w-[200px]">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {checks.filter(c => c.status === 'pass').length}
              </div>
              <div className="text-xs text-green-700 dark:text-green-400">Godkända</div>
            </div>
            <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {checks.filter(c => c.status === 'warning').length}
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-400">Varningar</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Checks */}
      <div className="space-y-4">
        <h3 className="font-semibold text-stone-800 dark:text-stone-100">Detaljerad analys</h3>

        {Object.entries(categoryLabels).map(([category, label]) => {
          const categoryChecks = checks.filter(c => c.category === category)

          return (
            <div key={category} className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
              <div className="px-6 py-4 bg-stone-50 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-700">
                <h4 className="font-semibold text-stone-800 dark:text-stone-100">{label}</h4>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-stone-700">
                {categoryChecks.map(check => (
                  <div key={check.id} className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Status Icon */}
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                        check.status === 'pass' && 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400',
                        check.status === 'warning' && 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400',
                        check.status === 'fail' && 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400',
                        check.status === 'neutral' && 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                      )}>
                        {check.status === 'pass' && <Check className="w-5 h-5" />}
                        {check.status === 'warning' && <AlertCircle className="w-5 h-5" />}
                        {check.status === 'fail' && <X className="w-5 h-5" />}
                        {check.status === 'neutral' && <Target className="w-5 h-5" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h5 className="font-medium text-stone-800 dark:text-stone-100">{check.title}</h5>
                            <p className="text-sm text-stone-700 dark:text-stone-300">{check.description}</p>
                          </div>
                          <span className={cn(
                            'px-3 py-1 rounded-full text-sm font-medium',
                            getScoreColor(check.score)
                          )}>
                            +{check.score}p
                          </span>
                        </div>

                        {/* Expandable Tips */}
                        <div className="mt-3">
                          <button
                            onClick={() => setShowDetails(showDetails === check.id ? null : check.id)}
                            className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium flex items-center gap-1"
                          >
                            {showDetails === check.id ? 'Dölj tips' : 'Visa tips'}
                            <ArrowRight className={cn('w-4 h-4 transition-transform', showDetails === check.id && 'rotate-90')} />
                          </button>

                          {showDetails === check.id && (
                            <div className="mt-3 p-4 bg-teal-50 dark:bg-teal-900/30 rounded-xl">
                              <ul className="space-y-2">
                                {check.tips.map((tip, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-teal-800 dark:text-teal-300">
                                    <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Vad är ATS?</h3>
            <p className="text-blue-800 dark:text-blue-300 text-sm mb-3">
              ATS (Applicant Tracking System) är programvara som används av arbetsgivare för att
              hantera jobbansökningar. Systemet scannar CV:n automatiskt och letar efter nyckelord
              och kvalifikationer som matchar jobbannonsen.
            </p>
            <p className="text-blue-800 dark:text-blue-300 text-sm">
              <strong>Varför är det viktigt?</strong> Uppskattningsvis 75% av alla större företag
              använder ATS. Om ditt CV inte är optimerat kan det bli bortfiltrerat innan en människa
              ens ser det.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-gradient-to-r from-teal-50 to-sky-50 dark:from-teal-900/20 dark:to-sky-900/20 rounded-2xl">
        <div>
          <h3 className="font-semibold text-stone-800 dark:text-stone-100">Vill du förbättra ditt CV?</h3>
          <p className="text-stone-600 dark:text-stone-400 text-sm">Gå tillbaka till CV-byggaren och gör justeringar</p>
        </div>
        <a
          href="/cv"
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
        >
          <Award className="w-5 h-5" />
          Förbättra mitt CV
        </a>
      </div>
    </div>
  )
}

export default ATSAnalysis
