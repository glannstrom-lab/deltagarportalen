/**
 * Search Tab - Job search with Platsbanken integration
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  MapPin,
  Filter,
  Loader2,
  ChevronDown,
  Building2,
  Calendar,
  Bookmark,
  ExternalLink,
  AlertCircle,
  Briefcase,
  X,
} from 'lucide-react'
import { afApi, type JobAd, type SearchFilters } from '@/services/arbetsformedlingenApi'
import { JobCard } from '@/components/jobs/JobCard'
import { Button } from '@/components/ui'
import { platsbankenApi } from '@/services/cloudStorage'

interface FilterState {
  q: string
  municipality: string
  region: string
  employment_type: string
  experience: boolean | null
  remote: boolean | null
}

export default function SearchTab() {
  const [filters, setFilters] = useState<FilterState>({
    q: '',
    municipality: '',
    region: '',
    employment_type: '',
    experience: null,
    remote: null,
  })

  const [jobs, setJobs] = useState<JobAd[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMockData, setIsMockData] = useState(false)
  const [totalJobs, setTotalJobs] = useState(0)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())

  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const [municipalities, setMunicipalities] = useState<any[]>([])
  const [regions, setRegions] = useState<any[]>([])

  const searchInputRef = useRef<HTMLInputElement>(null)
  const LIMIT = 20

  // Load saved job IDs
  useEffect(() => {
    const loadSavedJobs = async () => {
      const saved = await platsbankenApi.getSavedJobs()
      setSavedJobIds(new Set(saved.map((j: any) => j.id)))
    }
    loadSavedJobs()
  }, [])

  // Load municipalities and regions
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const [munResult, regResult] = await Promise.all([
          afApi.getMunicipalities(),
          afApi.getRegions(),
        ])
        if (munResult.success) setMunicipalities(munResult.data)
        if (regResult.success) setRegions(regResult.data)
      } catch (e) {
        console.error('Could not load locations:', e)
      }
    }
    loadLocations()
  }, [])

  const searchJobs = useCallback(
    async (resetOffset = true) => {
      setLoading(true)
      setError(null)

      if (resetOffset) setOffset(0)

      try {
        const searchFilters: SearchFilters = {
          ...filters,
          limit: LIMIT,
          offset: resetOffset ? 0 : offset,
        }

        Object.keys(searchFilters).forEach((key) => {
          if (
            searchFilters[key as keyof SearchFilters] === '' ||
            searchFilters[key as keyof SearchFilters] === null
          ) {
            delete searchFilters[key as keyof SearchFilters]
          }
        })

        const result = await afApi.searchJobsSafe(searchFilters)

        if (result.success) {
          const newJobs = result.data.hits
          setJobs((prev) => (resetOffset ? newJobs : [...prev, ...newJobs]))
          setTotalJobs(result.data.total?.value || 0)
          setIsMockData(!!result.fromCache || !!result.isMockData)
          setHasMore(newJobs.length === LIMIT)
          if (result.error) setError(result.error)
        } else {
          setError(result.error || 'Kunde inte hämta jobb')
          setJobs([])
        }
      } catch (err) {
        setError('Ett fel inträffade vid sökning')
        setJobs([])
      } finally {
        setLoading(false)
      }
    },
    [filters, offset]
  )

  const handleSearch = () => searchJobs(true)

  const loadMore = () => {
    setOffset((prev) => prev + LIMIT)
    searchJobs(false)
  }

  const handleInputChange = async (value: string) => {
    setFilters((prev) => ({ ...prev, q: value }))

    if (value.length >= 2) {
      try {
        const result = await afApi.getAutocomplete(value, 'occupation')
        if (result.success && result.data) {
          setSuggestions(result.data.map((item: any) => item.label || item).slice(0, 5))
          setShowSuggestions(true)
        }
      } catch (e) {
        setSuggestions([])
      }
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const selectSuggestion = (suggestion: string) => {
    setFilters((prev) => ({ ...prev, q: suggestion }))
    setShowSuggestions(false)
    searchJobs(true)
  }

  const toggleSaveJob = async (job: JobAd) => {
    const isSaved = savedJobIds.has(job.id)

    if (isSaved) {
      await platsbankenApi.removeSavedJob(job.id)
      setSavedJobIds((prev) => {
        const next = new Set(prev)
        next.delete(job.id)
        return next
      })
    } else {
      await platsbankenApi.saveJob(job)
      setSavedJobIds((prev) => new Set(prev).add(job.id))
    }
  }

  const openApplication = (job: JobAd) => {
    const url =
      job.application_details?.url ||
      `https://arbetsformedlingen.se/for-arbetssokande/lediga-jobb/${job.id}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const clearFilters = () => {
    setFilters({
      q: '',
      municipality: '',
      region: '',
      employment_type: '',
      experience: null,
      remote: null,
    })
    setJobs([])
    setTotalJobs(0)
    setError(null)
    setIsMockData(false)
  }

  const employmentTypes = [
    { value: '', label: 'Alla typer' },
    { value: 'Vanlig anställning', label: 'Tillsvidare' },
    { value: 'Tidsbegränsad anställning', label: 'Visstid' },
    { value: 'Heltid', label: 'Heltid' },
    { value: 'Deltid', label: 'Deltid' },
  ]

  const quickSearchTerms = ['Undersköterska', 'Lagerarbetare', 'Kundtjänst', 'Säljare', 'Kock']

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={filters.q}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Sök på yrke, titel eller nyckelord..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-indigo-50 border-indigo-200' : ''}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>

          <Button onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sök'}
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Län</label>
                <select
                  value={filters.region}
                  onChange={(e) => setFilters((prev) => ({ ...prev, region: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Alla län</option>
                  {regions.map((region) => (
                    <option key={region.concept_id} value={region.label}>
                      {region.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kommun</label>
                <select
                  value={filters.municipality}
                  onChange={(e) => setFilters((prev) => ({ ...prev, municipality: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Alla kommuner</option>
                  {municipalities.map((mun) => (
                    <option key={mun.concept_id} value={mun.label}>
                      {mun.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anställningstyp</label>
                <select
                  value={filters.employment_type}
                  onChange={(e) => setFilters((prev) => ({ ...prev, employment_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {employmentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.experience === false}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, experience: e.target.checked ? false : null }))
                  }
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Ingen erfarenhet krävs</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.remote === true}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, remote: e.target.checked ? true : null }))
                  }
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Distansarbete möjligt</span>
              </label>
            </div>

            <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
              <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700">
                Rensa filter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mock data warning */}
      {isMockData && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-amber-800 font-medium">Data kan vara föråldrad</p>
            <p className="text-amber-700 text-sm">
              Arbetsförmedlingens API är för närvarande otillgängligt. Visar exempeldata.
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {jobs.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            Visar <span className="font-semibold">{jobs.length}</span> av{' '}
            <span className="font-semibold">{totalJobs.toLocaleString('sv-SE')}</span> jobb
          </p>
        </div>
      )}

      {/* Job List */}
      <div className="space-y-4">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            isSaved={savedJobIds.has(job.id)}
            onSave={() => toggleSaveJob(job)}
            onApply={() => openApplication(job)}
            showMatch={false}
            showApplyButton={true}
          />
        ))}
      </div>

      {/* Load More */}
      {jobs.length > 0 && hasMore && (
        <div className="text-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Laddar...
              </>
            ) : (
              'Ladda fler jobb'
            )}
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!loading && jobs.length === 0 && !error && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Börja söka jobb</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Ange ett sökord ovan för att hitta lediga jobb från Arbetsförmedlingen.
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {quickSearchTerms.map((term) => (
              <button
                key={term}
                onClick={() => {
                  setFilters((prev) => ({ ...prev, q: term }))
                  searchJobs(true)
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && jobs.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Något gick fel</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => searchJobs(true)}>Försök igen</Button>
        </div>
      )}
    </div>
  )
}
