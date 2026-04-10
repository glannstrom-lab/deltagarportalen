/**
 * Companies Tab - Explore employers and companies
 */
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Building2, Search, MapPin, Star, Heart, ExternalLink,
  TrendingUp, Users, Briefcase, ChevronRight, Filter
} from '@/components/ui/icons'
import { Card, Button, Input } from '@/components/ui'

interface Company {
  id: string
  name: string
  industryKey: string
  locationKey: string
  employees: string
  rating: number
  reviews: number
  openPositions: number
  descriptionKey: string
  benefitKeys: string[]
  isFollowing: boolean
}

// Company definitions - in real app this would come from API
const companyDefs: Company[] = [
  {
    id: '1',
    name: 'Tech Solutions AB',
    industryKey: 'it',
    locationKey: 'stockholm',
    employees: '50-200',
    rating: 4.5,
    reviews: 23,
    openPositions: 5,
    descriptionKey: 'techDesc',
    benefitKeys: ['flextime', 'remote', 'development'],
    isFollowing: false,
  },
  {
    id: '2',
    name: 'Nordic Care',
    industryKey: 'healthcare',
    locationKey: 'gothenburg',
    employees: '200-500',
    rating: 4.2,
    reviews: 45,
    openPositions: 12,
    descriptionKey: 'careDesc',
    benefitKeys: ['pension', 'wellness', 'career'],
    isFollowing: true,
  },
  {
    id: '3',
    name: 'Green Energy Sweden',
    industryKey: 'energy',
    locationKey: 'malmo',
    employees: '100-200',
    rating: 4.7,
    reviews: 18,
    openPositions: 3,
    descriptionKey: 'energyDesc',
    benefitKeys: ['electricCar', 'sustainabilityBonus', 'travel'],
    isFollowing: false,
  },
]

const industryKeys = ['all', 'it', 'healthcare', 'energy', 'retail', 'manufacturing'] as const
const locationKeys = ['all', 'stockholm', 'gothenburg', 'malmo', 'uppsala', 'remote'] as const

export default function CompaniesTab() {
  const { t, i18n } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [following, setFollowing] = useState<string[]>(['2'])

  // Build translated industries and locations
  const industries = useMemo(() => industryKeys.map(key => ({
    key,
    label: t(`career.companies.industries.${key}`)
  })), [t])

  const locations = useMemo(() => locationKeys.map(key => ({
    key,
    label: t(`career.companies.locations.${key}`)
  })), [t])

  // Company descriptions (mock - would come from API)
  const companyDescriptions = useMemo(() => ({
    techDesc: i18n.language === 'en' ? 'A fast-growing tech company developing innovative solutions for customers worldwide.' : 'Ett snabbväxande tech-företag som utvecklar innovativa lösningar för kunder världen över.',
    careDesc: i18n.language === 'en' ? 'Leading healthcare company focused on person-centered care and work environment.' : 'Ledande vårdföretag med fokus på personcentrerad vård och arbetsmiljö.',
    energyDesc: i18n.language === 'en' ? 'Sustainable energy solutions for a greener future.' : 'Hållbara energilösningar för en grönare framtid.'
  }), [i18n.language])

  // Benefit translations
  const benefitLabels = useMemo(() => ({
    flextime: i18n.language === 'en' ? 'Flextime' : 'Flextid',
    remote: i18n.language === 'en' ? 'Remote work' : 'Distansarbete',
    development: i18n.language === 'en' ? 'Professional development' : 'Kompetensutveckling',
    pension: i18n.language === 'en' ? 'Favorable pension' : 'Förmånlig pension',
    wellness: i18n.language === 'en' ? 'Wellness benefits' : 'Friskvård',
    career: i18n.language === 'en' ? 'Career paths' : 'Karriärvägar',
    electricCar: i18n.language === 'en' ? 'Electric company car' : 'Elbil som tjänstebil',
    sustainabilityBonus: i18n.language === 'en' ? 'Sustainability bonus' : 'Hållbarhetsbonus',
    travel: i18n.language === 'en' ? 'International travel' : 'Utlandsresor'
  }), [i18n.language])

  // Build translated companies
  const companies = useMemo(() => companyDefs.map(c => ({
    ...c,
    industry: t(`career.companies.industries.${c.industryKey}`),
    location: t(`career.companies.locations.${c.locationKey}`),
    description: companyDescriptions[c.descriptionKey as keyof typeof companyDescriptions],
    benefits: c.benefitKeys.map(key => benefitLabels[key as keyof typeof benefitLabels])
  })), [t, companyDescriptions, benefitLabels])

  const toggleFollow = (id: string) => {
    setFollowing(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesIndustry = selectedIndustry === 'all' || company.industryKey === selectedIndustry
    const matchesLocation = selectedLocation === 'all' || company.locationKey === selectedLocation
    return matchesSearch && matchesIndustry && matchesLocation
  })

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder={t('career.companies.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 text-lg bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('career.companies.industry')}:</span>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="px-3 py-2 rounded-lg border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 text-sm text-gray-800 dark:text-gray-100"
            >
              {industries.map(i => <option key={i.key} value={i.key}>{i.label}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('career.companies.location')}:</span>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 rounded-lg border bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 text-sm text-gray-800 dark:text-gray-100"
            >
              {locations.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Following Summary */}
      {following.length > 0 && (
        <Card className="p-6 bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-teal-900 dark:text-teal-100">{t('career.companies.youFollow', { count: following.length })}</h3>
              <p className="text-sm text-teal-700 dark:text-teal-300">{t('career.companies.getNotifications')}</p>
            </div>
            <Button variant="outline" className="border-teal-300 dark:border-teal-600">
              <Heart className="w-4 h-4 mr-1" />
              {t('career.companies.seeFollowed')}
            </Button>
          </div>
        </Card>
      )}

      {/* Companies List */}
      <div className="space-y-4">
        {filteredCompanies.map((company) => (
          <Card key={company.id} className="p-6 hover:shadow-lg transition-shadow bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-stone-100 dark:bg-stone-700 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-8 h-8 text-gray-500 dark:text-gray-400" />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{company.name}</h3>
                    <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {company.industry}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {company.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {company.employees} {t('career.companies.employees')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFollow(company.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        following.includes(company.id)
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : 'bg-stone-100 dark:bg-stone-700 text-gray-600 dark:text-gray-400 hover:bg-stone-200 dark:hover:bg-stone-600'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${following.includes(company.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mt-3">{company.description}</p>

                {/* Rating and Stats */}
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="font-semibold text-gray-800 dark:text-gray-100">{company.rating}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">({company.reviews} {t('career.companies.reviews')})</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium">{company.openPositions} {t('career.companies.openPositions')}</span>
                  </div>
                </div>

                {/* Benefits */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {company.benefits.map((benefit, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full text-sm"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" size="sm">
                    <Briefcase className="w-4 h-4 mr-1" />
                    {t('career.companies.viewJobs')}
                  </Button>
                  <Button variant="ghost" size="sm">
                    {t('career.companies.readMore')}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('career.companies.noCompaniesFound')}</h3>
          <p className="text-gray-600 dark:text-gray-400">{t('career.companies.tryDifferentFilters')}</p>
        </div>
      )}

      {/* Tips */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">{t('career.companies.tips.title')}</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li>- {t('career.companies.tips.tip1')}</li>
          <li>- {t('career.companies.tips.tip2')}</li>
          <li>- {t('career.companies.tips.tip3')}</li>
          <li>- {t('career.companies.tips.tip4')}</li>
        </ul>
      </Card>
    </div>
  )
}
