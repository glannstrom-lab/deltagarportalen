/**
 * Occupations Tab - Recommended occupations based on test results
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'
import {
  calculateUserProfile,
  calculateJobMatches,
  type UserProfile,
  matchningsplats,
  type JobMatch,
} from '@/services/interestGuideData'
import { useYrken } from '@/services/useIntresseguideInnehall'
import { LoadingState, InfoCard, Button, Card, EmptyState } from '@/components/ui'
import { interestGuideApi } from '@/services/cloudStorage'
import {
  ClipboardList,
  Sparkles,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Star,
  Filter,
  Search,
  ChevronDown,
  X,
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'

export default function OccupationsTab() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  // All useState hooks
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterUni, setFilterUni] = useState<boolean | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'match' | 'name' | 'salary'>('match')
  const [expandedOccupation, setExpandedOccupation] = useState<string | null>(null)

  const yrken = useYrken()

  // useEffect for loading data
  useEffect(() => {
    const loadResults = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await interestGuideApi.getProgress()

        if (data?.is_completed && data.answers) {
          try {
            const calculatedProfile = calculateUserProfile(data.answers)
            setProfile(calculatedProfile)
          } catch (calcErr) {
            console.error('OccupationsTab - Failed to calculate profile:', calcErr)
            setError(t('interestGuide.occupations.errCalcProfile', 'Kunde inte beräkna din profil. Försök göra om testet.'))
          }
        } else if (data && !data.is_completed) {
          setError(t('interestGuide.occupations.errNotCompleted', 'Du har inte slutfört testet än. Gå till testet för att slutföra.'))
        }
      } catch (err) {
        console.error('OccupationsTab - Failed to load results:', err)
        setError(t('interestGuide.occupations.errLoad', 'Kunde inte ladda resultaten. Försök igen senare.'))
      } finally {
        setIsLoading(false)
      }
    }

    loadResults()
  }, [t])

  // Calculate job matches - useMemo must be called unconditionally
  const { allMatches, calculationError } = useMemo(() => {
    if (!profile) {
      return { allMatches: [] as JobMatch[], calculationError: null }
    }
    try {
      const matches = calculateJobMatches(profile, filterUni)
      /*
        `calculateJobMatches` har bara två parametrar — den tredje
        (yrkeslistan) som `useJobbmatchningar` i useIntresseguideInnehall.ts
        skickar existerar inte i funktionssignaturen och ignoreras tyst av
        JS (verifierat: `npx tsc --noEmit` flaggar TS2554 på den raden).
        Matchningarna beräknas alltså alltid mot den svenska yrkeslistan.
        Yrkesobjektet i varje träff byts därför ut här, efteråt, mot den
        översatta posten med samma id — bara text, poängen är orörd.
      */
      const yrkeOversattPerId = new Map(yrken.map(o => [o.id, o]))
      const oversattaMatches = matches.map(m => ({
        ...m,
        occupation: yrkeOversattPerId.get(m.occupation.id) ?? m.occupation,
      }))
      return { allMatches: oversattaMatches, calculationError: null }
    } catch (err) {
      console.error('OccupationsTab - Failed to calculate job matches:', err)
      return {
        allMatches: [] as JobMatch[],
        calculationError: t('interestGuide.occupations.errCalcMatches', 'Kunde inte beräkna yrkesmatchningar: {{fel}}', { fel: err instanceof Error ? err.message : t('interestGuide.occupations.unknownError', 'Okänt fel') })
      }
    }
  }, [profile, filterUni, yrken, t])

  // Filter and sort matches - also unconditional
  const filteredMatches = useMemo(() => {
    let matches = searchQuery
      ? allMatches.filter(m =>
          m.occupation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.occupation.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : allMatches

    if (sortBy === 'name') {
      matches = [...matches].sort((a, b) => a.occupation.name.localeCompare(b.occupation.name))
    } else if (sortBy === 'salary') {
      matches = [...matches].sort((a, b) => b.occupation.salary.localeCompare(a.occupation.salary))
    }

    return matches
  }, [searchQuery, allMatches, sortBy])

  // Stats calculations - also unconditional
  /*
    "Utmärkta (90 %+)" och "Bra (70 %+)" är borttagna. Den första nåddes av
    1 av 500 slumpprofiler och av 0 av 5 uniforma svarsmönster — kortet stod
    permanent på 0 överst på sidan, vilket både bryter mot "ett tomt fält är
    inte en nolla" och ser ut som en bugg. Den andra var nästan alltid 142,
    alltså lika oinformativ. Kvar står det som faktiskt går att belägga.
  */
  const stats = useMemo(() => ({
    growingJobs: allMatches.filter(m => m.occupation.prognosis === 'growing').length,
    displayedMatches: showAll ? filteredMatches : filteredMatches.slice(0, 10),
  }), [allMatches, filteredMatches, showAll])

  const toggleFavorite = (occupationId: string) => {
    setFavorites(prev =>
      prev.includes(occupationId)
        ? prev.filter(id => id !== occupationId)
        : [...prev, occupationId]
    )
  }

  // Now conditional returns are safe - all hooks have been called
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 ">
        <LoadingState title={t('common.loading')} size="lg" />
      </div>
    )
  }

  if (calculationError) {
    return (
      <div className="max-w-lg mx-auto text-center py-12  min-h-screen">
        <InfoCard variant="error" className="mb-6">
          {calculationError}
        </InfoCard>
        <Button
          onClick={() => navigate('/interest-guide')}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          {t('interestGuide.results.restart')}
        </Button>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto min-h-screen">
        <EmptyState
          icon={ClipboardList}
          title={t('interestGuide.completeTestFirst', 'Genomför testet först')}
          description={t('interestGuide.completeTestForSuggestions', 'Du behöver genomföra intressetestet för att få personliga yrkesförslag.')}
          action={{
            label: t('interestGuide.startTest', 'Starta testet'),
            onClick: () => navigate('/interest-guide'),
          }}
        />
      </div>
    )
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      {error && (
        <InfoCard variant="error" className="mb-6">
          {error}
        </InfoCard>
      )}

      {/*
        Designpasset 2026-10-09: rubriken var en andra <h1> med märke och ett
        stycke, följd av två KPI-kort (antal yrken, antal växande). Nu en
        rubrikrad med talen på en rad.
      */}
      <div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          {t('interestGuide.occupationsThatSuitYou')}
        </h2>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-[var(--c-solid)]" aria-hidden="true" />
            {t('interestGuide.occupations.toExplore', '{{count}} yrken att utforska', { count: allMatches.length })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[var(--c-solid)]" aria-hidden="true" />
            {stats.growingJobs} {t('interestGuide.occupations.growingShare')}
          </span>
        </p>
      </div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-4 space-y-3 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                aria-label={t('common.search')}
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-[var(--c-solid)] focus:border-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                aria-label={t('interestGuide.occupations.sortLabel', 'Sortera yrkeslistan')}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'match' | 'name' | 'salary')}
                className="px-4 py-2 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg text-sm focus:ring-2 focus:ring-[var(--c-solid)] appearance-none cursor-pointer text-gray-900 dark:text-gray-100"
              >
                <option value="match">{t('interestGuide.occupations.sortMatch')}</option>
                <option value="name">{t('interestGuide.occupations.sortName')}</option>
                <option value="salary">{t('interestGuide.occupations.sortSalary')}</option>
              </select>
            </div>
          </div>

          {/* Education Filter */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200 dark:border-stone-700">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{t('interestGuide.occupations.educationFilter', 'Utbildning:')}</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterUni(null)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-lg transition-colors font-medium',
                  filterUni === null
                    ? 'bg-[var(--c-solid)] hover:brightness-110 text-white'
                    : 'bg-stone-100 dark:bg-stone-700 text-gray-600 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                )}
              >
                {t('common.all')}
              </button>
              <button
                onClick={() => setFilterUni(true)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 font-medium',
                  filterUni === true
                    ? 'bg-[var(--c-solid)] hover:brightness-110 text-white'
                    : 'bg-stone-100 dark:bg-stone-700 text-gray-600 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                )}
              >
                <GraduationCap className="w-4 h-4" aria-hidden="true" />
                {t('interestGuide.occupations.university', 'Högskola')}
              </button>
              <button
                onClick={() => setFilterUni(false)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 font-medium',
                  filterUni === false
                    ? 'bg-[var(--c-solid)] hover:brightness-110 text-white'
                    : 'bg-stone-100 dark:bg-stone-700 text-gray-600 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                )}
              >
                <Briefcase className="w-4 h-4" aria-hidden="true" />
                {t('interestGuide.occupations.upperSecondary', 'Gymnasium/YH')}
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          {(searchQuery || filterUni !== null) && (
            <div className="text-sm text-gray-600 dark:text-gray-300 pt-2">
              {t('interestGuide.occupations.showingOf', 'Visar {{visade}} av {{totalt}} yrken', { visade: filteredMatches.length, totalt: allMatches.length })}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        {stats.displayedMatches.length === 0 ? (
          <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <EmptyState
              icon={Search}
              title={t('interestGuide.noOccupationsFound', 'Inga yrken hittades med dina filter.')}
              description={t('interestGuide.tryOtherFilters', 'Prova andra sökord eller ta bort ett filter.')}
              action={{
                label: t('interestGuide.explore.clearFilters', 'Rensa filter'),
                onClick: () => {
                  setSearchQuery('')
                  setFilterUni(null)
                },
                variant: 'secondary',
              }}
            />
          </Card>
        ) : (
          <AnimatePresence>
            {stats.displayedMatches.map((match, index) => (
              <motion.div
                key={match.occupation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                {index < 3 && !searchQuery && filterUni === null && (
                  <div className="absolute -left-4 -top-2 z-10">
                    <div className="w-8 h-8 bg-[var(--c-solid)] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white dark:border-stone-800">
                      {index + 1}
                    </div>
                  </div>
                )}
                <Card
                  className="p-5 hover:shadow-md transition-all cursor-pointer bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700"
                  onClick={() => setExpandedOccupation(expandedOccupation === match.occupation.id ? null : match.occupation.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Left side - Occupation info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                            {match.occupation.name}
                          </h3>
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                            {match.occupation.description}
                          </p>
                        </div>
                      </div>

                      {/*
                        Här stod "{matchPercentage}%" med en progressbar. Talet
                        är inte tolkbart som lämplighet — en neutral svarsprofil
                        får 61–82 % mot varje yrke (mätt med
                        scripts/mat-matchningsfordelning.mjs). Rangordningen är
                        däremot äkta: den säger vilka yrken som ligger närmast
                        just de svar personen gav.
                      */}
                      <p className="mb-3 text-xs text-stone-600 dark:text-stone-400">
                        {matchningsplats(allMatches.indexOf(match), allMatches.length)}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {match.occupation.prognosis === 'growing' && (
                          <span className="text-xs bg-[var(--c-bg)] text-[var(--c-text)] dark:text-stone-100 border border-[var(--c-accent)] px-2.5 py-1 rounded-full font-medium">
                            {t('interestGuide.jobCard.prognosis.growing', 'Växande')}
                          </span>
                        )}
                        {match.occupation.education && (
                          <span className="text-xs bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-stone-100 px-2.5 py-1 rounded-full font-medium">
                            {match.occupation.education.name}
                          </span>
                        )}
                        {favorites.includes(match.occupation.id) && (
                          <span className="text-xs bg-[var(--c-bg)] text-[var(--c-text)] dark:text-stone-100 px-2.5 py-1 rounded-full font-medium">
                            {t('interestGuide.occupations.favorite', 'Favorit')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side - Match score + Actions */}
                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      {/* "9/10" visade samma otolkbara tal i ett tredje
                          format. Platsen räcker, och den står redan till
                          vänster. */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(match.occupation.id)
                        }}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          favorites.includes(match.occupation.id)
                            ? 'bg-[var(--c-bg)] text-[var(--c-solid)]'
                            : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 hover:text-[var(--c-solid)] hover:bg-[var(--c-bg)]'
                        )}
                        title={favorites.includes(match.occupation.id) ? t('interestGuide.occupations.alreadyFavorite', 'Redan favorit') : t('interestGuide.occupations.addFavorite', 'Lägg till som favorit')}
                        aria-label={`${favorites.includes(match.occupation.id) ? t('interestGuide.occupations.alreadyFavorite', 'Redan favorit') : t('interestGuide.occupations.addFavorite', 'Lägg till som favorit')}: ${match.occupation.name}`}
                        aria-pressed={favorites.includes(match.occupation.id)}
                      >
                        <Star className="w-5 h-5" fill="currentColor" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  <AnimatePresence>
                    {expandedOccupation === match.occupation.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-700 space-y-3"
                      >
                        {match.occupation.salary && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('interestGuide.occupations.salaryRange')}:</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {match.occupation.salary}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-stone-600 dark:text-stone-400">{t('career.explore.demand')}:</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {match.occupation.prognosis === 'growing' ? t('interestGuide.jobCard.prognosis.growing', 'Växande') : match.occupation.prognosis === 'stable' ? t('interestGuide.jobCard.prognosis.stable', 'Stabil') : t('interestGuide.occupations.declining', 'Minskande')}
                          </span>
                        </div>

                        {/* Varför yrket hamnade här. Listan var tidigare en
                            rangordning utan motivering — användaren fick en
                            ordning men ingen möjlighet att bedöma om den
                            stämde. Talen nedan är samma delpoäng som
                            rangordningen vilar på. */}
                        <div className="pt-3 border-t border-stone-100 dark:border-stone-700">
                          <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-2">
                            {t('interestGuide.occupations.whyHere', 'Varför hamnade det här?')}
                          </h4>
                          <p className="text-sm text-stone-700 dark:text-stone-300 mb-3">
                            {match.forklaring.sammanfattning}
                          </p>
                          <ul className="space-y-1.5">
                            {match.forklaring.delar.map(del => (
                              <li key={del.namn} className="flex items-center gap-3 text-xs">
                                <span className="flex-1 text-stone-700 dark:text-stone-300">{del.namn}</span>
                                <span className="w-24 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden shrink-0">
                                  <span
                                    className="block h-full bg-[var(--c-solid)] rounded-full"
                                    style={{ width: `${del.poang}%` }}
                                  />
                                </span>
                                <span className="w-28 text-right text-stone-600 dark:text-stone-400 tabular-nums shrink-0">
                                  {t('interestGuide.occupations.partWeight', '{{poang}} % · väger {{andel}} %', { poang: del.poang, andel: del.andel })}
                                </span>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-3 text-xs text-stone-600 dark:text-stone-400">
                            {t('interestGuide.occupations.codingNote', 'Delpoängen kommer ur dina svar jämförda med hur vi kodat yrket. Kodningen är vår egen redaktionella bedömning — den kommer inte från SSYK, O*NET eller någon annan yrkesdatabas. Använd ordningen som en uppslagslista, inte som ett facit.')}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Pagination */}
      {filteredMatches.length > 10 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center"
        >
          {!showAll ? (
            <Button
              variant="outline"
              onClick={() => setShowAll(true)}
              className="gap-2"
            >
              {t('interestGuide.occupations.showAll', 'Visa alla {{count}} yrken', { count: filteredMatches.length })}
              <ChevronDown className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowAll(false)}
              className="gap-2"
            >
              {t('interestGuide.occupations.showFewer', 'Visa färre')}
              <ChevronDown className="w-4 h-4 rotate-180" />
            </Button>
          )}
        </motion.div>
      )}

      {/* Favorites Summary */}
      {favorites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-4 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-[var(--c-solid)] fill-current" aria-hidden="true" />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {t('interestGuide.occupations.favoritesCount', { count: favorites.length, defaultValue_one: 'Du har {{count}} favorit', defaultValue_other: 'Du har {{count}} favoriter' })}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFavorites([])}
                aria-label={t('interestGuide.occupations.clearFavorites', 'Rensa favoriterna')}
                className="text-[var(--c-text)] dark:text-stone-100"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
    </MotionConfig>
  )
}
