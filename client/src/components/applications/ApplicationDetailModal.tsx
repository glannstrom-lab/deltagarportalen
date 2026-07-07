/**
 * ApplicationDetailModal Component
 * Full detail view of a single application with history, contacts, and reminders
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  X, Building2, MapPin, ExternalLink, Calendar, Clock,
  Edit2, Trash2, Archive, Bell, User,
  ChevronRight, Plus, FileText, CheckCircle, Save
} from '@/components/ui/icons'
import { Button, Card, useConfirmDialog } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useApplication, useApplications } from '@/hooks/useApplications'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { DocumentSelector } from './DocumentSelector'
import {
  APPLICATION_STATUS_CONFIG,
  getStatusLabel,
  getNextStatuses,
  type Application,
  type ApplicationStatus,
  type CreateContactInput,
  type CreateReminderInput,
  type ReminderType
} from '@/types/application.types'

interface ApplicationDetailModalProps {
  application: Application
  isOpen: boolean
  onClose: () => void
  onEdit: (application: Application) => void
  /** Pausar fokusfällan när en annan modal (t.ex. redigering) ligger ovanpå. */
  suspended?: boolean
}

const REMINDER_TYPE_OPTIONS: { value: ReminderType; label: string }[] = [
  { value: 'follow_up', label: 'Uppföljning' },
  { value: 'interview', label: 'Intervju' },
  { value: 'phone_screen', label: 'Telefonintervju' },
  { value: 'assessment', label: 'Arbetsprov' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'custom', label: 'Annat' },
]

const formInputClass = 'w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)] bg-white'

function ContactForm({
  onSubmit,
  onCancel,
  isSaving
}: {
  onSubmit: (input: Omit<CreateContactInput, 'applicationId'>) => Promise<void>
  onCancel: () => void
  isSaving: boolean
}) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError(t('applications.contacts.nameRequired', 'Namn måste fyllas i'))
      return
    }
    setError(null)
    try {
      await onSubmit({
        name: name.trim(),
        title: title.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      })
    } catch {
      setError(t('applications.detail.contactSaveError', 'Kunde inte spara kontakten. Försök igen.'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 bg-stone-50 rounded-lg space-y-3">
      <h4 className="text-sm font-medium text-stone-900">{t('applications.detail.newContact', 'Ny kontakt')}</h4>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="contact-name" className="block text-xs font-medium text-stone-700 mb-1">
            {t('applications.contacts.name', 'Namn')} <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('applications.detail.contactNamePlaceholder', 'T.ex. Anna Andersson')}
            className={formInputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="contact-title" className="block text-xs font-medium text-stone-700 mb-1">{t('applications.contacts.roleTitle', 'Titel')}</label>
          <input
            id="contact-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('applications.detail.contactTitlePlaceholder', 'T.ex. Rekryterare')}
            className={formInputClass}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-xs font-medium text-stone-700 mb-1">{t('applications.contacts.email', 'E-post')}</label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('applications.detail.contactEmailPlaceholder', 'namn@foretag.se')}
            className={formInputClass}
          />
        </div>
        <div>
          <label htmlFor="contact-phone" className="block text-xs font-medium text-stone-700 mb-1">{t('applications.contacts.phone', 'Telefon')}</label>
          <input
            id="contact-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('applications.detail.contactPhonePlaceholder', '070-123 45 67')}
            className={formInputClass}
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          {t('applications.common.cancel', 'Avbryt')}
        </Button>
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? t('applications.common.saving', 'Sparar...') : t('applications.detail.saveContact', 'Spara kontakt')}
        </Button>
      </div>
    </form>
  )
}

