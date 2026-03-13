/**
 * My CVs Component - Fullt funktionell version
 * Lista och hantera alla sparade CV-versioner
 */

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { cvApi } from '@/services/supabaseApi'
import { PDFExportButton } from '@/components/pdf/PDFExportButton'
import { CVPreview } from './CVPreview'
import type { CVData } from '@/services/supabaseApi'
import { showToast } from '@/components/Toast'

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

const categories = [
  { id: 'all', label: 'Alla', color: 'bg-slate-100 text-slate-700' },
  { id: 'retail', label: 'Butik & Handel', color: 'bg-blue-100 text-blue-700' },
  { id: 'warehouse', label: 'Lager & Logistik', color: 'bg-orange-100 text-orange-700' },
  { id: 'office', label: 'Kontor & Admin', color: 'bg-purple-100 text-purple-700' },
  { id: 'healthcare', label: 'Vård & Omsorg', color: 'bg-red-100 text-red-700' },
  { id: 'tech', label: 'IT & Tech', color: 'bg-cyan-100 text-cyan-700' },
  { id: 'other', label: 'Övrigt', color: 'bg-gray-100 text-gray-700' },
]

export function MyCVs() {
  const navigate = useNavigate()
  const [cvs, setCvs] = useState<CVVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
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
      
      // Beräkna ATS-score för varje version om det inte redan finns
      const versionsWithScores = await Promise.all(
        versions.map(async (v: any) => {
          const cvData = v.data as CVData
          // Beräkna enkel ATS-score baserat på datainnehåll
          const atsScore = calculateATSScore(cvData)
          return {
            ...v,
            atsScore,
            isDefault: v.is_default || false
          }
        })
      )
      
      setCvs(versionsWithScores)
    } catch (error) {
      console.error('Fel vid laddning av CV:n:', error)
      showToast.error('Kunde inte ladda dina CV:n')
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
      const newName = `${cv.name} (kopia)`
      await cvApi.saveVersion(newName, cv.data)
      await loadCVs() // Ladda om listan
      showToast.success('CV duplicerat')
    } catch (error) {
      console.error('Fel vid duplicering:', error)
      showToast.error('Kunde inte duplicera CV:t')
    } finally {
      setDuplicatingId(null)
      setActionMenuOpen(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort detta CV? Detta kan inte ångras.')) {
      setActionMenuOpen(null)
      return
    }
    
    try {
      setDeletingId(id)
      await cvApi.deleteVersion(id)
      setCvs(cvs.filter(cv => cv.id !== id))
      showToast.success('CV borttaget')
    } catch (error) {
      console.error('Fel vid borttagning:', error)
      showToast.error('Kunde inte ta bort CV:t')
    } finally {
      setDeletingId(null)
      setActionMenuOpen(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      // Uppdatera lokalt först för snabb feedback
      setCvs(cvs.map(cv => ({
        ...cv,
        isDefault: cv.id === id
      })))
      
      // TODO: Uppdatera i databasen om vi vill spara standard-CV
      showToast.success('Satt som standard-CV')
    } catch (error) {
      showToast.error('Kunde inte sätta som standard')
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
    .filter(cv => selectedCategory === 'all' || cv.data?.template === selectedCategory)
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

  const getCategoryLabel = (categoryId?: string) => {
    return categories.find(c => c.id === categoryId)?.label || 'Övrigt'
  }

  const getCategoryColor = (categoryId?: string) => {
    return categories.find(c => c.id === categoryId)?.color || 'bg-gray-100 text-gray-700'
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-amber-600 bg-amber-100'
    return 'text-red-600 bg-red-100'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-600">Laddar dina CV:n...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header med stats */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">Mina sparade CV</h2>
            <p className="text-indigo-100">
              Du har {cvs.length} {cvs.length === 1 ? 'CV' : 'CV:n'} sparade
            </p>
          </div>
          <Link
            to="/cv"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 rounded-xl font-medium hover:bg-indigo-50 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Skapa nytt CV
          </Link>
        </div>
        
        {/* Quick stats */}
        {cvs.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-indigo-500/30">
            <div className="text-center">
              <div className="text-2xl font-bold">{cvs.length}</div>
              <div className="text-xs text-indigo-200">Totalt sparade</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {cvs.filter(c => (c.atsScore || 0) >= 70).length}
              </div>
              <div className="text-xs text-indigo-200">Godkänd ATS</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatDate(cvs[0]?.created_at || new Date().toISOString())}
              </div>
              <div className="text-xs text-indigo-200">Senast sparat</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Sök bland dina CV..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* CV List */}
      {filteredCVs.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Folder className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            {searchQuery ? 'Inga CV matchade sökningen' : 'Inga CV hittades'}
          </h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            {searchQuery 
              ? 'Prova att söka efter något annat eller ändra kategori'
              : 'Skapa ditt första CV för att komma igång. Du kan spara flera versioner för olika typer av jobb.'}
          </p>
          <Link
            to="/cv"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Skapa ditt första CV
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCVs.map(cv => (
            <div 
              key={cv.id}
              className={cn(
                'bg-white rounded-2xl border-2 p-5 transition-all hover:shadow-lg',
                cv.isDefault ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200'
              )}
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Icon & Basic Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
                    cv.isDefault ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'
                  )}>
                    <FileText className="w-7 h-7" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800 text-lg">{cv.name}</h3>
                      {cv.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                          <Star className="w-3 h-3 fill-current" />
                          Standard
                        </span>
                      )}
                    </div>
                    
                    {cv.data?.title && (
                      <p className="text-slate-600">{cv.data.title}</p>
                    )}
                    
                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-4 h-4" />
                        {formatDate(cv.created_at)}
                      </span>
                      
                      {cv.data?.workExperience && cv.data.workExperience.length > 0 && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Briefcase className="w-4 h-4" />
                          {cv.data.workExperience.length} erfarenheter
                        </span>
                      )}
                      
                      {cv.data?.education && cv.data.education.length > 0 && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <GraduationCap className="w-4 h-4" />
                          {cv.data.education.length} utbildningar
                        </span>
                      )}
                      
                      {cv.data?.skills && cv.data.skills.length > 0 && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Award className="w-4 h-4" />
                          {cv.data.skills.length} kompetenser
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
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Förhandsgranska"
                  >
                    <Eye className="w-5 h-5" />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleEdit(cv)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Redigera"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  
                  {/* Download PDF */}
                  <div className="relative">
                    <PDFExportButton
                      type="cv"
                      data={cv.data}
                      filename={`CV_${cv.data?.firstName || 'okänd'}_${cv.data?.lastName || ''}.pdf`}
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
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
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
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20">
                          <button
                            onClick={() => handleDuplicate(cv)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicera
                          </button>
                          {!cv.isDefault && (
                            <button
                              onClick={() => handleSetDefault(cv.id)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <Star className="w-4 h-4" />
                              Sätt som standard
                            </button>
                          )}
                          <div className="border-t border-slate-100 my-1" />
                          <button
                            onClick={() => handleDelete(cv.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Ta bort
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
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900 mb-2">
              💡 Tips: Anpassa CV för olika jobb
            </h3>
            <p className="text-amber-800 text-sm leading-relaxed">
              Skapa olika versioner av ditt CV för olika typer av jobb. Ett CV för butiksjobb bör framhäva 
              kundservice, medan ett för lager bör fokusera på logistik och arbets tempo. 
              Markera det CV du använder mest som "Standard" så du snabbt hittar det.
            </p>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewCV && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold text-slate-800">{previewCV.name}</h3>
                <p className="text-sm text-slate-500">Förhandsgranskning</p>
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
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
              <div className="max-w-[210mm] mx-auto bg-white shadow-lg">
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
