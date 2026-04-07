/**
 * ApplicationDetailModal Component
 * Full detail view of a single application with history, contacts, and reminders
 */

import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  X, Building2, MapPin, ExternalLink, Calendar, Clock,
  Edit2, Trash2, Archive, Bell, User, MessageSquare,
  ChevronRight, Plus, FileText, Send, CheckCircle, Save
} from '@/components/ui/icons'
import { Button, Card } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useApplication, useApplications } from '@/hooks/useApplications'
import { DocumentSelector } from './DocumentSelector'
import {
  APPLICATION_STATUS_CONFIG,
  getStatusLabel,
  getNextStatuses,
  type Application,
  type ApplicationStatus
} from '@/types/application.types'

interface ApplicationDetailModalProps {
  application: Application
  isOpen: boolean
  onClose: () => void
  onEdit: (application: Application) => void
}

export function ApplicationDetailModal({
  application,
  isOpen,
  onClose,
  onEdit
}: ApplicationDetailModalProps) {
  const { t } = useTranslation()
  const { updateStatus, updateApplication, archiveApplication, deleteApplication } = useApplications()
  const {
    contacts,
    reminders,
    history,
    isLoading: isDetailLoading
  } = useApplication(application.id)

  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'contacts' | 'reminders' | 'documents'>('overview')

  // Document selection state
  const [selectedCVId, setSelectedCVId] = useState<string | null>(application.cvVersionId || null)
  const [selectedCoverLetterId, setSelectedCoverLetterId] = useState<string | null>(application.coverLetterId || null)
  const [isSavingDocuments, setIsSavingDocuments] = useState(false)
  const [documentsChanged, setDocumentsChanged] = useState(false)

  // Track if documents have changed
  useEffect(() => {
    const cvChanged = selectedCVId !== (application.cvVersionId || null)
    const letterChanged = selectedCoverLetterId !== (application.coverLetterId || null)
    setDocumentsChanged(cvChanged || letterChanged)
  }, [selectedCVId, selectedCoverLetterId, application.cvVersionId, application.coverLetterId])

  // Reset selections when application changes
  useEffect(() => {
    setSelectedCVId(application.cvVersionId || null)
    setSelectedCoverLetterId(application.coverLetterId || null)
  }, [application.id, application.cvVersionId, application.coverLetterId])

  const handleSaveDocuments = async () => {
    setIsSavingDocuments(true)
    try {
      await updateApplication(application.id, {
        cvVersionId: selectedCVId || undefined,
        coverLetterId: selectedCoverLetterId || undefined
      })
      setDocumentsChanged(false)
    } catch (error) {
      console.error('Failed to save documents:', error)
    } finally {
      setIsSavingDocuments(false)
    }
  }

  const statusConfig = APPLICATION_STATUS_CONFIG[application.status]
  const companyName = application.companyName || (application.jobData as any)?.employer?.name || 'Okänt företag'
  const jobTitle = application.jobTitle || (application.jobData as any)?.headline || 'Okänd tjänst'
  const location = application.location || (application.jobData as any)?.workplace_address?.municipality

  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(application.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    try {
      await updateStatus(application.id, newStatus)
      setShowStatusMenu(false)
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleArchive = async () => {
    try {
      await archiveApplication(application.id)
      onClose()
    } catch (error) {
      console.error('Failed to archive:', error)
    }
  }

  const handleDelete = async () => {
    if (confirm('Är du säker på att du vill ta bort denna ansökan? Detta går inte att ångra.')) {
      try {
        await deleteApplication(application.id)
        onClose()
      } catch (error) {
        console.error('Failed to delete:', error)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                statusConfig.bgColor
              )}>
                <Building2 className={cn("w-6 h-6", statusConfig.color)} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-slate-900 line-clamp-1">{jobTitle}</h2>
                <p className="text-slate-600">{companyName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Quick info */}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-500">
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {daysSinceCreated === 0 ? 'Tillagd idag' : `${daysSinceCreated} dagar sedan`}
            </span>
            {application.applicationDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Ansökt {new Date(application.applicationDate).toLocaleDateString('sv-SE')}
              </span>
            )}
          </div>

          {/* Status & Actions */}
          <div className="flex items-center gap-2 mt-4">
            {/* Status dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium border flex items-center gap-2",
                  statusConfig.bgColor, statusConfig.color, statusConfig.borderColor
                )}
              >
                {getStatusLabel(application.status)}
                <ChevronRight className={cn("w-4 h-4 transition-transform", showStatusMenu && "rotate-90")} />
              </button>

              {showStatusMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
                  <div className="absolute left-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 min-w-[160px]">
                    {getNextStatuses(application.status).map((status) => {
                      const config = APPLICATION_STATUS_CONFIG[status]
                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className={cn(
                            "w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2",
                            config.color
                          )}
                        >
                          <span className={cn("w-2 h-2 rounded-full", config.bgColor)} />
                          {getStatusLabel(status)}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Priority badge */}
            {application.priority !== 'medium' && (
              <span className={cn(
                "px-2 py-1 rounded text-xs font-medium border",
                application.priority === 'high'
                  ? "bg-red-100 text-red-700 border-red-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              )}>
                {application.priority === 'high' ? 'Hög prioritet' : 'Låg prioritet'}
              </span>
            )}

            <div className="flex-1" />

            {/* Actions */}
            <button
              onClick={() => onEdit(application)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
              title="Redigera"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleArchive}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
              title="Arkivera"
            >
              <Archive className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-600"
              title="Ta bort"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-100 px-4">
          <div className="flex gap-4">
            {[
              { id: 'overview' as const, label: 'Översikt' },
              { id: 'documents' as const, label: 'Dokument', badge: documentsChanged ? 'Ändrad' : undefined },
              { id: 'history' as const, label: 'Historik', count: history.length },
              { id: 'contacts' as const, label: 'Kontakter', count: contacts.length },
              { id: 'reminders' as const, label: 'Påminnelser', count: reminders.filter(r => !r.isCompleted).length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "py-3 px-1 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-violet-600 text-violet-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Notes */}
              {application.notes && (
                <Card className="p-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Anteckningar</h4>
                  <p className="text-slate-600">{application.notes}</p>
                </Card>
              )}

              {/* Documents summary */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-slate-700">Dokument</h4>
                  <button
                    onClick={() => setActiveTab('documents')}
                    className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                  >
                    Hantera →
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCVId ? (
                    <span className="flex items-center gap-1.5 px-2 py-1 bg-violet-100 text-violet-700 rounded text-xs">
                      <FileText className="w-3 h-3" />
                      CV kopplat
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs">
                      <FileText className="w-3 h-3" />
                      Inget CV
                    </span>
                  )}
                  {selectedCoverLetterId ? (
                    <span className="flex items-center gap-1.5 px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs">
                      <FileText className="w-3 h-3" />
                      Brev kopplat
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs">
                      <FileText className="w-3 h-3" />
                      Inget brev
                    </span>
                  )}
                </div>
              </Card>

              {/* Job link */}
              {application.jobUrl && (
                <a
                  href={application.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3 bg-slate-100 rounded-lg text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visa jobbannons
                </a>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900">Koppla dokument</h3>
                  <p className="text-sm text-slate-500">Välj CV och personligt brev för denna ansökan</p>
                </div>
                {documentsChanged && (
                  <Button
                    onClick={handleSaveDocuments}
                    disabled={isSavingDocuments}
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {isSavingDocuments ? 'Sparar...' : 'Spara'}
                  </Button>
                )}
              </div>

              <DocumentSelector
                selectedCVId={selectedCVId}
                selectedCoverLetterId={selectedCoverLetterId}
                onSelectCV={setSelectedCVId}
                onSelectCoverLetter={setSelectedCoverLetterId}
                companyName={companyName}
                jobTitle={jobTitle}
              />

              {documentsChanged && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  Osparade ändringar
                </p>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {isDetailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>Ingen historik än</p>
                </div>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">
                        {entry.eventType === 'status_change'
                          ? `Status ändrad: ${entry.oldValue} → ${entry.newValue}`
                          : entry.eventType.replace(/_/g, ' ')}
                      </p>
                      {entry.note && (
                        <p className="text-sm text-slate-500 mt-1">{entry.note}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(entry.createdAt).toLocaleString('sv-SE')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-3">
              {isDetailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600" />
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <User className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>Inga kontakter tillagda</p>
                  <Button variant="outline" size="sm" className="mt-3">
                    <Plus className="w-4 h-4 mr-1" />
                    Lägg till kontakt
                  </Button>
                </div>
              ) : (
                contacts.map((contact) => (
                  <Card key={contact.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900">{contact.name}</p>
                        {contact.title && (
                          <p className="text-sm text-slate-500">{contact.title}</p>
                        )}
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="text-sm text-indigo-600 hover:underline">
                            {contact.email}
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'reminders' && (
            <div className="space-y-3">
              {isDetailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600" />
                </div>
              ) : reminders.filter(r => !r.isCompleted).length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>Inga aktiva påminnelser</p>
                  <Button variant="outline" size="sm" className="mt-3">
                    <Plus className="w-4 h-4 mr-1" />
                    Lägg till påminnelse
                  </Button>
                </div>
              ) : (
                reminders.filter(r => !r.isCompleted).map((reminder) => (
                  <Card key={reminder.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Bell className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900">{reminder.title}</p>
                        <p className="text-sm text-slate-500">
                          {new Date(reminder.reminderDate).toLocaleDateString('sv-SE')}
                          {reminder.reminderTime && ` kl ${reminder.reminderTime.slice(0, 5)}`}
                        </p>
                      </div>
                      <button className="p-2 hover:bg-green-50 rounded-lg text-slate-400 hover:text-green-600">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ApplicationDetailModal
