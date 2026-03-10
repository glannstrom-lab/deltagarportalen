import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Briefcase, 
  BookOpen, 
  FileText, 
  Heart, 
  Bookmark,
  ChevronRight,
  Trash2,
  ExternalLink,
  Loader2,
  Sparkles,
  Target,
  Calendar,
  Building2,
  MapPin,
  Clock,
  Star,
  TrendingUp,
  Download,
  Share2,
  FileCheck
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { savedJobsApi, articleBookmarksApi } from '@/services/cloudStorage'
import { cvApi, coverLetterApi, interestApi } from '@/services/supabaseApi'

// Types
interface SavedJob {
  id: string
  job_id: string
  job_data: {
    headline?: string
    employer?: { name?: string }
    workplace_address?: { municipality?: string }
    publication_date?: string
    application_deadline?: string
  }
  status: 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'REJECTED' | 'ACCEPTED'
  created_at: string
}

interface BookmarkedArticle {
  id: string
  title: string
  category: string
  readingTime?: number
  summary?: string
}

interface CoverLetter {
  id: string
  title: string
  company?: string
  job_title?: string
  created_at: string
  ai_generated: boolean
}

interface CVVersion {
  id: string
  name: string
  created_at: string
}

interface InterestResult {
  completed_at: string
  recommended_jobs?: string[]
}

const statusLabels: Record<string, { label: string; color: string }> = {
  'SAVED': { label: 'Sparad', color: 'bg-slate-100 text-slate-700' },
  'APPLIED': { label: 'Ansökt', color: 'bg-blue-100 text-blue-700' },
  'INTERVIEW': { label: 'Intervju', color: 'bg-purple-100 text-purple-700' },
  'REJECTED': { label: 'Avslag', color: 'bg-red-100 text-red-700' },
  'ACCEPTED': { label: 'Erbjudande', color: 'bg-green-100 text-green-700' },
}

