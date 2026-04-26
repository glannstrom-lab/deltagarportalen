import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search, MapPin, Sliders, X, Building2, Briefcase,
  Clock, GraduationCap, Wallet, Car, Home, Filter,
  ChevronDown, ChevronUp, RotateCcw, MapPinned
} from '@/components/ui/icons'

export interface JobFilterState {
  search: string
  location: string
  region: string
  employmentType: string[]
  experienceLevel: string[]
  publishedWithin: 'today' | 'week' | 'month' | 'all'
  minMatchPercentage: number
  // Nya filter
  workArrangement: ('remote' | 'hybrid' | 'onsite')[]
  salaryMin: number
  salaryMax: number
  drivingLicense: boolean
  distanceKm: number // Avstånd från ort
  language: string[]
}

interface JobFiltersProps {
  filters: JobFilterState
  onChange: (filters: JobFilterState) => void
  jobCount?: number
  totalJobs?: number
}

// Swedish regions don't need translation - they're proper nouns
const swedishRegions = [
  'Stockholms län', 'Uppsala län', 'Södermanlands län', 'Östergötlands län',
  'Jönköpings län', 'Kronobergs län', 'Kalmar län', 'Gotlands län',
  'Blekinge län', 'Skåne län', 'Hallands län', 'Västra Götalands län',
  'Värmlands län', 'Örebro län', 'Västmanlands län', 'Dalarnas län',
  'Gävleborgs län', 'Västernorrlands län', 'Jämtlands län',
  'Västerbottens län', 'Norrbottens län'
]

