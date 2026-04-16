/**
 * Explore Tab - Explore occupations with cloud storage for favorites
 */
import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search, Compass, Briefcase, GraduationCap, DollarSign,
  TrendingUp, MapPin, Clock, Star, Filter, ChevronRight,
  Heart, Share2, X, Eye, Loader2
} from '@/components/ui/icons'
import { Card, Button, Input } from '@/components/ui'
import { IndustryRadarSection, EducationPathPanel } from '@/components/ai'
import { CareerOnboarding, type CareerPreferences } from '@/components/career'
import { cn } from '@/lib/utils'
import { favoriteOccupationsApi, type FavoriteOccupation } from '@/services/careerApi'
import { taxonomyApi, POPULAR_OCCUPATIONS, type Occupation as TaxonomyOccupation } from '@/services/afTaxonomyApi'
import { trendsApi } from '@/services/afTrendsApi'
import { unifiedProfileApi, type EmploymentStatus } from '@/services/unifiedProfileApi'

// Extended occupation with display data
interface DisplayOccupation {
  id: string
  title: string
  category: string
  categoryLabel: string
  salary: string
  demand: string
  education: string
  match: number
  description: string
}

// Category mapping for occupations
const CATEGORY_MAPPING: Record<string, string> = {
  'Systemutvecklare': 'it',
  'Programmerare': 'it',
  'IT-tekniker': 'it',
  'Webbutvecklare': 'it',
  'Datatekniker': 'it',
  'Sjuksköterska': 'healthcare',
  'Läkare': 'healthcare',
  'Vårdbiträde': 'healthcare',
  'Undersköterska': 'healthcare',
  'Lärare': 'education',
  'Förskollärare': 'education',
  'Ekonomiassistent': 'economy',
  'Revisor': 'economy',
  'Redovisningsekonom': 'economy',
  'Projektledare': 'administration',
  'Administratör': 'administration',
  'Byggarbetare': 'construction',
  'Elektriker': 'construction',
  'Snickare': 'construction',
  'Lagerarbetare': 'logistics',
  'Lastbilschaufför': 'logistics',
  'Kundtjänstmedarbetare': 'service',
  'Kock': 'service',
  'Säljare': 'service',
}

const categoryKeys = ['all', 'it', 'healthcare', 'economy', 'administration', 'construction', 'education', 'service', 'logistics', 'other'] as const

const salaryRanges = [
  { key: 'all', label: 'Alla löneintervall', minSalary: 0, maxSalary: Infinity },
  { key: '0-35k', label: '0 - 35 000 kr', minSalary: 0, maxSalary: 35000 },
  { key: '35-50k', label: '35 000 - 50 000 kr', minSalary: 35000, maxSalary: 50000 },
  { key: '50k+', label: '50 000+ kr', minSalary: 50000, maxSalary: Infinity },
] as const

