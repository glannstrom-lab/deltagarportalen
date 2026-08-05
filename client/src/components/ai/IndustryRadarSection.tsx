/**
 * Industry Radar Section
 * Real market data from Arbetsförmedlingen APIs
 *
 * B13 (2026-08-05): sektionen visade tidigare uppfunna tal som marknadsdata —
 * `growthPercent: Math.floor(Math.random() * 15) + 5`, en `salaryTrend` på
 * "+3-6 % årligen" utan källa, och en `demandGrowth`/`learningTime` uträknad ur
 * en `demand`-siffra som edge-funktionen själv räknade ned (95, 90, 85 …).
 * Dessutom bar hela blocket AI-märkning (`data-ai-generated` +
 * AIGeneratedWatermark) trots att ingen AI är inblandad: allt som visas här är
 * en ren omformning av Arbetsförmedlingens publika JobSearch-API. Märkningen
 * intygade alltså att slumptalen kom ur en AI-analys.
 *
 * Regeln nu: varje tal på ytan ska gå att peka tillbaka på ett svar från AF.
 * Finns inte talet visas ingenting — inte en platshållare.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Radar,
  Zap,
  Briefcase,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { AiConsentGate } from './AiConsentGate'
import { AILoadingIndicator } from './AIResultCard'
import { trendsApi, type TrendingSkill, type PopularSearch } from '@/services/afTrendsApi'
import { AI_FEATURES } from '@/config/features'
import { cn } from '@/lib/utils'

/**
 * Formen på det sektionen faktiskt kan belägga.
 *
 * Tidigare återanvändes `IndustryRadarResult` från aiCareerAssistantApi — typen
 * för AI-endpointen `ai-industry-radar`, som den här sektionen aldrig anropar.
 * Den typen kräver `growthPercent`, `salaryTrend`, `demandGrowth` och
 * `learningTime`, fält AF:s API inte kan fylla, och det var precis de fälten som
 * fylldes med slump. En egen typ gör det omöjligt att göra om misstaget.
 */
interface MarketRadarData {
  /** Yrkesgrupper med flest lediga annonser just nu (AF: stats=occupation-group). */
  topOccupations: { name: string; jobCount: number }[]
  /** Kompetenser knutna till de yrkesområden som har flest annonser. */
  fieldSkills: { skill: string; industries: string[]; field?: string; fieldJobCount?: number }[]
  marketInsights: { title: string; summary: string }[]
  observations: string[]
  lastUpdated: string
}