export function JobFilters({ filters, onChange, jobCount = 0, totalJobs = 0 }: JobFiltersProps) {
  const { t } = useTranslation()
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic'])
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Translated employment types
  const employmentTypes = [
    { id: 'Heltid', labelKey: 'jobs.filters.employmentTypes.fullTime', icon: Clock },
    { id: 'Deltid', labelKey: 'jobs.filters.employmentTypes.partTime', icon: Clock },
    { id: 'Tillsvidare', labelKey: 'jobs.filters.employmentTypes.permanent', icon: Building2 },
    { id: 'Projekt', labelKey: 'jobs.filters.employmentTypes.project', icon: Briefcase },
    { id: 'Sommarjobb', labelKey: 'jobs.filters.employmentTypes.summer', icon: Briefcase },
    { id: 'Praktik', labelKey: 'jobs.filters.employmentTypes.internship', icon: GraduationCap },
  ]

  // Translated experience levels
  const experienceLevels = [
    { id: 'Ingen erfarenhet', labelKey: 'jobs.filters.experienceLevels.none', color: 'green' },
    { id: 'Erfaren', labelKey: 'jobs.filters.experienceLevels.experienced', color: 'yellow' },
    { id: 'Mycket erfaren', labelKey: 'jobs.filters.experienceLevels.senior', color: 'orange' },
  ]

  // Translated work arrangements
  const workArrangements = [
    { id: 'remote', labelKey: 'jobs.filters.workArrangements.remote', icon: Home, descKey: 'jobs.filters.workArrangements.remoteDesc' },
    { id: 'hybrid', labelKey: 'jobs.filters.workArrangements.hybrid', icon: Building2, descKey: 'jobs.filters.workArrangements.hybridDesc' },
    { id: 'onsite', labelKey: 'jobs.filters.workArrangements.onsite', icon: MapPin, descKey: 'jobs.filters.workArrangements.onsiteDesc' },
  ]

  // Translated languages
  const languages = [
    { id: 'svenska', labelKey: 'jobs.filters.languages.swedish' },
    { id: 'engelska', labelKey: 'jobs.filters.languages.english' },
    { id: 'norska', labelKey: 'jobs.filters.languages.norwegian' },
    { id: 'danska', labelKey: 'jobs.filters.languages.danish' },
  ]

  const updateFilter = <K extends keyof JobFilterState>(key: K, value: JobFilterState[K]) => {
    onChange({ ...filters, [key]: value })
  }

  const toggleArrayFilter = (key: 'employmentType' | 'experienceLevel' | 'workArrangement' | 'language', value: string) => {
    const current = filters[key] as string[]
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value]
    updateFilter(key, updated as any)
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const clearAllFilters = () => {
    onChange({
      search: '',
      location: '',
      region: '',
      employmentType: [],
      experienceLevel: [],
      publishedWithin: 'all',
      minMatchPercentage: 0,
      workArrangement: [],
      salaryMin: 0,
      salaryMax: 0,
      drivingLicense: false,
      distanceKm: 50,
      language: [],
    })
  }

  const hasActiveFilters = 
    filters.location || 
    filters.region ||
    filters.employmentType.length > 0 || 
    filters.experienceLevel.length > 0 ||
    filters.publishedWithin !== 'all' ||
    filters.minMatchPercentage > 0 ||
    filters.workArrangement.length > 0 ||
    filters.drivingLicense ||
    filters.language.length > 0

  const activeFilterCount = [
    filters.location,
    filters.region,
    ...filters.employmentType,
    ...filters.experienceLevel,
    filters.publishedWithin !== 'all' ? 'datum' : null,
    filters.minMatchPercentage > 0 ? 'match' : null,
    ...filters.workArrangement,
    filters.drivingLicense ? 'körkort' : null,
    ...filters.language,
  ].filter(Boolean).length

  const FilterSection = ({
    title,
    section,
    children,
    icon: Icon
  }: {
    title: string
    section: string
    children: React.ReactNode
    icon?: React.ElementType
  }) => {
    const isExpanded = expandedSections.includes(section)
    const sectionId = `filter-${section}`
    return (
      <div className="border-b border-slate-100 dark:border-stone-700 last:border-0">
        <button
          onClick={() => toggleSection(section)}
          aria-expanded={isExpanded}
          aria-controls={`${sectionId}-content`}
          className="w-full flex items-center justify-between py-3 px-1 hover:bg-slate-50 dark:hover:bg-stone-800 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            {Icon && <Icon size={18} className="text-slate-700 dark:text-stone-300" aria-hidden="true" />}
            <span className="font-medium text-slate-700 dark:text-stone-300">{title}</span>
          </div>
          {isExpanded ? <ChevronUp size={18} className="text-slate-600 dark:text-stone-400" aria-hidden="true" /> : <ChevronDown size={18} className="text-slate-600 dark:text-stone-400" aria-hidden="true" />}
        </button>
        {isExpanded && (
          <div id={`${sectionId}-content`} role="region" aria-label={title} className="pb-4 px-1">
            {children}
          </div>
        )}
      </div>
    )
  }

  const FilterContent = () => (
    <>
      {/* Search */}
      <FilterSection title={t('jobs.filters.search')} section="search" icon={Search}>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-stone-400" />
          <input
            type="text"
            placeholder={t('jobs.filters.searchPlaceholder')}
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-transparent text-sm"
          />
        </div>
      </FilterSection>

      {/* Location */}
      <FilterSection title={t('jobs.filters.location')} section="location" icon={MapPinned}>
        <div className="space-y-3">
          {/* Kommun/Ort */}
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-stone-400" />
            <input
              type="text"
              placeholder={t('jobs.filters.locationPlaceholder')}
              value={filters.location}
              onChange={(e) => updateFilter('location', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-700 text-sm"
            />
          </div>

          {/* Avstånd */}
          {filters.location && (
            <div className="bg-brand-50 p-3 rounded-xl">
              <label className="text-sm font-medium text-brand-900 mb-2 block">
                {t('jobs.filters.distance', { km: filters.distanceKm })}
              </label>
              <input
                type="range"
                min="5"
                max="200"
                step="5"
                value={filters.distanceKm}
                onChange={(e) => updateFilter('distanceKm', parseInt(e.target.value))}
                className="w-full accent-brand-900"
              />
              <div className="flex justify-between text-xs text-brand-900 mt-1">
                <span>5 km</span>
                <span>100 km</span>
                <span>200 km</span>
              </div>
            </div>
          )}

          {/* Län */}
          <select
            value={filters.region}
            onChange={(e) => updateFilter('region', e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-700 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
          >
            <option value="">{t('jobs.filters.allRegions')}</option>
            {swedishRegions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
      </FilterSection>

      {/* Published date */}
      <FilterSection title={t('jobs.filters.published')} section="date" icon={Clock}>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'all', labelKey: 'jobs.filters.publishedOptions.anytime' },
            { value: 'today', labelKey: 'jobs.filters.publishedOptions.today' },
            { value: 'week', labelKey: 'jobs.filters.publishedOptions.lastWeek' },
            { value: 'month', labelKey: 'jobs.filters.publishedOptions.lastMonth' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => updateFilter('publishedWithin', option.value as any)}
              className={`px-3 py-2.5 text-sm rounded-xl transition-colors text-left ${
                filters.publishedWithin === option.value
                  ? 'bg-brand-100 text-brand-900 font-medium border-2 border-brand-200'
                  : 'bg-slate-50 dark:bg-stone-800 text-slate-600 dark:text-stone-400 border-2 border-transparent hover:bg-slate-100 dark:hover:bg-stone-700'
              }`}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Work Arrangement */}
      <FilterSection title={t('jobs.filters.workplace')} section="arrangement" icon={Home}>
        <div className="space-y-2">
          {workArrangements.map((type) => (
            <button
              key={type.id}
              onClick={() => toggleArrayFilter('workArrangement', type.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                filters.workArrangement.includes(type.id)
                  ? 'bg-brand-100 text-brand-900 border-2 border-brand-200'
                  : 'bg-slate-50 dark:bg-stone-800 text-slate-600 dark:text-stone-400 border-2 border-transparent hover:bg-slate-100 dark:hover:bg-stone-700'
              }`}
            >
              <type.icon size={18} />
              <div>
                <div className="font-medium text-sm">{t(type.labelKey)}</div>
                <div className="text-xs opacity-70">{t(type.descKey)}</div>
              </div>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Employment type */}
      <FilterSection title={t('jobs.filters.employmentType')} section="employment" icon={Briefcase}>
        <div className="flex flex-wrap gap-2">
          {employmentTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => toggleArrayFilter('employmentType', type.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl transition-colors ${
                filters.employmentType.includes(type.id)
                  ? 'bg-brand-900 text-white'
                  : 'bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-stone-400 hover:bg-slate-200 dark:hover:bg-stone-700'
              }`}
            >
              <type.icon size={14} />
              {t(type.labelKey)}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Experience level */}
      <FilterSection title={t('jobs.filters.experienceLevel')} section="experience" icon={GraduationCap}>
        <div className="space-y-2">
          {experienceLevels.map((level) => (
            <button
              key={level.id}
              onClick={() => toggleArrayFilter('experienceLevel', level.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors text-left ${
                filters.experienceLevel.includes(level.id)
                  ? `bg-${level.color}-100 text-${level.color}-700 border-2 border-${level.color}-200`
                  : 'bg-slate-50 dark:bg-stone-800 text-slate-600 dark:text-stone-400 border-2 border-transparent hover:bg-slate-100 dark:hover:bg-stone-700'
              }`}
            >
              <span className="font-medium text-sm">{t(level.labelKey)}</span>
              {filters.experienceLevel.includes(level.id) && (
                <div className={`w-2 h-2 rounded-full bg-${level.color}-500`} />
              )}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Salary */}
      <FilterSection title={t('jobs.filters.salary')} section="salary" icon={Wallet}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder={t('jobs.filters.salaryMin')}
              value={filters.salaryMin || ''}
              onChange={(e) => updateFilter('salaryMin', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl text-sm"
            />
            <span className="text-slate-600 dark:text-stone-400">-</span>
            <input
              type="number"
              placeholder={t('jobs.filters.salaryMax')}
              value={filters.salaryMax || ''}
              onChange={(e) => updateFilter('salaryMax', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl text-sm"
            />
          </div>
          <p className="text-xs text-slate-700 dark:text-stone-300">{t('jobs.filters.salaryHint')}</p>
        </div>
      </FilterSection>

      {/* Language */}
      <FilterSection title={t('jobs.filters.language')} section="language" icon={Sliders}>
        <div className="flex flex-wrap gap-2">
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => toggleArrayFilter('language', lang.id)}
              className={`px-3 py-2 text-sm rounded-xl transition-colors ${
                filters.language.includes(lang.id)
                  ? 'bg-brand-900 text-white'
                  : 'bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-stone-400 hover:bg-slate-200 dark:hover:bg-stone-700'
              }`}
            >
              {t(lang.labelKey)}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Driving License */}
      <FilterSection title={t('jobs.filters.other')} section="other" icon={Car}>
        <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-stone-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-stone-700 transition-colors">
          <input
            type="checkbox"
            checked={filters.drivingLicense}
            onChange={(e) => updateFilter('drivingLicense', e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 dark:border-stone-600 text-brand-900 focus:ring-brand-700"
          />
          <div>
            <div className="font-medium text-sm text-slate-700 dark:text-stone-300">{t('jobs.filters.drivingLicenseRequired')}</div>
            <div className="text-xs text-slate-700 dark:text-stone-400">{t('jobs.filters.drivingLicenseHint')}</div>
          </div>
        </label>
      </FilterSection>

      {/* Match percentage */}
      <FilterSection title={t('jobs.filters.cvMatch')} section="match" icon={Sliders}>
        <div className="bg-gradient-to-r from-brand-50 to-sky-50 p-4 rounded-xl">
          <label className="text-sm font-medium text-brand-900 mb-3 block">
            {t('jobs.filters.minMatch', { percent: filters.minMatchPercentage })}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={filters.minMatchPercentage}
            onChange={(e) => updateFilter('minMatchPercentage', parseInt(e.target.value))}
            className="w-full accent-brand-900"
          />
          <div className="flex justify-between text-xs text-brand-900 mt-2">
            <span>{t('jobs.filters.noMin')}</span>
            <span>50%</span>
            <span>{t('jobs.filters.perfectMatch')}</span>
          </div>
        </div>
      </FilterSection>
    </>
  )

  return (
    <>
      {/* Desktop filter panel */}
      <div className="hidden lg:block bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-stone-700">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-brand-900" />
            <h3 className="font-semibold text-slate-800 dark:text-stone-100">{t('jobs.filters.title')}</h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium"
            >
              <RotateCcw size={12} />
              {t('jobs.filters.clearAll')}
            </button>
          )}
        </div>

        {/* Filter sections */}
        <div className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
          <FilterContent />
        </div>

        {/* Footer with count */}
        <div className="p-4 border-t border-slate-100 dark:border-stone-700 bg-slate-50 dark:bg-stone-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-stone-400">
              {t('jobs.filters.showing', { count: jobCount })}
            </span>
            {totalJobs > jobCount && (
              <span className="text-xs text-slate-700 dark:text-stone-300">
                {t('jobs.filters.ofTotal', { total: totalJobs })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter button */}
      <div className="lg:hidden">
        <button
          onClick={() => setShowMobileFilters(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-700 rounded-xl text-slate-700 dark:text-stone-300 font-medium"
        >
          <Filter size={18} />
          {t('jobs.filters.title')}
          {activeFilterCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-brand-900 text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Mobile filter modal */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowMobileFilters(false)}
            />
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-stone-900 overflow-hidden flex flex-col">
              {/* Mobile header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-stone-700 bg-white dark:bg-stone-900">
                <h3 className="font-semibold text-slate-800 dark:text-stone-100">{t('jobs.filters.filterJobs')}</h3>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-stone-800 rounded-lg"
                >
                  <X size={20} className="text-slate-700 dark:text-stone-300" />
                </button>
              </div>

              {/* Mobile filter content */}
              <div className="flex-1 overflow-y-auto p-4">
                <FilterContent />
              </div>

              {/* Mobile footer */}
              <div className="p-4 border-t border-slate-100 dark:border-stone-700 bg-slate-50 dark:bg-stone-800 flex gap-3">
                <button
                  onClick={clearAllFilters}
                  className="flex-1 px-4 py-3 border border-slate-200 dark:border-stone-700 rounded-xl text-slate-700 dark:text-stone-300 font-medium"
                >
                  {t('jobs.filters.clear')}
                </button>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1 px-4 py-3 bg-brand-900 text-white rounded-xl font-medium"
                >
                  {t('jobs.filters.showJobs', { count: jobCount })}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
