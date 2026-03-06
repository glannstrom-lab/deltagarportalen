import { useState, useEffect, useCallback } from 'react'
import { 
  Search, Sparkles, TrendingUp, Filter, Briefcase, Bot, 
  Target, GraduationCap, Map, Mic, Bookmark, History,
  SlidersHorizontal, X, RotateCcw, ChevronDown
} from 'lucide-react'
import { jobsApi } from '@/services/api'
import { afApi, POPULAR_QUERIES } from '@/services/arbetsformedlingenApi'
import { JobCard } from '@/components/jobs/JobCard'
import { JobFilters, type JobFilterState } from '@/components/jobs/JobFilters'
import { JobDetailModal } from '@/components/jobs/JobDetailModal'
import { ApplicationsTracker } from '@/components/jobs/ApplicationsTracker'
import JobMatchAnalyzer from '@/components/jobs/JobMatchAnalyzer'
import RealMarketInsights from '@/components/market/RealMarketInsights'
import EducationPathFinder from '@/components/education/EducationPathFinder'
import { SwedenMap } from '@/components/map/SwedenMap'
import { LoadingState, SkeletonList, ErrorState } from '@/components/ui/LoadingState'
import { InterviewPrep } from '@/components/interview/InterviewPrep'
import type { Job, JobApplication, CVData } from '@/services/mockApi'
import { cvApi } from '@/services/api'
import { supabase } from '@/lib/utils'
import { cn } from '@/lib/utils'

// Sökfilter för avancerad filtrering
const defaultFilters: JobFilterState = {
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
}

interface SavedSearch {
  id: string
  name: string
  filters: JobFilterState
  createdAt: string
}

