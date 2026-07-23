/**
 * ApplicationsContacts Component
 * CRM-style view for managing recruiter contacts
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  User, Mail, Phone, Linkedin, MoreVertical,
  Edit2, Trash2, MessageSquare, Clock, X, Briefcase
} from '@/components/ui/icons'
import { Button, Card, useConfirmDialog } from '@/components/ui'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from '@/components/ui/DropdownMenu'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useApplications } from '@/hooks/useApplications'
import { applicationContactsApi } from '@/services/applicationsApi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApplicationContact, CreateContactInput } from '@/types/application.types'

const editInputClass = 'w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)] bg-white'

function ContactEditModal({
  contact,
  onSave,
  onClose,
  isSaving
}: {
  contact: ApplicationContact
  onSave: (id: string, input: Partial<CreateContactInput>) => Promise<void>
  onClose: () => void
  isSaving: boolean
}) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: contact.name,
    title: contact.title || '',
    email: contact.email || '',
    phone: contact.phone || '',
    linkedinUrl: contact.linkedinUrl || '',
    notes: contact.notes || '',
  })
  const [error, setError] = useState<string | null>(null)

  // Fokusfälla + Escape/utanförklick stänger (WCAG 2.1.2)
  const modalRef = useFocusTrap<HTMLDivElement>(true, { onEscape: onClose })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError(t('applications.contacts.nameRequired', 'Namn måste fyllas i'))
      return
    }
    setError(null)
    try {
      // Tomma strängar skickas medvetet — undefined-nycklar stryks i API-lagret
      // och skulle göra det omöjligt att rensa ett fält.
      await onSave(contact.id, {
        name: formData.name.trim(),
        title: formData.title.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        linkedinUrl: formData.linkedinUrl.trim(),
        notes: formData.notes.trim(),
        isPrimary: contact.isPrimary,
      })
      onClose()
    } catch {
      setError(t('applications.contacts.saveError', 'Kunde inte spara kontakten. Försök igen.'))
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-contact-title-heading"
    >
      <div ref={modalRef} className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-stone-100 p-4 flex items-center justify-between">
          <h2 id="edit-contact-title-heading" className="text-lg font-semibold text-stone-900">{t('applications.contacts.editTitle', 'Redigera kontakt')}</h2>
          <button
            onClick={onClose}
            aria-label={t('applications.common.close', 'Stäng')}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-stone-700" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label htmlFor="edit-contact-name" className="block text-sm font-medium text-stone-700 mb-1">
              {t('applications.contacts.name', 'Namn')} <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-contact-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={editInputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="edit-contact-title" className="block text-sm font-medium text-stone-700 mb-1">{t('applications.contacts.roleTitle', 'Titel')}</label>
            <input
              id="edit-contact-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={editInputClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-contact-email" className="block text-sm font-medium text-stone-700 mb-1">{t('applications.contacts.email', 'E-post')}</label>
              <input
                id="edit-contact-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={editInputClass}
              />
            </div>
            <div>
              <label htmlFor="edit-contact-phone" className="block text-sm font-medium text-stone-700 mb-1">{t('applications.contacts.phone', 'Telefon')}</label>
              <input
                id="edit-contact-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={editInputClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="edit-contact-linkedin" className="block text-sm font-medium text-stone-700 mb-1">{t('applications.contacts.linkedin', 'LinkedIn-länk')}</label>
            <input
              id="edit-contact-linkedin"
              type="url"
              value={formData.linkedinUrl}
              onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
              placeholder="https://linkedin.com/in/..."
              className={editInputClass}
            />
          </div>
          <div>
            <label htmlFor="edit-contact-notes" className="block text-sm font-medium text-stone-700 mb-1">{t('applications.contacts.notes', 'Anteckningar')}</label>
            <textarea
              id="edit-contact-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className={`${editInputClass} resize-none`}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t('applications.common.cancel', 'Avbryt')}
            </Button>
            <Button type="submit" disabled={isSaving} className="flex-1">
              {isSaving ? t('applications.common.saving', 'Sparar...') : t('applications.common.save', 'Spara')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ContactCard({
  contact,
  applicationLabel,
  onEdit,
  onDelete,
  onMarkContacted
}: {
  contact: ApplicationContact
  /** "Tjänst · Företag" för ansökan kontakten hör till */
  applicationLabel?: string
  onEdit: (contact: ApplicationContact) => void
  onDelete: (id: string) => void
  onMarkContacted: (id: string) => void
}) {
  const { t } = useTranslation()

  const daysSinceContact = contact.lastContactedAt
    ? Math.floor((Date.now() - new Date(contact.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Card className="p-4 hover:shadow-md transition-shadow group">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-stone-100 dark:bg-stone-700 rounded-xl flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-stone-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                {contact.name}
                {contact.isPrimary && (
                  <span className="px-2 py-0.5 bg-[var(--c-accent)]/40 text-[var(--c-text)] rounded text-xs font-medium">
                    {t('applications.contacts.primary', 'Primär')}
                  </span>
                )}
              </h3>
              {contact.title && (
                <p className="text-sm text-stone-700">{contact.title}</p>
              )}
              {applicationLabel && (
                <p className="text-xs text-stone-600 mt-0.5 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">{applicationLabel}</span>
                </p>
              )}
            </div>

            {/* Synlig på touch och vid tangentbordsfokus; hover-gated endast på desktop */}
            <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label={t('applications.contacts.actionsAria', 'Åtgärder för kontakt')}
                    aria-haspopup="menu"
                    className="p-1.5 hover:bg-stone-100 rounded"
                  >
                    <MoreVertical className="w-4 h-4 text-stone-600" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[150px]">
                  <DropdownMenuItem onClick={() => onMarkContacted(contact.id)}>
                    <MessageSquare className="w-4 h-4" />
                    {t('applications.contacts.markContacted', 'Markera kontaktad')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(contact)}>
                    <Edit2 className="w-4 h-4" />
                    {t('applications.common.edit', 'Redigera')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(contact.id)} className="text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                    {t('applications.common.delete', 'Ta bort')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Contact info */}
          <div className="flex flex-wrap gap-3 mt-3">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-1.5 text-sm text-stone-600 hover:text-sky-600"
              >
                <Mail className="w-4 h-4" />
                {contact.email}
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-1.5 text-sm text-stone-600 hover:text-sky-600"
              >
                <Phone className="w-4 h-4" />
                {contact.phone}
              </a>
            )}
            {contact.linkedinUrl && (
              <a
                href={contact.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-stone-600 hover:text-sky-600"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </a>
            )}
          </div>

          {/* Notes */}
          {contact.notes && (
            <p className="text-sm text-stone-700 mt-2 italic">"{contact.notes}"</p>
          )}

          {/* Last contacted */}
          {contact.lastContactedAt && (
            <p className="text-xs text-stone-600 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {t('applications.contacts.lastContacted', 'Senast kontaktad:')}{' '}
              {daysSinceContact === 0
                ? t('applications.common.today', 'Idag')
                : t('applications.common.daysAgo', { count: daysSinceContact ?? 0 })}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

export function ApplicationsContacts() {
  const { t } = useTranslation()
  const { confirm } = useConfirmDialog()
  const queryClient = useQueryClient()
  const [editContact, setEditContact] = useState<ApplicationContact | null>(null)

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['application-contacts-all'],
    queryFn: () => applicationContactsApi.getAll(),
    staleTime: 60 * 1000
  })

  // Koppling kontakt -> ansökan ("Tjänst · Företag") — utan den säger
  // kontaktlistan inget om vilken process kontakten hör till
  const { applications } = useApplications()
  const applicationLabelById = useMemo(() => {
    const map = new Map<string, string>()
    for (const app of applications) {
      const jobData = app.jobData as { employer?: { name?: string }; headline?: string } | undefined
      const title = app.jobTitle || jobData?.headline
      const company = app.companyName || jobData?.employer?.name
      const label = [title, company].filter(Boolean).join(' · ')
      if (label) map.set(app.id, label)
    }
    return map
  }, [applications])

  const markContactedMutation = useMutation({
    mutationFn: (id: string) => applicationContactsApi.markContacted(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-contacts-all'] })
    },
    onError: (error) => {
      console.error('Failed to mark contact as contacted:', error)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => applicationContactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-contacts-all'] })
    },
    onError: (error) => {
      console.error('Failed to delete contact:', error)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateContactInput> }) =>
      applicationContactsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-contacts-all'] })
    }
  })

  const handleEdit = (contact: ApplicationContact) => {
    setEditContact(contact)
  }

  const handleSaveEdit = async (id: string, input: Partial<CreateContactInput>) => {
    await updateMutation.mutateAsync({ id, input })
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: t('applications.common.delete', 'Ta bort'),
      message: t('applications.contacts.deleteConfirm', 'Ta bort denna kontakt?'),
      confirmText: t('applications.common.delete', 'Ta bort'),
      cancelText: t('applications.common.cancel', 'Avbryt'),
      variant: 'danger',
    })
    if (ok) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleMarkContacted = async (id: string) => {
    await markContactedMutation.mutateAsync(id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" role="status" aria-label={t('common.loadingStatus', 'Laddar')} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">{t('applications.contacts.title', 'Kontakter')}</h2>
          <p className="text-sm text-stone-700">
            {t('applications.contacts.savedCount', { count: contacts.length })}
          </p>
        </div>
      </div>

      {contacts.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-stone-600" />
          </div>
          <h3 className="text-xl font-semibold text-stone-700 mb-2">{t('applications.contacts.emptyTitle', 'Inga kontakter än')}</h3>
          <p className="text-stone-700 mb-4 max-w-md mx-auto">
            {t('applications.contacts.emptyDescription', 'Lägg till kontakter från dina ansökningar för att hålla koll på rekryterare och kontaktpersoner.')}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {contacts.map(contact => (
            <ContactCard
              key={contact.id}
              contact={contact}
              applicationLabel={applicationLabelById.get(contact.applicationId)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMarkContacted={handleMarkContacted}
            />
          ))}
        </div>
      )}

      {editContact && (
        <ContactEditModal
          contact={editContact}
          onSave={handleSaveEdit}
          onClose={() => setEditContact(null)}
          isSaving={updateMutation.isPending}
        />
      )}
    </div>
  )
}

export default ApplicationsContacts
