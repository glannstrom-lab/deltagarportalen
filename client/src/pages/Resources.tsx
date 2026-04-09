/**
 * Resources Page - Redesigned with modern UI and better organization
 * All documents, files, and resources in one place
 */

import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  Building2,
  MapPin,
  Clock,
  Download,
  Eye,
  X,
  FileDown,
  CheckCircle2,
  FileEdit,
  Upload,
  Folder,
  File,
  Image as ImageIcon,
  MoreVertical,
  Edit2,
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  TrendingUp,
  Award,
  Briefcase as BriefcaseIcon,
  FileText as DocumentText,
  Star
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { savedJobsApi, articleBookmarksApi } from '@/services/cloudStorage'
import { cvApi, coverLetterApi, interestApi } from '@/services/supabaseApi'
import { PageLayout } from '@/components/layout/index'
import { resourcesTabs } from '@/data/pageTabs'
// NOTE: jsPDF is dynamically imported in PDF generation functions to reduce bundle size

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

interface UploadedFile {
  id: string
  name: string
  type: 'CV' | 'COVER_LETTER' | 'OTHER'
  url: string
  size: number
  uploaded_at: string
}

const statusLabels: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  'SAVED': { label: 'Sparad', color: 'text-slate-600', bg: 'bg-slate-100', icon: Bookmark },
  'APPLIED': { label: 'Ansökt', color: 'text-blue-600', bg: 'bg-blue-100', icon: CheckCircle2 },
  'INTERVIEW': { label: 'Intervju', color: 'text-purple-600', bg: 'bg-purple-100', icon: Sparkles },
  'REJECTED': { label: 'Avslag', color: 'text-red-600', bg: 'bg-red-100', icon: X },
  'ACCEPTED': { label: 'Erbjudande', color: 'text-green-600', bg: 'bg-green-100', icon: Award },
}

