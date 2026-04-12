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
import { cn } from '@/lib/utils'
import { favoriteOccupationsApi, type FavoriteOccupation } from '@/services/careerApi'

// Occupation definitions with i18n - these would typically come from an API
const occupationDefs = [
  {
    id: '1',
    titleKey: 'Systemutvecklare',
    categoryKey: 'it',
    salary: '45 000 - 65 000 kr',
    demandKey: 'high',
    educationKey: 'university',
    match: 95,
    descriptionKey: 'developerDesc'
  },
  {
    id: '2',
    titleKey: 'Projektledare',
    categoryKey: 'administration',
    salary: '40 000 - 60 000 kr',
    demandKey: 'medium',
    educationKey: 'university',
    match: 88,
    descriptionKey: 'pmDesc'
  },
  {
    id: '3',
    titleKey: 'Sjuksköterska',
    categoryKey: 'healthcare',
    salary: '35 000 - 50 000 kr',
    demandKey: 'veryHigh',
    educationKey: 'university',
    match: 82,
    descriptionKey: 'nurseDesc'
  },
  {
    id: '4',
    titleKey: 'Ekonomiassistent',
    categoryKey: 'economy',
    salary: '30 000 - 40 000 kr',
    demandKey: 'medium',
    educationKey: 'vocational',
    match: 78,
    descriptionKey: 'accountantDesc'
  },
]

const categoryKeys = ['all', 'it', 'healthcare', 'economy', 'administration', 'construction', 'education'] as const

const salaryRanges = [
  { key: 'all', label: 'Alla löneintervall', minSalary: 0, maxSalary: Infinity },
  { key: '0-35k', label: '0 - 35 000 kr', minSalary: 0, maxSalary: 35000 },
  { key: '35-50k', label: '35 000 - 50 000 kr', minSalary: 35000, maxSalary: 50000 },
  { key: '50k+', label: '50 000+ kr', minSalary: 50000, maxSalary: Infinity },
] as const

