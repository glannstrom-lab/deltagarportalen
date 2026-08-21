/**
 * Labor Market Tab — arbetsmarknadssiffror från Arbetsförmedlingen.
 *
 * Granskad 2026-08-21. Tre saker var fel och är rättade här:
 *
 * 1. Rubrikerna beskrev inte datan. "Mest sökta yrken" stod över
 *    `stats=occupation-group`, alltså antal *publicerade annonser* per
 *    yrkesgrupp — ingen har sökt på något. "Efterfrågade kompetenser" var en
 *    rangordnad topplista över kompetenser som ingen har mätt: AF:s
 *    JobSearch-API har inget `stats=skill`, så `af-trends` mappar yrkesområde
 *    → kompetenser ur en handskriven tabell och skickar med `occupation_field`
 *    + `occupation_field_job_count` "så att siffran kan tillskrivas rätt sak i
 *    gränssnittet". Den attribueringen kastades. Nu visas den.
 *
 * 2. En tom lista sprängde hela fliken. `Promise.all` + wrappers som kastar på
 *    tomt resultat gjorde att en utebliven kompetenslista också raderade
 *    totalsiffran, regionerna och radarn. Nu hämtas de tre delarna med
 *    `allSettled` och varje sektion bär sitt eget tomtillstånd.
 *
 * 3. Datumet i foten var renderingstiden, inte datans ålder — och trendcachen
 *    har 30 minuters TTL, så en cacheträff fick dagens stämpel oavsett ålder.
 *    Nu visas `marketStats.last_updated` ur svaret.
 *
 * Regeln som gäller här: varje tal på ytan ska
 * gå att peka tillbaka på ett svar från AF, och etiketten ska säga vad talet
 * faktiskt mäter. Finns talet inte visas ingenting — inte en platshållare.
 */
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MapPin,
  Briefcase,
  Zap,
  RefreshCw,
  AlertCircle,
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { trendsApi, type MarketStats, type TrendingSkill, type PopularSearch } from '@/services/afTrendsApi'

/**
 * Sidan gjorde tidigare två uppsättningar anrop mot samma IP-rate-limitade
 * edge-funktion vid varje visning — den här fliken hämtade 5/5 och den nu
 * borttagna branschradarn 10/6, och cache-nyckeln innehåller params, så
 * ingen av dem träffade den andras cache. Nu hämtas en uppsättning.
 */
const SKILL_LIMIT = 10
const OCCUPATION_LIMIT = 6
const VISA_ANTAL = 5

