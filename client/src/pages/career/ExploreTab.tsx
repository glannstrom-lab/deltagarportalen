/**
 * Explore Tab - Explore occupations (existing content)
 */
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search, Compass, Briefcase, GraduationCap, DollarSign,
  TrendingUp, MapPin, Clock, Star, Filter, ChevronRight
} from 'lucide-react'
import { Card, Button, Input } from '@/components/ui'

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

export default function ExploreTab() {
  const { t, i18n } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

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
    title: o.titleKey, // Title stays same (proper noun)
    category: o.categoryKey,
    categoryLabel: t(`career.explore.categories.${o.categoryKey}`),
    salary: o.salary,
    demand: demandLabels[o.demandKey as keyof typeof demandLabels],
    education: educationLabels[o.educationKey as keyof typeof educationLabels],
    match: o.match,
    description: occupationTexts[o.descriptionKey as keyof typeof occupationTexts]
  })), [t, demandLabels, educationLabels, occupationTexts])

  const filteredOccupations = occupations.filter(occ => {
    const matchesSearch = occ.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || occ.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            placeholder={t('career.explore.searchPlaceholder')}
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
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              selectedCategory === category.key
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Occupations */}
      <div className="space-y-4">
        {filteredOccupations.map((occupation) => (
          <Card key={occupation.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-slate-800">{occupation.title}</h3>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                    {occupation.match}% match
                  </span>
                </div>
                <p className="text-slate-600 mb-4">{occupation.description}</p>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1 text-slate-600">
                    <DollarSign className="w-4 h-4" />
                    {occupation.salary}
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <TrendingUp className="w-4 h-4" />
                    {t('career.explore.demand')}: {occupation.demand}
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <GraduationCap className="w-4 h-4" />
                    {occupation.education}
                  </div>
                </div>
              </div>

              <Button variant="outline" className="flex items-center gap-1">
                {t('career.explore.readMore')}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredOccupations.length === 0 && (
        <div className="text-center py-12">
          <Compass className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">{t('career.explore.noOccupationsFound')}</h3>
          <p className="text-slate-500">{t('career.explore.tryDifferentSearch')}</p>
        </div>
      )}
    </div>
  )
}