// Quick Stats Card Component
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  link,
  subtitle
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
  link?: string
  subtitle?: string
}) {
  const content = (
    <div className={`bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all group ${link ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {link && (
          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-600 transition-colors" />
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-slate-800">{value}</p>
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {subtitle && <p className="text-xs text-slate-600 mt-1">{subtitle}</p>}
      </div>
    </div>
  )

  if (link) {
    return <Link to={link}>{content}</Link>
  }
  return content
}

// Document Card Component
function DocumentCard({
  title,
  subtitle,
  type,
  date,
  actions,
  icon: Icon,
  color
}: {
  title: string
  subtitle?: string
  type: string
  date: string
  actions: React.ReactNode
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-800 truncate">{title}</h3>
                {subtitle && <p className="text-sm text-slate-700">{subtitle}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">{type}</span>
                  <span className="text-xs text-slate-600">{date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        {actions}
      </div>
    </div>
  )
}

// PDF Export Functions
async function generateCVPDF(cvData: CVData) {
  // Dynamic import to reduce initial bundle size
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let y = 20

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

  if (cvData.work_experience && cvData.work_experience.length > 0) {
    doc.setFontSize(12)
    doc.setTextColor(79, 70, 229)
    doc.text('Arbetslivserfarenhet', margin, y)
    y += 8

    cvData.work_experience.forEach((job) => {
      if (y > 250) { doc.addPage(); y = 20 }
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

  if (cvData.education && cvData.education.length > 0) {
    if (y > 220) { doc.addPage(); y = 20 }
    doc.setFontSize(12)
    doc.setTextColor(79, 70, 229)
    doc.text('Utbildning', margin, y)
    y += 8

    cvData.education.forEach((edu) => {
      if (y > 250) { doc.addPage(); y = 20 }
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

  if (cvData.skills && cvData.skills.length > 0) {
    if (y > 250) { doc.addPage(); y = 20 }
    doc.setFontSize(12)
    doc.setTextColor(79, 70, 229)
    doc.text('Kompetenser', margin, y)
    y += 8
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    const skillsText = cvData.skills.map(s => typeof s === 'string' ? s : (s as { name: string }).name).join(', ')
    const splitSkills = doc.splitTextToSize(skillsText, pageWidth - 2 * margin)
    doc.text(splitSkills, margin, y)
  }

  doc.save(`CV-${cvData.first_name || 'Mitt'}-${cvData.last_name || ''}.pdf`)
}

async function generateCoverLetterPDF(letter: CoverLetter) {
  // Dynamic import to reduce initial bundle size
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const margin = 25
  let y = 30

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(new Date().toLocaleDateString('sv-SE'), margin, y)
  y += 20

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

  doc.setFontSize(11)
  doc.setTextColor(40, 40, 40)
  const splitContent = doc.splitTextToSize(letter.content, 170)
  doc.text(splitContent, margin, y)

  doc.save(`Personligt-brev-${letter.company || 'Mitt'}.pdf`)
}

// Main Component
export default function Resources() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'all'
  
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [bookmarkedArticles, setBookmarkedArticles] = useState<BookmarkedArticle[]>([])
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [cvVersions, setCvVersions] = useState<CVVersion[]>([])
  const [hasCV, setHasCV] = useState(false)
  const [interestResult, setInterestResult] = useState<InterestResult | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [previewModal, setPreviewModal] = useState<{type: string, data: CVData | CoverLetter | SavedJob} | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [jobs, bookmarks, letters, cv, versions, interest, files] = await Promise.all([
        savedJobsApi.getAll(),
        articleBookmarksApi.getBookmarks(),
        coverLetterApi.getAll(),
        cvApi.getCV(),
        cvApi.getVersions(),
        interestApi.getResults(),
        Promise.resolve([]), // uploaded files
      ])

      setSavedJobs(jobs || [])
      setBookmarkedArticles(bookmarks || [])
      setCoverLetters(letters || [])
      setCvData(cv)
      setHasCV(!!cv)
      setCvVersions(versions || [])
      setInterestResult(interest)
      setUploadedFiles(files)
    } catch (error) {
      console.error('Error loading resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    await savedJobsApi.delete(jobId)
    setSavedJobs(prev => prev.filter(j => j.job_id !== jobId))
  }

  const handleRemoveBookmark = async (articleId: string) => {
    await articleBookmarksApi.removeBookmark(articleId)
    setBookmarkedArticles(prev => prev.filter(a => a.id !== articleId))
  }

  const handleDeleteFile = async (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleDownloadCV = async () => {
    if (cvData) await generateCVPDF(cvData)
  }

  const handleDownloadLetter = async (letter: CoverLetter) => {
    await generateCoverLetterPDF(letter)
  }

  // Filtered data
  const filteredJobs = useMemo(() => {
    if (!searchQuery) return savedJobs
    return savedJobs.filter(job => 
      job.job_data?.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.job_data?.employer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [savedJobs, searchQuery])

  const totalItems = savedJobs.length + bookmarkedArticles.length + coverLetters.length + uploadedFiles.length + (hasCV ? 1 : 0)

  const tabs = [
    { id: 'all', label: t('resources.tabs.all'), count: totalItems },
    { id: 'documents', label: t('resources.tabs.documents'), count: coverLetters.length + (hasCV ? 1 : 0) },
    { id: 'jobs', label: t('resources.tabs.jobs'), count: savedJobs.length },
    { id: 'articles', label: t('resources.tabs.articles'), count: bookmarkedArticles.length },
  ]

  // Status labels with translations
  const statusLabelsTranslated: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
    'SAVED': { label: t('resources.status.saved'), color: 'text-slate-600', bg: 'bg-slate-100', icon: Bookmark },
    'APPLIED': { label: t('resources.status.applied'), color: 'text-blue-600', bg: 'bg-blue-100', icon: CheckCircle2 },
    'INTERVIEW': { label: t('resources.status.interview'), color: 'text-purple-600', bg: 'bg-purple-100', icon: Sparkles },
    'REJECTED': { label: t('resources.status.rejected'), color: 'text-red-600', bg: 'bg-red-100', icon: X },
    'ACCEPTED': { label: t('resources.status.accepted'), color: 'text-green-600', bg: 'bg-green-100', icon: Award },
  }

  if (loading) {
    return (
      <PageLayout title={t('resources.title')} description={t('resources.description')}>
        <div
          className="flex items-center justify-center py-20"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2 className="animate-spin text-violet-600" size={48} aria-hidden="true" />
          <span className="sr-only">{t('common.loading')}</span>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={t('resources.title')}
      description={t('resources.description')}
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label={t('resources.stats.savedJobs')}
          value={savedJobs.length}
          icon={BriefcaseIcon}
          color="bg-blue-500"
          link="/job-search"
        />
        <StatCard
          label={t('resources.stats.documents')}
          value={coverLetters.length + (hasCV ? 1 : 0)}
          icon={DocumentText}
          color="bg-purple-500"
        />
        <StatCard
          label={t('resources.stats.bookmarks')}
          value={bookmarkedArticles.length}
          icon={BookOpen}
          color="bg-teal-500"
          link="/knowledge-base"
        />
        <StatCard
          label={t('resources.stats.files')}
          value={uploadedFiles.length}
          icon={Folder}
          color="bg-amber-500"
        />
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-violet-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input
                type="text"
                placeholder={t('resources.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none w-full md:w-64"
              />
            </div>
            <div className="flex bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-700'}`}
              >
                <Grid3X3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-700'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* CV Section - Priority Display */}
        {(activeTab === 'all' || activeTab === 'documents') && hasCV && cvData && (
          <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{t('resources.myCV')}</h2>
                    <p className="text-slate-600">
                      {cvData.first_name} {cvData.last_name}
                      {cvData.title && ` • ${cvData.title}`}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-700">
                      <span>{cvData.work_experience?.length || 0} {t('resources.experiences')}</span>
                      <span>{cvData.education?.length || 0} {t('resources.educations')}</span>
                      <span>{cvData.skills?.length || 0} {t('resources.skills')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/cv"
                    className="flex items-center gap-2 px-4 py-2.5 bg-white text-amber-700 rounded-xl font-medium hover:bg-amber-50 border border-amber-200 transition-colors shadow-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    {t('resources.edit')}
                  </Link>
                  <button
                    onClick={() => setPreviewModal({type: 'cv', data: cvData})}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white text-amber-700 rounded-xl font-medium hover:bg-amber-50 border border-amber-200 transition-colors shadow-sm"
                  >
                    <Eye className="w-4 h-4" />
                    {t('resources.view')}
                  </button>
                  <button
                    onClick={handleDownloadCV}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-colors shadow-md"
                  >
                    <FileDown className="w-4 h-4" />
                    {t('resources.downloadPDF')}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Interest Guide Result */}
        {(activeTab === 'all' || activeTab === 'documents') && interestResult && (
          <section className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl border border-pink-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{t('resources.interestGuide')}</h2>
                  <p className="text-slate-600">
                    {t('resources.completed')} {new Date(interestResult.completed_at).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'sv-SE')}
                    {interestResult.recommended_jobs && (
                      <span> • {interestResult.recommended_jobs.length} {t('resources.jobSuggestions')}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/interest-guide"
                  className="px-4 py-2.5 bg-white text-pink-700 rounded-xl font-medium hover:bg-pink-50 border border-pink-200 transition-colors"
                >
                  {t('resources.seeResults')}
                </Link>
                <Link
                  to="/career"
                  className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-medium hover:from-pink-600 hover:to-purple-600 transition-colors shadow-md"
                >
                  {t('resources.exploreJobs')}
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Documents Grid */}
        {(activeTab === 'all' || activeTab === 'documents') && coverLetters.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="text-purple-600" size={24} />
                {t('resources.coverLetters')}
              </h3>
              <Link
                to="/cover-letter"
                className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
              >
                {t('resources.createNew')}
                <Plus size={16} />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {coverLetters.map((letter) => (
                <DocumentCard
                  key={letter.id}
                  title={letter.title}
                  subtitle={letter.company ? `${letter.company}${letter.job_title ? ` • ${letter.job_title}` : ''}` : undefined}
                  type={letter.ai_generated ? t('resources.aiGenerated') : t('resources.manual')}
                  date={new Date(letter.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'sv-SE')}
                  icon={FileText}
                  color="bg-gradient-to-br from-purple-500 to-indigo-500"
                  actions={
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewModal({type: 'letter', data: letter})}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                      >
                        <Eye size={16} />
                        {t('resources.read')}
                      </button>
                      <button
                        onClick={() => handleDownloadLetter(letter)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                      >
                        <FileDown size={16} />
                        PDF
                      </button>
                    </div>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Saved Jobs */}
        {(activeTab === 'all' || activeTab === 'jobs') && savedJobs.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <BriefcaseIcon className="text-blue-600" size={24} />
                {t('resources.savedJobs')}
                <span className="text-sm font-normal text-slate-700">({filteredJobs.length})</span>
              </h3>
              <Link
                to="/applications"
                className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
              >
                {t('resources.jobTracker')}
                <ChevronRight size={16} />
              </Link>
            </div>
            <div className="space-y-3">
              {filteredJobs.slice(0, activeTab === 'all' ? 5 : undefined).map((job) => {
                const StatusIcon = statusLabelsTranslated[job.status]?.icon || Bookmark
                return (
                  <div 
                    key={job.id} 
                    className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${statusLabelsTranslated[job.status]?.bg || 'bg-slate-100'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <StatusIcon className={`w-6 h-6 ${statusLabelsTranslated[job.status]?.color || 'text-slate-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-semibold text-slate-800 text-lg">{job.job_data?.headline || t('resources.jobAd')}</h4>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700 mt-1">
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
                          </div>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusLabelsTranslated[job.status]?.bg} ${statusLabelsTranslated[job.status]?.color}`}>
                            {statusLabelsTranslated[job.status]?.label}
                          </span>
                        </div>
                        {job.notes && (
                          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl mt-3">
                            <span className="font-medium">{t('resources.notes')}:</span> {job.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-4">
                          <button
                            onClick={() => setPreviewModal({type: 'job', data: job})}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye size={16} />
                            {t('resources.viewDetails')}
                          </button>
                          {job.job_data?.webpage_url && (
                            <a
                              href={job.job_data.webpage_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <ExternalLink size={16} />
                              {t('resources.openAd')}
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteJob(job.job_id)}
                            className="ml-auto p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Bookmarked Articles */}
        {(activeTab === 'all' || activeTab === 'articles') && bookmarkedArticles.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <BookOpen className="text-teal-600" size={24} />
                {t('resources.bookmarkedArticles')}
                <span className="text-sm font-normal text-slate-700">({bookmarkedArticles.length})</span>
              </h3>
              <Link
                to="/knowledge-base"
                className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
              >
                {t('resources.explore')}
                <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {bookmarkedArticles.map((article) => (
                <Link
                  key={article.id}
                  to={`/knowledge-base/article/${article.id}`}
                  className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-all group flex items-start gap-4"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="inline-block px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded-full mb-2">
                      {article.category}
                    </span>
                    <h4 className="font-semibold text-slate-800 group-hover:text-teal-600 transition-colors">{article.title}</h4>
                    {article.readingTime && (
                      <span className="text-xs text-slate-700 flex items-center gap-1 mt-1">
                        <Clock size={12} />
                        {article.readingTime} {t('resources.minReading')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleRemoveBookmark(article.id)
                    }}
                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Uploaded Files */}
        {(activeTab === 'all') && uploadedFiles.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Folder className="text-amber-600" size={24} />
              {t('resources.uploadedFiles')}
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {uploadedFiles.map((file) => (
                <div 
                  key={file.id} 
                  className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <File className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{file.name}</p>
                      <p className="text-xs text-slate-700">
                        {file.type === 'CV' ? 'CV' : file.type === 'COVER_LETTER' ? t('resources.coverLetter') : t('resources.other')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {totalItems === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">{t('resources.noResourcesTitle')}</h3>
            <p className="text-slate-600 max-w-md mx-auto mb-6">
              {t('resources.noResourcesDesc')}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/cv"
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md"
              >
                {t('resources.createCV')}
              </Link>
              <Link
                to="/job-search"
                className="px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-all"
              >
                {t('resources.searchJobs')}
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                {previewModal.type === 'cv' && `${t('resources.preview')} - CV`}
                {previewModal.type === 'letter' && previewModal.data.title}
                {previewModal.type === 'job' && previewModal.data.job_data?.headline}
              </h3>
              <button
                onClick={() => setPreviewModal(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {previewModal.type === 'cv' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                      {previewModal.data.first_name} {previewModal.data.last_name}
                    </h2>
                    {previewModal.data.title && (
                      <p className="text-lg text-slate-600">{previewModal.data.title}</p>
                    )}
                  </div>
                  {previewModal.data.summary && (
                    <div>
                      <h3 className="font-semibold text-slate-700 mb-2">{t('resources.summary')}</h3>
                      <p className="text-slate-600">{previewModal.data.summary}</p>
                    </div>
                  )}
                </div>
              )}
              {previewModal.type === 'letter' && (
                <div className="prose max-w-none">
                  <p className="text-slate-600 whitespace-pre-wrap">{previewModal.data.content}</p>
                </div>
              )}
              {previewModal.type === 'job' && (
                <div className="space-y-4">
                  <p className="text-slate-600">{previewModal.data.job_data?.description?.text}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
