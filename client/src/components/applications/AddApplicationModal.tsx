/**
 * AddApplicationModal Component
 * Modal for adding or editing job applications manually
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  X, Building2, Briefcase, MapPin, Link2, Calendar,
  FileText, AlertCircle, ChevronDown
} from '@/components/ui/icons'
import { Button, Card } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useApplications } from '@/hooks/useApplications'
import {
  APPLICATION_STATUS_CONFIG,
  getStatusLabel,
  type Application,
  type ApplicationStatus,
  type ApplicationPriority,
  type ApplicationSource
} from '@/types/application.types'

interface AddApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  editApplication?: Application | null
  prefillJob?: {
    jobId?: string
    companyName?: string
    jobTitle?: string
    location?: string
    jobUrl?: string
    jobData?: any
  }
}

const PRIORITY_OPTIONS: { value: ApplicationPriority; label: string; color: string }[] = [
  { value: 'high', label: 'Hög', color: 'text-red-600' },
  { value: 'medium', label: 'Medium', color: 'text-amber-600' },
  { value: 'low', label: 'Låg', color: 'text-slate-600' },
]

const SOURCE_OPTIONS: { value: ApplicationSource; label: string }[] = [
  { value: 'job_search', label: 'Jobbsökning' },
  { value: 'job_alert', label: 'Jobbnotis' },
  { value: 'manual', label: 'Manuellt tillagd' },
  { value: 'import', label: 'Importerad' },
]

export function AddApplicationModal({
  isOpen,
  onClose,
  editApplication,
  prefillJob
}: AddApplicationModalProps) {
  const { t } = useTranslation()
  const { createApplication, updateApplication } = useApplications()

  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    location: '',
    jobUrl: '',
    source: 'manual' as ApplicationSource,
    status: 'interested' as ApplicationStatus,
    priority: 'medium' as ApplicationPriority,
    applicationDate: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form data
  useEffect(() => {
    if (editApplication) {
      setFormData({
        companyName: editApplication.companyName || '',
        jobTitle: editApplication.jobTitle || '',
        location: editApplication.location || '',
        jobUrl: editApplication.jobUrl || '',
        source: editApplication.source || 'manual',
        status: editApplication.status,
        priority: editApplication.priority,
        applicationDate: editApplication.applicationDate || '',
        notes: editApplication.notes || '',
      })
    } else if (prefillJob) {
      setFormData(prev => ({
        ...prev,
        companyName: prefillJob.companyName || '',
        jobTitle: prefillJob.jobTitle || '',
        location: prefillJob.location || '',
        jobUrl: prefillJob.jobUrl || '',
        source: 'job_search',
      }))
    } else {
      // Reset form
      setFormData({
        companyName: '',
        jobTitle: '',
        location: '',
        jobUrl: '',
        source: 'manual',
        status: 'interested',
        priority: 'medium',
        applicationDate: '',
        notes: '',
      })
    }
    setError(null)
  }, [editApplication, prefillJob, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.companyName.trim() || !formData.jobTitle.trim()) {
      setError('Företag och tjänst är obligatoriska fält')
      return
    }

    setIsSubmitting(true)

    try {
      if (editApplication) {
        await updateApplication(editApplication.id, {
          status: formData.status,
          priority: formData.priority,
          applicationDate: formData.applicationDate || undefined,
          notes: formData.notes || undefined,
        })
      } else {
        // Create ManualJobData from form fields
        const jobData = prefillJob?.jobData || {
          headline: formData.jobTitle,
          employer: { name: formData.companyName },
          workplace_address: formData.location ? { municipality: formData.location } : undefined,
          webpage_url: formData.jobUrl || undefined,
        }

        await createApplication({
          jobId: prefillJob?.jobId,
          jobData,
          source: formData.source,
          status: formData.status,
          priority: formData.priority,
          notes: formData.notes || undefined,
        })
      }
      onClose()
    } catch (err) {
      console.error('Failed to save application:', err)
      setError('Kunde inte spara ansökan. Försök igen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {editApplication ? 'Redigera ansökan' : 'Lägg till ansökan'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Företag <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="T.ex. Spotify"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>
          </div>

          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tjänst <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="T.ex. Frontend Developer"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Plats</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="T.ex. Stockholm"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Job URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Länk till annons</label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="url"
                value={formData.jobUrl}
                onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                placeholder="https://..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Source & Application Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Källa</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value as ApplicationSource })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                {SOURCE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ansökningsdatum</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={formData.applicationDate}
                  onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ApplicationStatus })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                {Object.keys(APPLICATION_STATUS_CONFIG).map(status => (
                  <option key={status} value={status}>
                    {getStatusLabel(status as ApplicationStatus)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prioritet</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as ApplicationPriority })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                {PRIORITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Anteckningar</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Anteckningar om ansökan..."
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Avbryt
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Sparar...' : editApplication ? 'Spara ändringar' : 'Lägg till'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AddApplicationModal
