/**
 * Industry Radar Section
 * Personalized industry trends and market insights
 */

import { useState, useEffect } from 'react'
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
import {
  getIndustryRadar,
  type IndustryRadarParams,
  type IndustryRadarResult,
} from '@/services/aiCareerAssistantApi'
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
  userInterests,
  currentOccupation,
  region,
  className,
  defaultExpanded = false,
}: IndustryRadarSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<IndustryRadarResult | null>(null)

  if (!AI_FEATURES.INDUSTRY_RADAR) {
    return null
  }

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params: IndustryRadarParams = {
        userInterests,
        currentOccupation,
        region,
      }

      const response = await getIndustryRadar(params)
      setResult(response.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte hämta trender')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data when expanded
  useEffect(() => {
    if (isExpanded && !result && !isLoading && !error) {
      fetchData()
    }
  }, [isExpanded])

  const getGrowthIcon = (indicator: 'up' | 'stable' | 'down') => {
    switch (indicator) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-slate-600" />
    }
  }

  const getDemandColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high':
        return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-600'
    }
  }

  return (
    <AiConsentGate compact featureName="Branschradar">
      <Card className={cn('overflow-hidden', className)} padding="none">
        {/* Collapsible Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
              <Radar className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-sm sm:text-base">Branschradar</h3>
              <p className="text-indigo-100 text-xs sm:text-sm">
                {result ? 'Personaliserade trender baserat på din profil' : 'AI-drivna marknadsinsikter'}
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
              >
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              </Button>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </button>

        {/* Content */}
        {isExpanded && (
          <div className="p-4">
            {isLoading && <AILoadingIndicator text="Hämtar marknadstrender..." />}

            {error && (
              <div className="text-center py-6">
                <p className="text-sm text-slate-600 dark:text-slate-600 mb-3">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchData}>
                  Försök igen
                </Button>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                {/* Trending Industries */}
                {result.trendingIndustries.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      Trendande branscher
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {result.trendingIndustries.map((industry, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm text-slate-800 dark:text-slate-200">
                              {industry.name}
                            </span>
                            <div className="flex items-center gap-1">
                              {getGrowthIcon(industry.growthIndicator)}
                              <span className={cn(
                                'text-xs font-medium',
                                industry.growthIndicator === 'up' && 'text-green-600',
                                industry.growthIndicator === 'down' && 'text-red-600',
                                industry.growthIndicator === 'stable' && 'text-slate-700'
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
                              {industry.demandLevel === 'high' ? 'Hög efterfrågan' :
                               industry.demandLevel === 'medium' ? 'Medel' : 'Låg'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-600 mt-2">
                            Lönetrend: {industry.salaryTrend}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emerging Skills */}
                {result.emergingSkills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Kompetenser på uppgång
                    </h4>
                    <div className="space-y-2">
                      {result.emergingSkills.map((skill, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm text-slate-800 dark:text-slate-200">
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
                                className="px-2 py-0.5 bg-white/50 dark:bg-slate-800/50 rounded-full text-xs text-slate-600 dark:text-slate-600"
                              >
                                {ind}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-600 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            Lärtid: {skill.learningTime}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Market Insights */}
                {result.marketInsights.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                      Marknadsinsikter
                    </h4>
                    <div className="space-y-2">
                      {result.marketInsights.map((insight, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <h5 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                            {insight.title}
                          </h5>
                          <p className="text-xs text-slate-600 dark:text-slate-600 mb-2">
                            {insight.summary}
                          </p>
                          <p className="text-xs text-violet-600 dark:text-violet-400">
                            Påverkan: {insight.impact}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personalized Recommendations */}
                {result.personalizedRecommendations.length > 0 && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-800">
                    <h4 className="text-sm font-semibold text-violet-800 dark:text-violet-200 mb-3">
                      Rekommendationer för dig
                    </h4>
                    <ul className="space-y-2">
                      {result.personalizedRecommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 flex-shrink-0" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {rec}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Last Updated */}
                {result.lastUpdated && (
                  <p className="text-xs text-slate-600 text-center">
                    Senast uppdaterad: {result.lastUpdated}
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
