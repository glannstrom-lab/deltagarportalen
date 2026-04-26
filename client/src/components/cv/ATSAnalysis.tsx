/**
 * ATS Analysis Component
 * Check how well CV passes through recruitment systems
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
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

// Default checks will be generated with translations inside the component

export function ATSAnalysis() {
  const { t } = useTranslation()
  const [checks, setChecks] = useState<ATSCheck[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showDetails, setShowDetails] = useState<string | null>(null)
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [loadingCV, setLoadingCV] = useState(true)

  // Generate default checks with translations (M5: wrapped in useCallback)
  const getDefaultChecks = useCallback((): ATSCheck[] => [
    {
      id: '1',
      category: 'content',
      title: t('cv.ats.checks.contact.title'),
      description: t('cv.ats.checks.contact.description'),
      status: 'pass',
      score: 10,
      tips: [t('cv.ats.checks.contact.tip1'), t('cv.ats.checks.contact.tip2')]
    },
    {
      id: '2',
      category: 'content',
      title: t('cv.ats.checks.summary.title'),
      description: t('cv.ats.checks.summary.description'),
      status: 'pass',
      score: 15,
      tips: [t('cv.ats.checks.summary.tip1'), t('cv.ats.checks.summary.tip2')]
    },
    {
      id: '3',
      category: 'content',
      title: t('cv.ats.checks.experience.title'),
      description: t('cv.ats.checks.experience.description'),
      status: 'pass',
      score: 20,
      tips: [t('cv.ats.checks.experience.tip1'), t('cv.ats.checks.experience.tip2')]
    },
    {
      id: '4',
      category: 'content',
      title: t('cv.ats.checks.education.title'),
      description: t('cv.ats.checks.education.description'),
      status: 'warning',
      score: 10,
      tips: [t('cv.ats.checks.education.tip1'), t('cv.ats.checks.education.tip2')]
    },
    {
      id: '5',
      category: 'keywords',
      title: t('cv.ats.checks.keywords.title'),
      description: t('cv.ats.checks.keywords.description'),
      status: 'warning',
      score: 15,
      tips: [t('cv.ats.checks.keywords.tip1'), t('cv.ats.checks.keywords.tip2')]
    },
    {
      id: '6',
      category: 'format',
      title: t('cv.ats.checks.fileFormat.title'),
      description: t('cv.ats.checks.fileFormat.description'),
      status: 'pass',
      score: 10,
      tips: [t('cv.ats.checks.fileFormat.tip1'), t('cv.ats.checks.fileFormat.tip2')]
    },
    {
      id: '7',
      category: 'format',
      title: t('cv.ats.checks.typography.title'),
      description: t('cv.ats.checks.typography.description'),
      status: 'pass',
      score: 10,
      tips: [t('cv.ats.checks.typography.tip1'), t('cv.ats.checks.typography.tip2')]
    },
    {
      id: '8',
      category: 'technical',
      title: t('cv.ats.checks.graphics.title'),
      description: t('cv.ats.checks.graphics.description'),
      status: 'neutral',
      score: 5,
      tips: [t('cv.ats.checks.graphics.tip1'), t('cv.ats.checks.graphics.tip2')]
    },
    {
      id: '9',
      category: 'technical',
      title: t('cv.ats.checks.headings.title'),
      description: t('cv.ats.checks.headings.description'),
      status: 'pass',
      score: 5,
      tips: [t('cv.ats.checks.headings.tip1'), t('cv.ats.checks.headings.tip2')]
    }
  ], [t])

  // Initialize checks with translations (M5: fixed dependencies)
  useEffect(() => {
    if (checks.length === 0) {
      setChecks(getDefaultChecks())
    }
  }, [checks.length, getDefaultChecks])

  // Load CV data
  useEffect(() => {
    const loadCV = async () => {
      try {
        const cv = await cvApi.getCV()
        if (cv) {
          setCvData(cv)
        }
      } catch (e) {
        console.error('Could not load CV:', e)
      } finally {
        setLoadingCV(false)
      }
    }
    loadCV()
  }, [])

  // Calculate actual ATS score based on CV data (M5: wrapped in useCallback)
  const calculateChecks = useCallback((cv: CVData | null): ATSCheck[] => {
    if (!cv) return getDefaultChecks()

    return [
      {
        id: '1',
        category: 'content',
        title: t('cv.ats.checks.contact.title'),
        description: t('cv.ats.checks.contact.description'),
        status: (cv.firstName && cv.lastName && cv.email && cv.phone) ? 'pass' :
                (cv.firstName || cv.email) ? 'warning' : 'fail',
        score: (cv.firstName && cv.lastName ? 5 : 0) + (cv.email ? 3 : 0) + (cv.phone ? 2 : 0),
        tips: [t('cv.ats.checks.contact.tip1'), t('cv.ats.checks.contact.tip2')]
      },
      {
        id: '2',
        category: 'content',
        title: t('cv.ats.checks.summary.title'),
        description: t('cv.ats.checks.summary.description'),
        status: cv.summary && cv.summary.length > 100 ? 'pass' :
                cv.summary && cv.summary.length > 30 ? 'warning' : 'fail',
        score: cv.summary ? Math.min(15, Math.floor(cv.summary.length / 20)) : 0,
        tips: [t('cv.ats.checks.summary.tip1'), t('cv.ats.checks.summary.tip2')]
      },
      {
        id: '3',
        category: 'content',
        title: t('cv.ats.checks.experience.title'),
        description: t('cv.ats.checks.experience.description'),
        status: cv.workExperience && cv.workExperience.length >= 2 ? 'pass' :
                cv.workExperience && cv.workExperience.length === 1 ? 'warning' : 'fail',
        score: cv.workExperience ? Math.min(25, cv.workExperience.length * 10) : 0,
        tips: [t('cv.ats.checks.experience.tip1'), t('cv.ats.checks.experience.tip2')]
      },
      {
        id: '4',
        category: 'content',
        title: t('cv.ats.checks.education.title'),
        description: t('cv.ats.checks.education.description'),
        status: cv.education && cv.education.length > 0 ? 'pass' : 'warning',
        score: cv.education ? Math.min(15, cv.education.length * 7) : 0,
        tips: [t('cv.ats.checks.education.tip1'), t('cv.ats.checks.education.tip2')]
      },
      {
        id: '5',
        category: 'keywords',
        title: t('cv.ats.checks.skills.title'),
        description: t('cv.ats.checks.skills.description'),
        status: cv.skills && cv.skills.length >= 5 ? 'pass' :
                cv.skills && cv.skills.length > 0 ? 'warning' : 'fail',
        score: cv.skills ? Math.min(15, cv.skills.length * 3) : 0,
        tips: [t('cv.ats.checks.skills.tip1'), t('cv.ats.checks.skills.tip2')]
      },
      {
        id: '6',
        category: 'format',
        title: t('cv.ats.checks.profileImage.title'),
        description: t('cv.ats.checks.profileImage.description'),
        status: cv.profileImage ? 'pass' : 'neutral',
        score: cv.profileImage ? 5 : 0,
        tips: [t('cv.ats.checks.profileImage.tip1'), t('cv.ats.checks.profileImage.tip2')]
      },
      {
        id: '7',
        category: 'format',
        title: t('cv.ats.checks.template.title'),
        description: t('cv.ats.checks.template.description'),
        status: cv.template ? 'pass' : 'warning',
        score: cv.template ? 10 : 5,
        tips: [t('cv.ats.checks.template.tip1'), t('cv.ats.checks.template.tip2')]
      },
      {
        id: '8',
        category: 'technical',
        title: t('cv.ats.checks.languages.title'),
        description: t('cv.ats.checks.languages.description'),
        status: cv.languages && cv.languages.length > 0 ? 'pass' : 'neutral',
        score: cv.languages ? Math.min(10, cv.languages.length * 5) : 0,
        tips: [t('cv.ats.checks.languages.tip1'), t('cv.ats.checks.languages.tip2')]
      },
      {
        id: '9',
        category: 'technical',
        title: t('cv.ats.checks.certifications.title'),
        description: t('cv.ats.checks.certifications.description'),
        status: cv.certificates && cv.certificates.length > 0 ? 'pass' : 'neutral',
        score: cv.certificates ? Math.min(5, cv.certificates.length * 2) : 0,
        tips: [t('cv.ats.checks.certifications.tip1'), t('cv.ats.checks.certifications.tip2')]
      }
    ]
  }, [t, getDefaultChecks])

  // Recalculate checks when CV data changes (M5: fixed dependencies)
  useEffect(() => {
    if (cvData) {
      setChecks(calculateChecks(cvData))
    }
  }, [cvData, calculateChecks])

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
    if (score >= 80) return 'text-brand-900 bg-brand-100'
    if (score >= 60) return 'text-amber-600 bg-amber-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreText = (score: number) => {
    if (score >= 80) return t('cv.ats.score.excellent')
    if (score >= 60) return t('cv.ats.score.good')
    if (score >= 40) return t('cv.ats.score.needsImprovement')
    return t('cv.ats.score.critical')
  }

  const categoryLabels: Record<string, string> = {
    content: t('cv.ats.categories.content'),
    format: t('cv.ats.categories.format'),
    keywords: t('cv.ats.categories.keywords'),
    technical: t('cv.ats.categories.technical')
  }

  return (
    <div className="space-y-6">
      {/* ATS Analyzer Widget - Hämtar och analyserar användarens CV */}
      {loadingCV ? (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="w-6 h-6 animate-spin text-brand-900 dark:text-brand-400" />
            <span className="text-stone-600 dark:text-stone-400">{t('cv.ats.loadingCV')}</span>
          </div>
        </div>
      ) : cvData ? (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-stone-800 dark:text-stone-100">{t('cv.ats.analysisTitle')}</h3>
          </div>
          <p className="text-sm text-stone-700 dark:text-stone-300 mb-4">
            {t('cv.ats.analysisDescription')}
          </p>
          <ATSAnalyzer cvData={cvData} />
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">{t('cv.ats.noCVFound')}</h3>
              <p className="text-amber-800 dark:text-amber-300 text-sm mb-3">
                {t('cv.ats.noCVDescription')}
              </p>
              <a
                href="/cv"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
              >
                {t('cv.ats.createCV')}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Score Card */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Score Circle */}
          <div className="flex items-center justify-center">
            <div className={cn(
              'w-32 h-32 rounded-full flex flex-col items-center justify-center border-4',
              percentage >= 80 ? 'border-brand-700 bg-brand-50 dark:bg-brand-900/30' :
              percentage >= 60 ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30' :
              'border-red-500 bg-red-50 dark:bg-red-900/30'
            )}>
              <span className={cn(
                'text-4xl font-bold',
                percentage >= 80 ? 'text-brand-900 dark:text-brand-400' :
                percentage >= 60 ? 'text-amber-600 dark:text-amber-400' :
                'text-red-600 dark:text-red-400'
              )}>
                {percentage}%
              </span>
              <span className="text-xs text-stone-700 dark:text-stone-300 mt-1">{t('cv.ats.scoreLabel')}</span>
            </div>
          </div>

          {/* Score Info */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">
              {getScoreText(percentage)}
            </h2>
            <p className="text-stone-600 dark:text-stone-400 mb-4">
              {percentage >= 60 ? t('cv.ats.scoreInfo.good') : t('cv.ats.scoreInfo.poor')}
              {percentage < 80 && ` ${t('cv.ats.scoreInfo.roomForImprovement')}`}
            </p>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-xl font-medium hover:bg-brand-900 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn('w-4 h-4', isAnalyzing && 'animate-spin')} />
                {isAnalyzing ? t('cv.ats.analyzing') : t('cv.ats.runAnalysis')}
              </button>

              {percentage < 80 && (
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-xl font-medium hover:bg-amber-200 transition-colors">
                  <Lightbulb className="w-4 h-4" />
                  {t('cv.ats.seeImprovements')}
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 min-w-[200px]">
            <div className="text-center p-3 bg-brand-50 dark:bg-brand-900/30 rounded-xl">
              <div className="text-2xl font-bold text-brand-900 dark:text-brand-400">
                {checks.filter(c => c.status === 'pass').length}
              </div>
              <div className="text-xs text-brand-900 dark:text-brand-400">{t('cv.ats.passed')}</div>
            </div>
            <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {checks.filter(c => c.status === 'warning').length}
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-400">{t('cv.ats.warnings')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Checks */}
      <div className="space-y-4">
        <h3 className="font-semibold text-stone-800 dark:text-stone-100">{t('cv.ats.detailedAnalysis')}</h3>

        {Object.entries(categoryLabels).map(([category, label]) => {
          const categoryChecks = checks.filter(c => c.category === category)

          return (
            <div key={category} className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
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
                        check.status === 'pass' && 'bg-brand-100 dark:bg-brand-900/50 text-brand-900 dark:text-brand-400',
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
                            className="text-sm text-brand-900 dark:text-brand-400 hover:text-brand-900 dark:hover:text-brand-300 font-medium flex items-center gap-1"
                          >
                            {showDetails === check.id ? t('cv.ats.hideTips') : t('cv.ats.showTips')}
                            <ArrowRight className={cn('w-4 h-4 transition-transform', showDetails === check.id && 'rotate-90')} />
                          </button>

                          {showDetails === check.id && (
                            <div className="mt-3 p-4 bg-brand-50 dark:bg-brand-900/30 rounded-xl">
                              <ul className="space-y-2">
                                {check.tips.map((tip, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-brand-900 dark:text-brand-300">
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
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">{t('cv.ats.whatIsAts.title')}</h3>
            <p className="text-blue-800 dark:text-blue-300 text-sm mb-3">
              {t('cv.ats.whatIsAts.description')}
            </p>
            <p className="text-blue-800 dark:text-blue-300 text-sm">
              <strong>{t('cv.ats.whatIsAts.whyImportant')}</strong> {t('cv.ats.whatIsAts.importance')}
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-gradient-to-r from-brand-50 to-sky-50 dark:from-brand-900/20 dark:to-sky-900/20 rounded-xl">
        <div>
          <h3 className="font-semibold text-stone-800 dark:text-stone-100">{t('cv.ats.cta.title')}</h3>
          <p className="text-stone-600 dark:text-stone-400 text-sm">{t('cv.ats.cta.description')}</p>
        </div>
        <a
          href="/cv"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-900 text-white rounded-xl font-medium hover:bg-brand-900 transition-colors"
        >
          <Award className="w-5 h-5" />
          {t('cv.ats.cta.button')}
        </a>
      </div>
    </div>
  )
}

export default ATSAnalysis
