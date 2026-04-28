/**
 * My CVs Component - Fullt funktionell version
 * Lista och hantera alla sparade CV-versioner
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FileText, 
  Download, 
  Edit2, 
  Trash2, 
  Copy,
  MoreVertical,
  Calendar,
  Check,
  Star,
  Folder,
  Plus,
  Search,
  Eye,
  Loader2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Award,
  X
} from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { cvApi } from '@/services/supabaseApi'
import { userPreferencesApi } from '@/services/cloudStorage'
import { PDFExportButton } from '@/components/pdf/PDFExportButton'
import { CVPreview } from './CVPreview'
import type { CVData } from '@/services/supabaseApi'
import { showToast } from '@/components/Toast'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'

interface CVVersion {
  id: string
  user_id: string
  name: string
  data: CVData
  created_at: string
  updated_at?: string
  isDefault?: boolean
  atsScore?: number
}

// Filter by CV template design instead of non-existent categories
const templateFilters = [
  { id: 'all', labelKey: 'cv.myCvs.filters.all', color: 'bg-stone-100 text-stone-700' },
  { id: 'sidebar', labelKey: 'cv.myCvs.filters.sidebar', color: 'bg-blue-100 text-blue-700' },
  { id: 'centered', labelKey: 'cv.myCvs.filters.centered', color: 'bg-purple-100 text-purple-700' },
  { id: 'minimal', labelKey: 'cv.myCvs.filters.minimal', color: 'bg-gray-100 text-gray-700' },
  { id: 'creative', labelKey: 'cv.myCvs.filters.creative', color: 'bg-pink-100 text-pink-700' },
  { id: 'executive', labelKey: 'cv.myCvs.filters.executive', color: 'bg-amber-100 text-amber-700' },
  { id: 'nordic', labelKey: 'cv.myCvs.filters.nordic', color: 'bg-cyan-100 text-cyan-700' },
]

export function MyCVs() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { confirm } = useConfirmDialog()
  const [cvs, setCvs] = useState<CVVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [previewCV, setPreviewCV] = useState<CVVersion | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  useEffect(() => {
    loadCVs()
  }, [])

  const loadCVs = async () => {
    try {
      setLoading(true)
      // Hämta från databasen
      const versions = await cvApi.getVersions()

      // Hämta standard-CV-id från användarinställningar
      const prefs = await userPreferencesApi.get()
      const defaultCVId = prefs?.default_cv_id || localStorage.getItem('default_cv_id')

      // Beräkna ATS-score för varje version om det inte redan finns
      const versionsWithScores = await Promise.all(
        versions.map(async (v) => {
          const cvData = v.data as CVData
          // Beräkna enkel ATS-score baserat på datainnehåll
          const atsScore = calculateATSScore(cvData)
          return {
            ...v,
            atsScore,
            isDefault: v.id === defaultCVId || v.is_default || false
          }
        })
      )

      setCvs(versionsWithScores)
    } catch (error) {
      console.error('Fel vid laddning av CV:n:', error)
      showToast.error(t('cv.myCvs.errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  // Beräkna ATS-score baserat på CV-innehåll
  const calculateATSScore = (cvData: CVData): number => {
    let score = 0
    if (!cvData) return 0
    
    // Kontaktinformation (20p)
    if (cvData.firstName && cvData.lastName) score += 10
    if (cvData.email) score += 5
    if (cvData.phone) score += 5
    
    // Sammanfattning (15p)
    if (cvData.summary && cvData.summary.length > 50) score += 15
    
    // Erfarenhet (25p)
    if (cvData.workExperience && cvData.workExperience.length > 0) {
      score += Math.min(25, cvData.workExperience.length * 8)
    }
    
    // Utbildning (15p)
    if (cvData.education && cvData.education.length > 0) {
      score += Math.min(15, cvData.education.length * 7)
    }
    
    // Kompetenser (15p)
    if (cvData.skills && cvData.skills.length > 0) {
      score += Math.min(15, cvData.skills.length * 3)
    }
    
    // Språk (10p)
    if (cvData.languages && cvData.languages.length > 0) score += 10
    
    return Math.min(100, score)
  }

  const handleDuplicate = async (cv: CVVersion) => {
    try {
      setDuplicatingId(cv.id)
      const newName = `${cv.name} ${t('cv.myCvs.copy')}`
      await cvApi.saveVersion(newName, cv.data)
      await loadCVs()
      showToast.success(t('cv.myCvs.duplicated'))
    } catch (error) {
      console.error('Fel vid duplicering:', error)
      showToast.error(t('cv.myCvs.errors.duplicateFailed'))
    } finally {
      setDuplicatingId(null)
      setActionMenuOpen(null)
    }
  }

  const handleDelete = async (id: string) => {
    setActionMenuOpen(null)

    const confirmed = await confirm({
      title: t('cv.myCvs.deleteConfirm.title'),
      message: t('cv.myCvs.deleteConfirm.message'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'danger'
    })

    if (!confirmed) return

    try {
      setDeletingId(id)
      await cvApi.deleteVersion(id)
      setCvs(cvs.filter(cv => cv.id !== id))
      showToast.success(t('cv.myCvs.deleted'))
    } catch (error) {
      console.error('Fel vid borttagning:', error)
      showToast.error(t('cv.myCvs.errors.deleteFailed'))
    } finally {
      setDeletingId(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      // Uppdatera lokalt först för snabb feedback
      setCvs(cvs.map(cv => ({
        ...cv,
        isDefault: cv.id === id
      })))

      // Spara till cloud storage och localStorage som fallback
      await userPreferencesApi.update({ default_cv_id: id })
      localStorage.setItem('default_cv_id', id)

      showToast.success(t('cv.myCvs.setAsDefault'))
    } catch (error) {
      console.error('Fel vid sparning av standard-CV:', error)
      // Fallback till localStorage om cloud storage misslyckas
      localStorage.setItem('default_cv_id', id)
      showToast.success(t('cv.myCvs.setAsDefault'))
    } finally {
      setActionMenuOpen(null)
    }
  }

  const handleEdit = (cv: CVVersion) => {
    // Spara versionens data i localStorage så CVBuilder kan hämta det
    localStorage.setItem('cv-edit-version', JSON.stringify({
      versionId: cv.id,
      data: cv.data
    }))
    navigate('/cv')
  }

  const filteredCVs = cvs
    .filter(cv => selectedTemplate === 'all' || cv.data?.template === selectedTemplate)
    .filter(cv =>
      searchQuery === '' ||
      cv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cv.data?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cv.data?.firstName?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Standard-CV först, sedan efter datum
      if (a.isDefault && !b.isDefault) return -1
      if (!a.isDefault && b.isDefault) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-amber-600 bg-amber-100'
    return 'text-red-600 bg-red-100'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-[var(--c-text)] mb-4" />
        <p className="text-stone-600">{t('cv.myCvs.loading')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header med stats */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700/50 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-1">{t('cv.myCvs.title')}</h2>
            <p className="text-stone-600 dark:text-stone-400">
              {t('cv.myCvs.savedCount', { count: cvs.length })}
            </p>
          </div>
          <Link
            to="/cv"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--c-solid)] dark:bg-[var(--c-solid)] text-white rounded-xl font-medium hover:bg-[var(--c-text)] dark:hover:bg-[var(--c-solid)] transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            {t('cv.myCvs.createNew')}
          </Link>
        </div>

        {/* Quick stats */}
        {cvs.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-stone-200 dark:border-stone-700/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-stone-800 dark:text-stone-100">{cvs.length}</div>
              <div className="text-xs text-stone-600 dark:text-stone-400">{t('cv.myCvs.stats.totalSaved')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-stone-800 dark:text-stone-100">
                {cvs.filter(c => (c.atsScore || 0) >= 70).length}
              </div>
              <div className="text-xs text-stone-600 dark:text-stone-400">{t('cv.myCvs.stats.atsApproved')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-stone-800 dark:text-stone-100">
                {formatDate(cvs[0]?.created_at || new Date().toISOString())}
              </div>
              <div className="text-xs text-stone-600 dark:text-stone-400">{t('cv.myCvs.stats.lastSaved')}</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600 dark:text-stone-400" />
          <input
            type="text"
            placeholder={t('cv.myCvs.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)] bg-white dark:bg-stone-900 dark:text-stone-100"
          />
        </div>

        {/* Template Filter */}
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="px-4 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)] bg-white dark:bg-stone-900 dark:text-stone-100"
          aria-label={t('cv.myCvs.filterByTemplate')}
        >
          {templateFilters.map(tpl => (
            <option key={tpl.id} value={tpl.id}>{t(tpl.labelKey)}</option>
          ))}
        </select>
      </div>

      {/* CV List */}
      {filteredCVs.length === 0 ? (
        <div className="text-center py-16 bg-stone-50 dark:bg-stone-800 rounded-xl border border-dashed border-stone-300 dark:border-stone-600">
          <div className="w-20 h-20 bg-stone-100 dark:bg-stone-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Folder className="w-10 h-10 text-stone-600 dark:text-stone-400" />
          </div>
          <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">
            {searchQuery ? t('cv.myCvs.empty.noSearchResults') : t('cv.myCvs.empty.noCVs')}
          </h3>
          <p className="text-stone-600 dark:text-stone-400 mb-6 max-w-md mx-auto">
            {searchQuery
              ? t('cv.myCvs.empty.tryOtherSearch')
              : t('cv.myCvs.empty.createFirst')}
          </p>
          <Link
            to="/cv"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--c-solid)] text-white rounded-xl font-medium hover:bg-[var(--c-text)] transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('cv.myCvs.createFirstCV')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCVs.map(cv => (
            <div
              key={cv.id}
              className={cn(
                'bg-white dark:bg-stone-900 rounded-xl border-2 p-5 transition-all hover:shadow-lg',
                cv.isDefault ? 'border-[var(--c-accent)] dark:border-[var(--c-accent)]/50 bg-[var(--c-bg)]/30 dark:bg-[var(--c-bg)]/20' : 'border-stone-200 dark:border-stone-700/50'
              )}
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Icon & Basic Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
                    cv.isDefault ? 'bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/50 text-[var(--c-text)] dark:text-[var(--c-solid)]' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                  )}>
                    <FileText className="w-7 h-7" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-stone-800 dark:text-stone-100 text-lg">{cv.name}</h3>
                      {cv.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--c-accent)]/40 text-[var(--c-text)] text-xs font-medium rounded-full">
                          <Star className="w-3 h-3 fill-current" />
                          {t('cv.myCvs.default')}
                        </span>
                      )}
                    </div>
                    
                    {cv.data?.title && (
                      <p className="text-stone-600 dark:text-stone-400">{cv.data.title}</p>
                    )}

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                      <span className="flex items-center gap-1 text-stone-700 dark:text-stone-300">
                        <Calendar className="w-4 h-4" />
                        {formatDate(cv.created_at)}
                      </span>

                      {cv.data?.workExperience && cv.data.workExperience.length > 0 && (
                        <span className="flex items-center gap-1 text-stone-700 dark:text-stone-300">
                          <Briefcase className="w-4 h-4" />
                          {t('cv.myCvs.experiences', { count: cv.data.workExperience.length })}
                        </span>
                      )}

                      {cv.data?.education && cv.data.education.length > 0 && (
                        <span className="flex items-center gap-1 text-stone-700 dark:text-stone-300">
                          <GraduationCap className="w-4 h-4" />
                          {t('cv.myCvs.educations', { count: cv.data.education.length })}
                        </span>
                      )}

                      {cv.data?.skills && cv.data.skills.length > 0 && (
                        <span className="flex items-center gap-1 text-stone-700 dark:text-stone-300">
                          <Award className="w-4 h-4" />
                          {t('cv.myCvs.skills', { count: cv.data.skills.length })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ATS Score */}
                {cv.atsScore !== undefined && (
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5',
                      getScoreColor(cv.atsScore)
                    )}>
                      <TrendingUp className="w-4 h-4" />
                      ATS: {cv.atsScore}%
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {/* Preview */}
                  <button
                    onClick={() => setPreviewCV(cv)}
                    className="p-2 text-stone-600 hover:text-[var(--c-text)] hover:bg-[var(--c-bg)] rounded-lg transition-colors"
                    title={t('common.preview')}
                  >
                    <Eye className="w-5 h-5" />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleEdit(cv)}
                    className="p-2 text-stone-600 hover:text-[var(--c-text)] hover:bg-[var(--c-bg)] rounded-lg transition-colors"
                    title={t('common.edit')}
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  
                  {/* Download PDF */}
                  <div className="relative">
                    <PDFExportButton
                      type="cv"
                      data={cv.data}
                      filename={`CV_${cv.data?.firstName || t('common.unknown')}_${cv.data?.lastName || ''}.pdf`}
                      variant="light"
                      size="sm"
                      showPreview={false}
                    />
                  </div>

                  {/* More Actions Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setActionMenuOpen(actionMenuOpen === cv.id ? null : cv.id)}
                      disabled={duplicatingId === cv.id || deletingId === cv.id}
                      className="p-2 text-stone-600 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {duplicatingId === cv.id || deletingId === cv.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <MoreVertical className="w-5 h-5" />
                      )}
                    </button>

                    {actionMenuOpen === cv.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setActionMenuOpen(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700 py-1 z-20">
                          <button
                            onClick={() => handleDuplicate(cv)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700"
                          >
                            <Copy className="w-4 h-4" />
                            {t('cv.myCvs.actions.duplicate')}
                          </button>
                          {!cv.isDefault && (
                            <button
                              onClick={() => handleSetDefault(cv.id)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700"
                            >
                              <Star className="w-4 h-4" />
                              {t('cv.myCvs.actions.setDefault')}
                            </button>
                          )}
                          <div className="border-t border-stone-100 dark:border-stone-700 my-1" />
                          <button
                            onClick={() => handleDelete(cv.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                          >
                            <Trash2 className="w-4 h-4" />
                            {t('common.delete')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
              {t('cv.myCvs.tips.title')}
            </h3>
            <p className="text-amber-800 dark:text-amber-300 text-sm leading-relaxed">
              {t('cv.myCvs.tips.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewCV && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-stone-700">
              <div>
                <h3 className="font-semibold text-stone-800 dark:text-stone-100">{previewCV.name}</h3>
                <p className="text-sm text-stone-700 dark:text-stone-300">{t('common.preview')}</p>
              </div>
              <div className="flex items-center gap-2">
                <PDFExportButton
                  type="cv"
                  data={previewCV.data}
                  filename={`CV_${previewCV.data?.firstName || 'okänd'}_${previewCV.data?.lastName || ''}.pdf`}
                  variant="primary"
                  size="sm"
                  showPreview={false}
                />
                <button
                  onClick={() => setPreviewCV(null)}
                  className="p-2 text-stone-600 hover:text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-stone-100 dark:bg-stone-800">
              <div className="max-w-[210mm] mx-auto bg-white dark:bg-white shadow-lg">
                <CVPreview data={previewCV.data} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyCVs
