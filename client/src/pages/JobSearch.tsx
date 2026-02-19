import { useState, useEffect } from 'react'
import { Search, Sparkles, TrendingUp, Filter, Briefcase } from 'lucide-react'
import { jobsApi } from '@/services/api'
import { cvApi } from '@/services/api'
import { JobCard } from '@/components/jobs/JobCard'
import { JobFilters, type JobFilterState } from '@/components/jobs/JobFilters'
import { JobDetailModal } from '@/components/jobs/JobDetailModal'
import { ApplicationsTracker } from '@/components/jobs/ApplicationsTracker'
import type { Job, JobApplication, CVData } from '@/services/mockApi'

export default function JobSearch() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<(JobApplication & { job?: Job })[]>([])
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'search' | 'applications'>('search')
  
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
    searchJobs()
  }, [filters])

  const loadData = async () => {
    try {
      const [jobsResult, appsResult, cvResult] = await Promise.all([
        jobsApi.searchJobs(),
        jobsApi.getApplications(),
        cvApi.getCV(),
      ])
      setJobs(jobsResult)
      setApplications(appsResult)
      setCvData(cvResult)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchJobs = async () => {
    try {
      const result = await jobsApi.searchJobs(filters)
      setJobs(result)
    } catch (error) {
      console.error('Error searching jobs:', error)
    }
  }

  const handleSaveJob = async (jobId: string) => {
    try {
      const existingApp = applications.find(a => a.jobId === jobId)
      
      if (existingApp) {
        // Toggle between saved and deleted
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
        // Save new job
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

  // Get top matches
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
      ) : (
        /* Applications tab */
        <div className="max-w-3xl">
          <ApplicationsTracker
            applications={applications}
            onUpdateStatus={handleUpdateStatus}
            onDelete={handleDelete}
            onAddNote={handleAddNote}
          />
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
            // TODO: Open cover letter generator
            alert('AI-ansökan skulle öppnas här!')
          }}
        />
      )}
    </div>
  )
}
