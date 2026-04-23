/**
 * DocumentsSection - Dokument-uppladdning (certifikat, intyg, etc)
 * Updated with ARIA attributes and toast notifications
 */

import { useState, useEffect, useRef, useId } from 'react'
import { Plus, X, FileText, Upload, Loader2, ExternalLink, Calendar, Building2 } from '@/components/ui/icons'
import { profileDocumentsApi, type ProfileDocument } from '@/services/profileEnhancementsApi'
import { cn } from '@/lib/utils'
import { notifications } from '@/lib/toast'

const DOCUMENT_TYPES = [
  { value: 'certificate', label: 'Certifikat' },
  { value: 'degree', label: 'Examensbevis' },
  { value: 'reference', label: 'Referensbrev' },
  { value: 'other', label: 'Övrigt' },
]

interface Props {
  className?: string
}

export function DocumentsSection({ className }: Props) {
  const [documents, setDocuments] = useState<ProfileDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'certificate' as ProfileDocument['type'],
    description: '',
    issuer: '',
    issue_date: '',
    expiry_date: ''
  })

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const data = await profileDocumentsApi.getAll()
      setDocuments(data)
    } catch (err) {
      console.error('Error loading documents:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      notifications.error('Filen måste vara mindre än 10MB')
      return
    }

    setSelectedFile(file)
    setFormData(prev => ({
      ...prev,
      name: prev.name || file.name.replace(/\.[^/.]+$/, '')
    }))
    setShowForm(true)
  }

  const handleUpload = async () => {
    if (!selectedFile || !formData.name) return

    setUploading(true)
    const toastId = notifications.loading('Laddar upp...')

    try {
      const doc = await profileDocumentsApi.upload(selectedFile, {
        name: formData.name,
        type: formData.type,
        description: formData.description || undefined,
        issuer: formData.issuer || undefined,
        issue_date: formData.issue_date || undefined,
        expiry_date: formData.expiry_date || undefined
      })
      setDocuments(prev => [doc, ...prev])
      resetForm()
      notifications.dismiss(toastId)
      notifications.success('Dokument uppladdat!')
    } catch (err) {
      console.error('Error uploading document:', err)
      notifications.dismiss(toastId)
      notifications.error('Kunde inte ladda upp dokumentet')
    } finally {
      setUploading(false)
    }
  }

  // State for delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    // If already in confirm state, proceed with deletion
    if (deleteConfirm === id) {
      try {
        await profileDocumentsApi.delete(id)
        setDocuments(prev => prev.filter(d => d.id !== id))
        notifications.success('Dokument borttaget')
      } catch (err) {
        console.error('Error deleting document:', err)
        notifications.error('Kunde inte ta bort dokumentet')
      } finally {
        setDeleteConfirm(null)
      }
    } else {
      // Set confirm state - user needs to click again to confirm
      setDeleteConfirm(id)
      // Auto-reset after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setFormData({
      name: '',
      type: 'certificate',
      description: '',
      issuer: '',
      issue_date: '',
      expiry_date: ''
    })
    setShowForm(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('sv-SE')
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload area */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        aria-label="Ladda upp dokument"
      >
        <Upload className="w-8 h-8 mx-auto text-stone-400 dark:text-stone-500 mb-2" aria-hidden="true" />
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Klicka för att ladda upp certifikat, intyg eller andra dokument
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">
          PDF, Word, bilder - max 10MB
        </p>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Välj fil att ladda upp"
      />

      {/* Upload form modal */}
      {showForm && selectedFile && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-modal-title"
        >
          <div className="bg-white dark:bg-stone-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="upload-modal-title" className="font-semibold text-stone-800 dark:text-stone-200">
                Ladda upp dokument
              </h3>
              <button
                onClick={resetForm}
                className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg"
                aria-label="Stäng dialogruta"
              >
                <X className="w-5 h-5 text-stone-500" aria-hidden="true" />
              </button>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-700 rounded-lg flex items-center gap-3">
              <FileText className="w-5 h-5 text-teal-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-stone-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                  Namn *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="T.ex. Projektledarutbildning"
                  className="w-full px-3 py-2 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                  Typ
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ProfileDocument['type'] }))}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                >
                  {DOCUMENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                  Utfärdare
                </label>
                <input
                  type="text"
                  value={formData.issuer}
                  onChange={(e) => setFormData(prev => ({ ...prev, issuer: e.target.value }))}
                  placeholder="T.ex. Komvux, Arbetsförmedlingen"
                  className="w-full px-3 py-2 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Utfärdat
                  </label>
                  <input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Giltigt t.o.m.
                  </label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                  Beskrivning
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Valfri beskrivning..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-2 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-lg text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleUpload}
                disabled={!formData.name || uploading}
                className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Laddar upp...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Ladda upp
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documents list */}
      {documents.length > 0 ? (
        <div className="space-y-2">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700"
            >
              <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-stone-800 dark:text-stone-200 truncate">
                    {doc.name}
                  </span>
                  <span className="px-2 py-0.5 text-xs bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 rounded-full">
                    {DOCUMENT_TYPES.find(t => t.value === doc.type)?.label || doc.type}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {doc.issuer && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {doc.issuer}
                    </span>
                  )}
                  {doc.issue_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(doc.issue_date)}
                    </span>
                  )}
                  {doc.file_size && (
                    <span>{formatFileSize(doc.file_size)}</span>
                  )}
                </div>
              </div>

              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/40 rounded-lg transition-colors"
                aria-label={`Öppna ${doc.name} i nytt fönster`}
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>

              <button
                onClick={() => handleDelete(doc.id)}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  deleteConfirm === doc.id
                    ? 'text-white bg-red-500 hover:bg-red-600'
                    : 'text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                )}
                aria-label={deleteConfirm === doc.id ? 'Klicka igen för att bekräfta borttagning' : `Ta bort: ${doc.name}`}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone-500 dark:text-stone-400 text-center py-4">
          Inga dokument uppladdade än.
        </p>
      )}
    </div>
  )
}
