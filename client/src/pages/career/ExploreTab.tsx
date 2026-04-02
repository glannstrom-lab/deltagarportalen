/**
 * Explore Tab - Explore occupations with enhanced interactivity
 */
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search, Compass, Briefcase, GraduationCap, DollarSign,
  TrendingUp, MapPin, Clock, Star, Filter, ChevronRight,
  Heart, Share2, X, Eye
} from '@/components/ui/icons'
import { Card, Button, Input } from '@/components/ui'
import { cn } from '@/lib/utils'

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
  const [comparison, setComparison] = useState<Set<string>>(new Set())
  const [showComparison, setShowComparison] = useState(false)

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

  const toggleFavorite = (id: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(id)) {
      newFavorites.delete(id)
    } else {
      newFavorites.add(id)
    }
    setFavorites(newFavorites)
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

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            placeholder={t('career.explore.searchPlaceholder') || 'Sök efter yrken...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 text-lg"
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
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-sm font-medium"
        >
          <Filter className="w-4 h-4" />
          Filtrera
        </button>
        {comparison.size > 0 && (
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            Jämför ({comparison.size}/3)
          </button>
        )}
      </div>

      {/* Salary Filter */}
      {showFilters && (
        <Card className="p-4 bg-slate-50">
          <h4 className="font-semibold text-slate-800 mb-3 text-sm">Löneintervall</h4>
          <div className="flex flex-wrap gap-2">
            {salaryRanges.map((range) => (
              <button
                key={range.key}
                onClick={() => setSelectedSalaryRange(range.key)}
                className={cn(
                  'px-3 py-1 rounded-full text-sm transition-all',
                  selectedSalaryRange === range.key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
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
        <Card className="p-4 bg-indigo-50 border-2 border-indigo-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-indigo-900">Jämförelse ({comparedOccupations.length})</h3>
            <button onClick={() => setShowComparison(false)} className="text-indigo-600 hover:text-indigo-700">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {comparedOccupations.map((occ) => (
              <div key={occ.id} className="bg-white rounded-lg p-3 border border-indigo-200">
                <h4 className="font-semibold text-slate-800 text-sm">{occ.title}</h4>
                <div className="mt-2 space-y-1 text-xs text-slate-600">
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
          <Card key={occupation.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <h3 className="text-xl font-bold text-slate-800">{occupation.title}</h3>
                  <span className={cn('px-3 py-1 rounded-full text-sm font-medium', getMatchColor(occupation.match))}>
                    {occupation.match}% match
                  </span>
                </div>

                {/* Match Score Bar */}
                <div className="mb-3 w-full max-w-xs">
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all',
                        occupation.match >= 90 ? 'bg-emerald-500' :
                        occupation.match >= 80 ? 'bg-blue-500' :
                        occupation.match >= 70 ? 'bg-amber-500' : 'bg-slate-400'
                      )}
                      style={{ width: `${occupation.match}%` }}
                    />
                  </div>
                </div>

                <p className="text-slate-600 mb-4">{occupation.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="flex items-center gap-1 text-slate-600 font-medium mb-1">
                      <DollarSign className="w-4 h-4" />
                      Lön
                    </div>
                    <div className="text-slate-800 font-semibold">{occupation.salary}</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="flex items-center gap-1 text-slate-600 font-medium mb-1">
                      <TrendingUp className="w-4 h-4" />
                      Efterfrågan
                    </div>
                    <div className="text-slate-800 font-semibold">{getDemandIcon(occupation.demand)} {occupation.demand}</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="flex items-center gap-1 text-slate-600 font-medium mb-1">
                      <GraduationCap className="w-4 h-4" />
                      Utbildning
                    </div>
                    <div className="text-slate-800 font-semibold text-xs">{occupation.education}</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="flex items-center gap-1 text-slate-600 font-medium mb-1">
                      <Briefcase className="w-4 h-4" />
                      Kategori
                    </div>
                    <div className="text-slate-800 font-semibold text-xs">{occupation.categoryLabel}</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 min-w-fit">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleFavorite(occupation.id)}
                  className={cn(
                    'flex items-center gap-1',
                    favorites.has(occupation.id) && 'bg-red-50 text-red-600 border-red-200'
                  )}
                >
                  <Heart className={cn('w-4 h-4', favorites.has(occupation.id) && 'fill-current')} />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleComparison(occupation.id)}
                  disabled={!comparison.has(occupation.id) && comparison.size >= 3}
                  className={cn(
                    'flex items-center gap-1',
                    comparison.has(occupation.id) && 'bg-indigo-50 text-indigo-600 border-indigo-200'
                  )}
                >
                  <Share2 className={cn('w-4 h-4', comparison.has(occupation.id) && 'text-indigo-600')} />
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
          <Compass className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">{t('career.explore.noOccupationsFound') || 'Inga yrken hittades'}</h3>
          <p className="text-slate-500">{t('career.explore.tryDifferentSearch') || 'Försök med en annan sökning'}</p>
        </div>
      )}
    </div>
  )
}
