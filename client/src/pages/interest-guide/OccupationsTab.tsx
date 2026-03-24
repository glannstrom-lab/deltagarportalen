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
import { JobCard } from '@/components/interest-guide/JobCard'
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
  Bookmark,
  Heart,
  BarChart3,
  ChevronDown,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function OccupationsTab() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterUni, setFilterUni] = useState<boolean | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'match' | 'name' | 'salary'>('match')
  const [expandedOccupation, setExpandedOccupation] = useState<string | null>(null)

  useEffect(() => {
    const loadResults = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await interestGuideApi.getProgress()

        console.log('Interest guide data:', data) // Debug

        if (data?.is_completed && data.answers) {
          try {
            const calculatedProfile = calculateUserProfile(data.answers)
            console.log('Calculated profile:', calculatedProfile) // Debug
            setProfile(calculatedProfile)
          } catch (calcErr) {
            console.error('Failed to calculate profile:', calcErr)
            setError('Kunde inte beräkna din profil. Försök göra om testet.')
          }
        } else if (data && !data.is_completed) {
          setError('Du har inte slutfört testet än. Gå till testet för att slutföra.')
        }
      } catch (err) {
        console.error('Failed to load results:', err)
        setError('Kunde inte ladda resultaten. Försök igen senare.')
      } finally {
        setIsLoading(false)
      }
    }

    loadResults()
  }, [])

  const toggleFavorite = (occupationId: string) => {
    setFavorites(prev =>
      prev.includes(occupationId)
        ? prev.filter(id => id !== occupationId)
        : [...prev, occupationId]
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingState title={t('common.loading') || 'Laddar yrken...'} size="lg" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6"
        >
          <ClipboardList className="w-8 h-8 text-indigo-600" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {t('interestGuide.completeTestFirst') || 'Genomför testet först'}
        </h2>
        <p className="text-gray-600 mb-6">
          {t('interestGuide.completeTestForSuggestions') || 'Du behöver genomföra intressetestet för att få personliga yrkesförslag.'}
        </p>
        <Button
          onClick={() => navigate('/interest-guide')}
          className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600"
        >
          <Sparkles className="w-4 h-4" />
          {t('interestGuide.startTest') || 'Starta testet'}
        </Button>
      </div>
    )
  }

  const allMatches = calculateJobMatches(profile, filterUni)

  // Filter by search query
  const filteredMatches = useMemo(() => {
    let matches = searchQuery
      ? allMatches.filter(m =>
          m.occupation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.occupation.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : allMatches

    // Sort matches
    if (sortBy === 'name') {
      matches = [...matches].sort((a, b) => a.occupation.name.localeCompare(b.occupation.name))
    } else if (sortBy === 'salary') {
      matches = [...matches].sort((a, b) => b.occupation.salary.localeCompare(a.occupation.salary))
    }

    return matches
  }, [searchQuery, allMatches, sortBy])

  const displayedMatches = showAll ? filteredMatches : filteredMatches.slice(0, 10)

  // Stats
  const goodMatches = allMatches.filter(m => m.matchPercentage >= 70).length
  const growingJobs = allMatches.filter(m => m.occupation.prognosis === 'growing').length
  const excellentMatches = allMatches.filter(m => m.matchPercentage >= 90).length

  return (
    <div className="max-w-5xl mx-auto space-y-8">
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
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
          <Briefcase className="w-4 h-4" />
          {t('interestGuide.basedOnYourProfile') || 'Baserat på din profil'}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {t('interestGuide.occupationsThatSuitYou') || 'Yrken som passar dig'}
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
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
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900">{excellentMatches}</p>
              <p className="text-xs text-green-700">Utmärkta (90%+)</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{goodMatches}</p>
              <p className="text-xs text-blue-700">Bra (70%+)</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-900">{growingJobs}</p>
              <p className="text-xs text-purple-700">Växande yrken</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-200 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-900">{allMatches.length}</p>
              <p className="text-xs text-orange-700">Totalt att utforska</p>
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
        <Card className="p-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('common.search') || 'Sök yrken...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer bg-white"
              >
                <option value="match">Sortera: Matchning</option>
                <option value="name">Sortera: Namn (A-Z)</option>
                <option value="salary">Sortera: Lön (högst först)</option>
              </select>
            </div>
          </div>

          {/* Education Filter */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 font-medium">Utbildning:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterUni(null)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-lg transition-colors font-medium',
                  filterUni === null
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {t('common.all') || 'Alla'}
              </button>
              <button
                onClick={() => setFilterUni(true)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 font-medium',
                  filterUni === true
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                <Briefcase className="w-4 h-4" />
                Gym/YH
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          {searchQuery || filterUni !== null ? (
            <div className="text-sm text-gray-600 pt-2">
              Visar <span className="font-semibold text-indigo-600">{filteredMatches.length}</span> av{' '}
              <span className="font-semibold">{allMatches.length}</span> yrken
            </div>
          ) : null}
        </Card>
      </motion.div>

      {/* Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        {displayedMatches.length === 0 ? (
          <Card className="p-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">
              {t('interestGuide.noOccupationsFound') || 'Inga yrken hittades med dina filter.'}
            </p>
          </Card>
        ) : (
          <AnimatePresence>
            {displayedMatches.map((match, index) => (
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
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white">
                      {index + 1}
                    </div>
                  </div>
                )}
                <Card
                  className="p-5 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setExpandedOccupation(expandedOccupation === match.occupation.id ? null : match.occupation.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Left side - Occupation info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 truncate">
                            {match.occupation.name}
                          </h3>
                          <p className="text-sm text-slate-500 line-clamp-2">
                            {match.occupation.description}
                          </p>
                        </div>
                      </div>

                      {/* Match Percentage Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-600">Matchning</span>
                          <span className="text-sm font-bold text-indigo-600">{match.matchPercentage}%</span>
                        </div>
                        <Progress value={match.matchPercentage} className="h-2" />
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {match.occupation.prognosis === 'growing' && (
                          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                            📈 Växande
                          </span>
                        )}
                        {match.occupation.education && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                            🎓 {match.occupation.education.name}
                          </span>
                        )}
                        {favorites.includes(match.occupation.id) && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">
                            ⭐ Favorit
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side - Match score + Actions */}
                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                          <span className="text-lg font-bold text-indigo-600">{Math.round(match.matchPercentage / 10)}/10</span>
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
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-gray-100 text-gray-400 hover:text-amber-600 hover:bg-amber-50'
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
                        className="mt-4 pt-4 border-t border-slate-100 space-y-3"
                      >
                        {match.occupation.salary && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">💰 Lönespann:</span>
                            <span className="font-semibold text-slate-900">
                              {match.occupation.salary}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">📊 Efterfrågan:</span>
                          <span className="font-semibold text-slate-900">
                            {match.occupation.prognosis === 'growing' ? '📈 Växande' : match.occupation.prognosis === 'stable' ? '➡️ Stabil' : '📉 Minskande'}
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
          <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-600 fill-current" />
                <span className="font-medium text-slate-900">
                  Du har {favorites.length} favorit{favorites.length !== 1 ? 'er' : ''}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFavorites([])}
                className="text-amber-700 hover:bg-amber-100"
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