export default function Resources() {
  const [activeTab, setActiveTab] = useState<'all' | 'jobs' | 'articles' | 'documents'>('all')
  const [loading, setLoading] = useState(true)
  
  // Data states
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [bookmarkedArticles, setBookmarkedArticles] = useState<BookmarkedArticle[]>([])
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [cvVersions, setCvVersions] = useState<CVVersion[]>([])
  const [interestResult, setInterestResult] = useState<InterestResult | null>(null)
  const [hasCV, setHasCV] = useState(false)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      // Load saved jobs
      const jobs = await savedJobsApi.getAll()
      setSavedJobs(jobs)

      // Load bookmarked articles
      const bookmarks = await articleBookmarksApi.getAll()
      setBookmarkedArticles(bookmarks)

      // Load cover letters
      const letters = await coverLetterApi.getAll()
      setCoverLetters(letters)

      // Load CV versions
      const versions = await cvApi.getVersions()
      setCvVersions(versions)

      // Check if user has a CV
      const cv = await cvApi.getCV()
      setHasCV(!!cv)

      // Load interest guide result
      const interest = await interestApi.getResult()
      if (interest) {
        setInterestResult({
          completed_at: interest.completed_at,
          recommended_jobs: interest.recommended_jobs
        })
      }
    } catch (error) {
      console.error('Fel vid laddning av resurser:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    try {
      await savedJobsApi.delete(jobId)
      setSavedJobs(prev => prev.filter(j => j.job_id !== jobId))
    } catch (error) {
      console.error('Fel vid borttagning:', error)
    }
  }

  const handleRemoveBookmark = async (articleId: string) => {
    try {
      await articleBookmarksApi.remove(articleId)
      setBookmarkedArticles(prev => prev.filter(a => a.id !== articleId))
    } catch (error) {
      console.error('Fel vid borttagning av bokmärke:', error)
    }
  }

  const totalItems = savedJobs.length + bookmarkedArticles.length + coverLetters.length + cvVersions.length + (hasCV ? 1 : 0) + (interestResult ? 1 : 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3 mb-2">
          <Bookmark className="text-indigo-600" size={32} />
          Resurser och Dokument
        </h1>
        <p className="text-slate-600">
          Allt ditt sparade material samlat på ett ställe. Här hittar du dina sparade jobb, 
          bokmärkta artiklar, CV, personliga brev och intresseguide-resultat.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{savedJobs.length}</p>
              <p className="text-sm text-slate-600">Sparade jobb</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{bookmarkedArticles.length}</p>
              <p className="text-sm text-slate-600">Bokmärkta artiklar</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{coverLetters.length}</p>
              <p className="text-sm text-slate-600">Personliga brev</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{cvVersions.length + (hasCV ? 1 : 0)}</p>
              <p className="text-sm text-slate-600">CV-versioner</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Allt ({totalItems})
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'jobs'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4 inline mr-1" />
          Jobb ({savedJobs.length})
        </button>
        <button
          onClick={() => setActiveTab('articles')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'articles'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-1" />
          Artiklar ({bookmarkedArticles.length})
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'documents'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-1" />
          Dokument ({coverLetters.length + cvVersions.length + (hasCV ? 1 : 0)})
        </button>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* Saved Jobs */}
        {(activeTab === 'all' || activeTab === 'jobs') && savedJobs.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <Briefcase className="text-blue-600" size={24} />
                Sparade jobb
              </h2>
              <Link 
                to="/dashboard/job-tracker"
                className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
              >
                Se alla i jobbtracker
                <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid gap-3">
              {savedJobs.slice(0, activeTab === 'all' ? 3 : undefined).map((job) => (
                <div 
                  key={job.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800">
                          {job.job_data?.headline || 'Jobbannons'}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusLabels[job.status]?.color || 'bg-slate-100'}`}>
                          {statusLabels[job.status]?.label || job.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        {job.job_data?.employer?.name && (
                          <span className="flex items-center gap-1">
                            <Building2 size={14} />
                            {job.job_data.employer.name}
                          </span>
                        )}
                        {job.job_data?.workplace_address?.municipality && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {job.job_data.workplace_address.municipality}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          Sparad {new Date(job.created_at).toLocaleDateString('sv-SE')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/dashboard/job-search`}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Visa jobb"
                      >
                        <ExternalLink size={18} />
                      </Link>
                      <button
                        onClick={() => handleDeleteJob(job.job_id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Ta bort"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bookmarked Articles */}
        {(activeTab === 'all' || activeTab === 'articles') && bookmarkedArticles.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <BookOpen className="text-teal-600" size={24} />
                Bokmärkta artiklar
              </h2>
              <Link 
                to="/dashboard/knowledge-base"
                className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
              >
                Utforska kunskapsbanken
                <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {bookmarkedArticles.map((article) => (
                <div 
                  key={article.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <span className="inline-block px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded-full mb-2">
                        {article.category}
                      </span>
                      <h3 className="font-medium text-slate-800 mb-1 line-clamp-2">
                        {article.title}
                      </h3>
                      {article.readingTime && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock size={12} />
                          {article.readingTime} min läsning
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/dashboard/knowledge-base/${article.id}`}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Läs artikel"
                      >
                        <ExternalLink size={18} />
                      </Link>
                      <button
                        onClick={() => handleRemoveBookmark(article.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Ta bort bokmärke"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Documents Section */}
        {(activeTab === 'all' || activeTab === 'documents') && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* CV */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <FileCheck className="text-amber-600" size={24} />
                  CV
                </h2>
                <Link 
                  to="/dashboard/cv"
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Hantera CV
                </Link>
              </div>
              
              {hasCV ? (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <FileCheck className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-800">Mitt CV</h3>
                      <p className="text-sm text-slate-500">Aktivt CV</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to="/dashboard/cv"
                      className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors text-center"
                    >
                      Redigera
                    </Link>
                    <button
                      className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                  
                  {cvVersions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-sm font-medium text-slate-700 mb-2">Tidigare versioner</p>
                      <div className="space-y-2">
                        {cvVersions.slice(0, 3).map((version) => (
                          <div key={version.id} className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">{version.name}</span>
                            <span className="text-slate-400 text-xs">
                              {new Date(version.created_at).toLocaleDateString('sv-SE')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6 text-center">
                  <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium mb-2">Inget CV ännu</p>
                  <p className="text-slate-500 text-sm mb-4">Skapa ditt CV för att komma igång med jobbsökningen</p>
                  <Link
                    to="/dashboard/cv"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Sparkles size={16} />
                    Skapa CV
                  </Link>
                </div>
              )}
            </section>

            {/* Cover Letters */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <FileText className="text-purple-600" size={24} />
                  Personliga brev
                </h2>
                <Link 
                  to="/dashboard/cover-letter"
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Skapa nytt
                </Link>
              </div>
              
              {coverLetters.length > 0 ? (
                <div className="space-y-3">
                  {coverLetters.slice(0, activeTab === 'all' ? 3 : undefined).map((letter) => (
                    <div 
                      key={letter.id}
                      className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-800 mb-1">{letter.title}</h3>
                          <div className="text-sm text-slate-500">
                            {letter.company && <span>{letter.company}</span>}
                            {letter.company && letter.job_title && <span> • </span>}
                            {letter.job_title && <span>{letter.job_title}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {letter.ai_generated && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                <Sparkles size={10} />
                                AI-genererad
                              </span>
                            )}
                            <span className="text-xs text-slate-400">
                              {new Date(letter.created_at).toLocaleDateString('sv-SE')}
                            </span>
                          </div>
                        </div>
                        <Link
                          to={`/dashboard/cover-letter`}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Visa brev"
                        >
                          <ExternalLink size={18} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium mb-2">Inga personliga brev ännu</p>
                  <p className="text-slate-500 text-sm mb-4">Skapa personliga brev för dina jobbansökningar</p>
                  <Link
                    to="/dashboard/cover-letter"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Sparkles size={16} />
                    Skapa brev
                  </Link>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Interest Guide Result */}
        {(activeTab === 'all' || activeTab === 'documents') && interestResult && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <Target className="text-pink-600" size={24} />
                Intresseguide
              </h2>
              <Link 
                to="/dashboard/interest-guide"
                className="text-sm text-indigo-600 hover:underline"
              >
                Gör om guiden
              </Link>
            </div>
            
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl border border-pink-100 p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 mb-1">Din intresseguide är klar!</h3>
                  <p className="text-slate-600 text-sm mb-3">
                    Du slutförde intresseguiden {new Date(interestResult.completed_at).toLocaleDateString('sv-SE')}.
                    {interestResult.recommended_jobs && interestResult.recommended_jobs.length > 0 && (
                      <span> Vi har identifierat {interestResult.recommended_jobs.length} yrken som kan passa dig.</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to="/dashboard/interest-guide"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white text-pink-700 text-sm font-medium rounded-lg hover:bg-pink-50 transition-colors border border-pink-200"
                    >
                      <TrendingUp size={16} />
                      Se resultat
                    </Link>
                    <Link
                      to="/dashboard/career"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors"
                    >
                      <Sparkles size={16} />
                      Utforska yrken
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Empty State */}
        {totalItems === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Inga sparade resurser ännu</h3>
            <p className="text-slate-600 max-w-md mx-auto mb-6">
              När du sparar jobb, bokmärker artiklar eller skapar dokument kommer de att visas här.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/dashboard/job-search"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Briefcase size={18} />
                Sök jobb
              </Link>
              <Link
                to="/dashboard/knowledge-base"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <BookOpen size={18} />
                Utforska artiklar
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
