import { useState } from 'react'
import { Search, MapPin, Sliders, X } from 'lucide-react'

export interface JobFilterState {
  search: string
  location: string  // Kommun/ort
  region: string    // Län
  employmentType: string[]
  experienceLevel: string[]
  publishedWithin: 'today' | 'week' | 'month' | 'all'
  minMatchPercentage: number
}

interface JobFiltersProps {
  filters: JobFilterState
  onChange: (filters: JobFilterState) => void
}

const employmentTypes = [
  { id: 'Heltid', label: 'Heltid' },
  { id: 'Deltid', label: 'Deltid' },
  { id: 'Tillsvidare', label: 'Tillsvidare' },
  { id: 'Projekt', label: 'Projekt' },
  { id: 'Sommarjobb', label: 'Sommarjobb' },
]

const experienceLevels = [
  { id: 'Ingen erfarenhet', label: 'Ingen erfarenhet' },
  { id: 'Erfaren', label: 'Erfaren' },
  { id: 'Mycket erfaren', label: 'Mycket erfaren' },
]

export function JobFilters({ filters, onChange }: JobFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const updateFilter = <K extends keyof JobFilterState>(key: K, value: JobFilterState[K]) => {
    onChange({ ...filters, [key]: value })
  }

  const toggleArrayFilter = (key: 'employmentType' | 'experienceLevel', value: string) => {
    const current = filters[key]
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value]
    updateFilter(key, updated)
  }

  const hasActiveFilters = 
    filters.location || 
    filters.region ||
    filters.employmentType.length > 0 || 
    filters.experienceLevel.length > 0 ||
    filters.publishedWithin !== 'all' ||
    filters.minMatchPercentage > 0

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <Sliders size={20} className="text-[#4f46e5]" />
        <h3 className="font-semibold text-slate-800">Filtrera jobb</h3>
        {hasActiveFilters && (
          <button
            onClick={() => onChange({
              search: filters.search,
              location: '',
              region: '',
              employmentType: [],
              experienceLevel: [],
              publishedWithin: 'all',
              minMatchPercentage: 0,
            })}
            className="ml-auto text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
          >
            <X size={12} />
            Rensa filter
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">Sök</label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Yrke, företag, nyckelord..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          />
        </div>
      </div>

      {/* Location */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">Ort (kommun)</label>
        <div className="relative">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Stockholm, Göteborg..."
            value={filters.location}
            onChange={(e) => updateFilter('location', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">Skriv en kommun för exakt filtrering</p>
      </div>

      {/* Region */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">Län</label>
        <select
          value={filters.region}
          onChange={(e) => updateFilter('region', e.target.value)}
          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
        >
          <option value="">Alla län</option>
          <option value="Stockholms län">Stockholms län</option>
          <option value="Uppsala län">Uppsala län</option>
          <option value="Södermanlands län">Södermanlands län</option>
          <option value="Östergötlands län">Östergötlands län</option>
          <option value="Jönköpings län">Jönköpings län</option>
          <option value="Kronobergs län">Kronobergs län</option>
          <option value="Kalmar län">Kalmar län</option>
          <option value="Gotlands län">Gotlands län</option>
          <option value="Blekinge län">Blekinge län</option>
          <option value="Skåne län">Skåne län</option>
          <option value="Hallands län">Hallands län</option>
          <option value="Västra Götalands län">Västra Götalands län</option>
          <option value="Värmlands län">Värmlands län</option>
          <option value="Örebro län">Örebro län</option>
          <option value="Västmanlands län">Västmanlands län</option>
          <option value="Dalarnas län">Dalarnas län</option>
          <option value="Gävleborgs län">Gävleborgs län</option>
          <option value="Västernorrlands län">Västernorrlands län</option>
          <option value="Jämtlands län">Jämtlands län</option>
          <option value="Västerbottens län">Västerbottens län</option>
          <option value="Norrbottens län">Norrbottens län</option>
        </select>
      </div>

      {/* Published date */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">Publicerad</label>
        <select
          value={filters.publishedWithin}
          onChange={(e) => updateFilter('publishedWithin', e.target.value as any)}
          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
        >
          <option value="all">När som helst</option>
          <option value="today">Idag</option>
          <option value="week">Senaste veckan</option>
          <option value="month">Senaste månaden</option>
        </select>
      </div>

      {/* Advanced filters toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-[#4f46e5] hover:underline mb-4"
      >
        {showAdvanced ? 'Dölj avancerade filter' : 'Visa avancerade filter'}
      </button>

      {showAdvanced && (
        <>
          {/* Employment type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Anställningsform</label>
            <div className="flex flex-wrap gap-2">
              {employmentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => toggleArrayFilter('employmentType', type.id)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filters.employmentType.includes(type.id)
                      ? 'bg-[#4f46e5] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Experience level */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Erfarenhetsnivå</label>
            <div className="flex flex-wrap gap-2">
              {experienceLevels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => toggleArrayFilter('experienceLevel', level.id)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filters.experienceLevel.includes(level.id)
                      ? 'bg-[#4f46e5] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Match percentage */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Minst {filters.minMatchPercentage}% match med CV
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={filters.minMatchPercentage}
              onChange={(e) => updateFilter('minMatchPercentage', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