function ReminderForm({
  onSubmit,
  onCancel,
  isSaving
}: {
  onSubmit: (input: Omit<CreateReminderInput, 'applicationId'>) => Promise<void>
  onCancel: () => void
  isSaving: boolean
}) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [reminderType, setReminderType] = useState<ReminderType>('follow_up')
  const [reminderDate, setReminderDate] = useState('')
  const [reminderTime, setReminderTime] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !reminderDate) {
      setError(t('applications.detail.reminderRequiredError', 'Titel och datum måste fyllas i'))
      return
    }
    setError(null)
    try {
      await onSubmit({
        title: title.trim(),
        reminderType,
        reminderDate,
        reminderTime: reminderTime || undefined,
      })
    } catch {
      setError(t('applications.detail.reminderSaveError', 'Kunde inte spara påminnelsen. Försök igen.'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 bg-stone-50 rounded-lg space-y-3">
      <h4 className="text-sm font-medium text-stone-900">{t('applications.detail.newReminder', 'Ny påminnelse')}</h4>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="reminder-title" className="block text-xs font-medium text-stone-700 mb-1">
            {t('applications.detail.reminderTitle', 'Titel')} <span className="text-red-500">*</span>
          </label>
          <input
            id="reminder-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('applications.detail.reminderTitlePlaceholder', 'T.ex. Ring och följ upp')}
            className={formInputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="reminder-type" className="block text-xs font-medium text-stone-700 mb-1">{t('applications.detail.reminderType', 'Typ')}</label>
          <select
            id="reminder-type"
            value={reminderType}
            onChange={(e) => setReminderType(e.target.value as ReminderType)}
            className={formInputClass}
          >
            {REMINDER_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.value === 'custom'
                  ? t('applications.detail.reminderTypeOther', opt.label)
                  : t(`applications.calendar.types.${opt.value}`, opt.label)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="reminder-date" className="block text-xs font-medium text-stone-700 mb-1">
            {t('applications.detail.reminderDate', 'Datum')} <span className="text-red-500">*</span>
          </label>
          <input
            id="reminder-date"
            type="date"
            value={reminderDate}
            onChange={(e) => setReminderDate(e.target.value)}
            className={formInputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="reminder-time" className="block text-xs font-medium text-stone-700 mb-1">{t('applications.detail.reminderTime', 'Tid')}</label>
          <input
            id="reminder-time"
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className={formInputClass}
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          {t('applications.common.cancel', 'Avbryt')}
        </Button>
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? t('applications.common.saving', 'Sparar...') : t('applications.detail.saveReminder', 'Spara påminnelse')}
        </Button>
      </div>
    </form>
  )
}

export function ApplicationDetailModal({
  application,
  isOpen,
  onClose,
  onEdit,
  suspended = false
}: ApplicationDetailModalProps) {
  const { t, i18n } = useTranslation()
  const { confirm } = useConfirmDialog()
  const { updateStatus, updateApplication, archiveApplication, deleteApplication } = useApplications()
  const {
    contacts,
    reminders,
    history,
    isLoading: isDetailLoading,
    addContact,
    addReminder,
    completeReminder,
    isAddingContact,
    isAddingReminder
  } = useApplication(application.id)

  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'contacts' | 'reminders' | 'documents'>('overview')
  const [showContactForm, setShowContactForm] = useState(false)
  const [showReminderForm, setShowReminderForm] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Fokusfälla + Escape (WCAG 2.1.2). Pausas när redigeringsmodal eller
  // bekräftelsedialog ligger ovanpå så att deras egna fällor tar över.
  // Escape stänger statusmenyn först om den är öppen.
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen && !suspended && !confirmOpen, {
    onEscape: () => {
      if (showStatusMenu) {
        setShowStatusMenu(false)
      } else {
        onClose()
      }
    }
  })

  const handleAddContact = async (input: Omit<CreateContactInput, 'applicationId'>) => {
    await addContact(input)
    setShowContactForm(false)
  }

  const handleAddReminder = async (input: Omit<CreateReminderInput, 'applicationId'>) => {
    await addReminder(input)
    setShowReminderForm(false)
  }

  const handleCompleteReminder = async (reminderId: string) => {
    try {
      await completeReminder(reminderId)
    } catch (error) {
      console.error('Failed to complete reminder:', error)
    }
  }

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
  const jobData = application.jobData as { employer?: { name?: string }; headline?: string; workplace_address?: { municipality?: string } } | undefined
  const companyName = application.companyName || jobData?.employer?.name || t('applications.common.unknownCompany', 'Okänt företag')
  const jobTitle = application.jobTitle || jobData?.headline || t('applications.common.unknownTitle', 'Okänd tjänst')
  const location = application.location || jobData?.workplace_address?.municipality

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
    setConfirmOpen(true)
    const ok = await confirm({
      title: t('applications.common.delete', 'Ta bort'),
      message: t('applications.detail.deleteConfirm', 'Är du säker på att du vill ta bort denna ansökan? Detta går inte att ångra.'),
      confirmText: t('applications.common.delete', 'Ta bort'),
      cancelText: t('applications.common.cancel', 'Avbryt'),
      variant: 'danger',
    })
    setConfirmOpen(false)
    if (ok) {
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
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="application-detail-title"
    >
      <div ref={modalRef} className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-100 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                statusConfig.bgColor
              )}>
                <Building2 className={cn("w-6 h-6", statusConfig.color)} />
              </div>
              <div className="min-w-0">
                <h2 id="application-detail-title" className="text-lg font-semibold text-stone-900 line-clamp-1">{jobTitle}</h2>
                <p className="text-stone-600">{companyName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label={t('applications.common.close', 'Stäng')}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-stone-700" aria-hidden="true" />
            </button>
          </div>

          {/* Quick info */}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-stone-700">
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {daysSinceCreated === 0
                ? t('applications.detail.addedToday', 'Tillagd idag')
                : t('applications.common.daysAgo', { count: daysSinceCreated })}
            </span>
            {application.applicationDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {t('applications.card.appliedOn', { date: new Date(application.applicationDate).toLocaleDateString(i18n.language) })}
              </span>
            )}
          </div>

          {/* Status & Actions */}
          <div className="flex items-center gap-2 mt-4">
            {/* Status dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                aria-haspopup="menu"
                aria-expanded={showStatusMenu}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium border flex items-center gap-2",
                  statusConfig.bgColor, statusConfig.color, statusConfig.borderColor
                )}
              >
                {t(`applications.status.${application.status}`, getStatusLabel(application.status))}
                <ChevronRight className={cn("w-4 h-4 transition-transform", showStatusMenu && "rotate-90")} />
              </button>

              {showStatusMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
                  <div className="absolute left-0 mt-1 bg-white rounded-lg shadow-lg border border-stone-200 py-1 z-20 min-w-[160px]">
                    {getNextStatuses(application.status).map((status) => {
                      const config = APPLICATION_STATUS_CONFIG[status]
                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className={cn(
                            "w-full text-left px-3 py-2 text-sm hover:bg-stone-50 flex items-center gap-2",
                            config.color
                          )}
                        >
                          <span className={cn("w-2 h-2 rounded-full", config.bgColor)} />
                          {t(`applications.status.${status}`, getStatusLabel(status))}
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
                  : "bg-stone-100 text-stone-600 border-stone-200"
              )}>
                {application.priority === 'high'
                  ? t('applications.pipeline.priorityHigh', 'Hög prioritet')
                  : t('applications.pipeline.priorityLow', 'Låg prioritet')}
              </span>
            )}

            <div className="flex-1" />

            {/* Actions */}
            <button
              onClick={() => onEdit(application)}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-600 hover:text-stone-600"
              title={t('applications.common.edit', 'Redigera')}
              aria-label={t('applications.common.edit', 'Redigera')}
            >
              <Edit2 className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={handleArchive}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-600 hover:text-stone-600"
              title={t('applications.common.archive', 'Arkivera')}
              aria-label={t('applications.common.archive', 'Arkivera')}
            >
              <Archive className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors text-stone-600 hover:text-red-600"
              title={t('applications.common.delete', 'Ta bort')}
              aria-label={t('applications.common.delete', 'Ta bort')}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-stone-100 px-4">
          <div className="flex gap-4" role="tablist">
            {[
              { id: 'overview' as const, label: t('applications.detail.tabs.overview', 'Översikt') },
              { id: 'documents' as const, label: t('applications.detail.tabs.documents', 'Dokument'), badge: documentsChanged ? t('applications.detail.changedBadge', 'Ändrad') : undefined },
              { id: 'history' as const, label: t('applications.detail.tabs.history', 'Historik'), count: history.length },
              { id: 'contacts' as const, label: t('applications.detail.tabs.contacts', 'Kontakter'), count: contacts.length },
              { id: 'reminders' as const, label: t('applications.detail.tabs.reminders', 'Påminnelser'), count: reminders.filter(r => !r.isCompleted).length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={cn(
                  "py-3 px-1 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-[var(--c-solid)] text-[var(--c-text)]"
                    : "border-transparent text-stone-700 hover:text-stone-700"
                )}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded text-xs">
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
                  <h4 className="text-sm font-medium text-stone-700 mb-2">{t('applications.detail.notes', 'Anteckningar')}</h4>
                  <p className="text-stone-600">{application.notes}</p>
                </Card>
              )}

              {/* Documents summary */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-stone-700">{t('applications.detail.documents', 'Dokument')}</h4>
                  <button
                    onClick={() => setActiveTab('documents')}
                    className="text-xs text-[var(--c-text)] hover:text-[var(--c-text)] font-medium"
                  >
                    {t('applications.detail.manage', 'Hantera →')}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCVId ? (
                    <span className="flex items-center gap-1.5 px-2 py-1 bg-[var(--c-accent)]/40 text-[var(--c-text)] rounded text-xs">
                      <FileText className="w-3 h-3" />
                      {t('applications.detail.cvLinked', 'CV kopplat')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2 py-1 bg-stone-100 text-stone-700 rounded text-xs">
                      <FileText className="w-3 h-3" />
                      {t('applications.detail.noCv', 'Inget CV')}
                    </span>
                  )}
                  {selectedCoverLetterId ? (
                    <span className="flex items-center gap-1.5 px-2 py-1 bg-[var(--c-accent)]/40 text-[var(--c-text)] rounded text-xs">
                      <FileText className="w-3 h-3" />
                      {t('applications.detail.letterLinked', 'Brev kopplat')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2 py-1 bg-stone-100 text-stone-700 rounded text-xs">
                      <FileText className="w-3 h-3" />
                      {t('applications.detail.noLetter', 'Inget brev')}
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
                  className="flex items-center justify-center gap-2 p-3 bg-stone-100 rounded-lg text-stone-700 hover:bg-stone-200 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t('applications.detail.viewAd', 'Visa jobbannons')}
                </a>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-stone-900">{t('applications.detail.linkDocuments', 'Koppla dokument')}</h3>
                  <p className="text-sm text-stone-700">{t('applications.detail.linkDocumentsHint', 'Välj CV och personligt brev för denna ansökan')}</p>
                </div>
                {documentsChanged && (
                  <Button
                    onClick={handleSaveDocuments}
                    disabled={isSavingDocuments}
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {isSavingDocuments ? t('applications.common.saving', 'Sparar...') : t('applications.common.save', 'Spara')}
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
                  {t('applications.detail.unsavedChanges', 'Osparade ändringar')}
                </p>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {isDetailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--c-solid)]" role="status" aria-label="Laddar" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-stone-700">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                  <p>{t('applications.detail.noHistory', 'Ingen historik än')}</p>
                </div>
              ) : (
                history.map((entry) => {
                  const historyStatusLabel = (value: string) => {
                    const status = value.toLowerCase() as ApplicationStatus
                    return t(`applications.status.${status}`, getStatusLabel(status))
                  }
                  return (
                    <div key={entry.id} className="flex gap-3 p-3 bg-stone-50 rounded-lg">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-stone-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-700">
                          {entry.eventType === 'status_change'
                            ? `${t('applications.detail.statusChanged', 'Status ändrad:')} ${entry.oldValue ? historyStatusLabel(entry.oldValue) : '?'} → ${entry.newValue ? historyStatusLabel(entry.newValue) : '?'}`
                            : t(`applications.timeline.events.${entry.eventType}`, entry.eventType.replace(/_/g, ' '))}
                        </p>
                        {entry.note && (
                          <p className="text-sm text-stone-700 mt-1">{entry.note}</p>
                        )}
                        <p className="text-xs text-stone-600 mt-1">
                          {new Date(entry.createdAt).toLocaleString(i18n.language)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-3">
              {showContactForm && (
                <ContactForm
                  onSubmit={handleAddContact}
                  onCancel={() => setShowContactForm(false)}
                  isSaving={isAddingContact}
                />
              )}
              {isDetailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--c-solid)]" role="status" aria-label="Laddar" />
                </div>
              ) : contacts.length === 0 ? (
                !showContactForm && (
                  <div className="text-center py-8 text-stone-700">
                    <User className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                    <p>{t('applications.detail.noContacts', 'Inga kontakter tillagda')}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowContactForm(true)}>
                      <Plus className="w-4 h-4 mr-1" />
                      {t('applications.detail.addContact', 'Lägg till kontakt')}
                    </Button>
                  </div>
                )
              ) : (
                <>
                {!showContactForm && (
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setShowContactForm(true)}>
                      <Plus className="w-4 h-4 mr-1" />
                      {t('applications.detail.addContact', 'Lägg till kontakt')}
                    </Button>
                  </div>
                )}
                {contacts.map((contact) => (
                  <Card key={contact.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-stone-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-900">{contact.name}</p>
                        {contact.title && (
                          <p className="text-sm text-stone-700">{contact.title}</p>
                        )}
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="text-sm text-sky-600 hover:underline">
                            {contact.email}
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                </>
              )}
            </div>
          )}

          {activeTab === 'reminders' && (
            <div className="space-y-3">
              {showReminderForm && (
                <ReminderForm
                  onSubmit={handleAddReminder}
                  onCancel={() => setShowReminderForm(false)}
                  isSaving={isAddingReminder}
                />
              )}
              {isDetailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--c-solid)]" role="status" aria-label="Laddar" />
                </div>
              ) : reminders.filter(r => !r.isCompleted).length === 0 ? (
                !showReminderForm && (
                  <div className="text-center py-8 text-stone-700">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                    <p>{t('applications.detail.noReminders', 'Inga aktiva påminnelser')}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowReminderForm(true)}>
                      <Plus className="w-4 h-4 mr-1" />
                      {t('applications.detail.addReminder', 'Lägg till påminnelse')}
                    </Button>
                  </div>
                )
              ) : (
                <>
                {!showReminderForm && (
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setShowReminderForm(true)}>
                      <Plus className="w-4 h-4 mr-1" />
                      {t('applications.detail.addReminder', 'Lägg till påminnelse')}
                    </Button>
                  </div>
                )}
                {reminders.filter(r => !r.isCompleted).map((reminder) => (
                  <Card key={reminder.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Bell className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-900">{reminder.title}</p>
                        <p className="text-sm text-stone-700">
                          {new Date(reminder.reminderDate).toLocaleDateString(i18n.language)}
                          {reminder.reminderTime && ` ${t('applications.detail.atTime', 'kl')} ${reminder.reminderTime.slice(0, 5)}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCompleteReminder(reminder.id)}
                        aria-label={t('applications.detail.markDoneAria', { title: reminder.title })}
                        title={t('applications.common.markDone', 'Markera som klar')}
                        className="p-2 hover:bg-green-50 rounded-lg text-stone-600 hover:text-green-600"
                      >
                        <CheckCircle className="w-5 h-5" aria-hidden="true" />
                      </button>
                    </div>
                  </Card>
                ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ApplicationDetailModal