export default function ExploreTab() {
  const { t, i18n } = useTranslation()
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

  // Demand labels
  const demandLabels = useMemo(() => ({
    veryHigh: i18n.language === 'en' ? 'Very High' : 'Mycket hög',
    high: i18n.language === 'en' ? 'High' : 'Hög',
    medium: i18n.language === 'en' ? 'Medium' : 'Medel',
    low: i18n.language === 'en' ? 'Low' : 'Låg'
  }), [i18n.language])

  // Education labels
  const educationLabels = useMemo(() => ({
    university: i18n.language === 'en' ? 'University degree' : 'Högskoleutbildning',
    vocational: i18n.language === 'en' ? 'Vocational/High school' : 'Gymnasium/Yrkeshögskola'
  }), [i18n.language])

  // Occupation titles/descriptions (mock data - in real app these come from API)
  const occupationTexts = useMemo(() => ({
    developerDesc: i18n.language === 'en' ? 'Develops and maintains software systems.' : 'Utvecklar och underhåller programvarusystem.',
    pmDesc: i18n.language === 'en' ? 'Leads and coordinates projects from start to finish.' : 'Leder och koordinerar projekt från start till mål.',
    nurseDesc: i18n.language === 'en' ? 'Provides care and treatment to patients.' : 'Ger omvårdnad och behandling till patienter.',
    accountantDesc: i18n.language === 'en' ? 'Handles invoicing, accounting and financial administration.' : 'Hanterar fakturering, bokföring och ekonomiadministration.'
  }), [i18n.language])

  // Build translated occupations
  const occupations = useMemo(() => occupationDefs.map(o => ({
    id: o.id,
    title: o.titleKey,
    category: o.categoryKey,
    categoryLabel: t(`career.explore.categories.${o.categoryKey}`),
    salary: o.salary,
    demand: demandLabels[o.demandKey as keyof typeof demandLabels],
    education: educationLabels[o.educationKey as keyof typeof educationLabels],
    match: o.match,
    description: occupationTexts[o.descriptionKey as keyof typeof occupationTexts]
  })), [t, demandLabels, educationLabels, occupationTexts])

  // Parse salary from string "X - Y kr"
  const parseSalary = (salaryStr: string): number => {
    const match = salaryStr.match(/(\d+)\s*000/)
    return match ? parseInt(match[1]) * 1000 : 0
  }

  const filteredOccupations = occupations.filter(occ => {
    const matchesSearch = occ.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || occ.category === selectedCategory

    const salaryRange = salaryRanges.find(r => r.key === selectedSalaryRange)!
    const occSalary = parseSalary(occ.salary)
    const matchesSalary = occSalary >= salaryRange.minSalary && occSalary <= salaryRange.maxSalary

    return matchesSearch && matchesCategory && matchesSalary
  })

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
    if (match >= 90) return 'text-emerald-600 bg-emerald-50'
    if (match >= 80) return 'text-blue-600 bg-blue-50'
    if (match >= 70) return 'text-amber-600 bg-amber-50'
    return 'text-slate-600 bg-slate-50'
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

  return (
    <div className="space-y-6">
      {/* Industry Radar */}
      <IndustryRadarSection />

      {/* Search */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder={t('career.explore.searchPlaceholder') || 'Sök efter yrken...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 text-lg bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600"
          />
        </div>
      </Card>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
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
          Filtrera
        </button>
        {comparison.size > 0 && (
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            Jämför ({comparison.size}/3)
          </button>
        )}
      </div>

      {/* Salary Filter */}
      {showFilters && (
        <Card className="p-4 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 text-sm">Löneintervall</h4>
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
            <h3 className="font-semibold text-teal-900 dark:text-teal-100">Jämförelse ({comparedOccupations.length})</h3>
            <button onClick={() => setShowComparison(false)} className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {comparedOccupations.map((occ) => (
              <div key={occ.id} className="bg-white dark:bg-stone-800 rounded-lg p-3 border border-teal-200 dark:border-teal-700">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{occ.title}</h4>
                <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <p><strong>Match:</strong> {occ.match}%</p>
                  <p><strong>Lön:</strong> {occ.salary}</p>
                  <p><strong>Efterfrågan:</strong> {occ.demand}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Occupations */}
      <div className="space-y-4">
        {filteredOccupations.map((occupation) => (
          <Card key={occupation.id} className="p-6 hover:shadow-lg transition-shadow bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
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
                      Lön
                    </div>
                    <div className="text-gray-800 dark:text-gray-100 font-semibold">{occupation.salary}</div>
                  </div>

                  <div className="bg-stone-50 dark:bg-stone-700 p-3 rounded-lg">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 font-medium mb-1">
                      <TrendingUp className="w-4 h-4" />
                      Efterfrågan
                    </div>
                    <div className="text-gray-800 dark:text-gray-100 font-semibold">{getDemandIcon(occupation.demand)} {occupation.demand}</div>
                  </div>

                  <div className="bg-stone-50 dark:bg-stone-700 p-3 rounded-lg">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 font-medium mb-1">
                      <GraduationCap className="w-4 h-4" />
                      Utbildning
                    </div>
                    <div className="text-gray-800 dark:text-gray-100 font-semibold text-xs">{occupation.education}</div>
                  </div>

                  <div className="bg-stone-50 dark:bg-stone-700 p-3 rounded-lg">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 font-medium mb-1">
                      <Briefcase className="w-4 h-4" />
                      Kategori
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
                >
                  {savingFavorite === occupation.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Heart className={cn('w-4 h-4', favorites.has(occupation.id) && 'fill-current')} />
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
                >
                  <Share2 className={cn('w-4 h-4', comparison.has(occupation.id) && 'text-teal-600 dark:text-teal-400')} />
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

      {filteredOccupations.length === 0 && (
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
