/**
 * Industry Radar Section
 * Personalized industry trends and market insights
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Radar,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  BookOpen,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AiConsentGate } from './AiConsentGate'
import { AILoadingIndicator } from './AIResultCard'
import type { IndustryRadarResult } from '@/services/aiCareerAssistantApi'
import { AI_FEATURES } from '@/config/features'
import { cn } from '@/lib/utils'

// Demo data until API is ready
const DEMO_DATA: IndustryRadarResult = {
  trendingIndustries: [
    { name: 'IT & Tech', growthIndicator: 'up', growthPercent: 12, demandLevel: 'high', salaryTrend: '+5-8% årligen' },
    { name: 'Hälso- & sjukvård', growthIndicator: 'up', growthPercent: 8, demandLevel: 'high', salaryTrend: '+3-5% årligen' },
    { name: 'Grön energi', growthIndicator: 'up', growthPercent: 15, demandLevel: 'medium', salaryTrend: '+6-10% årligen' },
  ],
  emergingSkills: [
    { skill: 'AI & Machine Learning', demandGrowth: '+45%', industries: ['IT', 'Finans', 'Hälsa'], learningTime: '6-12 månader' },
    { skill: 'Cybersäkerhet', demandGrowth: '+32%', industries: ['IT', 'Bank', 'Offentlig sektor'], learningTime: '3-6 månader' },
  ],
  marketInsights: [
    { title: 'Distansarbete ökar', summary: 'Fler arbetsgivare erbjuder hybrid- eller distansarbete', impact: 'Bredare geografisk arbetsmarknad' },
  ],
  personalizedRecommendations: [
    'Överväg att utveckla digitala färdigheter för ökad anställningsbarhet',
    'Nätverka aktivt inom din bransch för att hitta dolda möjligheter',
  ],
  lastUpdated: new Date().toLocaleDateString('sv-SE'),
}

interface IndustryRadarSectionProps {
  userInterests?: string[]
  currentOccupation?: string
  region?: string
  className?: string
  defaultExpanded?: boolean
}

export function IndustryRadarSection({
  className,
  defaultExpanded = false,
}: IndustryRadarSectionProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<IndustryRadarResult | null>(null)

  if (!AI_FEATURES.INDUSTRY_RADAR) {
    return null
  }

  const fetchData = async () => {
    setIsLoading(true)
    // Simulate loading for demo
    await new Promise(resolve => setTimeout(resolve, 800))
    setResult(DEMO_DATA)
    setIsLoading(false)
  }

  // Fetch data when expanded
  useEffect(() => {
    if (isExpanded && !result && !isLoading) {
      fetchData()
    }
  }, [isExpanded, result, isLoading])

  const getGrowthIcon = (indicator: 'up' | 'stable' | 'down') => {
    switch (indicator) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-stone-500 dark:text-stone-400" />
    }
  }

  const getDemandColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high':
        return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
      default:
        return 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
    }
  }

  return (
    <AiConsentGate compact featureName={t('career.industryRadar.title')}>
      <Card className={cn('overflow-hidden', className)} padding="none">
        {/* Collapsible Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-sky-600 to-teal-600 text-white"
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
              <Radar className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-sm sm:text-base">{t('career.industryRadar.title')}</h3>
              <p className="text-sky-100 text-xs sm:text-sm">
                {result ? t('career.industryRadar.personalized') : t('career.industryRadar.subtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  fetchData()
                }}
                className="text-white/80 hover:text-white hover:bg-white/10"
                aria-label={t('common.refresh')}
              >
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              </Button>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-5 h-5" aria-hidden="true" />
            )}
          </div>
        </button>

        {/* Content */}
        {isExpanded && (
          <div className="p-4">
            {isLoading && <AILoadingIndicator text={t('career.industryRadar.loading')} />}

            {result && (
              <div className="space-y-6">
                {/* Trending Industries */}
                {result.trendingIndustries.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" aria-hidden="true" />
                      {t('career.industryRadar.trendingIndustries')}
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {result.trendingIndustries.map((industry, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-teal-300 dark:hover:border-teal-700 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm text-stone-800 dark:text-stone-200">
                              {industry.name}
                            </span>
                            <div className="flex items-center gap-1">
                              {getGrowthIcon(industry.growthIndicator)}
                              <span className={cn(
                                'text-xs font-medium',
                                industry.growthIndicator === 'up' && 'text-green-600 dark:text-green-400',
                                industry.growthIndicator === 'down' && 'text-red-600 dark:text-red-400',
                                industry.growthIndicator === 'stable' && 'text-stone-600 dark:text-stone-400'
                              )}>
                                {industry.growthIndicator === 'up' && '+'}
                                {industry.growthPercent}%
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              getDemandColor(industry.demandLevel)
                            )}>
                              {t(`career.industryRadar.demand.${industry.demandLevel}`)}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">
                            {t('career.industryRadar.salaryTrend')}: {industry.salaryTrend}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emerging Skills */}
                {result.emergingSkills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" aria-hidden="true" />
                      {t('career.industryRadar.emergingSkills')}
                    </h4>
                    <div className="space-y-2">
                      {result.emergingSkills.map((skill, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm text-stone-800 dark:text-stone-200">
                              {skill.skill}
                            </span>
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">
                              {skill.demandGrowth}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {skill.industries.map((ind, j) => (
                              <span
                                key={j}
                                className="px-2 py-0.5 bg-white/50 dark:bg-stone-800/50 rounded-full text-xs text-stone-600 dark:text-stone-400"
                              >
                                {ind}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-stone-600 dark:text-stone-400 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" aria-hidden="true" />
                            {t('career.industryRadar.learningTime')}: {skill.learningTime}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Market Insights */}
                {result.marketInsights.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-3">
                      {t('career.industryRadar.marketInsights')}
                    </h4>
                    <div className="space-y-2">
                      {result.marketInsights.map((insight, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg border border-stone-200 dark:border-stone-700"
                        >
                          <h5 className="text-sm font-medium text-stone-800 dark:text-stone-200 mb-1">
                            {insight.title}
                          </h5>
                          <p className="text-xs text-stone-600 dark:text-stone-400 mb-2">
                            {insight.summary}
                          </p>
                          <p className="text-xs text-teal-600 dark:text-teal-400">
                            {t('career.industryRadar.impact')}: {insight.impact}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personalized Recommendations */}
                {result.personalizedRecommendations.length > 0 && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-sky-50 dark:from-teal-900/20 dark:to-sky-900/20 border border-teal-200 dark:border-teal-800">
                    <h4 className="text-sm font-semibold text-teal-800 dark:text-teal-200 mb-3">
                      {t('career.industryRadar.recommendations')}
                    </h4>
                    <ul className="space-y-2">
                      {result.personalizedRecommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-2 flex-shrink-0" aria-hidden="true" />
                          <span className="text-sm text-stone-700 dark:text-stone-300">
                            {rec}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Last Updated */}
                {result.lastUpdated && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 text-center">
                    {t('career.industryRadar.lastUpdated')}: {result.lastUpdated}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </AiConsentGate>
  )
}

export default IndustryRadarSection
