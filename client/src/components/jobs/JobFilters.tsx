import { useState, useEffect } from 'react'
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

const employmentTypes = [
  { id: 'Heltid', label: 'Heltid', icon: Clock },
  { id: 'Deltid', label: 'Deltit', icon: Clock },
  { id: 'Tillsvidare', label: 'Tillsvidare', icon: Building2 },
  { id: 'Projekt', label: 'Projekt / Visstid', icon: Briefcase },
  { id: 'Sommarjobb', label: 'Sommarjobb', icon: Briefcase },
  { id: 'Praktik', label: 'Praktik', icon: GraduationCap },
]

const experienceLevels = [
  { id: 'Ingen erfarenhet', label: 'Ingen erfarenhet krävs', color: 'green' },
  { id: 'Erfaren', label: 'Erfarenhet (1-3 år)', color: 'yellow' },
  { id: 'Mycket erfaren', label: 'Senior (5+ år)', color: 'orange' },
]

const workArrangements = [
  { id: 'remote', label: 'Distans', icon: Home, description: 'Jobba hemifrån' },
  { id: 'hybrid', label: 'Hybrid', icon: Building2, description: 'Blandat läge' },
  { id: 'onsite', label: 'På plats', icon: MapPin, description: 'På kontoret' },
]

const swedishRegions = [
  'Stockholms län', 'Uppsala län', 'Södermanlands län', 'Östergötlands län',
  'Jönköpings län', 'Kronobergs län', 'Kalmar län', 'Gotlands län',
  'Blekinge län', 'Skåne län', 'Hallands län', 'Västra Götalands län',
  'Värmlands län', 'Örebro län', 'Västmanlands län', 'Dalarnas län',
  'Gävleborgs län', 'Västernorrlands län', 'Jämtlands län', 
  'Västerbottens län', 'Norrbottens län'
]

const languages = [
  { id: 'svenska', label: 'Svenska' },
  { id: 'engelska', label: 'Engelska' },
  { id: 'norska', label: 'Norska' },
  { id: 'danska', label: 'Danska' },
]

