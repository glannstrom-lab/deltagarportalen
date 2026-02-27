import { useState, useEffect } from 'react'
import { Search, Sparkles, TrendingUp, Filter, Briefcase, Bot, Target, GraduationCap, Map, Mic } from 'lucide-react'
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

export default function JobSearch() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<(JobApplication & { job?: Job })[]>([])
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showMatchAnalyzer, setShowMatchAnalyzer] = useState(false)
  const [activeTab, setActiveTab] = useState<'search' | 'applications' | 'insights' | 'education' | 'interview'>('search')
  
  const [filters, setFilters] = useState<JobFilterState>({
    search: '',
    location: '',
    region: '',
    employmentType: [],
    experienceLevel: [],
    publishedWithin: 'all',
    minMatchPercentage: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    searchJobsWithAPI()
  }, [filters, cvData])

  const loadData = async () => {
    try {
      const [appsResult, cvResult] = await Promise.all([
        jobsApi.getApplications(),
        cvApi.getCV(),
      ])
      setApplications(appsResult)
      setCvData(cvResult)
      
      // Ladda initiala jobb från Platsbanken
      await searchJobsWithAPI()
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchJobsWithAPI = async () => {
    try {
      setLoading(true)
      
      // Beräkna published-after datum baserat på filter
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
      
      // Använd Arbetsförmedlingens API
      const afResult = await afApi.searchJobs({
        q: filters.search,
        municipality: filters.location,
        region: filters.region,
        employment_type: filters.employmentType[0], // API stöder en typ åt gången
        published_after: publishedAfter,
        limit: 50, // Hämta fler så vi kan filtrera lokalt
      })
      
      // Konvertera AF-format till portalens format
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
        benefits: [],
        matchPercentage: undefined,
      }))
      
      // Lokal filtrering för erfarenhetsnivå (API stöder inte detta)
      if (filters.experienceLevel.length > 0) {
        convertedJobs = convertedJobs.filter(job => 
          filters.experienceLevel.includes(job.experienceLevel)
        )
      }
      
      // Lokal filtrering för matchningsprocent (om CV-data finns)
      if (filters.minMatchPercentage > 0 && cvData) {
        convertedJobs = convertedJobs.filter(job => 
          (job.matchPercentage || 0) >= filters.minMatchPercentage
        )
      }
      
      // Filtrera på flera anställningsformer (om fler än en är vald)
      if (filters.employmentType.length > 1) {
        convertedJobs = convertedJobs.filter(job => 
          filters.employmentType.includes(job.employmentType)
        )
      }
      
      setJobs(convertedJobs)
    } catch (error) {
      console.error('Error searching with API:', error)
      setJobs([])
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Sök jobb</h1>
        <p className="text-slate-600">
          Hitta lediga jobb från Platsbanken (Arbetsförmedlingen)
        </p>
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
          Sparade jobb
          {applications.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-sm">
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
          Marknadsinsikter
        </button>
        
        <button
          onClick={() => setActiveTab('interview')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'interview'
              ? 'bg-[#4f46e5] text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Mic size={18} />
          Intervjuförberedelse
        </button>
      </div>

      {activeTab === 'search' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <JobFilters filters={filters} onChange={setFilters} />
            
            {/* Sweden Map */}
            <SwedenMap
              selectedRegion={filters.region || null}
              onRegionSelect={(region) => setFilters({ ...filters, region: region || '' })}
              jobData={{
                'SE110': 2847,  // Stockholm
                'SE232': 1823,  // Västra Götaland
                'SE224': 1245,  // Skåne
                'SE121': 678,   // Uppsala
                'SE123': 542,   // Östergötland
                'SE231': 423,   // Halland
                'SE211': 387,   // Jönköping
                'SE212': 298,   // Kronoberg
              }}
            />
          </div>

          {/* Job listings */}
          <div className="lg:col-span-3">
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
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12">
                <ErrorState
                  title="Inga jobb hittades"
                  message="Prova att ändra dina sökkriterier eller sök på något annat."
                  onRetry={() => searchJobsWithAPI()}
                />
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
