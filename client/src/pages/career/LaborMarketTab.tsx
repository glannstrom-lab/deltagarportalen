/**
 * Labor Market Tab - Real market data and trends
 * No personal matching, just objective market information
 */
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Briefcase,
  Zap,
  RefreshCw,
  AlertCircle,
  Users,
  Building2,
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { IndustryRadarSection } from '@/components/ai'
import { cn } from '@/lib/utils'
import { trendsApi, type MarketStats, type TrendingSkill, type PopularSearch } from '@/services/afTrendsApi'

export default function LaborMarketTab() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null)
  const [trendingSkills, setTrendingSkills] = useState<TrendingSkill[]>([])
  const [popularOccupations, setPopularOccupations] = useState<PopularSearch[]>([])
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [statsResult, skillsResult, occupationsResult] = await Promise.all([
        trendsApi.getMarketStatsWithFallback(),
        trendsApi.getTrendingSkillsWithFallback(8),
        trendsApi.getPopularSearchesWithFallback('occupations', 8)
      ])

      setMarketStats(statsResult.data)
      setTrendingSkills(skillsResult.data)
      setPopularOccupations(occupationsResult.data)
      setLastUpdated(new Date().toLocaleDateString(lang === 'en' ? 'en-SE' : 'sv-SE'))
    } catch (err) {
      console.error('Failed to fetch labor market data:', err)
      setError(lang === 'en'
        ? 'Could not load market data. Try again later.'
        : 'Kunde inte ladda marknadsdata. Försök igen senare.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-stone-400" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400'
      case 'down':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-stone-600 dark:text-stone-400'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mr-3" aria-hidden="true" />
        <span className="text-stone-600 dark:text-stone-400">
          {lang === 'en' ? 'Loading market data...' : 'Laddar marknadsdata...'}
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-stone-600 dark:text-stone-400 mb-4">{error}</p>
        <Button onClick={fetchData}>
          {lang === 'en' ? 'Try again' : 'Försök igen'}
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">
            {lang === 'en' ? 'Swedish Labor Market' : 'Svensk arbetsmarknad'}
          </h2>
          <p className="text-stone-600 dark:text-stone-400 text-sm">
            {lang === 'en' ? 'Real-time data from Arbetsförmedlingen' : 'Realtidsdata från Arbetsförmedlingen'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {lang === 'en' ? 'Refresh' : 'Uppdatera'}
        </Button>
      </div>

      {/* Key Stats */}
      {marketStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center bg-gradient-to-br from-teal-50 to-sky-50 dark:from-teal-900/20 dark:to-sky-900/20 border-teal-200 dark:border-teal-800">
            <Briefcase className="w-8 h-8 text-teal-600 dark:text-teal-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-stone-800 dark:text-stone-100">
              {marketStats.total_jobs.toLocaleString('sv-SE')}
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-400">
              {lang === 'en' ? 'Open positions' : 'Lediga tjänster'}
            </div>
          </Card>

          <Card className="p-4 text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
            <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-stone-800 dark:text-stone-100">
              +{marketStats.new_jobs_week.toLocaleString('sv-SE')}
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-400">
              {lang === 'en' ? 'New this week' : 'Nya denna vecka'}
            </div>
          </Card>

          <Card className="p-4 text-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
            <Users className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-stone-800 dark:text-stone-100">
              {marketStats.competition_index.toFixed(1)}
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-400">
              {lang === 'en' ? 'Applicants per job' : 'Sökande per jobb'}
            </div>
          </Card>

          <Card className="p-4 text-center bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
            <Building2 className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-stone-800 dark:text-stone-100">
              {marketStats.avg_time_to_hire_days}
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-400">
              {lang === 'en' ? 'Avg. days to hire' : 'Dagar till anställning'}
            </div>
          </Card>
        </div>
      )}

      {/* Industry Radar */}
      <IndustryRadarSection defaultExpanded />

      {/* Two-column layout for skills and occupations */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Trending Skills */}
        <Card className="p-5">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            {lang === 'en' ? 'In-Demand Skills' : 'Efterfrågade kompetenser'}
          </h3>
          <div className="space-y-3">
            {trendingSkills.map((skill, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">
                    {skill.skill}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    {skill.job_count.toLocaleString('sv-SE')} {lang === 'en' ? 'jobs' : 'jobb'}
                  </span>
                  {getTrendIcon(skill.trend)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Popular Occupations */}
        <Card className="p-5">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-teal-500" />
            {lang === 'en' ? 'Most Searched Occupations' : 'Mest sökta yrken'}
          </h3>
          <div className="space-y-3">
            {popularOccupations.map((occ, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 text-xs font-medium flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">
                    {occ.term}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs font-medium', getTrendColor(occ.trend))}>
                    {occ.change_percent !== undefined && occ.change_percent > 0 && '+'}
                    {occ.change_percent !== undefined ? `${occ.change_percent}%` : ''}
                  </span>
                  {getTrendIcon(occ.trend)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Regional Stats */}
      {marketStats?.by_region && marketStats.by_region.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-500" />
            {lang === 'en' ? 'Jobs by Region' : 'Jobb per region'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {marketStats.by_region.map((region, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border border-sky-200 dark:border-sky-800 text-center"
              >
                <div className="text-lg font-bold text-stone-800 dark:text-stone-100">
                  {region.job_count.toLocaleString('sv-SE')}
                </div>
                <div className="text-xs text-stone-600 dark:text-stone-400 truncate" title={region.region}>
                  {region.region.replace(' län', '')}
                </div>
                {region.growth_percent > 0 && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    +{region.growth_percent}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Footer with data source */}
      <div className="text-center text-xs text-stone-500 dark:text-stone-400 py-4">
        <p>
          {lang === 'en' ? 'Data from' : 'Data från'}{' '}
          <a
            href="https://arbetsformedlingen.se"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 dark:text-teal-400 hover:underline"
          >
            Arbetsförmedlingen
          </a>
          {lastUpdated && (
            <span> • {lang === 'en' ? 'Updated' : 'Uppdaterad'}: {lastUpdated}</span>
          )}
        </p>
      </div>
    </div>
  )
}
