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
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { IndustryRadarSection } from '@/components/ai'
import { trendsApi, type MarketStats, type TrendingSkill, type PopularSearch } from '@/services/afTrendsApi'

export default function LaborMarketTab() {
  const { i18n } = useTranslation()
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
      // DESIGN.md §8 — max 5-7 saker synliga utan val. Hämta 5, inte 8.
      const [statsResult, skillsResult, occupationsResult] = await Promise.all([
        trendsApi.getMarketStatsWithFallback(),
        trendsApi.getTrendingSkillsWithFallback(5),
        trendsApi.getPopularSearchesWithFallback('occupations', 5)
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

  // getTrendIcon + getTrendColor borttagna 2026-05-15 — 0 callers.
  // Återinför när trending-display behöver visuell indikering.

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--c-text)] mr-3" aria-hidden="true" />
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

      {/* Huvudsiffra med kontext (DESIGN.md §8 — en sak i centrum) */}
      {marketStats && (
        <Card className="p-6 sm:p-8 bg-[var(--c-bg)] border-[var(--c-accent)]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--c-text)]" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-3xl sm:text-4xl font-bold text-[var(--c-text)] tabular-nums leading-tight">
                {marketStats.total_jobs.toLocaleString('sv-SE')}
              </div>
              <p className="text-sm sm:text-base text-stone-700 dark:text-stone-300 mt-1">
                {lang === 'en'
                  ? `lediga jobb just nu — ${marketStats.new_jobs_week.toLocaleString('sv-SE')} nya denna vecka`
                  : `lediga jobb just nu — ${marketStats.new_jobs_week.toLocaleString('sv-SE')} nya denna vecka`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Industry Radar */}
      <IndustryRadarSection defaultExpanded />

      {/* Two-column layout for skills and occupations */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Trending Skills — DESIGN.md §8 chips */}
        <Card className="p-5">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            {lang === 'en' ? 'In-Demand Skills' : 'Efterfrågade kompetenser'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {trendingSkills.map((skill, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--c-bg)] border border-[var(--c-accent)] text-sm text-[var(--c-text)] font-medium"
              >
                <span className="text-xs opacity-60">{i + 1}.</span>
                {skill.skill}
              </span>
            ))}
          </div>
        </Card>

        {/* Popular Occupations — DESIGN.md §8 chips, inga delta-procent */}
        <Card className="p-5">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[var(--c-solid)]" />
            {lang === 'en' ? 'Most Searched Occupations' : 'Mest sökta yrken'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {popularOccupations.map((occ, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--c-bg)] border border-[var(--c-accent)] text-sm text-[var(--c-text)] font-medium"
              >
                <span className="text-xs opacity-60">{i + 1}.</span>
                {occ.term}
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Regional Stats — DESIGN.md §8 top 3 städer, inga delta-procent */}
      {marketStats?.by_region && marketStats.by_region.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[var(--c-solid)]" />
            {lang === 'en' ? 'Jobs by Region' : 'Var finns jobben?'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {marketStats.by_region.slice(0, 3).map((region, i) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-[var(--c-bg)] border border-[var(--c-accent)]"
              >
                <div className="text-xl font-bold text-[var(--c-text)] tabular-nums">
                  {region.job_count.toLocaleString('sv-SE')}
                </div>
                <div className="text-sm text-stone-700 dark:text-stone-300 mt-0.5">
                  {region.region.replace(' län', '')}
                </div>
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
            className="text-[var(--c-text)] dark:text-[var(--c-text)] hover:underline"
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
