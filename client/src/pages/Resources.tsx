import { useState, useEffect, useRef } from 'react'
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
  FileCheck,
  Eye,
  X,
  FileDown,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileEdit
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { savedJobsApi, articleBookmarksApi } from '@/services/cloudStorage'
import { cvApi, coverLetterApi, interestApi } from '@/services/supabaseApi'
import jsPDF from 'jspdf'

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
    description?: { text?: string }
    webpage_url?: string
  }
  status: 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'REJECTED' | 'ACCEPTED'
  notes?: string
  created_at: string
}

interface BookmarkedArticle {
  id: string
  title: string
  category: string
  readingTime?: number
  summary?: string
  content?: string
}

interface CoverLetter {
  id: string
  title: string
  company?: string
  job_title?: string
  content: string
  created_at: string
  ai_generated: boolean
}

interface CVVersion {
  id: string
  name: string
  created_at: string
}

interface CVData {
  first_name?: string
  last_name?: string
  title?: string
  email?: string
  phone?: string
  location?: string
  summary?: string
  work_experience?: Array<{
    title: string
    company: string
    description?: string
    startDate?: string
    endDate?: string
    current?: boolean
  }>
  education?: Array<{
    degree: string
    school: string
    startDate?: string
    endDate?: string
  }>
  skills?: string[]
  languages?: Array<{
    language: string
    level: string
  }>
}

interface InterestResult {
  completed_at: string
  recommended_jobs?: string[]
  profile?: {
    riasec?: Record<string, number>
    bigFive?: Record<string, number>
  }
}

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  'SAVED': { label: 'Sparad', color: 'text-slate-600', bg: 'bg-slate-100' },
  'APPLIED': { label: 'Ansökt', color: 'text-blue-600', bg: 'bg-blue-100' },
  'INTERVIEW': { label: 'Intervju', color: 'text-purple-600', bg: 'bg-purple-100' },
  'REJECTED': { label: 'Avslag', color: 'text-red-600', bg: 'bg-red-100' },
  'ACCEPTED': { label: 'Erbjudande', color: 'text-green-600', bg: 'bg-green-100' },
}

// PDF Export Functions
function generateCVPDF(cvData: CVData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let y = 20

  // Header
  doc.setFontSize(24)
  doc.setTextColor(79, 70, 229)
  doc.text(`${cvData.first_name || ''} ${cvData.last_name || ''}`, margin, y)
  y += 10

  if (cvData.title) {
    doc.setFontSize(14)
    doc.setTextColor(100, 100, 100)
    doc.text(cvData.title, margin, y)
    y += 15
  }

  // Contact info
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  const contactInfo = []
  if (cvData.email) contactInfo.push(cvData.email)
  if (cvData.phone) contactInfo.push(cvData.phone)
  if (cvData.location) contactInfo.push(cvData.location)
  
  if (contactInfo.length > 0) {
    doc.text(contactInfo.join(' | '), margin, y)
    y += 10
  }

  // Summary
  if (cvData.summary) {
    doc.setFontSize(12)
    doc.setTextColor(79, 70, 229)
    doc.text('Sammanfattning', margin, y)
    y += 8
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    const splitSummary = doc.splitTextToSize(cvData.summary, pageWidth - 2 * margin)
    doc.text(splitSummary, margin, y)
    y += splitSummary.length * 5 + 10
  }

  // Work Experience
  if (cvData.work_experience && cvData.work_experience.length > 0) {
    doc.setFontSize(12)
    doc.setTextColor(79, 70, 229)
    doc.text('Arbetslivserfarenhet', margin, y)
    y += 8

    cvData.work_experience.forEach((job) => {
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      doc.setFontSize(11)
      doc.setTextColor(40, 40, 40)
      doc.text(job.title, margin, y)
      y += 6
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`${job.company} | ${job.startDate || ''} - ${job.current ? 'Nuvarande' : job.endDate || ''}`, margin, y)
      y += 6
      if (job.description) {
        doc.setFontSize(9)
        doc.setTextColor(80, 80, 80)
        const splitDesc = doc.splitTextToSize(job.description, pageWidth - 2 * margin)
        doc.text(splitDesc, margin, y)
        y += splitDesc.length * 4 + 8
      }
    })
  }

  // Education
  if (cvData.education && cvData.education.length > 0) {
    if (y > 220) {
      doc.addPage()
      y = 20
    }
    doc.setFontSize(12)
    doc.setTextColor(79, 70, 229)
    doc.text('Utbildning', margin, y)
    y += 8

    cvData.education.forEach((edu) => {
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      doc.setFontSize(11)
      doc.setTextColor(40, 40, 40)
      doc.text(edu.degree, margin, y)
      y += 6
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`${edu.school} | ${edu.startDate || ''} - ${edu.endDate || ''}`, margin, y)
      y += 8
    })
  }

  // Skills
  if (cvData.skills && cvData.skills.length > 0) {
    if (y > 250) {
      doc.addPage()
      y = 20
    }
    doc.setFontSize(12)
    doc.setTextColor(79, 70, 229)
    doc.text('Kompetenser', margin, y)
    y += 8
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    const skillsText = cvData.skills.map(s => typeof s === 'string' ? s : s.name).join(', ')
    const splitSkills = doc.splitTextToSize(skillsText, pageWidth - 2 * margin)
    doc.text(splitSkills, margin, y)
  }

  doc.save(`CV-${cvData.first_name || 'Mitt'}-${cvData.last_name || ''}.pdf`)
}

