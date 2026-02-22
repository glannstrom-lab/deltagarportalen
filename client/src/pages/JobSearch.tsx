import { useState, useEffect } from 'react'
import { Search, Sparkles, TrendingUp, Filter, Briefcase, Bot, Target } from 'lucide-react'
import { jobsApi } from '@/services/api'
import { afApi, POPULAR_QUERIES } from '@/services/arbetsformedlingenApi'
import { JobCard } from '@/components/jobs/JobCard'
import { JobFilters, type JobFilterState } from '@/components/jobs/JobFilters'
import { JobDetailModal } from '@/components/jobs/JobDetailModal'
import { ApplicationsTracker } from '@/components/jobs/ApplicationsTracker'
import JobMatchAnalyzer from '@/components/jobs/JobMatchAnalyzer'
import MarketInsights from '@/components/market/MarketInsights'
import type { Job, JobApplication, CVData } from '@/services/mockApi'
import { cvApi } from '@/services/api'

export default function JobSearch() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<(JobApplication & { job?: Job })[]>([])
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showMatchAnalyzer, setShowMatchAnalyzer] = useState(false)
  const [activeTab, setActiveTab] = useState<'search' | 'applications' | 'insights'>('search')
  const [usingRealAPI, setUsingRealAPI] = useState(false)
  
  const [filters, setFilters] = useState<JobFilterState>({
    search: '',
    location: '',
    employmentType: [],
    experienceLevel: [],
    publishedWithin: 'all',
    minMatchPercentage: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (usingRealAPI) {
      searchJobsWithAPI()
    } else {
      searchJobs()
    }
  }, [filters, usingRealAPI])

  const loadData = async () => {
    try {
      const [appsResult, cvResult] = await Promise.all([
        jobsApi.getApplications(),
        cvApi.getCV(),
      ])
      setApplications(appsResult)
      setCvData(cvResult)
      
      // Ladda initiala jobb från mock API
      const jobsResult = await jobsApi.searchJobs()
      setJobs(jobsResult)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchJobs = async () => {
    try {
      setLoading(true)
      const result = await jobsApi.searchJobs(filters)
      setJobs(result)
    } catch (error) {
      console.error('Error searching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchJobsWithAPI = async () => {
    try {
      setLoading(true)
      
      // Använd Arbetsförmedlingens API
      const afResult = await afApi.searchJobs({
        q: filters.search,
        municipality: filters.location,
        limit: 20,
      })
      
      // Konvertera AF-format till portalens format
      const convertedJobs: Job[] = afResult.hits.map(ad => ({
        id: ad.id,
        title: ad.headline,
        company: ad.employer?.name || 'Arbetsgivare ej angiven',
        location: ad.workplace_address?.municipality || ad.workplace_address?.city || 'Ort ej angiven',
        description: ad.description.text.substring(0, 500) + '...',
        requirements: [
          ...(ad.must_have?.skills?.map(s => s.label) || []),
          ...(ad.must_have?.languages?.map(l => l.label) || []),
        ],
        employmentType: (ad.employment_type?.label as any) || 'Ej angiven',
        experienceLevel: ad.experience_required ? 'Erfaren' : 'Ingen erfarenhet',
        salaryRange: ad.salary_description || undefined,
        salary: ad.salary_description || undefined,
        publishedDate: ad.publication_date,
        publishedAt: ad.publication_date,
        deadline: ad.application_deadline || undefined,
        url: ad.application_details?.url || '#',
        benefits: [],
        matchPercentage: undefined, // Beräknas separat
      }))
      
      setJobs(convertedJobs)
    } catch (error) {
      console.error('Error searching with API:', error)
      // Fallback till mock
      setUsingRealAPI(false)
      searchJobs()
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

  const isJobSaved = (jobId: string) => {
    return applications.some(a => a.jobId === jobId && a.status === 'saved')
  }

  const topMatches = jobs
    .filter(j => (j.matchPercentage || 0) >= 70)
    .sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0))
    .slice(0, 3)

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Sök jobb</h1>
        <p className="text-slate-600 mt-2">
          Hitta ditt nästa jobb med hjälp av AI-matchning och smarta filter.
        </p>
      </div>

      {/* API Toggle */}
      <div className="mb-6 bg-slate-50 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot size={24} className={usingRealAPI ? 'text-teal-600' : 'text-slate-400'} />
          <div>
            <p className="font-medium text-slate-800">
              {usingRealAPI ? 'Realtidsdata från Platsbanken' : 'Demo-läge med exempeljobb'}
            </p>
            <p className="text-sm text-slate-500">
              {usingRealAPI 
                ? 'Visar aktuella annonser från Arbetsförmedlingen' 
                : 'Visar exempeljobb för demonstration'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setUsingRealAPI(!usingRealAPI)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            usingRealAPI
              ? 'bg-teal-100 text-teal-700'
              : 'bg-slate-200 text-slate-700'
          }`}
        >
          {usingRealAPI ? 'Använd demo' : 'Använd Platsbanken'}
        </button>
      </div>

      {/* Popular searches - only when no search active */}
      {!filters.search && usingRealAPI && (
        <div className="mb-6">
          <p className="text-sm text-slate-500 mb-3">Populära sökningar:</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_QUERIES.map((query) => (
              <button
                key={query.label}
                onClick={() => setFilters({ ...filters, search: query.query })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm text-slate-700 hover:border-teal-400 hover:text-teal-700 transition-colors"
              >
                <span>{query.icon}</span>
                {query.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'search'
              ? 'bg-[#4f46e5] text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Search size={18} />
          Sök jobb
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'applications'
              ? 'bg-[#4f46e5] text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Briefcase size={18} />
          Mina ansökningar
          {applications.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-sm">
              {applications.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'insights'
              ? 'bg-[#4f46e5] text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <TrendingUp size={18} />
          Marknadsinsikt
        </button>
      </div>

      {activeTab === 'search' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters sidebar */}
          <div className="lg:col-span-1">
            <JobFilters filters={filters} onChange={setFilters} />
            
            {/* Stats */}
            <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-[#4f46e5]" />
                Din statistik
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Sparade jobb</span>
                  <span className="font-medium">{applications.filter(a => a.status === 'saved').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Ansökta jobb</span>
                  <span className="font-medium">
                    {applications.filter(a => ['applied', 'interview', 'offer'].includes(a.status)).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Intervjuer</span>
                  <span className="font-medium">
                    {applications.filter(a => a.status === 'interview').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Match Analyzer CTA */}
            {cvData && (
              <div className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <Bot size={20} className="text-indigo-600" />
                  <h3 className="font-semibold text-indigo-900">AI-Matchning</h3>
                </div>
                <p className="text-sm text-indigo-700 mb-4">
                  Analysera hur väl ditt CV matchar specifika jobb med hjälp av AI.
                </p>
                <button
                  onClick={() => {
                    if (jobs.length > 0) {
                      setSelectedJob(jobs[0])
                      setShowMatchAnalyzer(true)
                    }
                  }}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Testa matchning
                </button>
              </div>
            )}
          </div>

          {/* Job listings */}
          <div className="lg:col-span-3 space-y-6">
            {/* Top matches */}
            {topMatches.length > 0 && !filters.search && (
              <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Sparkles size={20} className="text-amber-500" />
                  Toppmatchningar för dig
                </h2>
                <div className="space-y-4">
                  {topMatches.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      isSaved={isJobSaved(job.id)}
                      onSave={handleSaveJob}
                      onApply={handleApply}
                      onClick={() => {
                        setSelectedJob(job)
                        setShowModal(true)
                      }}
                      showMatch={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All jobs */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                {filters.search || filters.location || filters.employmentType.length > 0
                  ? `Sökresultat (${jobs.length})`
                  : `Alla jobb (${jobs.length})`}
                {usingRealAPI && (
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    från Platsbanken
                  </span>
                )}
              </h2>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-[#4f46e5] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-slate-500 mt-4">Söker jobb...</p>
                </div>
              ) : jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      isSaved={isJobSaved(job.id)}
                      onSave={handleSaveJob}
                      onApply={handleApply}
                      onAnalyze={cvData ? () => handleAnalyzeMatch(job) : undefined}
                      onClick={() => {
                        setSelectedJob(job)
                        setShowModal(true)
                      }}
                      showMatch={!filters.search}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                  <Filter size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600 font-medium">Inga jobb hittades</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Prova att ändra dina filter eller sökord
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'applications' ? (
        /* Applications tab */
        <div className="max-w-3xl">
          <ApplicationsTracker
            applications={applications}
            onUpdateStatus={handleUpdateStatus}
            onDelete={handleDelete}
            onAddNote={handleAddNote}
          />
        </div>
      ) : (
        /* Insights tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MarketInsights occupation={filters.search} />
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Target size={18} className="text-teal-600" />
                Tips för jobbsökning
              </h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-teal-600">1.</span>
                  <span>Använd AI-matchningen för att se hur väl du matchar olika jobb</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600">2.</span>
                  <span>Spara intressanta jobb och återkom till dem senare</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600">3.</span>
                  <span>Anpassa ditt CV med nyckelorden från varje annons</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600">4.</span>
                  <span>Följ upp dina ansökningar regelbundet</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Job Detail Modal */}
      {cvData && (
        <JobDetailModal
          job={selectedJob}
          cvData={cvData}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          isSaved={selectedJob ? isJobSaved(selectedJob.id) : false}
          onSave={() => selectedJob && handleSaveJob(selectedJob.id)}
          onApply={() => {
            setShowModal(false)
          }}
        />
      )}

      {/* Match Analyzer Modal */}
      {showMatchAnalyzer && selectedJob && cvData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <JobMatchAnalyzer
              jobId={selectedJob.id}
              cvData={cvData}
              onClose={() => setShowMatchAnalyzer(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