export default function JobSearch() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<(JobApplication & { job?: Job })[]>([])
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showMatchAnalyzer, setShowMatchAnalyzer] = useState(false)
  const [activeTab, setActiveTab] = useState<'search' | 'applications' | 'insights' | 'education' | 'interview'>('search')
  const [showFilterPanel, setShowFilterPanel] = useState(true)
  
  const [filters, setFilters] = useState<JobFilterState>(defaultFilters)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [jobCountByRegion, setJobCountByRegion] = useState<Record<string, number>>({})
  const [totalJobCount, setTotalJobCount] = useState(0)

  // Ladda data vid start
  useEffect(() => {
    loadData()
    loadSavedSearches()
    loadRecentSearches()
  }, [])

  // Sök jobb när filter ändras
  useEffect(() => {
    const timeout = setTimeout(() => {
      searchJobsWithAPI()
    }, 300) // Debounce 300ms
    return () => clearTimeout(timeout)
  }, [filters])

  const loadData = async () => {
    try {
      const [appsResult, cvResult] = await Promise.all([
        jobsApi.getApplications(),
        cvApi.getCV(),
      ])
      setApplications(appsResult)
      setCvData(cvResult)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const loadSavedSearches = () => {
    const saved = localStorage.getItem('savedJobSearches')
    if (saved) {
      setSavedSearches(JSON.parse(saved))
    }
  }

  const loadRecentSearches = () => {
    const recent = localStorage.getItem('recentJobSearches')
    if (recent) {
      setRecentSearches(JSON.parse(recent))
    }
  }

  const saveSearch = () => {
    const name = prompt('Namnge din sökning:')
    if (!name) return

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    }

    const updated = [...savedSearches, newSearch]
    setSavedSearches(updated)
    localStorage.setItem('savedJobSearches', JSON.stringify(updated))
  }

  const deleteSavedSearch = (id: string) => {
    const updated = savedSearches.filter(s => s.id !== id)
    setSavedSearches(updated)
    localStorage.setItem('savedJobSearches', JSON.stringify(updated))
  }

  const applySavedSearch = (savedFilters: JobFilterState) => {
    setFilters(savedFilters)
  }

  const addToRecentSearches = (query: string) => {
    if (!query.trim()) return
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentJobSearches', JSON.stringify(updated))
  }

  const searchJobsWithAPI = async () => {
    try {
      setLoading(true)
      
      // Spara i recent searches om det är en ny sökning
      if (filters.search && !recentSearches.includes(filters.search)) {
        addToRecentSearches(filters.search)
      }
      
      // Beräkna published-after datum
      let publishedAfter: string | undefined
      if (filters.publishedWithin === 'today') {
        publishedAfter = new Date().toISOString().split('T')[0]
      } else if (filters.publishedWithin === 'week') {
        const date = new Date()
        date.setDate(date.getDate() - 7)
        publishedAfter = date.toISOString().split('T')[0]
      } else if (filters.publishedWithin === 'month') {
        const date = new Date()
        date.setDate(date.getDate() - 30)
        publishedAfter = date.toISOString().split('T')[0]
      }
      
      // Hämta jobb från Arbetsförmedlingen
      const afResult = await afApi.searchJobs({
        q: filters.search,
        municipality: filters.location,
        region: filters.region,
        employment_type: filters.employmentType[0],
        published_after: publishedAfter,
        limit: 100,
      })
      
      // Konvertera till portalens format
      let convertedJobs: Job[] = (afResult.hits || []).map(ad => ({
        id: ad.id,
        title: ad.headline || 'Titel ej angiven',
        company: ad.employer?.name || 'Arbetsgivare ej angiven',
        location: ad.workplace_address?.municipality || ad.workplace_address?.city || 'Ort ej angiven',
        description: ad.description?.text ? ad.description.text.substring(0, 500) + '...' : 'Ingen beskrivning',
        requirements: [
          ...(ad.must_have?.skills?.map((s: any) => s.label) || []),
          ...(ad.must_have?.languages?.map((l: any) => l.label) || []),
        ],
        employmentType: (ad.employment_type?.label as any) || 'Ej angiven',
        experienceLevel: ad.experience_required ? 'Erfaren' : 'Ingen erfarenhet',
        salaryRange: ad.salary_description || undefined,
        salary: ad.salary_description || undefined,
        publishedDate: ad.publication_date,
        publishedAt: ad.publication_date,
        deadline: ad.application_deadline || undefined,
        url: ad.application_details?.url || '#',
        benefits: ad.employer?.benefits || [],
        matchPercentage: undefined,
        // Nya fält
        workArrangement: ad.remote_work?.options || 'onsite',
        drivingLicense: ad.must_have?.driving_license?.required || false,
      }))
      
      // Lokal filtrering för avancerade filter
      if (filters.experienceLevel.length > 0) {
        convertedJobs = convertedJobs.filter(job => 
          filters.experienceLevel.includes(job.experienceLevel)
        )
      }
      
      if (filters.workArrangement.length > 0) {
        convertedJobs = convertedJobs.filter(job => 
          filters.workArrangement.includes(job.workArrangement as any)
        )
      }
      
      if (filters.drivingLicense) {
        convertedJobs = convertedJobs.filter(job => job.drivingLicense)
      }
      
      if (filters.language.length > 0) {
        convertedJobs = convertedJobs.filter(job => 
          filters.language.some(lang => 
            job.requirements.some(req => req.toLowerCase().includes(lang))
          )
        )
      }
      
      setJobs(convertedJobs)
      setTotalJobCount(convertedJobs.length)
      
      // Uppdatera jobb per region för kartan
      const regionCount: Record<string, number> = {}
      convertedJobs.forEach(job => {
        const region = job.location
        regionCount[region] = (regionCount[region] || 0) + 1
      })
      setJobCountByRegion(regionCount)
      
    } catch (error) {
      console.error('Error searching with API:', error)
      setJobs([])
      setTotalJobCount(0)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveJob = async (jobId: string) => {
    try {
      const existingApp = applications.find(a => a.jobId === jobId)
      
      if (existingApp) {
        if (existingApp.status === 'saved') {
          await jobsApi.deleteApplication(existingApp.id)
          setApplications(applications.filter(a => a.id !== existingApp.id))
        } else {
          await jobsApi.updateApplication(existingApp.id, { status: 'saved' })
          setApplications(applications.map(a => 
            a.id === existingApp.id ? { ...a, status: 'saved' } : a
          ))
        }
      } else {
        const newApp = await jobsApi.saveJob(jobId, 'saved')
        const job = jobs.find(j => j.id === jobId)
        setApplications([...applications, { ...newApp, job }])
      }
    } catch (error) {
      console.error('Error saving job:', error)
    }
  }

  const handleApply = (job: Job) => {
    setSelectedJob(job)
    setShowModal(true)
  }

  const handleAnalyzeMatch = (job: Job) => {
    setSelectedJob(job)
    setShowMatchAnalyzer(true)
    setShowModal(false)
  }

  const handleUpdateStatus = async (appId: string, status: JobApplication['status']) => {
    try {
      await jobsApi.updateApplication(appId, { status })
      setApplications(applications.map(a => 
        a.id === appId ? { ...a, status } : a
      ))
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleDelete = async (appId: string) => {
    try {
      await jobsApi.deleteApplication(appId)
      setApplications(applications.filter(a => a.id !== appId))
    } catch (error) {
      console.error('Error deleting application:', error)
    }
  }

  const handleAddNote = async (appId: string, note: string) => {
    try {
      await jobsApi.updateApplication(appId, { notes: note })
      setApplications(applications.map(a => 
        a.id === appId ? { ...a, notes: note } : a
      ))
    } catch (error) {
      console.error('Error adding note:', error)
    }
  }

  const handleRegionSelect = (regionId: string) => {
    if (regionId) {
      const regionNames: Record<string, string> = {
        'SE110': 'Stockholms län',
        'SE121': 'Uppsala län',
        'SE122': 'Södermanlands län',
        'SE123': 'Östergötlands län',
        'SE124': 'Örebro län',
        'SE125': 'Västmanlands län',
        'SE211': 'Jönköpings län',
        'SE212': 'Kronobergs län',
        'SE213': 'Kalmar län',
        'SE214': 'Gotlands län',
        'SE221': 'Blekinge län',
        'SE224': 'Skåne län',
        'SE231': 'Hallands län',
        'SE232': 'Västra Götalands län',
        'SE311': 'Värmlands län',
        'SE312': 'Dalarnas län',
        'SE313': 'Gävleborgs län',
        'SE321': 'Västernorrlands län',
        'SE322': 'Jämtlands län',
        'SE331': 'Västerbottens län',
        'SE332': 'Norrbottens län',
      }
      setFilters(prev => ({ 
        ...prev, 
        region: regionId,
        regionName: regionNames[regionId] || regionId
      }))
    } else {
      setFilters(prev => ({ ...prev, region: '', regionName: '' }))
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Sök jobb</h1>
            <p className="text-slate-600 mt-1">
              Hitta lediga jobb från Platsbanken (Arbetsförmedlingen)
              {totalJobCount > 0 && (
                <span className="ml-2 text-violet-600 font-medium">
                  • {totalJobCount} jobb hittade
                </span>
              )}
            </p>
          </div>
          
          {/* Filter toggle (mobile) */}
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium"
          >
            <SlidersHorizontal size={18} />
            Filter
          </button>
        </div>

        {/* Recent & Saved Searches */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <div className="flex items-center gap-2">
              <History size={14} className="text-slate-400" />
              <span className="text-sm text-slate-500">Senast:</span>
              {recentSearches.slice(0, 3).map((query) => (
                <button
                  key={query}
                  onClick={() => setFilters({ ...filters, search: query })}
                  className="text-sm text-violet-600 hover:text-violet-700 hover:underline"
                >
                  {query}
                </button>
              ))}
            </div>
          )}
          
          {/* Saved searches */}
          {savedSearches.length > 0 && (
            <div className="flex items-center gap-2 ml-4">
              <Bookmark size={14} className="text-slate-400" />
              <span className="text-sm text-slate-500">Sparade:</span>
              <select
                onChange={(e) => {
                  const search = savedSearches.find(s => s.id === e.target.value)
                  if (search) applySavedSearch(search.filters)
                }}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1"
              >
                <option value="">Välj sökning...</option>
                {savedSearches.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Popular searches */}
      {!filters.search && (
        <div className="mb-6">
          <p className="text-sm text-slate-500 mb-3">Populära sökningar:</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_QUERIES.map((query) => (
              <button
                key={query.label}
                onClick={() => setFilters({ ...filters, search: query.query })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm text-slate-700 hover:border-violet-400 hover:text-violet-700 transition-colors"
              >
                <span>{query.icon}</span>
                {query.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'search', label: 'Sök jobb', icon: Search },
          { id: 'applications', label: 'Sparade jobb', icon: Briefcase, count: applications.length },
          { id: 'insights', label: 'Marknadsinsikter', icon: TrendingUp },
          { id: 'interview', label: 'Intervjuförberedelse', icon: Mic },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-colors text-sm sm:text-base",
              activeTab === tab.id
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            )}
          >
            <tab.icon size={18} />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            {'count' in tab && tab.count > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'search' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters sidebar */}
          <div className={cn(
            "lg:col-span-1 space-y-4",
            !showFilterPanel && "hidden lg:block"
          )}>
            <JobFilters 
              filters={filters} 
              onChange={setFilters}
              jobCount={jobs.length}
              totalJobs={totalJobCount}
            />
            
            {/* Save search button */}
            <button
              onClick={saveSearch}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              <Bookmark size={18} />
              Spara sökning
            </button>
            
            {/* Sweden Map */}
            <SwedenMap
              selectedRegion={filters.region || null}
              onRegionSelect={handleRegionSelect}
              jobData={jobCountByRegion}
            />
          </div>

          {/* Job listings */}
          <div className="lg:col-span-3">
            {/* Active filters display */}
            {(filters.location || filters.region || filters.employmentType.length > 0) && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-500">Aktiva filter:</span>
                {filters.location && (
                  <span className="px-2 py-1 bg-violet-100 text-violet-700 text-xs rounded-lg flex items-center gap-1">
                    📍 {filters.location}
                    <button onClick={() => setFilters({ ...filters, location: '' })}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filters.region && (
                  <span className="px-2 py-1 bg-violet-100 text-violet-700 text-xs rounded-lg flex items-center gap-1">
                    🗺️ {filters.region}
                    <button onClick={() => setFilters({ ...filters, region: '' })}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filters.employmentType.map(type => (
                  <span key={type} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg flex items-center gap-1">
                    💼 {type}
                    <button onClick={() => setFilters({ 
                      ...filters, 
                      employmentType: filters.employmentType.filter(t => t !== type)
                    })}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => setFilters(defaultFilters)}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  Rensa alla
                </button>
              </div>
            )}

            {loading ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12">
                <LoadingState 
                  message="Söker jobb från Platsbanken..." 
                  submessage="Använder Arbetsförmedlingens API"
                  size="md"
                />
              </div>
            ) : jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSaved={applications.some(a => a.jobId === job.id && a.status === 'saved')}
                    isApplied={applications.some(a => a.jobId === job.id && a.status === 'applied')}
                    onSave={() => handleSaveJob(job.id)}
                    onApply={() => handleApply(job)}
                    onAnalyzeMatch={() => handleAnalyzeMatch(job)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                <Search className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Inga jobb hittades</h3>
                <p className="text-slate-600 mb-6">
                  Prova att ändra dina sökkriterier eller sök på något annat.
                </p>
                <button
                  onClick={() => setFilters(defaultFilters)}
                  className="px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors"
                >
                  Rensa alla filter
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <ApplicationsTracker
          applications={applications}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDelete}
          onAddNote={handleAddNote}
        />
      )}

      {activeTab === 'insights' && <RealMarketInsights />}
      
      {activeTab === 'education' && <EducationPathFinder />}
      
      {activeTab === 'interview' && <InterviewPrep jobTitle={filters.search} />}

      {/* Job Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        cvData={cvData}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isSaved={selectedJob ? applications.some(a => a.jobId === selectedJob.id && a.status === 'saved') : false}
        onSave={() => selectedJob && handleSaveJob(selectedJob.id)}
        onApply={() => {
          setShowModal(false)
        }}
      />

      {/* Match Analyzer */}
      {showMatchAnalyzer && selectedJob && (
        <JobMatchAnalyzer
          job={selectedJob}
          cvData={cvData}
          onClose={() => setShowMatchAnalyzer(false)}
        />
      )}
    </div>
  )
}