export default function ExploreTab() {
  const { t, i18n } = useTranslation()

  // Onboarding state - check profile data to determine if onboarding is needed
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [careerPreferences, setCareerPreferences] = useState<CareerPreferences | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSalaryRange, setSelectedSalaryRange] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [cloudFavorites, setCloudFavorites] = useState<FavoriteOccupation[]>([])
  const [comparison, setComparison] = useState<Set<string>>(new Set())
  const [showComparison, setShowComparison] = useState(false)
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true)
  const [savingFavorite, setSavingFavorite] = useState<string | null>(null)

  // Dynamic occupation loading
  const [occupations, setOccupations] = useState<DisplayOccupation[]>([])
  const [isLoadingOccupations, setIsLoadingOccupations] = useState(true)
  const [isSearching, setIsSearching] = useState(false)

  // Handle onboarding completion - save to cloud
  const handleOnboardingComplete = async (preferences: CareerPreferences) => {
    setCareerPreferences(preferences)
    setShowOnboarding(false)

    // Save to cloud via unifiedProfileApi
    // Only set employmentStatus if it's a valid non-empty value
    try {
      await unifiedProfileApi.updateCareer({
        employmentStatus: preferences.currentSituation
          ? (preferences.currentSituation as EmploymentStatus)
          : ('other' as EmploymentStatus),
        targetIndustries: preferences.interests,
        careerGoals: {
          shortTerm: preferences.goals[0] || '',
          longTerm: preferences.goals[1] || ''
        }
      })
    } catch (err) {
      console.error('Failed to save career preferences:', err)
    }

    // Pre-select category based on interests
    if (preferences.interests.length > 0) {
      const interestToCategory: Record<string, string> = {
        'tech': 'it',
        'healthcare': 'healthcare',
        'education': 'education',
        'business': 'economy',
        'trades': 'construction',
        'service': 'service',
      }
      const firstInterest = preferences.interests[0]
      if (interestToCategory[firstInterest]) {
        setSelectedCategory(interestToCategory[firstInterest])
      }
    }
  }

  const handleSkipOnboarding = async () => {
    setShowOnboarding(false)
    // Mark as completed by setting a default status
    try {
      await unifiedProfileApi.updateCareer({
        employmentStatus: 'other'
      })
    } catch (err) {
      console.error('Failed to skip onboarding:', err)
    }
  }

  // Load profile data to check if onboarding is needed
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await unifiedProfileApi.getProfile()

        // Check if onboarding is complete (user has employmentStatus set)
        const hasCompletedOnboarding = !!profile.career?.employmentStatus
        setShowOnboarding(!hasCompletedOnboarding)

        // Restore preferences from profile
        if (hasCompletedOnboarding && profile.career) {
          setCareerPreferences({
            currentSituation: profile.career.employmentStatus || '',
            interests: profile.career.targetIndustries || [],
            goals: [
              profile.career.careerGoals?.shortTerm || '',
              profile.career.careerGoals?.longTerm || ''
            ].filter(Boolean),
            location: profile.core?.location || '',
            experience: profile.professional?.workExperience?.length ? 'experienced' : 'entry'
          })
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
        // If profile load fails, show onboarding as fallback
        setShowOnboarding(true)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadProfile()
  }, [])

  // Load occupations from API
  useEffect(() => {
    loadInitialOccupations()
  }, [i18n.language])

  const loadInitialOccupations = async () => {
    setIsLoadingOccupations(true)
    try {
      // Load popular occupations with their details
      const popularOccupations = await Promise.all(
        POPULAR_OCCUPATIONS.slice(0, 20).map(async (pop) => {
          try {
            const results = await taxonomyApi.searchOccupations(pop.label, 1)
            if (results.length > 0) {
              return transformOccupation(results[0], pop.category)
            }
            // Fallback if API doesn't return result
            return {
              id: pop.id,
              title: pop.label,
              category: getCategoryFromTitle(pop.label),
              categoryLabel: t(`career.explore.categories.${getCategoryFromTitle(pop.label)}`),
              salary: 'Varierar',
              demand: i18n.language === 'en' ? 'Medium' : 'Medel',
              education: i18n.language === 'en' ? 'Varies' : 'Varierar',
              match: Math.floor(Math.random() * 30) + 60,
              description: ''
            }
          } catch {
            return {
              id: pop.id,
              title: pop.label,
              category: getCategoryFromTitle(pop.label),
              categoryLabel: t(`career.explore.categories.${getCategoryFromTitle(pop.label)}`),
              salary: 'Varierar',
              demand: i18n.language === 'en' ? 'Medium' : 'Medel',
              education: i18n.language === 'en' ? 'Varies' : 'Varierar',
              match: Math.floor(Math.random() * 30) + 60,
              description: ''
            }
          }
        })
      )
      setOccupations(popularOccupations.filter(Boolean))
    } catch (err) {
      console.error('Failed to load occupations:', err)
      // Fallback to basic data
      setOccupations(POPULAR_OCCUPATIONS.map(pop => ({
        id: pop.id,
        title: pop.label,
        category: getCategoryFromTitle(pop.label),
        categoryLabel: pop.category,
        salary: 'Varierar',
        demand: i18n.language === 'en' ? 'Medium' : 'Medel',
        education: i18n.language === 'en' ? 'Varies' : 'Varierar',
        match: Math.floor(Math.random() * 30) + 60,
        description: ''
      })))
    } finally {
      setIsLoadingOccupations(false)
    }
  }

  const getCategoryFromTitle = (title: string): string => {
    return CATEGORY_MAPPING[title] || 'other'
  }

  const transformOccupation = (occ: TaxonomyOccupation, category?: string): DisplayOccupation => {
    const cat = category || getCategoryFromTitle(occ.preferred_label)
    return {
      id: occ.id,
      title: occ.preferred_label,
      category: cat,
      categoryLabel: t(`career.explore.categories.${cat}`),
      salary: 'Laddar...',
      demand: i18n.language === 'en' ? 'Medium' : 'Medel',
      education: i18n.language === 'en' ? 'Varies' : 'Varierar',
      match: Math.floor(Math.random() * 30) + 60,
      description: occ.definition || ''
    }
  }

  // Search for occupations when query changes
  useEffect(() => {
    const searchOccupations = async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        return
      }

      setIsSearching(true)
      try {
        const results = await taxonomyApi.searchOccupations(searchQuery, 20)
        if (results.length > 0) {
          const transformed = results.map(r => transformOccupation(r))
          setOccupations(transformed)
        }
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setIsSearching(false)
      }
    }

    const debounce = setTimeout(searchOccupations, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  // Reset to popular occupations when search is cleared
  useEffect(() => {
    if (!searchQuery.trim()) {
      loadInitialOccupations()
    }
  }, [searchQuery])

  // Load favorites from cloud on mount
  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    try {
      const data = await favoriteOccupationsApi.getAll()
      setCloudFavorites(data)
      setFavorites(new Set(data.map(f => f.occupation_id)))
    } catch (err) {
      console.error('Failed to load favorites:', err)
    } finally {
      setIsLoadingFavorites(false)
    }
  }

  // Build translated categories
  const categories = useMemo(() => categoryKeys.map(key => ({
    key,
    label: t(`career.explore.categories.${key}`)
  })), [t])

  // Filter occupations by category (search is handled by API)
  const filteredOccupations = useMemo(() => {
    return occupations.filter(occ => {
      const matchesCategory = selectedCategory === 'all' || occ.category === selectedCategory
      return matchesCategory
    })
  }, [occupations, selectedCategory])

  const toggleFavorite = async (id: string) => {
    const occupation = occupations.find(o => o.id === id)
    if (!occupation) return

    setSavingFavorite(id)
    try {
      const isFav = await favoriteOccupationsApi.toggle({
        occupation_id: id,
        occupation_title: occupation.title,
        occupation_category: occupation.category,
        salary_range: occupation.salary,
        demand_level: occupation.demand,
        education_required: occupation.education,
        match_percentage: occupation.match
      })

      const newFavorites = new Set(favorites)
      if (isFav) {
        newFavorites.add(id)
      } else {
        newFavorites.delete(id)
      }
      setFavorites(newFavorites)
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    } finally {
      setSavingFavorite(null)
    }
  }

  const toggleComparison = (id: string) => {
    const newComparison = new Set(comparison)
    if (newComparison.has(id)) {
      newComparison.delete(id)
    } else if (newComparison.size < 3) {
      newComparison.add(id)
    }
    setComparison(newComparison)
  }

  const getMatchColor = (match: number): string => {
    if (match >= 90) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
    if (match >= 80) return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
    if (match >= 70) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30'
    return 'text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-700'
  }

  const getDemandIcon = (demand: string) => {
    if (demand.includes('Mycket') || demand.includes('Very')) return '⬆️⬆️'
    if (demand.includes('Hög') || demand.includes('High')) return '⬆️'
    return '→'
  }

  const comparedOccupations = occupations.filter(o => comparison.has(o.id))

  // Get selected occupation for education panel
  const selectedOccupation = useMemo(() => {
    if (favorites.size === 0) return null
    const firstFavoriteId = Array.from(favorites)[0]
    return occupations.find(o => o.id === firstFavoriteId)
  }, [favorites, occupations])

  // Show loading state while checking profile
  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mr-3" aria-hidden="true" />
        <span className="text-gray-600 dark:text-gray-400">
          {t('common.loading') || 'Laddar...'}
        </span>
      </div>
    )
  }

  // Show onboarding for first-time users
  if (showOnboarding) {
    return (
      <CareerOnboarding
        onComplete={handleOnboardingComplete}
        onSkip={handleSkipOnboarding}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome back message with personalized recommendations */}
      {careerPreferences && (
        <Card className="p-6 bg-gradient-to-r from-teal-500 to-sky-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1">
                {t('career.explore.welcomeBack')}
              </h2>
              <p className="text-teal-100 text-sm">
                {t('career.explore.basedOnInterests', {
                  interests: careerPreferences.interests.map(i => t(`career.onboarding.interests.${i}`)).join(', ')
                })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                // Clear career data in cloud to retake onboarding
                try {
                  await unifiedProfileApi.updateCareer({
                    employmentStatus: null as unknown as EmploymentStatus,
                    targetIndustries: [],
                    careerGoals: { shortTerm: '', longTerm: '' }
                  })
                } catch (err) {
                  console.error('Failed to reset preferences:', err)
                }
                setShowOnboarding(true)
                setCareerPreferences(null)
              }}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              {t('career.explore.retakeQuiz')}
            </Button>
          </div>
        </Card>
      )}

      {/* Industry Radar */}
      <IndustryRadarSection />

      {/* Search */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700" role="search">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
          <Input
            type="search"
            placeholder={t('career.explore.searchPlaceholder') || 'Sök efter yrken...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 text-lg bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600"
            aria-label="Sök efter yrken"
          />
        </div>
      </Card>

      {/* Categories */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrera efter kategori">
        {categories.map((category) => (
          <button
            key={category.key}
            onClick={() => setSelectedCategory(category.key)}
            className={cn(
              'px-4 py-2 rounded-full font-medium transition-all',
              selectedCategory === category.key
                ? 'bg-teal-500 dark:bg-teal-600 text-white shadow-md'
                : 'bg-stone-100 dark:bg-stone-700 text-gray-700 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-stone-600'
            )}
            aria-pressed={selectedCategory === category.key}
            aria-label={`Filtrera efter ${category.label}`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Filter and Comparison Controls */}
      <div className="flex gap-2 items-center flex-wrap">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-stone-100 dark:bg-stone-700 text-gray-700 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors text-sm font-medium"
        >
          <Filter className="w-4 h-4" />
          {t('common.filter') || 'Filtrera'}
        </button>
        {comparison.size > 0 && (
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            {t('career.explore.compare') || 'Jämför'} ({comparison.size}/3)
          </button>
        )}
      </div>

      {/* Salary Filter */}
      {showFilters && (
        <Card className="p-4 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 text-sm">{t('career.explore.salaryRange') || 'Löneintervall'}</h4>
          <div className="flex flex-wrap gap-2">
            {salaryRanges.map((range) => (
              <button
                key={range.key}
                onClick={() => setSelectedSalaryRange(range.key)}
                className={cn(
                  'px-3 py-1 rounded-full text-sm transition-all',
                  selectedSalaryRange === range.key
                    ? 'bg-teal-500 dark:bg-teal-600 text-white'
                    : 'bg-white dark:bg-stone-700 text-gray-700 dark:text-gray-300 border border-stone-200 dark:border-stone-600 hover:border-teal-300 dark:hover:border-teal-600'
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Comparison View */}
      {showComparison && comparedOccupations.length > 0 && (
        <Card className="p-4 bg-teal-50 dark:bg-teal-900/20 border-2 border-teal-200 dark:border-teal-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-teal-900 dark:text-teal-100">{t('career.explore.comparison') || 'Jämförelse'} ({comparedOccupations.length})</h3>
            <button onClick={() => setShowComparison(false)} className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {comparedOccupations.map((occ) => (
              <div key={occ.id} className="bg-white dark:bg-stone-800 rounded-lg p-3 border border-teal-200 dark:border-teal-700">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{occ.title}</h4>
                <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <p><strong>{t('career.explore.match') || 'Match'}:</strong> {occ.match}%</p>
                  <p><strong>{t('career.explore.salary') || 'Lön'}:</strong> {occ.salary}</p>
                  <p><strong>{t('career.explore.demandLabel') || 'Efterfrågan'}:</strong> {occ.demand}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Loading state */}
      {(isLoadingOccupations || isSearching) && (
        <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600 mr-2" aria-hidden="true" />
          <span className="text-gray-600 dark:text-gray-400">
            {isSearching
              ? (t('career.explore.searching') || 'Söker yrken...')
              : (t('career.explore.loadingOccupations') || 'Laddar yrken...')}
          </span>
        </div>
      )}

      {/* Occupations */}
      {!isLoadingOccupations && !isSearching && (
      <div className="space-y-4" role="list" aria-label="Yrken" aria-live="polite">
        {filteredOccupations.map((occupation) => (
          <Card key={occupation.id} className="p-6 hover:shadow-lg transition-shadow bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700" role="listitem">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{occupation.title}</h3>
                  <span className={cn('px-3 py-1 rounded-full text-sm font-medium', getMatchColor(occupation.match))}>
                    {occupation.match}% match
                  </span>
                </div>

                {/* Match Score Bar */}
                <div className="mb-3 w-full max-w-xs">
                  <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all',
                        occupation.match >= 90 ? 'bg-emerald-500' :
                        occupation.match >= 80 ? 'bg-teal-500' :
                        occupation.match >= 70 ? 'bg-amber-500' : 'bg-stone-400'
                      )}
                      style={{ width: `${occupation.match}%` }}
                    />
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-4">{occupation.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-stone-50 dark:bg-stone-700 p-3 rounded-lg">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 font-medium mb-1">
                      <DollarSign className="w-4 h-4" />
                      {t('career.explore.salary') || 'Lön'}
                    </div>
                    <div className="text-gray-800 dark:text-gray-100 font-semibold">{occupation.salary}</div>
                  </div>

                  <div className="bg-stone-50 dark:bg-stone-700 p-3 rounded-lg">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 font-medium mb-1">
                      <TrendingUp className="w-4 h-4" />
                      {t('career.explore.demandLabel') || 'Efterfrågan'}
                    </div>
                    <div className="text-gray-800 dark:text-gray-100 font-semibold">{getDemandIcon(occupation.demand)} {occupation.demand}</div>
                  </div>

                  <div className="bg-stone-50 dark:bg-stone-700 p-3 rounded-lg">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 font-medium mb-1">
                      <GraduationCap className="w-4 h-4" />
                      {t('career.explore.education') || 'Utbildning'}
                    </div>
                    <div className="text-gray-800 dark:text-gray-100 font-semibold text-xs">{occupation.education}</div>
                  </div>

                  <div className="bg-stone-50 dark:bg-stone-700 p-3 rounded-lg">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 font-medium mb-1">
                      <Briefcase className="w-4 h-4" />
                      {t('career.explore.category') || 'Kategori'}
                    </div>
                    <div className="text-gray-800 dark:text-gray-100 font-semibold text-xs">{occupation.categoryLabel}</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 min-w-fit">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleFavorite(occupation.id)}
                  disabled={savingFavorite === occupation.id}
                  className={cn(
                    'flex items-center gap-1',
                    favorites.has(occupation.id) && 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                  )}
                  aria-pressed={favorites.has(occupation.id)}
                  aria-label={favorites.has(occupation.id) ? `Ta bort ${occupation.title} från favoriter` : `Lägg till ${occupation.title} i favoriter`}
                >
                  {savingFavorite === occupation.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Heart className={cn('w-4 h-4', favorites.has(occupation.id) && 'fill-current')} aria-hidden="true" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleComparison(occupation.id)}
                  disabled={!comparison.has(occupation.id) && comparison.size >= 3}
                  className={cn(
                    'flex items-center gap-1',
                    comparison.has(occupation.id) && 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800'
                  )}
                  aria-pressed={comparison.has(occupation.id)}
                  aria-label={comparison.has(occupation.id) ? `Ta bort ${occupation.title} från jämförelse` : `Lägg till ${occupation.title} i jämförelse`}
                >
                  <Share2 className={cn('w-4 h-4', comparison.has(occupation.id) && 'text-teal-600 dark:text-teal-400')} aria-hidden="true" />
                </Button>

                <Button
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  {t('career.explore.readMore') || 'Läs mer'}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      )}

      {!isLoadingOccupations && !isSearching && filteredOccupations.length === 0 && (
        <div className="text-center py-12">
          <Compass className="w-16 h-16 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('career.explore.noOccupationsFound') || 'Inga yrken hittades'}</h3>
          <p className="text-gray-600 dark:text-gray-400">{t('career.explore.tryDifferentSearch') || 'Försök med en annan sökning'}</p>
        </div>
      )}

      {/* Education Path Panel - Shows when user has selected a favorite occupation */}
      {selectedOccupation && (
        <EducationPathPanel targetOccupation={selectedOccupation.title} />
      )}
    </div>
  )
}
