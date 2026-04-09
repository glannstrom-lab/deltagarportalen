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
  Building2,
  MapPin,
  Clock,
  Eye,
  X,
  FileDown,
  CheckCircle2,
  Folder,
  File,
  Edit2,
  Plus,
  Search,
  Grid3X3,
  List,
  Award,
  Briefcase as BriefcaseIcon,
  FileText as DocumentText,
  GraduationCap,
  Wrench,
  Languages,
  Mail,
  Phone,
  MapPinned
} from '@/components/ui/icons'
import { savedJobsApi, articleBookmarksApi } from '@/services/cloudStorage'
import { cvApi, coverLetterApi, interestApi } from '@/services/supabaseApi'
import { PageLayout } from '@/components/layout/index'
import { PDFExportButton } from '@/components/pdf/PDFExportButton'
// NOTE: jsPDF and docx are dynamically imported in export functions to reduce bundle size

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
  data: CVData
}

interface CVData {
  firstName?: string
  lastName?: string
  title?: string
  email?: string
  phone?: string
  location?: string
  summary?: string
  workExperience?: Array<{
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
  skills?: Array<{ id: string; name: string; level?: number; category?: string }> | string[]
  languages?: Array<{
    language: string
    level: string
  }>
  template?: string
  colorScheme?: string
  font?: string
  profileImage?: string | null
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

// Compact Stats Card Component
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  link
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
  link?: string
}) {
  const content = (
    <div className={`bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all group ${link ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
        </div>
        {link && <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />}
      </div>
    </div>
  )

  if (link) {
    return <Link to={link}>{content}</Link>
  }
  return content
}

// Compact Document Card Component
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
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all group">
      <div className="p-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-800 truncate text-sm">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">{type}</span>
              <span className="text-xs text-slate-400">{date}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
        {actions}
      </div>
    </div>
  )
}

// PDF Export Functions
async function generateCoverLetterPDF(letter: CoverLetter) {
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

// Word (DOCX) Export Functions
async function generateCoverLetterWord(letter: CoverLetter) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')
  const { saveAs } = await import('file-saver')

  const children: Paragraph[] = []

  // Date
  children.push(new Paragraph({
    children: [new TextRun({ text: new Date().toLocaleDateString('sv-SE'), size: 22, color: '666666' })],
    spacing: { after: 400 }
  }))

  // Title
  children.push(new Paragraph({ text: 'Personligt brev', heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }))

  // Company & Position
  if (letter.company) {
    children.push(new Paragraph({
      children: [new TextRun({ text: letter.company, bold: true, size: 26 })],
      spacing: { after: 50 }
    }))
  }
  if (letter.job_title) {
    children.push(new Paragraph({
      children: [new TextRun({ text: letter.job_title, size: 24, color: '666666' })],
      spacing: { after: 300 }
    }))
  }

  // Content - split by newlines to preserve paragraphs
  const paragraphs = letter.content.split('\n\n')
  paragraphs.forEach(p => {
    if (p.trim()) {
      children.push(new Paragraph({
        children: [new TextRun({ text: p.trim(), size: 24 })],
        spacing: { after: 200 }
      }))
    }
  })

  const doc = new Document({ sections: [{ children }] })
  const blob = await Packer.toBlob(doc)
  saveAs(blob, `Personligt-brev-${letter.company || 'Mitt'}.docx`)
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
      const [jobs, bookmarks, letters, cv, versions, interest] = await Promise.all([
        savedJobsApi.getAll(),
        articleBookmarksApi.getBookmarks(),
        coverLetterApi.getAll(),
        cvApi.getCV(),
        cvApi.getVersions(),
        interestApi.getResult(), // Fixed: was getResults()
      ])

      setSavedJobs(jobs || [])
      setBookmarkedArticles(bookmarks || [])
      setCoverLetters(letters || [])
      setCvData(cv)
      setHasCV(!!cv)
      setCvVersions(versions || [])
      setInterestResult(interest)
      // Note: uploadedFiles not yet implemented - requires Supabase Storage bucket
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

  const handleDownloadLetter = async (letter: CoverLetter, format: 'pdf' | 'word' = 'pdf') => {
    if (format === 'word') {
      await generateCoverLetterWord(letter)
    } else {
      await generateCoverLetterPDF(letter)
    }
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
      <PageLayout title={t('resources.title')} description={t('resources.description')} showTabs={false}>
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
      showTabs={false}
    >
      {/* Compact Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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

      {/* Tabs & Search - Compact */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-violet-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder={t('resources.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none w-full md:w-48"
              />
            </div>
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-500'}`}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-500'}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Saved CV Versions Section */}
        {(activeTab === 'all' || activeTab === 'documents') && cvVersions.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="text-amber-600" size={18} />
                Sparade CV ({cvVersions.length})
              </h3>
              <Link
                to="/cv"
                className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
              >
                Skapa ny version
                <Plus size={14} />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cvVersions.map((version) => {
                const versionData = version.data || {}
                return (
                  <div key={version.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all">
                    <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-800 text-sm truncate">{version.name}</h4>
                          <p className="text-xs text-slate-500">
                            {new Date(version.created_at).toLocaleDateString('sv-SE')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-xs text-slate-600 space-y-1 mb-3">
                        {versionData.firstName && (
                          <p className="truncate"><span className="text-slate-400">Namn:</span> {versionData.firstName} {versionData.lastName}</p>
                        )}
                        {versionData.title && (
                          <p className="truncate"><span className="text-slate-400">Titel:</span> {versionData.title}</p>
                        )}
                        <p className="flex gap-3">
                          <span><span className="text-slate-400">Erfarenhet:</span> {versionData.workExperience?.length || 0}</span>
                          <span><span className="text-slate-400">Utbildning:</span> {versionData.education?.length || 0}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPreviewModal({type: 'cv', data: versionData as CVData})}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors"
                        >
                          <Eye size={14} />
                          Visa
                        </button>
                        <PDFExportButton
                          type="cv"
                          data={versionData}
                          filename={`CV_${versionData.firstName || ''}_${versionData.lastName || ''}.pdf`}
                          variant="light"
                          size="sm"
                          showPreview={false}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Current CV (if no versions saved, show current) */}
        {(activeTab === 'all' || activeTab === 'documents') && hasCV && cvData && cvVersions.length === 0 && (
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{cvData.firstName} {cvData.lastName}</h2>
                    <p className="text-sm text-slate-600">{cvData.title || t('resources.myCV')}</p>
                    <p className="text-xs text-amber-600 mt-1">Spara en version på CV-sidan för att se den här</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to="/cv"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white text-amber-700 rounded-lg font-medium hover:bg-amber-50 border border-amber-200 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {t('resources.edit')}
                  </Link>
                  <PDFExportButton
                    type="cv"
                    data={cvData}
                    filename={`CV_${cvData.firstName || ''}_${cvData.lastName || ''}.pdf`}
                    variant="primary"
                    size="sm"
                    showPreview={false}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Interest Guide Result - Compact */}
        {(activeTab === 'all' || activeTab === 'documents') && interestResult && (
          <section className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200 p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">{t('resources.interestGuide')}</h2>
                  <p className="text-xs text-slate-600">
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
                  className="px-3 py-1.5 text-sm bg-white text-pink-700 rounded-lg font-medium hover:bg-pink-50 border border-pink-200 transition-colors"
                >
                  {t('resources.seeResults')}
                </Link>
                <Link
                  to="/career"
                  className="px-3 py-1.5 text-sm bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-600 transition-colors"
                >
                  {t('resources.exploreJobs')}
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Cover Letters - Compact Grid */}
        {(activeTab === 'all' || activeTab === 'documents') && coverLetters.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="text-purple-600" size={18} />
                {t('resources.coverLetters')} ({coverLetters.length})
              </h3>
              <Link
                to="/cover-letter"
                className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
              >
                {t('resources.createNew')}
                <Plus size={14} />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                    <>
                      <button
                        onClick={() => setPreviewModal({type: 'letter', data: letter})}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors"
                      >
                        <Eye size={14} />
                        {t('resources.read')}
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDownloadLetter(letter, 'pdf')}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-violet-600 text-white rounded hover:bg-violet-700 transition-colors"
                        >
                          <FileDown size={14} />
                          PDF
                        </button>
                        <button
                          onClick={() => handleDownloadLetter(letter, 'word')}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          <FileDown size={14} />
                          Word
                        </button>
                      </div>
                    </>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Saved Jobs - Compact */}
        {(activeTab === 'all' || activeTab === 'jobs') && savedJobs.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <BriefcaseIcon className="text-blue-600" size={18} />
                {t('resources.savedJobs')} ({filteredJobs.length})
              </h3>
              <Link
                to="/applications"
                className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
              >
                {t('resources.jobTracker')}
                <ChevronRight size={14} />
              </Link>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {filteredJobs.slice(0, activeTab === 'all' ? 5 : undefined).map((job) => {
                const StatusIcon = statusLabelsTranslated[job.status]?.icon || Bookmark
                return (
                  <div
                    key={job.id}
                    className="p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 ${statusLabelsTranslated[job.status]?.bg || 'bg-slate-100'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <StatusIcon className={`w-4 h-4 ${statusLabelsTranslated[job.status]?.color || 'text-slate-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium text-slate-800 text-sm truncate">{job.job_data?.headline || t('resources.jobAd')}</h4>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${statusLabelsTranslated[job.status]?.bg} ${statusLabelsTranslated[job.status]?.color}`}>
                            {statusLabelsTranslated[job.status]?.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          {job.job_data?.employer?.name && (
                            <span className="flex items-center gap-1 truncate">
                              <Building2 size={12} />
                              {job.job_data.employer.name}
                            </span>
                          )}
                          {job.job_data?.workplace_address?.municipality && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {job.job_data.workplace_address.municipality}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setPreviewModal({type: 'job', data: job})}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title={t('resources.viewDetails')}
                        >
                          <Eye size={16} />
                        </button>
                        {job.job_data?.webpage_url && (
                          <a
                            href={job.job_data.webpage_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title={t('resources.openAd')}
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteJob(job.job_id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Ta bort"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {activeTab === 'all' && filteredJobs.length > 5 && (
              <button
                onClick={() => setSearchParams({ tab: 'jobs' })}
                className="w-full mt-2 py-2 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
              >
                Visa alla {filteredJobs.length} jobb →
              </button>
            )}
          </section>
        )}

        {/* Bookmarked Articles - Compact */}
        {(activeTab === 'all' || activeTab === 'articles') && bookmarkedArticles.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <BookOpen className="text-teal-600" size={18} />
                {t('resources.bookmarkedArticles')} ({bookmarkedArticles.length})
              </h3>
              <Link
                to="/knowledge-base"
                className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
              >
                {t('resources.explore')}
                <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {bookmarkedArticles.map((article) => (
                <Link
                  key={article.id}
                  to={`/knowledge-base/article/${article.id}`}
                  className="bg-white rounded-xl border border-slate-200 p-3 hover:shadow-md transition-all group flex items-center gap-3"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-800 text-sm truncate group-hover:text-teal-600 transition-colors">{article.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-1.5 py-0.5 bg-teal-100 text-teal-700 text-xs rounded">
                        {article.category}
                      </span>
                      {article.readingTime && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={10} />
                          {article.readingTime} min
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleRemoveBookmark(article.id)
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Uploaded Files - Compact */}
        {(activeTab === 'all') && uploadedFiles.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Folder className="text-amber-600" size={18} />
              {t('resources.uploadedFiles')} ({uploadedFiles.length})
            </h3>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="bg-white rounded-xl border border-slate-200 p-3 hover:shadow-md transition-all flex items-center gap-2"
                >
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <File className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {file.type === 'CV' ? 'CV' : file.type === 'COVER_LETTER' ? t('resources.coverLetter') : t('resources.other')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State - Compact */}
        {totalItems === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bookmark className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">{t('resources.noResourcesTitle')}</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
              {t('resources.noResourcesDesc')}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                to="/cv"
                className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-violet-700 transition-all"
              >
                {t('resources.createCV')}
              </Link>
              <Link
                to="/job-search"
                className="px-4 py-2 text-sm bg-white text-slate-700 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-all"
              >
                {t('resources.searchJobs')}
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal - Full CV Details */}
      {previewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPreviewModal(null)}>
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-200 p-3 flex items-center justify-between z-10">
              <h3 className="font-semibold text-slate-800">
                {previewModal.type === 'cv' && `${t('resources.preview')} - CV`}
                {previewModal.type === 'letter' && (previewModal.data as CoverLetter).title}
                {previewModal.type === 'job' && (previewModal.data as SavedJob).job_data?.headline}
              </h3>
              <button
                onClick={() => setPreviewModal(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              {previewModal.type === 'cv' && (() => {
                const cv = previewModal.data as CVData
                return (
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="border-b border-slate-100 pb-4">
                      <h2 className="text-xl font-bold text-slate-800">
                        {cv.firstName} {cv.lastName}
                      </h2>
                      {cv.title && <p className="text-slate-600">{cv.title}</p>}
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
                        {cv.email && <span className="flex items-center gap-1"><Mail size={14} />{cv.email}</span>}
                        {cv.phone && <span className="flex items-center gap-1"><Phone size={14} />{cv.phone}</span>}
                        {cv.location && <span className="flex items-center gap-1"><MapPinned size={14} />{cv.location}</span>}
                      </div>
                    </div>

                    {/* Summary */}
                    {cv.summary && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-1">Sammanfattning</h3>
                        <p className="text-sm text-slate-600">{cv.summary}</p>
                      </div>
                    )}

                    {/* Work Experience */}
                    {cv.workExperience && cv.workExperience.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                          <Briefcase size={16} className="text-blue-500" />
                          Arbetslivserfarenhet
                        </h3>
                        <div className="space-y-3">
                          {cv.workExperience.map((job, i) => (
                            <div key={i} className="pl-4 border-l-2 border-blue-200">
                              <p className="font-medium text-slate-800">{job.title}</p>
                              <p className="text-sm text-slate-600">{job.company}</p>
                              <p className="text-xs text-slate-400">
                                {job.startDate} - {job.current ? 'Nuvarande' : job.endDate}
                              </p>
                              {job.description && (
                                <p className="text-sm text-slate-500 mt-1">{job.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {cv.education && cv.education.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                          <GraduationCap size={16} className="text-purple-500" />
                          Utbildning
                        </h3>
                        <div className="space-y-2">
                          {cv.education.map((edu, i) => (
                            <div key={i} className="pl-4 border-l-2 border-purple-200">
                              <p className="font-medium text-slate-800">{edu.degree}</p>
                              <p className="text-sm text-slate-600">{edu.school}</p>
                              <p className="text-xs text-slate-400">{edu.startDate} - {edu.endDate}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {cv.skills && cv.skills.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                          <Wrench size={16} className="text-amber-500" />
                          Kompetenser
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {cv.skills.map((skill, i) => (
                            <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                              {typeof skill === 'string' ? skill : (skill as { name: string }).name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {cv.languages && cv.languages.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                          <Languages size={16} className="text-teal-500" />
                          Språk
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {cv.languages.map((lang, i) => (
                            <span key={i} className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded">
                              {lang.language} ({lang.level})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Download Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex gap-2">
                      <PDFExportButton
                        type="cv"
                        data={cv}
                        filename={`CV_${cv.firstName || ''}_${cv.lastName || ''}.pdf`}
                        variant="primary"
                        size="sm"
                        showPreview={false}
                      />
                    </div>
                  </div>
                )
              })()}
              {previewModal.type === 'letter' && (
                <div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{(previewModal.data as CoverLetter).content}</p>
                  <div className="pt-3 mt-4 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => handleDownloadLetter(previewModal.data as CoverLetter, 'pdf')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
                    >
                      <FileDown size={14} />
                      Ladda ner PDF
                    </button>
                    <button
                      onClick={() => handleDownloadLetter(previewModal.data as CoverLetter, 'word')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                    >
                      <FileDown size={14} />
                      Ladda ner Word
                    </button>
                  </div>
                </div>
              )}
              {previewModal.type === 'job' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">{(previewModal.data as SavedJob).job_data?.description?.text}</p>
                  {(previewModal.data as SavedJob).job_data?.webpage_url && (
                    <a
                      href={(previewModal.data as SavedJob).job_data!.webpage_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                    >
                      <ExternalLink size={14} />
                      Öppna annons
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