/** Extrafält som af-trends skickar men som den delade DTO:n ännu inte beskriver. */
type TrendingSkillWithField = TrendingSkill & {
  occupation_field?: string
  occupation_field_job_count?: number
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
  const { t, i18n } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<MarketRadarData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<'api' | 'cache'>('api')

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

      const isEn = i18n.language === 'en'

      // Omforma till det som faktiskt är mätt. Inga härledda procenttal, inga
      // lönetrender, ingen inlärningstid — AF:s API levererar inget av det.
      const transformedResult: MarketRadarData = {
        topOccupations: (marketStats?.by_occupation || []).slice(0, 5).map(occ => ({
          name: occ.occupation,
          jobCount: occ.job_count,
        })),

        fieldSkills: (trendingSkills || []).slice(0, 5).map(skill => {
          const withField = skill as TrendingSkillWithField
          return {
            skill: skill.skill,
            industries: getIndustriesForSkill(skill.skill),
            field: withField.occupation_field,
            fieldJobCount: withField.occupation_field_job_count,
          }
        }),

        marketInsights: [
          ...(typeof marketStats?.total_jobs === 'number' ? [{
            title: isEn ? 'Total job openings' : 'Totalt antal lediga jobb',
            summary: `${marketStats.total_jobs.toLocaleString('sv-SE')} ${isEn ? 'positions available' : 'tjänster tillgängliga'}`,
          }] : []),
          ...(typeof marketStats?.new_jobs_week === 'number' ? [{
            title: isEn ? 'Published in the past week' : 'Publicerade senaste veckan',
            summary: `${marketStats.new_jobs_week.toLocaleString('sv-SE')} ${isEn ? 'new job ads' : 'nya annonser'}`,
          }] : []),
          // Regioner: bara det riktiga annonsantalet. Fältet growth_percent
          // fanns här förut och var Math.random() i edge-funktionen.
          ...(marketStats?.by_region?.slice(0, 2).map(region => ({
            title: region.region,
            summary: `${region.job_count.toLocaleString('sv-SE')} ${isEn ? 'jobs' : 'jobb'}`,
          })) || [])
        ],

        observations: generateObservations(trendingSkills, popularOccupations, i18n.language),

        lastUpdated: new Date().toLocaleDateString(isEn ? 'en-SE' : 'sv-SE')
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

  if (!AI_FEATURES.INDUSTRY_RADAR) {
    return null
  }

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

  /**
   * Observationer om marknaden — formulerade så att de bara påstår det
   * rangordningen faktiskt visar.
   *
   * Tidigare hette den här `generateRecommendations` och byggde på `trend ===
   * 'up'`, ett fält som edge-funktionen satte efter listposition. Den skrev
   * alltså "visar stark tillväxt" om de tre första posterna i en lista, oavsett
   * hur marknaden såg ut. Rangordningen är däremot äkta: det är AF:s antal
   * lediga annonser. Så det är rangordningen vi uttalar oss om.
   */
  function generateObservations(
    skills: TrendingSkill[] | null,
    occupations: PopularSearch[] | null,
    lang: string
  ): string[] {
    const observations: string[] = []

    if (occupations && occupations.length > 0) {
      const top = occupations.slice(0, 2).map(o => o.term)
      observations.push(lang === 'en'
        ? `Right now ${top.join(' and ')} have the most open positions`
        : `Just nu har ${top.join(' och ')} flest lediga tjänster`)
    }

    if (skills && skills.length > 0) {
      const topSkill = skills[0]
      const field = (topSkill as TrendingSkillWithField).occupation_field
      observations.push(lang === 'en'
        ? `${topSkill.skill} appears in ${field || 'the occupational field'}, which has many open positions`
        : `${topSkill.skill} hör till ${field || 'det yrkesområde'} som har många lediga tjänster`)
    }

    observations.push(lang === 'en'
      ? 'Network actively within your industry to find hidden opportunities'
      : 'Nätverka aktivt inom din bransch för att hitta dolda möjligheter')

    return observations.slice(0, 3)
  }

  const hasAnyData = Boolean(
    result &&
    (result.topOccupations.length > 0 ||
      result.fieldSkills.length > 0 ||
      result.marketInsights.length > 0)
  )

  return (
    <AiConsentGate compact featureName={t('career.industryRadar.title')}>
      <Card className={cn('overflow-hidden', className)} padding="none">
        {/* Collapsible Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between bg-[var(--c-solid)] text-white"
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

            {result && !error && !hasAnyData && (
              <EmptyState
                icon={Radar}
                title={i18n.language === 'en'
                  ? 'No market figures right now'
                  : 'Inga marknadssiffror just nu'}
                description={i18n.language === 'en'
                  ? 'Arbetsförmedlingen returned no figures for this view. Rather than showing an estimate, we show nothing — try again in a while.'
                  : 'Arbetsförmedlingen lämnade inga siffror till den här vyn. Hellre än att visa en uppskattning visar vi ingenting — försök gärna igen om en stund.'}
                action={{
                  label: i18n.language === 'en' ? 'Try again' : 'Försök igen',
                  onClick: fetchData,
                }}
                compact
              />
            )}

            {result && !error && hasAnyData && (
              <div className="space-y-6">
                {/* Yrkesgrupper med flest lediga jobb — riktigt annonsantal, ingen trendpil */}
                {result.topOccupations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-3 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[var(--c-solid)]" aria-hidden="true" />
                      {i18n.language === 'en'
                        ? 'Occupation groups with the most open positions'
                        : 'Yrkesgrupper med flest lediga jobb'}
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {result.topOccupations.map((occupation, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-[var(--c-accent)] dark:hover:border-[var(--c-accent)]/60 transition-colors"
                        >
                          <span className="font-medium text-sm text-stone-800 dark:text-stone-200 block">
                            {occupation.name}
                          </span>
                          <span className="text-xs text-stone-600 dark:text-stone-400 tabular-nums">
                            {occupation.jobCount.toLocaleString('sv-SE')}{' '}
                            {i18n.language === 'en' ? 'open positions' : 'lediga jobb'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Kompetenser i de yrkesområden som har flest annonser */}
                {result.fieldSkills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" aria-hidden="true" />
                      {i18n.language === 'en'
                        ? 'Skills in the fields hiring most right now'
                        : 'Kompetenser i de yrkesområden som anställer mest'}
                    </h4>
                    <div className="space-y-2">
                      {result.fieldSkills.map((skill, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                        >
                          <span className="font-medium text-sm text-stone-800 dark:text-stone-200 block mb-1">
                            {skill.skill}
                          </span>
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
                          {/* Siffran hör till yrkesområdet, inte till kompetensen — och sägs så. */}
                          {skill.field && typeof skill.fieldJobCount === 'number' && (
                            <p className="text-xs text-stone-600 dark:text-stone-400">
                              {skill.field}: {skill.fieldJobCount.toLocaleString('sv-SE')}{' '}
                              {i18n.language === 'en' ? 'open positions' : 'lediga jobb'}
                            </p>
                          )}
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
                          <p className="text-xs text-stone-600 dark:text-stone-400">
                            {insight.summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observationer ur rangordningen */}
                {result.observations.length > 0 && (
                  <div className="p-4 rounded-xl bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50">
                    <h4 className="text-sm font-semibold text-[var(--c-text)] dark:text-[var(--c-text)] mb-3">
                      {t('career.industryRadar.recommendations')}
                    </h4>
                    <ul className="space-y-2">
                      {result.observations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-solid)]/80 mt-2 flex-shrink-0" aria-hidden="true" />
                          <span className="text-sm text-stone-700 dark:text-stone-300">
                            {rec}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Last Updated & Data Source */}
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                  {result.lastUpdated && (
                    <span>{t('career.industryRadar.lastUpdated')}: {result.lastUpdated}</span>
                  )}
                  {/* Badgen sa "Realtidsdata" även när svaret kom ur 30-minuterscachen. */}
                  <span className={cn(
                    'px-2 py-0.5 rounded-full',
                    dataSource === 'api'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                  )}>
                    {dataSource === 'api'
                      ? (i18n.language === 'en' ? 'Live data' : 'Realtidsdata')
                      : (i18n.language === 'en' ? 'Cached data' : 'Sparad data')}
                  </span>
                  <span>
                    {i18n.language === 'en' ? 'Source: Arbetsförmedlingen' : 'Källa: Arbetsförmedlingen'}
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