export function JobFilters({ filters, onChange, jobCount = 0, totalJobs = 0 }: JobFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic'])
  const [showMobileFilters, setShowMobileFilters] = useState(false)

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
    return (
      <div className="border-b border-slate-100 last:border-0">
        <button
          onClick={() => toggleSection(section)}
          className="w-full flex items-center justify-between py-3 px-1 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            {Icon && <Icon size={18} className="text-slate-700" />}
            <span className="font-medium text-slate-700">{title}</span>
          </div>
          {isExpanded ? <ChevronUp size={18} className="text-slate-600" /> : <ChevronDown size={18} className="text-slate-600" />}
        </button>
        {isExpanded && (
          <div className="pb-4 px-1">
            {children}
          </div>
        )}
      </div>
    )
  }

  const FilterContent = () => (
    <>
      {/* Search */}
      <FilterSection title="Sökord" section="search" icon={Search}>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            placeholder="Yrke, företag, nyckelord..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
          />
        </div>
      </FilterSection>

      {/* Location */}
      <FilterSection title="Plats" section="location" icon={MapPinned}>
        <div className="space-y-3">
          {/* Kommun/Ort */}
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              placeholder="Skriv ort eller kommun..."
              value={filters.location}
              onChange={(e) => updateFilter('location', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          {/* Avstånd */}
          {filters.location && (
            <div className="bg-teal-50 p-3 rounded-xl">
              <label className="text-sm font-medium text-teal-900 mb-2 block">
                Avstånd: {filters.distanceKm} km
              </label>
              <input
                type="range"
                min="5"
                max="200"
                step="5"
                value={filters.distanceKm}
                onChange={(e) => updateFilter('distanceKm', parseInt(e.target.value))}
                className="w-full accent-teal-600"
              />
              <div className="flex justify-between text-xs text-teal-600 mt-1">
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
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
          >
            <option value="">Alla län</option>
            {swedishRegions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
      </FilterSection>

      {/* Published date */}
      <FilterSection title="Publicerad" section="date" icon={Clock}>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'all', label: 'När som helst' },
            { value: 'today', label: 'Idag' },
            { value: 'week', label: 'Senaste veckan' },
            { value: 'month', label: 'Senaste månaden' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => updateFilter('publishedWithin', option.value as any)}
              className={`px-3 py-2.5 text-sm rounded-xl transition-colors text-left ${
                filters.publishedWithin === option.value
                  ? 'bg-teal-100 text-teal-700 font-medium border-2 border-teal-200'
                  : 'bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-slate-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Work Arrangement */}
      <FilterSection title="Arbetsplats" section="arrangement" icon={Home}>
        <div className="space-y-2">
          {workArrangements.map((type) => (
            <button
              key={type.id}
              onClick={() => toggleArrayFilter('workArrangement', type.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                filters.workArrangement.includes(type.id)
                  ? 'bg-teal-100 text-teal-700 border-2 border-teal-200'
                  : 'bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-slate-100'
              }`}
            >
              <type.icon size={18} />
              <div>
                <div className="font-medium text-sm">{type.label}</div>
                <div className="text-xs opacity-70">{type.description}</div>
              </div>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Employment type */}
      <FilterSection title="Anställningsform" section="employment" icon={Briefcase}>
        <div className="flex flex-wrap gap-2">
          {employmentTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => toggleArrayFilter('employmentType', type.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl transition-colors ${
                filters.employmentType.includes(type.id)
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <type.icon size={14} />
              {type.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Experience level */}
      <FilterSection title="Erfarenhetsnivå" section="experience" icon={GraduationCap}>
        <div className="space-y-2">
          {experienceLevels.map((level) => (
            <button
              key={level.id}
              onClick={() => toggleArrayFilter('experienceLevel', level.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors text-left ${
                filters.experienceLevel.includes(level.id)
                  ? `bg-${level.color}-100 text-${level.color}-700 border-2 border-${level.color}-200`
                  : 'bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-slate-100'
              }`}
            >
              <span className="font-medium text-sm">{level.label}</span>
              {filters.experienceLevel.includes(level.id) && (
                <div className={`w-2 h-2 rounded-full bg-${level.color}-500`} />
              )}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Salary */}
      <FilterSection title="Lön" section="salary" icon={Wallet}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.salaryMin || ''}
              onChange={(e) => updateFilter('salaryMin', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
            />
            <span className="text-slate-600">-</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.salaryMax || ''}
              onChange={(e) => updateFilter('salaryMax', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <p className="text-xs text-slate-700">Ange önskad månadslön i kr</p>
        </div>
      </FilterSection>

      {/* Language */}
      <FilterSection title="Språk" section="language" icon={Sliders}>
        <div className="flex flex-wrap gap-2">
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => toggleArrayFilter('language', lang.id)}
              className={`px-3 py-2 text-sm rounded-xl transition-colors ${
                filters.language.includes(lang.id)
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Driving License */}
      <FilterSection title="Övrigt" section="other" icon={Car}>
        <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
          <input
            type="checkbox"
            checked={filters.drivingLicense}
            onChange={(e) => updateFilter('drivingLicense', e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          <div>
            <div className="font-medium text-sm text-slate-700">Körkort krävs</div>
            <div className="text-xs text-slate-700">Visa endast jobb som kräver körkort</div>
          </div>
        </label>
      </FilterSection>

      {/* Match percentage */}
      <FilterSection title="Match med CV" section="match" icon={Sliders}>
        <div className="bg-gradient-to-r from-teal-50 to-sky-50 p-4 rounded-xl">
          <label className="text-sm font-medium text-teal-900 mb-3 block">
            Minst {filters.minMatchPercentage}% match
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={filters.minMatchPercentage}
            onChange={(e) => updateFilter('minMatchPercentage', parseInt(e.target.value))}
            className="w-full accent-teal-600"
          />
          <div className="flex justify-between text-xs text-teal-600 mt-2">
            <span>Ingen min</span>
            <span>50%</span>
            <span>Perfekt match</span>
          </div>
        </div>
      </FilterSection>
    </>
  )

  return (
    <>
      {/* Desktop filter panel */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-teal-600" />
            <h3 className="font-semibold text-slate-800">Filtrera</h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium"
            >
              <RotateCcw size={12} />
              Rensa alla
            </button>
          )}
        </div>

        {/* Filter sections */}
        <div className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
          <FilterContent />
        </div>

        {/* Footer with count */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">
              Visar <strong className="text-slate-900">{jobCount}</strong> jobb
            </span>
            {totalJobs > jobCount && (
              <span className="text-xs text-slate-700">
                av {totalJobs} totala
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter button */}
      <div className="lg:hidden">
        <button
          onClick={() => setShowMobileFilters(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium shadow-sm"
        >
          <Filter size={18} />
          Filter
          {activeFilterCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-teal-600 text-white text-xs rounded-full">
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
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-xl overflow-hidden flex flex-col">
              {/* Mobile header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
                <h3 className="font-semibold text-slate-800">Filtrera jobb</h3>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X size={20} className="text-slate-700" />
                </button>
              </div>

              {/* Mobile filter content */}
              <div className="flex-1 overflow-y-auto p-4">
                <FilterContent />
              </div>

              {/* Mobile footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button
                  onClick={clearAllFilters}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-medium"
                >
                  Rensa
                </button>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl font-medium"
                >
                  Visa {jobCount} jobb
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
