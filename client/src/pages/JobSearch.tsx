import { useState, useEffect, useCallback } from 'react'
import { 
  Search, 
  MapPin, 
  Building2, 
  Calendar, 
  ExternalLink,
  Filter,
  Briefcase,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Star,
  Bookmark,
  BookmarkCheck,
  Mail,
  Send,
  Target,
  BarChart3,
  X,
  CheckCircle
} from 'lucide-react'
import { afApi, POPULAR_QUERIES, type JobAd, type SearchFilters } from '../services/arbetsformedlingenApi'
import NotificationsCenter from '../components/NotificationsCenter'
import JobRecommendations from '../components/JobRecommendations'
import CVMatcher from '../components/CVMatcher'
import QuickApply from '../components/QuickApply'
import MarketStats from '../components/MarketStats'

interface SavedJob {
  id: string
  dateSaved: string
  status: 'saved' | 'applied' | 'interview' | 'rejected'
  notes?: string
}

export default function JobSearch() {
  const [query, setQuery] = useState('')
  const [jobs, setJobs] = useState<JobAd[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [savedJobs, setSavedJobs] = useState<Record<string, SavedJob>>({})
  const [selectedJob, setSelectedJob] = useState<JobAd | null>(null)
  const [showCVMatcher, setShowCVMatcher] = useState(false)
  const [showQuickApply, setShowQuickApply] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [appliedJobs] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('job-applications')
    return saved ? new Set(JSON.parse(saved).map((a: any) => a.jobId)) : new Set()
  })
  const [filters, setFilters] = useState<SearchFilters>({
    limit: 10,
  })
  const [showFilters, setShowFilters] = useState(false)

  const LIMIT = 10

  // Ladda sparade jobb från localStorage
  useEffect(() => {
    const saved = localStorage.getItem('saved-jobs')
    if (saved) {
      setSavedJobs(JSON.parse(saved))
    }
  }, [])

  // Spara sparade jobb
  useEffect(() => {
    localStorage.setItem('saved-jobs', JSON.stringify(savedJobs))
  }, [savedJobs])

  // Sök jobb
  const searchJobs = useCallback(async () => {
    if (!query.trim() && !filters.occupation) {
      setJobs([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await afApi.searchJobs({
        ...filters,
        q: query || undefined,
        offset,
        limit: LIMIT,
      })
      setJobs(response.hits)
      setTotal(response.total.value)
    } catch (err) {
      setError('Kunde inte hämta jobbannonser. Försök igen senare.')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }, [query, filters, offset])

  // Sök när query/filters/offset ändras
  useEffect(() => {
    const timeout = setTimeout(() => {
      searchJobs()
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchJobs])

  // Spara/ta bort sparat jobb
  const toggleSaveJob = (job: JobAd) => {
    setSavedJobs(prev => {
      const newSaved = { ...prev }
      if (newSaved[job.id]) {
        delete newSaved[job.id]
      } else {
        newSaved[job.id] = {
          id: job.id,
          dateSaved: new Date().toISOString(),
          status: 'saved',
        }
      }
      return newSaved
    })
  }

  // Formatera datum
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Inget slutdatum'
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Utgången'
    if (diffDays === 0) return 'Sista dagen!'
    if (diffDays === 1) return '1 dag kvar'
    if (diffDays <= 7) return `${diffDays} dagar kvar`
    
    return date.toLocaleDateString('sv-SE')
  }

  // Trunkera text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setOffset(0)
  }

  const handleApplied = () => {
    setShowQuickApply(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sök jobb</h1>
          <p className="text-slate-500 mt-1">
            {total > 0 ? `${total.toLocaleString('sv-SE')} jobb hittades` : 'Sök bland alla lediga jobb i Sverige'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a 
            href="https://arbetsformedlingen.se" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            Data från Arbetsförmedlingen
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Sök på yrke, företag eller nyckelord..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setOffset(0)
              }}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
              ${showFilters 
                ? 'bg-teal-600 text-white' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }
            `}
          >
            <Filter size={18} />
            Filter
          </button>
        </div>

        {/* Popular searches */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">Populärt:</span>
          {POPULAR_QUERIES.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setQuery(item.query)
                setOffset(0)
              }}
              className="px-3 py-1 text-sm bg-slate-100 hover:bg-teal-100 text-slate-700 hover:text-teal-700 rounded-full transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Omfattning</label>
              <select
                value={filters.employment_type || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  employment_type: e.target.value || undefined 
                }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Alla typer</option>
                <option value="Vanlig anställning">Tillsvidare</option>
                <option value="Tidsbegränsad anställning">Visstid</option>
                <option value="Arbete på deltid">Deltid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Distansarbete</label>
              <select
                value={filters.remote === undefined ? '' : String(filters.remote)}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  remote: e.target.value === '' ? undefined : e.target.value === 'true'
                }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Alla</option>
                <option value="true">Distans möjligt</option>
                <option value="false">På plats</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Erfarenhet</label>
              <select
                value={filters.experience === undefined ? '' : String(filters.experience)}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  experience: e.target.value === '' ? undefined : e.target.value === 'true'
                }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Alla</option>
                <option value="false">Ingen erfarenhet krävs</option>
                <option value="true">Erfarenhet krävs</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <span className="ml-3 text-slate-600">Söker jobb...</span>
        </div>
      )}

      {/* Job list */}
      {!loading && jobs.length > 0 && (
        <div className="space-y-4">
          {jobs.map((job) => {
            const isSaved = !!savedJobs[job.id]
            const deadlineColor = job.application_deadline 
              ? new Date(job.application_deadline) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                ? 'text-red-600 bg-red-50'
                : 'text-slate-600 bg-slate-100'
              : 'text-slate-600 bg-slate-100'

            return (
              <div
                key={job.id}
                className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Main content */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 text-lg">{job.headline}</h3>
                        <p className="text-slate-600">{job.employer.name}</p>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                          {job.workplace_address?.municipality && (
                            <span className="flex items-center gap-1">
                              <MapPin size={14} />
                              {job.workplace_address.municipality}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            Publicerad {new Date(job.publication_date).toLocaleDateString('sv-SE')}
                          </span>
                          {job.employment_type && (
                            <span className="flex items-center gap-1">
                              <Briefcase size={14} />
                              {job.employment_type.label}
                            </span>
                          )}
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${deadlineColor}`}>
                            <Clock size={14} />
                            {formatDate(job.application_deadline)}
                          </span>
                        </div>

                        {/* Description preview */}
                        <p className="text-sm text-slate-600 mt-3 line-clamp-2">
                          {truncateText(job.description?.text || '', 200)}
                        </p>

                        {/* Skills */}
                        {job.must_have?.skills && job.must_have.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {job.must_have.skills.slice(0, 5).map((skill, idx) => (
                              <span 
                                key={idx}
                                className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full"
                              >
                                {skill.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col items-center lg:items-end gap-2">
                    <button
                      onClick={() => toggleSaveJob(job)}
                      className={`
                        p-2 rounded-lg transition-colors
                        ${isSaved 
                          ? 'text-teal-600 bg-teal-50' 
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        }
                      `}
                      title={isSaved ? 'Ta bort från sparade' : 'Spara jobb'}
                    >
                      {isSaved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                    </button>
                    
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
                    >
                      Läs mer
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              disabled={offset === 0}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
              Föregående
            </button>
            <span className="text-sm text-slate-500">
              Visar {offset + 1}-{Math.min(offset + LIMIT, total)} av {total.toLocaleString('sv-SE')}
            </span>
            <button
              onClick={() => setOffset(offset + LIMIT)}
              disabled={offset + LIMIT >= total}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Nästa
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && jobs.length === 0 && query && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Inga jobb hittades</h3>
          <p className="text-slate-500 mb-4">Prova att ändra din sökning eller filter</p>
          <button
            onClick={() => {
              setQuery('')
              setFilters({ limit: 10 })
            }}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700"
          >
            Rensa sökning
          </button>
        </div>
      )}

      {/* Initial state */}
      {!loading && !error && jobs.length === 0 && !query && (
        <div className="text-center py-12">
          <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Börja söka jobb</h3>
          <p className="text-slate-500">Skriv ett sökord ovan eller klicka på en populär kategori</p>
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedJob.headline}</h2>
                <p className="text-slate-600">{selectedJob.employer.name}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Quick info */}
              <div className="flex flex-wrap gap-3">
                {selectedJob.workplace_address?.municipality && (
                  <span className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm">
                    <MapPin size={14} />
                    {selectedJob.workplace_address.municipality}
                  </span>
                )}
                {selectedJob.employment_type && (
                  <span className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm">
                    <Briefcase size={14} />
                    {selectedJob.employment_type.label}
                  </span>
                )}
                <span className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                  new Date(selectedJob.application_deadline || '') < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                    ? 'text-red-700 bg-red-100'
                    : 'text-slate-700 bg-slate-100'
                }`}>
                  <Clock size={14} />
                  Sista ansökningsdag: {formatDate(selectedJob.application_deadline)}
                </span>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Om jobbet</h3>
                <div 
                  className="prose prose-slate max-w-none text-slate-600"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedJob.description?.text_formatted || selectedJob.description?.text || '' 
                  }}
                />
              </div>

              {/* Requirements */}
              {selectedJob.must_have?.skills && selectedJob.must_have.skills.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Krav</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.must_have.skills.map((skill, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm"
                      >
                        {skill.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact */}
              {(selectedJob.employer.email || selectedJob.employer.phone_number) && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Kontakt</h3>
                  <div className="space-y-1 text-sm text-slate-600">
                    {selectedJob.employer.email && (
                      <p>E-post: {selectedJob.employer.email}</p>
                    )}
                    {selectedJob.employer.phone_number && (
                      <p>Telefon: {selectedJob.employer.phone_number}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Application */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">Ansökan</h3>
                <div className="flex flex-wrap gap-3">
                  {selectedJob.application_details?.url ? (
                    <a
                      href={selectedJob.application_details.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
                    >
                      <ExternalLink size={18} />
                      Ansök nu
                    </a>
                  ) : selectedJob.application_details?.email ? (
                    <a
                      href={`mailto:${selectedJob.application_details.email}`}
                      className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
                    >
                      <Mail size={18} />
                      Skicka ansökan
                    </a>
                  ) : (
                    <button className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors">
                      <Star size={18} />
                      Via Arbetsförmedlingen
                    </button>
                  )}
                  
                  <button
                    onClick={() => toggleSaveJob(selectedJob)}
                    className={`
                      flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
                      ${savedJobs[selectedJob.id]
                        ? 'bg-teal-100 text-teal-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }
                    `}
                  >
                    {savedJobs[selectedJob.id] ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                    {savedJobs[selectedJob.id] ? 'Sparad' : 'Spara jobb'}
                  </button>
                  
                  {/* Quick Apply Button */}
                  {!appliedJobs.has(selectedJob.id) && (
                    <button
                      onClick={() => setShowQuickApply(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-medium hover:from-teal-700 hover:to-emerald-700 transition-colors"
                    >
                      <Send size={18} />
                      Snabbansök
                    </button>
                  )}
                  
                  {appliedJobs.has(selectedJob.id) && (
                    <span className="flex items-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-lg font-medium">
                      <CheckCircle size={18} />
                      Ansökt
                    </span>
                  )}
                  
                  {/* CV Match Button */}
                  <button
                    onClick={() => setShowCVMatcher(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors"
                  >
                    <Target size={18} />
                    Kolla matchning
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Job Recommendations */}
      {query && !loading && (
        <JobRecommendations 
          query={query} 
          onSuggestionClick={handleSuggestionClick}
        />
      )}
      
      {/* Market Stats Button */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30">
        <button
          onClick={() => setShowStats(true)}
          className="px-4 py-2 bg-white text-slate-700 rounded-full shadow-lg border border-slate-200 hover:shadow-xl transition-all flex items-center gap-2"
        >
          <BarChart3 size={18} />
          <span className="hidden sm:inline">Marknadsstatistik</span>
        </button>
      </div>
      
      {/* Notifications Center */}
      <NotificationsCenter />
      
      {/* CV Matcher Modal */}
      {showCVMatcher && selectedJob && (
        <CVMatcher 
          job={selectedJob} 
          onClose={() => setShowCVMatcher(false)}
        />
      )}
      
      {/* Quick Apply Modal */}
      {showQuickApply && selectedJob && (
        <QuickApply
          job={selectedJob}
          onClose={() => setShowQuickApply(false)}
          onApplied={handleApplied}
        />
      )}
      
      {/* Market Stats Modal */}
      {showStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Marknadsstatistik</h2>
              <button
                onClick={() => setShowStats(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <MarketStats />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
