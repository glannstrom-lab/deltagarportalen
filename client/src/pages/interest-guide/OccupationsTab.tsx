/**
 * Occupations Tab - Recommended occupations based on test results
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  calculateUserProfile,
  calculateJobMatches,
  type UserProfile,
  type JobMatch,
} from '@/services/interestGuideData'
import { LoadingState, InfoCard, Button, Card, Progress } from '@/components/ui'
import { interestGuideApi } from '@/services/cloudStorage'
import {
  ClipboardList,
  Sparkles,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Filter,
  Search,
  Star,
  BarChart3,
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
      return { allMatches: [], calculationError: null }
    }
    try {
      const matches = calculateJobMatches(profile, filterUni)
      return { allMatches: matches, calculationError: null }
    } catch (err) {
      console.error('OccupationsTab - Failed to calculate job matches:', err)
      return {
        allMatches: [],
        calculationError: `Kunde inte beräkna yrkesmatchningar: ${err instanceof Error ? err.message : 'Okänt fel'}`
      }
    }
  }, [profile, filterUni])

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
  const stats = useMemo(() => ({
    goodMatches: allMatches.filter(m => m.matchPercentage >= 70).length,
    growingJobs: allMatches.filter(m => m.occupation.prognosis === 'growing').length,
    excellentMatches: allMatches.filter(m => m.matchPercentage >= 90).length,
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
      <div className="flex items-center justify-center py-12 bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950">
        <LoadingState title={t('common.loading') || 'Laddar yrken...'} size="lg" />
      </div>
    )
  }

  if (calculationError) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 min-h-screen">
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
      <div className="max-w-lg mx-auto text-center py-12 bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 min-h-screen">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl flex items-center justify-center mx-auto mb-6"
        >
          <ClipboardList className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          {t('interestGuide.completeTestFirst') || 'Genomför testet först'}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {t('interestGuide.completeTestForSuggestions') || 'Du behöver genomföra intressetestet för att få personliga yrkesförslag.'}
        </p>
        <Button
          onClick={() => navigate('/interest-guide')}
          className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600"
        >
          <Sparkles className="w-4 h-4" />
          {t('interestGuide.startTest') || 'Starta testet'}
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 p-4">
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

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="p-4 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-900/20 border-brand-200 dark:border-brand-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-200 dark:bg-brand-900/50 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-brand-900 dark:text-brand-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-900 dark:text-brand-100">{stats.excellentMatches}</p>
              <p className="text-xs text-brand-900 dark:text-brand-300">Utmärkta (90%+)</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-200 dark:bg-blue-800/50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.goodMatches}</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">Bra (70%+)</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-200 dark:bg-purple-800/50 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.growingJobs}</p>
              <p className="text-xs text-purple-700 dark:text-purple-300">Växande yrken</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-200 dark:bg-orange-800/50 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{allMatches.length}</p>
              <p className="text-xs text-orange-700 dark:text-orange-300">Totalt att utforska</p>
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
                placeholder={t('common.search') || 'Sök yrken...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'match' | 'name' | 'salary')}
                className="px-4 py-2 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 appearance-none cursor-pointer text-gray-900 dark:text-gray-100"
              >
                <option value="match">Sortera: Matchning</option>
                <option value="name">Sortera: Namn (A-Z)</option>
                <option value="salary">Sortera: Lön (högst först)</option>
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
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white'
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
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white'
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
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white'
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
          <Card className="p-12 text-center bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {t('interestGuide.noOccupationsFound') || 'Inga yrken hittades med dina filter.'}
            </p>
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
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 dark:from-amber-500 dark:to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-stone-800">
                      {index + 1}
                    </div>
                  </div>
                )}
                <Card
                  className="p-5 hover: transition-all cursor-pointer bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700"
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

                      {/* Match Percentage Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Matchning</span>
                          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{match.matchPercentage}%</span>
                        </div>
                        <Progress value={match.matchPercentage} className="h-2" />
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {match.occupation.prognosis === 'growing' && (
                          <span className="text-xs bg-brand-100 dark:bg-brand-900/30 text-brand-900 dark:text-brand-300 px-2.5 py-1 rounded-full font-medium">
                            Växande
                          </span>
                        )}
                        {match.occupation.education && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full font-medium">
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
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                          <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{Math.round(match.matchPercentage / 10)}/10</span>
                        </div>
                      </div>
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
                            <span className="text-sm text-gray-600 dark:text-gray-400">Lönespann:</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {match.occupation.salary}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Efterfrågan:</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {match.occupation.prognosis === 'growing' ? 'Växande' : match.occupation.prognosis === 'stable' ? 'Stabil' : 'Minskande'}
                          </span>
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
          <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
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
  )
}
