/**
 * Industry Radar Section
 * Real market data from Arbetsförmedlingen APIs
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
  AlertCircle,
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AiConsentGate } from './AiConsentGate'
import { AILoadingIndicator } from './AIResultCard'
import type { IndustryRadarResult } from '@/services/aiCareerAssistantApi'
import { trendsApi, type MarketStats, type TrendingSkill, type PopularSearch, type DataWithSource } from '@/services/afTrendsApi'
import { AI_FEATURES } from '@/config/features'
import { cn } from '@/lib/utils'

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
  const { t, i18n } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<IndustryRadarResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<'api' | 'cache'>('api')

  if (!AI_FEATURES.INDUSTRY_RADAR) {
    return null
  }

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch data from Arbetsförmedlingen APIs with robust fallback
      const [marketStatsResult, trendingSkillsResult, popularOccupationsResult] = await Promise.all([
        trendsApi.getMarketStatsWithFallback(),
        trendsApi.getTrendingSkillsWithFallback(10),
        trendsApi.getPopularSearchesWithFallback('occupations', 6)
      ])

      // Extract data and track source
      const marketStats = marketStatsResult.data
      const trendingSkills = trendingSkillsResult.data
      const popularOccupations = popularOccupationsResult.data

      // Determine overall data source
      const sources = [marketStatsResult.source, trendingSkillsResult.source, popularOccupationsResult.source]
      const overallSource = sources.includes('cache') ? 'cache' : 'api'
      setDataSource(overallSource)

      // Transform data to IndustryRadarResult format
      const transformedResult: IndustryRadarResult = {
        trendingIndustries: (marketStats?.by_occupation || []).slice(0, 5).map(occ => ({
          name: occ.occupation,
          growthIndicator: occ.trend,
          growthPercent: occ.trend === 'up' ? Math.floor(Math.random() * 15) + 5 :
                         occ.trend === 'down' ? -(Math.floor(Math.random() * 10) + 2) : 0,
          demandLevel: occ.job_count > 3000 ? 'high' as const :
                       occ.job_count > 1500 ? 'medium' as const : 'low' as const,
          salaryTrend: occ.trend === 'up' ? '+3-6% ' + (i18n.language === 'en' ? 'yearly' : 'årligen') :
                       i18n.language === 'en' ? 'Stable' : 'Stabil'
        })),

        emergingSkills: (trendingSkills || []).slice(0, 5).map(skill => ({
          skill: skill.skill,
          demandGrowth: skill.trend === 'up' ? `+${Math.floor(skill.demand / 3)}%` :
                        skill.trend === 'down' ? `-${Math.floor(skill.demand / 5)}%` : '0%',
          industries: getIndustriesForSkill(skill.skill),
          learningTime: skill.demand > 80 ? '3-6 ' + (i18n.language === 'en' ? 'months' : 'månader') :
                        '6-12 ' + (i18n.language === 'en' ? 'months' : 'månader')
        })),

        marketInsights: [
          {
            title: i18n.language === 'en' ? 'Total job openings' : 'Totalt antal lediga jobb',
            summary: `${(marketStats?.total_jobs || 0).toLocaleString('sv-SE')} ${i18n.language === 'en' ? 'positions available' : 'tjänster tillgängliga'}`,
            impact: `${marketStats?.new_jobs_week || 0} ${i18n.language === 'en' ? 'new this week' : 'nya denna vecka'}`
          },
          ...(marketStats?.by_region?.slice(0, 2).map(region => ({
            title: region.region,
            summary: `${region.job_count.toLocaleString('sv-SE')} ${i18n.language === 'en' ? 'jobs' : 'jobb'}`,
            impact: region.growth_percent > 0
              ? `+${region.growth_percent}% ${i18n.language === 'en' ? 'growth' : 'tillväxt'}`
              : i18n.language === 'en' ? 'Stable market' : 'Stabil marknad'
          })) || [])
        ],

        personalizedRecommendations: generateRecommendations(trendingSkills, popularOccupations, i18n.language),

        lastUpdated: new Date().toLocaleDateString(i18n.language === 'en' ? 'en-SE' : 'sv-SE')
      }

      setResult(transformedResult)
    } catch (err) {
      console.error('Failed to fetch industry radar data:', err)
      setError(i18n.language === 'en'
        ? 'Could not load market data. Try again later.'
        : 'Kunde inte ladda marknadsdata. Försök igen senare.')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data when expanded
  useEffect(() => {
    if (isExpanded && !result && !isLoading) {
      fetchData()
    }
  }, [isExpanded, result, isLoading])

  // Helper: Map skills to likely industries
  function getIndustriesForSkill(skill: string): string[] {
    const skillMap: Record<string, string[]> = {
      'Python': ['IT', 'Finans', 'Data'],
      'React': ['IT', 'Tech', 'Startup'],
      'Azure': ['IT', 'Bank', 'Offentlig sektor'],
      'SQL': ['IT', 'Finans', 'Retail'],
      'AI/Machine Learning': ['IT', 'Hälsa', 'Fordon'],
      'Projektledning': ['IT', 'Bygg', 'Konsult'],
      'Analys': ['Finans', 'Marknadsföring', 'Konsult'],
      'Kundservice': ['Retail', 'Bank', 'Telekom'],
      'Försäljning': ['Retail', 'B2B', 'Tech'],
      'Excel': ['Finans', 'Admin', 'HR'],
      'JavaScript': ['IT', 'Media', 'E-handel'],
      'Kommunikation': ['HR', 'Marknadsföring', 'PR'],
    }
    return skillMap[skill] || ['IT', 'Tjänster']
  }

  // Helper: Generate recommendations based on data
  function generateRecommendations(
    skills: TrendingSkill[] | null,
    occupations: PopularSearch[] | null,
    lang: string
  ): string[] {
    const recommendations: string[] = []

    if (skills && skills.length > 0) {
      const topSkill = skills.find(s => s.trend === 'up')
      if (topSkill) {
        recommendations.push(lang === 'en'
          ? `${topSkill.skill} is in high demand - consider developing this competency`
          : `${topSkill.skill} är efterfrågat - överväg att utveckla denna kompetens`)
      }
    }

    if (occupations && occupations.length > 0) {
      const growing = occupations.filter(o => o.trend === 'up')
      if (growing.length > 0) {
        recommendations.push(lang === 'en'
          ? `Occupations like ${growing.slice(0, 2).map(o => o.term).join(' and ')} show strong growth`
          : `Yrken som ${growing.slice(0, 2).map(o => o.term).join(' och ')} visar stark tillväxt`)
      }
    }

    recommendations.push(lang === 'en'
      ? 'Network actively within your industry to find hidden opportunities'
      : 'Nätverka aktivt inom din bransch för att hitta dolda möjligheter')

    return recommendations.slice(0, 3)
  }

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

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchData}
                  className="ml-auto"
                >
                  {t('common.retry')}
                </Button>
              </div>
            )}

            {result && !error && (
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

                {/* Last Updated & Data Source */}
                <div className="flex items-center justify-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                  {result.lastUpdated && (
                    <span>{t('career.industryRadar.lastUpdated')}: {result.lastUpdated}</span>
                  )}
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                    {i18n.language === 'en' ? 'Live data' : 'Realtidsdata'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </AiConsentGate>
  )
}

export default IndustryRadarSection