function generateCoverLetterPDF(letter: CoverLetter) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 25
  let y = 30

  // Header
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(new Date().toLocaleDateString('sv-SE'), margin, y)
  y += 20

  // Title
  doc.setFontSize(16)
  doc.setTextColor(40, 40, 40)
  doc.text('Personligt brev', margin, y)
  y += 10

  if (letter.company) {
    doc.setFontSize(12)
    doc.text(letter.company, margin, y)
    y += 6
  }
  if (letter.job_title) {
    doc.setFontSize(11)
    doc.setTextColor(80, 80, 80)
    doc.text(letter.job_title, margin, y)
    y += 15
  }

  // Content
  doc.setFontSize(11)
  doc.setTextColor(40, 40, 40)
  const splitContent = doc.splitTextToSize(letter.content, pageWidth - 2 * margin)
  doc.text(splitContent, margin, y)

  doc.save(`Personligt-brev-${letter.company || 'Allmant'}.pdf`)
}

export default function Resources() {
  const [activeTab, setActiveTab] = useState<'all' | 'jobs' | 'articles' | 'documents'>('all')
  const [loading, setLoading] = useState(true)
  const [previewModal, setPreviewModal] = useState<{type: 'cv' | 'letter' | 'job' | null, data: any}>({type: null, data: null})
  
  // Data states
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [bookmarkedArticles, setBookmarkedArticles] = useState<BookmarkedArticle[]>([])
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [cvVersions, setCvVersions] = useState<CVVersion[]>([])
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [interestResult, setInterestResult] = useState<InterestResult | null>(null)
  const [hasCV, setHasCV] = useState(false)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [jobs, bookmarks, letters, versions, cv, interest] = await Promise.all([
        savedJobsApi.getAll(),
        articleBookmarksApi.getAll(),
        coverLetterApi.getAll(),
        cvApi.getVersions(),
        cvApi.getCV(),
        interestApi.getResult()
      ])

      setSavedJobs(jobs)
      setBookmarkedArticles(bookmarks)
      setCoverLetters(letters)
      setCvVersions(versions)
      setCvData(cv)
      setHasCV(!!cv)

      if (interest) {
        setInterestResult({
          completed_at: interest.completed_at,
          recommended_jobs: interest.recommended_jobs,
          profile: interest.profile
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

  const handleDownloadCV = () => {
    if (cvData) {
      generateCVPDF(cvData)
    }
  }

  const handleDownloadLetter = (letter: CoverLetter) => {
    generateCoverLetterPDF(letter)
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
          Allt ditt material samlat på ett ställe. Förhandsgranska, ladda ner och hantera dina dokument.
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
        {[
          { id: 'all', label: 'Allt', count: totalItems },
          { id: 'jobs', label: 'Jobb', count: savedJobs.length, icon: Briefcase },
          { id: 'documents', label: 'Dokument', count: coverLetters.length + (hasCV ? 1 : 0), icon: FileText },
          { id: 'articles', label: 'Artiklar', count: bookmarkedArticles.length, icon: BookOpen },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.id ? 'bg-indigo-500' : 'bg-slate-100'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* CV Section - Always show if exists */}
        {(activeTab === 'all' || activeTab === 'documents') && hasCV && cvData && (
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">Mitt CV</h2>
                  <p className="text-sm text-slate-600">{cvData.first_name} {cvData.last_name}{cvData.title ? ` • ${cvData.title}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewModal({type: 'cv', data: cvData})}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-amber-700 rounded-lg font-medium hover:bg-amber-50 border border-amber-200 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Förhandsgranska
                </button>
                <button
                  onClick={handleDownloadCV}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  Ladda ner PDF
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Kontakt</h3>
                  <div className="space-y-1 text-sm">
                    {cvData.email && <p className="text-slate-700">{cvData.email}</p>}
                    {cvData.phone && <p className="text-slate-700">{cvData.phone}</p>}
                    {cvData.location && <p className="text-slate-700">{cvData.location}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Erfarenhet</h3>
                  <p className="text-2xl font-bold text-slate-800">{cvData.work_experience?.length || 0}</p>
                  <p className="text-sm text-slate-600">Anställningar</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Utbildning</h3>
                  <p className="text-2xl font-bold text-slate-800">{cvData.education?.length || 0}</p>
                  <p className="text-sm text-slate-600">Utbildningar</p>
                </div>
              </div>
              
              {cvData.skills && cvData.skills.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">Kompetenser</h3>
                  <div className="flex flex-wrap gap-2">
                    {cvData.skills.slice(0, 10).map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                        {typeof skill === 'string' ? skill : skill.name}
                      </span>
                    ))}
                    {cvData.skills.length > 10 && (
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-sm">
                        +{cvData.skills.length - 10} till
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {cvVersions.length > 0 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Tidigare versioner</h3>
                <div className="space-y-2">
                  {cvVersions.slice(0, 3).map((version) => (
                    <div key={version.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                      <span className="text-sm text-slate-600">{version.name}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(version.created_at).toLocaleDateString('sv-SE')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Cover Letters Section */}
        {(activeTab === 'all' || activeTab === 'documents') && coverLetters.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="text-purple-600" size={24} />
              Personliga brev
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {coverLetters.map((letter) => (
                <div key={letter.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-800">{letter.title}</h3>
                        {letter.company && (
                          <p className="text-sm text-slate-500">{letter.company}{letter.job_title && ` • ${letter.job_title}`}</p>
                        )}
                      </div>
                      {letter.ai_generated && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          AI
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                      {letter.content.substring(0, 150)}...
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewModal({type: 'letter', data: letter})}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Läs
                      </button>
                      <button
                        onClick={() => handleDownloadLetter(letter)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                      >
                        <FileDown className="w-4 h-4" />
                        PDF
                      </button>
                    </div>
                  </div>
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
                    Skapad {new Date(letter.created_at).toLocaleDateString('sv-SE')}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Saved Jobs Section */}
        {(activeTab === 'all' || activeTab === 'jobs') && savedJobs.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Briefcase className="text-blue-600" size={24} />
                Sparade jobb
              </h2>
              <Link to="/dashboard/job-tracker" className="text-sm text-indigo-600 hover:underline">
                Öppna jobbtracker →
              </Link>
            </div>
            <div className="space-y-3">
              {savedJobs.slice(0, activeTab === 'all' ? 3 : undefined).map((job) => (
                <div key={job.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800">{job.job_data?.headline || 'Jobbannons'}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusLabels[job.status]?.bg} ${statusLabels[job.status]?.color}`}>
                          {statusLabels[job.status]?.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-3">
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
                      </div>
                      {job.notes && (
                        <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg mb-3">
                          <span className="font-medium">Dina anteckningar:</span> {job.notes}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewModal({type: 'job', data: job})}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                          Visa detaljer
                        </button>
                        {job.job_data?.webpage_url && (
                          <a
                            href={job.job_data.webpage_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <ExternalLink size={16} />
                            Öppna annons
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteJob(job.job_id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bookmarked Articles */}
        {(activeTab === 'all' || activeTab === 'articles') && bookmarkedArticles.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen className="text-teal-600" size={24} />
              Bokmärkta artiklar
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {bookmarkedArticles.map((article) => (
                <Link
                  key={article.id}
                  to={`/dashboard/knowledge-base/${article.id}`}
                  className="block bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded-full mb-2">
                        {article.category}
                      </span>
                      <h3 className="font-medium text-slate-800 mb-1">{article.title}</h3>
                      {article.readingTime && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock size={12} />
                          {article.readingTime} min läsning
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleRemoveBookmark(article.id)
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Interest Guide Result */}
        {(activeTab === 'all' || activeTab === 'documents') && interestResult && (
          <section className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl border border-pink-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-800 mb-1">Din intresseguide</h2>
                <p className="text-slate-600 text-sm mb-4">
                  Slutförd {new Date(interestResult.completed_at).toLocaleDateString('sv-SE')}
                  {interestResult.recommended_jobs && (
                    <span> • {interestResult.recommended_jobs.length} yrkesförslag</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/dashboard/interest-guide"
                    className="px-4 py-2 bg-white text-pink-700 rounded-lg font-medium hover:bg-pink-50 border border-pink-200 transition-colors"
                  >
                    Se resultat
                  </Link>
                  <Link
                    to="/dashboard/career"
                    className="px-4 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors"
                  >
                    Utforska yrken
                  </Link>
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
              När du sparar jobb, skapar dokument eller bokmärker artiklar kommer de att visas här.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/dashboard/cv" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Skapa CV
              </Link>
              <Link to="/dashboard/job-search" className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50">
                Sök jobb
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewModal.type && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                {previewModal.type === 'cv' && 'Förhandsgranska CV'}
                {previewModal.type === 'letter' && previewModal.data.title}
                {previewModal.type === 'job' && previewModal.data.job_data?.headline}
              </h3>
              <button
                onClick={() => setPreviewModal({type: null, data: null})}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {previewModal.type === 'cv' && cvData && (
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-4">
                    <h1 className="text-2xl font-bold text-slate-800">{cvData.first_name} {cvData.last_name}</h1>
                    {cvData.title && <p className="text-lg text-slate-600">{cvData.title}</p>}
                    <div className="mt-2 text-sm text-slate-500 space-y-1">
                      {cvData.email && <p>{cvData.email}</p>}
                      {cvData.phone && <p>{cvData.phone}</p>}
                      {cvData.location && <p>{cvData.location}</p>}
                    </div>
                  </div>
                  
                  {cvData.summary && (
                    <div>
                      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Sammanfattning</h2>
                      <p className="text-slate-700">{cvData.summary}</p>
                    </div>
                  )}

                  {cvData.work_experience && cvData.work_experience.length > 0 && (
                    <div>
                      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Arbetslivserfarenhet</h2>
                      <div className="space-y-4">
                        {cvData.work_experience.map((job, i) => (
                          <div key={i}>
                            <h3 className="font-medium text-slate-800">{job.title}</h3>
                            <p className="text-slate-600">{job.company}</p>
                            <p className="text-sm text-slate-500">
                              {job.startDate} - {job.current ? 'Nuvarande' : job.endDate}
                            </p>
                            {job.description && <p className="text-sm text-slate-600 mt-1">{job.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {cvData.education && cvData.education.length > 0 && (
                    <div>
                      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Utbildning</h2>
                      <div className="space-y-3">
                        {cvData.education.map((edu, i) => (
                          <div key={i}>
                            <h3 className="font-medium text-slate-800">{edu.degree}</h3>
                            <p className="text-slate-600">{edu.school}</p>
                            <p className="text-sm text-slate-500">{edu.startDate} - {edu.endDate}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {cvData.skills && cvData.skills.length > 0 && (
                    <div>
                      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Kompetenser</h2>
                      <div className="flex flex-wrap gap-2">
                        {cvData.skills.map((skill, i) => (
                          <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                            {typeof skill === 'string' ? skill : skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {previewModal.type === 'letter' && (
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                    {previewModal.data.content}
                  </div>
                </div>
              )}

              {previewModal.type === 'job' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusLabels[previewModal.data.status]?.bg} ${statusLabels[previewModal.data.status]?.color}`}>
                      {statusLabels[previewModal.data.status]?.label}
                    </span>
                  </div>
                  
                  {previewModal.data.job_data?.description?.text && (
                    <div className="prose max-w-none">
                      <div 
                        className="text-slate-700"
                        dangerouslySetInnerHTML={{ 
                          __html: previewModal.data.job_data.description.text.substring(0, 2000) + '...' 
                        }}
                      />
                    </div>
                  )}
                  
                  {previewModal.data.notes && (
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                      <h4 className="font-medium text-amber-800 mb-1">Dina anteckningar</h4>
                      <p className="text-amber-700">{previewModal.data.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setPreviewModal({type: null, data: null})}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Stäng
              </button>
              {previewModal.type === 'cv' && (
                <button
                  onClick={() => {
                    handleDownloadCV()
                    setPreviewModal({type: null, data: null})
                  }}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
                >
                  <FileDown size={18} />
                  Ladda ner PDF
                </button>
              )}
              {previewModal.type === 'letter' && (
                <button
                  onClick={() => {
                    handleDownloadLetter(previewModal.data)
                    setPreviewModal({type: null, data: null})
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <FileDown size={18} />
                  Ladda ner PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
