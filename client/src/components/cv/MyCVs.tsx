/**
 * My CVs Component
 * List and manage all saved CVs and versions
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { cvApi } from '@/services/supabaseApi'

interface CVVersion {
  id: string
  name: string
  title?: string
  created_at: string
  updated_at: string
  isDefault?: boolean
  category?: string
  atsScore?: number
}

const categories = [
  { id: 'all', label: 'Alla' },
  { id: 'retail', label: 'Butik & Handel' },
  { id: 'warehouse', label: 'Lager & Logistik' },
  { id: 'office', label: 'Kontor & Admin' },
  { id: 'healthcare', label: 'Vård & Omsorg' },
  { id: 'tech', label: 'IT & Tech' },
  { id: 'other', label: 'Övrigt' },
]

export function MyCVs() {
  const [cvs, setCvs] = useState<CVVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)

  useEffect(() => {
    loadCVs()
  }, [])

  const loadCVs = async () => {
    try {
      setLoading(true)
      // This would fetch from API
      // const versions = await cvApi.getVersions()
      
      // Mock data for now
      const mockCVs: CVVersion[] = [
        { 
          id: '1', 
          name: 'CV - Butiksbiträde', 
          title: 'Butiksbiträde',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          isDefault: true,
          category: 'retail',
          atsScore: 85
        },
        { 
          id: '2', 
          name: 'CV - Lagerarbetare', 
          title: 'Lagerarbetare',
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'warehouse',
          atsScore: 72
        },
        { 
          id: '3', 
          name: 'CV - Kundtjänst', 
          title: 'Kundtjänstmedarbetare',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'office',
          atsScore: 90
        },
      ]
      
      setCvs(mockCVs)
    } catch (error) {
      console.error('Error loading CVs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicate = (cv: CVVersion) => {
    const newCV = {
      ...cv,
      id: Date.now().toString(),
      name: `${cv.name} (kopia)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isDefault: false
    }
    setCvs([newCV, ...cvs])
    setActionMenuOpen(null)
  }

  const handleDelete = (id: string) => {
    setCvs(cvs.filter(cv => cv.id !== id))
    setActionMenuOpen(null)
  }

  const handleSetDefault = (id: string) => {
    setCvs(cvs.map(cv => ({
      ...cv,
      isDefault: cv.id === id
    })))
    setActionMenuOpen(null)
  }

  const filteredCVs = cvs
    .filter(cv => selectedCategory === 'all' || cv.category === selectedCategory)
    .filter(cv => 
      searchQuery === '' || 
      cv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cv.title?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Mina sparade CV</h2>
          <p className="text-slate-600">Du har {cvs.length} CV:n sparade</p>
        </div>
        <Link
          to="/cv"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Skapa nytt CV
        </Link>
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
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <Folder className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Inga CV hittades</h3>
          <p className="text-slate-600 mb-4">
            {searchQuery 
              ? 'Prova att söka efter något annat' 
              : 'Skapa ditt första CV för att komma igång'}
          </p>
          <Link
            to="/cv"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Skapa CV
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCVs.map(cv => (
            <div 
              key={cv.id}
              className={cn(
                'bg-white rounded-2xl border-2 p-5 transition-all hover:shadow-md',
                cv.isDefault ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200'
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
                  cv.isDefault ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'
                )}>
                  <FileText className="w-7 h-7" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800 text-lg">{cv.name}</h3>
                    {cv.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                        <Star className="w-3 h-3" />
                        Standard
                      </span>
                    )}
                  </div>
                  
                  {cv.title && (
                    <p className="text-slate-600 text-sm">{cv.title}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Folder className="w-4 h-4" />
                      {getCategoryLabel(cv.category)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Uppdaterad {formatDate(cv.updated_at)}
                    </span>
                    {cv.atsScore && (
                      <span className={cn(
                        'flex items-center gap-1 font-medium',
                        cv.atsScore >= 80 ? 'text-green-600' : 
                        cv.atsScore >= 60 ? 'text-amber-600' : 'text-red-600'
                      )}>
                        <Check className="w-4 h-4" />
                        ATS: {cv.atsScore}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    to={`/cv?id=${cv.id}`}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Redigera"
                  >
                    <Edit2 className="w-5 h-5" />
                  </Link>
                  
                  <button
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Ladda ner"
                  >
                    <Download className="w-5 h-5" />
                  </button>

                  {/* More Actions Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setActionMenuOpen(actionMenuOpen === cv.id ? null : cv.id)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
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
      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
        <h3 className="font-semibold text-amber-900 mb-2">💡 Tips: Anpassa CV för olika jobb</h3>
        <p className="text-amber-800 text-sm">
          Skapa olika versioner av ditt CV för olika typer av jobb. Ett CV för butiksjobb bör framhäva 
          kundservice, medan ett för lager bör fokusera på logistik och arbets tempo. 
          Markera det CV du använder mest som "Standard".
        </p>
      </div>
    </div>
  )
}

export default MyCVs