export default function LaborMarketTab() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language

  /**
   * `isLoading` gäller bara första hämtningen. Vid "Uppdatera" byts inte
   * trädet ut mot en spinner längre — knappen som hade fokus avmonterades då,
   * och fokus föll till <body>. Nu står innehållet kvar medan `isRefreshing`
   * märker knappen.
   */
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null)
  const [trendingSkills, setTrendingSkills] = useState<TrendingSkill[]>([])
  const [popularOccupations, setPopularOccupations] = useState<PopularSearch[]>([])

  const fetchData = useCallback(async ({ forsta = false } = {}) => {
    if (forsta) setIsLoading(true)
    else setIsRefreshing(true)
    setError(false)

    // allSettled, inte all: en tom kompetenslista får inte radera totalsiffran.
    const [statsResult, skillsResult, occupationsResult] = await Promise.allSettled([
      trendsApi.getMarketStats(),
      trendsApi.getTrendingSkills(SKILL_LIMIT),
      trendsApi.getPopularSearches('occupations', OCCUPATION_LIMIT),
    ])

    const stats = statsResult.status === 'fulfilled' ? statsResult.value : null
    const skills = skillsResult.status === 'fulfilled' ? skillsResult.value : []
    const occupations = occupationsResult.status === 'fulfilled' ? occupationsResult.value : []

    setMarketStats(stats)
    setTrendingSkills(skills)
    setPopularOccupations(occupations)

    // Fel = ingenting gick igenom. Att en enskild del är tom är inget fel;
    // det är ett tomtillstånd, och det bärs av sektionen själv.
    setError(!stats && skills.length === 0 && occupations.length === 0)
    setIsLoading(false)
    setIsRefreshing(false)
  }, [])

  useEffect(() => {
    fetchData({ forsta: true })
  }, [fetchData])

  const formateraDatum = (iso: string | undefined) => {
    if (!iso) return null
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'sv-SE', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--c-text)] mr-3" aria-hidden="true" />
        <span className="text-stone-600 dark:text-stone-400">
          {t('career.laborMarket.loading')}
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-8 text-center" role="alert">
        <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">
          {t('career.laborMarket.errorTitle')}
        </h2>
        <p className="text-stone-600 dark:text-stone-400 mb-4">
          {t('career.laborMarket.errorBody')}
        </p>
        <Button onClick={() => fetchData({ forsta: true })}>
          {t('career.laborMarket.retry')}
        </Button>
      </Card>
    )
  }

  const uppdaterad = formateraDatum(marketStats?.last_updated)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">
            {t('career.laborMarket.heading')}
          </h2>
          <p className="text-stone-600 dark:text-stone-400 text-sm">
            {t('career.laborMarket.source')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData()}
          disabled={isRefreshing}
          className="flex items-center gap-2 flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          {isRefreshing ? t('career.laborMarket.loading') : t('career.laborMarket.refresh')}
        </Button>
      </div>

      {/* Huvudsiffra med kontext (DESIGN.md §8 — en sak i centrum) */}
      {marketStats && (
        <Card className="p-6 sm:p-8 bg-[var(--c-bg)] border-[var(--c-accent)]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white dark:bg-white/10 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--c-text)]" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-3xl sm:text-4xl font-bold text-[var(--c-text)] tabular-nums leading-tight">
                {marketStats.total_jobs.toLocaleString('sv-SE')}
              </div>
              <p className="text-sm sm:text-base text-stone-700 dark:text-stone-300 mt-1">
                {t('career.laborMarket.openJobs')}
                {typeof marketStats.new_jobs_week === 'number' && (
                  <>
                    {' — '}
                    {t('career.laborMarket.newThisWeek', {
                      antal: marketStats.new_jobs_week.toLocaleString('sv-SE'),
                    })}
                  </>
                )}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/*
        Branschradarn låg här (`<IndustryRadarSection defaultExpanded />`) och
        är borttagen 2026-08-21. Den ritade **samma data en gång till**: samma
        fem yrkesgrupper, samma fem kompetenser, samma totalsiffra, samma
        regioner — hämtat ur samma `af-trends`-anrop. Att det inte syntes
        berodde på att en AiConsentGate dolde hela sektionen för konton utan
        AI-samtycke, trots att den inte gör ett enda AI-anrop.

        Med grinden borta blev dubbleringen uppenbar, och tre saker till:
        `getIndustriesForSkill` mappade "Patientvård" till "IT, Tjänster" ur
        en handskriven tabell med `['IT','Tjänster']` som fallback; en badge
        sa "Realtidsdata" om en 30-minuterscache; och rubriken
        "Rekommendationer för dig" stod över tre generella meningar.

        Komponenten och dess test är raderade — den hade ingen annan anropare.
      */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Kompetenser — attribuerade till yrkesområdet de hämtats ur. */}
        <Card className="p-5">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
            {t('career.laborMarket.skillsTitle')}
          </h3>
          {trendingSkills.length === 0 ? (
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {t('career.laborMarket.skillsEmpty')}
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {trendingSkills.slice(0, VISA_ANTAL).map((skill) => (
                <li
                  key={skill.skill}
                  className="inline-flex flex-col px-3 py-1.5 rounded-2xl bg-[var(--c-bg)] border border-[var(--c-accent)] text-sm text-[var(--c-text)] font-medium"
                >
                  <span>{skill.skill}</span>
                  {skill.occupation_field && typeof skill.occupation_field_job_count === 'number' && (
                    <span className="text-xs font-normal text-stone-600 dark:text-stone-400">
                      {t('career.laborMarket.skillsField', {
                        field: skill.occupation_field,
                        antal: skill.occupation_field_job_count.toLocaleString('sv-SE'),
                      })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Yrkesgrupper — antal annonser, inte antal sökningar. */}
        <Card className="p-5">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
            {t('career.laborMarket.occupationsTitle')}
          </h3>
          {popularOccupations.length === 0 ? (
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {t('career.laborMarket.occupationsEmpty')}
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {popularOccupations.slice(0, VISA_ANTAL).map((occ) => (
                <li
                  key={occ.term}
                  className="inline-flex flex-col px-3 py-1.5 rounded-2xl bg-[var(--c-bg)] border border-[var(--c-accent)] text-sm text-[var(--c-text)] font-medium"
                >
                  <span>{occ.term}</span>
                  {typeof occ.count === 'number' && (
                    <span className="text-xs font-normal text-stone-600 dark:text-stone-400 tabular-nums">
                      {t('career.laborMarket.jobsUnit', {
                        antal: occ.count.toLocaleString('sv-SE'),
                      })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Regioner — DESIGN.md §8 top 3, inga delta-procent */}
      {marketStats?.by_region && marketStats.by_region.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
            {t('career.laborMarket.regionsTitle')}
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {marketStats.by_region.slice(0, 3).map((region) => (
              <li
                key={region.region}
                className="p-4 rounded-lg bg-[var(--c-bg)] border border-[var(--c-accent)]"
              >
                <div className="text-xl font-bold text-[var(--c-text)] tabular-nums">
                  {region.job_count.toLocaleString('sv-SE')}
                </div>
                {/*
                  Namnet renderas helt. `.replace(' län', '')` stod här och
                  lämnade genitivformen utan huvudord: "Stockholms",
                  "Västra Götalands". Verifierat i prod 2026-08-21.
                */}
                <div className="text-sm text-stone-700 dark:text-stone-300 mt-0.5">
                  {region.region}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Källa och datans ålder */}
      <div className="text-center text-xs text-stone-600 dark:text-stone-400 py-4">
        <p>
          {t('career.laborMarket.dataFrom')}{' '}
          <a
            href="https://arbetsformedlingen.se"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--c-text)] hover:underline"
          >
            Arbetsförmedlingen
          </a>
          {uppdaterad && (
            <span> • {t('career.laborMarket.updated')}: {uppdaterad}</span>
          )}
        </p>
      </div>
    </div>
  )
}
