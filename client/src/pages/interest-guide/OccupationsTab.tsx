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
            setError('Kunde inte beräkna din profil. Försök göra om testet.')
          }
        } else if (data && !data.is_completed) {
          setError('Du har inte slutfört testet än. Gå till testet för att slutföra.')
        }
      } catch (err) {
        console.error('OccupationsTab - Failed to load results:', err)
        setError('Kunde inte ladda resultaten. Försök igen senare.')
      } finally {
        setIsLoading(false)
      }
    }

    loadResults()
  }, [])

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
        calculationError: `Kunde inte beräkna yrkesmatchningar: ${err instanceof Error ? err.message : 'Okänt fel'}`
      }
    }
  }, [profile, filterUni, yrken])

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
        <LoadingState title={t('common.loading') || 'Laddar yrken...'} size="lg" />
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
          <Sparkles className="w-4 h-4" />
          Gör om testet
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
    <div className="max-w-5xl mx-auto space-y-8 min-h-screen  p-4">
      {error && (
        <InfoCard variant="error" className="mb-6">
          {error}
        </InfoCard>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm font-medium mb-4">
          <Briefcase className="w-4 h-4" />
          {t('interestGuide.basedOnYourProfile') || 'Baserat på din profil'}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          {t('interestGuide.occupationsThatSuitYou') || 'Yrken som passar dig'}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {t('interestGuide.occupationsDescription') || 'Vi har analyserat din profil och hittat yrken som matchar dina intressen, personlighet och förutsättningar.'}
        </p>
      </motion.div>

      {/*
        Fyra KPI-kort i hjälteposition, i grönt, blått, lila och orange på en
        rosa sida. Två av talen gick inte att belägga: "Utmärkta (90 %+)" stod
        permanent på 0 och "Bra (70 %+)" på i stort sett 142. Kvar är de två
        som betyder något, i hubbfärgen.
      */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <Card className="p-4 bg-[var(--c-bg)] border-[var(--c-accent)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/60 dark:bg-white/10 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--c-text)] tabular-nums">{allMatches.length}</p>
              <p className="text-xs text-stone-700 dark:text-stone-300">yrken att utforska</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-[var(--c-bg)] border-[var(--c-accent)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/60 dark:bg-white/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[var(--c-solid)]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--c-text)] tabular-nums">{stats.growingJobs}</p>
              <p className="text-xs text-stone-700 dark:text-stone-300">{t('interestGuide.occupations.growingShare')}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6 space-y-4 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                aria-label={t('common.search') || 'Sök yrken...'}
                placeholder={t('common.search') || 'Sök yrken...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                aria-label="Sortera yrkeslistan"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'match' | 'name' | 'salary')}
                className="px-4 py-2 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 appearance-none cursor-pointer text-gray-900 dark:text-gray-100"
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
            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Utbildning:</span>
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
                {t('common.all') || 'Alla'}
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
                <GraduationCap className="w-4 h-4" />
                Högskola
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
                <Briefcase className="w-4 h-4" />
                Gym/YH
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          {(searchQuery || filterUni !== null) && (
            <div className="text-sm text-gray-600 dark:text-gray-300 pt-2">
              Visar <span className="font-semibold text-amber-600 dark:text-amber-400">{filteredMatches.length}</span> av{' '}
              <span className="font-semibold">{allMatches.length}</span> yrken
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
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full font-medium">
                            Växande
                          </span>
                        )}
                        {match.occupation.education && (
                          <span className="text-xs bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-blue-300 px-2.5 py-1 rounded-full font-medium">
                            {match.occupation.education.name}
                          </span>
                        )}
                        {favorites.includes(match.occupation.id) && (
                          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full font-medium">
                            Favorit
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
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                            : 'bg-stone-100 dark:bg-stone-700 text-gray-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                        )}
                        title={favorites.includes(match.occupation.id) ? 'Redan favorit' : 'Lägg till som favorit'}
                      >
                        <Star className="w-5 h-5" fill="currentColor" />
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
                            {match.occupation.prognosis === 'growing' ? 'Växande' : match.occupation.prognosis === 'stable' ? 'Stabil' : 'Minskande'}
                          </span>
                        </div>

                        {/* Varför yrket hamnade här. Listan var tidigare en
                            rangordning utan motivering — användaren fick en
                            ordning men ingen möjlighet att bedöma om den
                            stämde. Talen nedan är samma delpoäng som
                            rangordningen vilar på. */}
                        <div className="pt-3 border-t border-stone-100 dark:border-stone-700">
                          <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-2">
                            Varför hamnade det här?
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
                                  {del.poang} % · väger {del.andel} %
                                </span>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-3 text-xs text-stone-600 dark:text-stone-400">
                            Delpoängen kommer ur dina svar jämförda med hur vi kodat yrket.
                            Kodningen är vår egen redaktionella bedömning — den kommer inte från
                            SSYK, O*NET eller någon annan yrkesdatabas. Använd ordningen som en
                            uppslagslista, inte som ett facit.
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
              Visa alla {filteredMatches.length} yrken
              <ChevronDown className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowAll(false)}
              className="gap-2"
            >
              Visa färre
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
                <Star className="w-5 h-5 text-amber-600 dark:text-amber-400 fill-current" />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  Du har {favorites.length} favorit{favorites.length !== 1 ? 'er' : ''}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFavorites([])}
                className="text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
    </MotionConfig>
  )
}
