/**
 * CompanyCard — kort för ett sparat företag i Spontanansökan.
 * Status, uppföljningsdatum, kontaktperson, anteckningar och genväg
 * till Personligt brev-generatorn.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  MapPin,
  Calendar,
  MoreVertical,
  Trash2,
  Edit2,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Archive,
  FileText,
  Mail,
  Phone,
  User,
  UserPlus,
  Star,
  StarOff,
  Briefcase,
  MessageCircle,
  Loader2,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatOrgNumber, getSniDescription } from '@/services/bolagsverketApi'
import type {
  SpontaneousCompany,
  SpontaneousStatus,
  UpdateSpontaneousCompany,
  OutreachMethod,
} from '@/services/supabaseApi'
import { applicationsApi } from '@/services/applicationsApi'
import { showToast } from '@/components/Toast'
import { buildSpontaneousCoverLetterUrl } from '@/utils/jobLinks'
import { StatusBadge } from './spontaneousStatus'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'

const OUTREACH_METHODS: OutreachMethod[] = ['email', 'linkedin', 'phone', 'visit', 'other']

function addDaysIso(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

export function CompanyCard({
  company,
  onUpdateStatus,
  onDelete,
  onUpdate,
  selectable = false,
  selected = false,
  onToggleSelect,
}: {
  company: SpontaneousCompany
  onUpdateStatus: (status: SpontaneousStatus) => void
  onDelete: () => void
  onUpdate: (updates: UpdateSpontaneousCompany) => void
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState(company.notes || '')
  const [isEditingFollowup, setIsEditingFollowup] = useState(false)
  const [followupValue, setFollowupValue] = useState(company.followup_date || '')
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [contactDraft, setContactDraft] = useState({
    name: company.contact_name || '',
    email: company.contact_email || '',
    phone: company.contact_phone || '',
    method: (company.outreach_method || '') as OutreachMethod | '',
  })
  const [isAddingToApplications, setIsAddingToApplications] = useState(false)
  const [addedToApplications, setAddedToApplications] = useState(false)

  const address = company.company_data?.address
  const sniCodes = company.company_data?.sniCodes || []
  const businessDescription = company.company_data?.businessDescription
  const hasContact = Boolean(company.contact_name || company.contact_email || company.contact_phone)
  const suggestFollowup = !company.followup_date && (company.status === 'contacted' || company.status === 'waiting')

  const handleSaveNotes = () => {
    onUpdate({ notes: notesValue })
    setIsEditingNotes(false)
  }

  const handleSaveFollowup = () => {
    if (!followupValue) return
    onUpdate({ followup_date: followupValue })
    setIsEditingFollowup(false)
  }

  const handleRemoveFollowup = () => {
    onUpdate({ followup_date: null })
    setFollowupValue('')
    setIsEditingFollowup(false)
  }

  const handleSaveContact = () => {
    onUpdate({
      contact_name: contactDraft.name.trim() || null,
      contact_email: contactDraft.email.trim() || null,
      contact_phone: contactDraft.phone.trim() || null,
      outreach_method: contactDraft.method || null,
    })
    setIsEditingContact(false)
  }

  const openCoverLetter = () => {
    navigate(buildSpontaneousCoverLetterUrl(company, t('spontaneous.title')))
  }

  // Positivt svar → skapa post på Ansökningar-sidan (pipeline, kontakter, påminnelser)
  const handleAddToApplications = async () => {
    setIsAddingToApplications(true)
    try {
      await applicationsApi.create({
        jobData: {
          headline: t('spontaneous.title'),
          employer: { name: company.company_name },
          workplace_address: { municipality: company.company_data?.address?.city },
          description: { text: company.company_data?.businessDescription },
        },
        status: 'applied',
        source: 'manual',
        notes: company.notes || undefined,
      })
      setAddedToApplications(true)
      showToast.success(t('spontaneous.toasts.addedToApplications', { name: company.company_name }))
    } catch (err) {
      console.error('Error adding to applications:', err)
      showToast.error(t('spontaneous.toasts.addToApplicationsError'))
    } finally {
      setIsAddingToApplications(false)
    }
  }

  return (
    <Card className={`p-4 hover:shadow-md transition-shadow bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 ${selected ? 'ring-2 ring-[var(--c-solid)]' : ''}`}>
      <div className="flex justify-between items-start gap-4">
        {selectable && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            aria-label={t('spontaneous.selectCompany', { name: company.company_name })}
            className="mt-1 w-4 h-4 flex-shrink-0 text-primary-500 rounded border-stone-300 focus:ring-primary-500"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-[var(--c-solid)] dark:text-[var(--c-solid)] flex-shrink-0" aria-hidden="true" />
            <h3 className="font-semibold truncate text-stone-800 dark:text-stone-100">{company.company_name}</h3>
          </div>

          <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">
            {formatOrgNumber(company.org_number)}
            {company.company_data?.legalForm && ` - ${company.company_data.legalForm}`}
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            <StatusBadge status={company.status} />
            {company.priority === 'high' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {t('spontaneous.highPriority')}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-600 dark:text-stone-400">
            {address?.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                {address.street && `${address.street}, `}{address.city}
              </span>
            )}
            {sniCodes.length > 0 && (
              <span className="truncate max-w-[200px]" title={sniCodes.map(s => s.description || getSniDescription(s.code)).join(', ')}>
                {sniCodes[0].description || getSniDescription(sniCodes[0].code)}
              </span>
            )}
          </div>

          {businessDescription && (
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 line-clamp-2" title={businessDescription}>
              <FileText className="w-3 h-3 inline mr-1" aria-hidden="true" />
              {businessDescription}
            </p>
          )}

          {company.outreach_date && (
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" aria-hidden="true" />
              {t('spontaneous.contacted')}: {new Date(company.outreach_date).toLocaleDateString('sv-SE')}
            </p>
          )}

          {/* Uppföljning */}
          {isEditingFollowup ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label htmlFor={`followup-${company.id}`} className="sr-only">
                {t('spontaneous.followup.dateLabel')}
              </label>
              <input
                id={`followup-${company.id}`}
                type="date"
                value={followupValue}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFollowupValue(e.target.value)}
                className="text-sm px-2 py-1 rounded-md border bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100"
              />
              <Button size="sm" onClick={handleSaveFollowup} disabled={!followupValue} className="bg-[var(--c-solid)] hover:bg-[var(--c-solid)]">
                {t('common.save')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditingFollowup(false)} className="border-stone-200 dark:border-stone-700">
                {t('common.cancel')}
              </Button>
              {company.followup_date && (
                <Button size="sm" variant="ghost" onClick={handleRemoveFollowup} className="text-red-600">
                  {t('spontaneous.followup.remove')}
                </Button>
              )}
            </div>
          ) : company.followup_date ? (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {t('spontaneous.followUp')}: {new Date(company.followup_date).toLocaleDateString('sv-SE')}
              <button
                type="button"
                onClick={() => { setFollowupValue(company.followup_date || ''); setIsEditingFollowup(true) }}
                className="underline hover:no-underline text-stone-600 dark:text-stone-400 ml-1"
              >
                {t('spontaneous.followup.change')}
              </button>
            </p>
          ) : suggestFollowup ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
              <Clock className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              <span>{t('spontaneous.followup.suggestion')}</span>
              <button
                type="button"
                onClick={() => onUpdate({ followup_date: addDaysIso(7) })}
                className="px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700"
              >
                {t('spontaneous.followup.quickWeek')}
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ followup_date: addDaysIso(14) })}
                className="px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700"
              >
                {t('spontaneous.followup.quickTwoWeeks')}
              </button>
              <button
                type="button"
                onClick={() => setIsEditingFollowup(true)}
                className="px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700"
              >
                {t('spontaneous.followup.pickDate')}
              </button>
            </div>
          ) : null}

          {/* Nästa steg vid positivt svar */}
          {company.status === 'response_positive' && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              <span>{t('spontaneous.nextSteps.title')}</span>
              {!addedToApplications && (
                <button
                  type="button"
                  onClick={handleAddToApplications}
                  disabled={isAddingToApplications}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50"
                >
                  {isAddingToApplications ? (
                    <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                  ) : (
                    <Briefcase className="w-3 h-3" aria-hidden="true" />
                  )}
                  {t('spontaneous.nextSteps.addToApplications')}
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/interview-simulator')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
              >
                <MessageCircle className="w-3 h-3" aria-hidden="true" />
                {t('spontaneous.nextSteps.practiceInterview')}
              </button>
            </div>
          )}

          {/* Kontaktperson */}
          {isEditingContact ? (
            <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-700 space-y-2">
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{t('spontaneous.contact.title')}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label htmlFor={`contact-name-${company.id}`} className="block text-xs text-stone-600 dark:text-stone-400 mb-0.5">
                    {t('spontaneous.contact.name')}
                  </label>
                  <input
                    id={`contact-name-${company.id}`}
                    type="text"
                    value={contactDraft.name}
                    onChange={(e) => setContactDraft(d => ({ ...d, name: e.target.value }))}
                    placeholder={t('spontaneous.contact.namePlaceholder')}
                    className="w-full text-sm px-2 py-1.5 rounded-md border bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label htmlFor={`contact-method-${company.id}`} className="block text-xs text-stone-600 dark:text-stone-400 mb-0.5">
                    {t('spontaneous.contact.method')}
                  </label>
                  <select
                    id={`contact-method-${company.id}`}
                    value={contactDraft.method}
                    onChange={(e) => setContactDraft(d => ({ ...d, method: e.target.value as OutreachMethod | '' }))}
                    className="w-full text-sm px-2 py-1.5 rounded-md border bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100"
                  >
                    <option value="">–</option>
                    {OUTREACH_METHODS.map(m => (
                      <option key={m} value={m}>{t(`spontaneous.contact.methods.${m}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`contact-email-${company.id}`} className="block text-xs text-stone-600 dark:text-stone-400 mb-0.5">
                    {t('spontaneous.contact.email')}
                  </label>
                  <input
                    id={`contact-email-${company.id}`}
                    type="email"
                    value={contactDraft.email}
                    onChange={(e) => setContactDraft(d => ({ ...d, email: e.target.value }))}
                    className="w-full text-sm px-2 py-1.5 rounded-md border bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label htmlFor={`contact-phone-${company.id}`} className="block text-xs text-stone-600 dark:text-stone-400 mb-0.5">
                    {t('spontaneous.contact.phone')}
                  </label>
                  <input
                    id={`contact-phone-${company.id}`}
                    type="tel"
                    value={contactDraft.phone}
                    onChange={(e) => setContactDraft(d => ({ ...d, phone: e.target.value }))}
                    className="w-full text-sm px-2 py-1.5 rounded-md border bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveContact} className="bg-[var(--c-solid)] hover:bg-[var(--c-solid)]">
                  {t('common.save')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditingContact(false)} className="border-stone-200 dark:border-stone-700">
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          ) : hasContact ? (
            <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-700 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-600 dark:text-stone-400">
              {company.contact_name && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" aria-hidden="true" />
                  {company.contact_name}
                  {company.outreach_method && (
                    <span className="text-xs text-stone-500 dark:text-stone-500">
                      ({t(`spontaneous.contact.methods.${company.outreach_method}`)})
                    </span>
                  )}
                </span>
              )}
              {company.contact_email && (
                <a href={`mailto:${company.contact_email}`} className="flex items-center gap-1 hover:underline">
                  <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                  {company.contact_email}
                </a>
              )}
              {company.contact_phone && (
                <a href={`tel:${company.contact_phone}`} className="flex items-center gap-1 hover:underline">
                  <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                  {company.contact_phone}
                </a>
              )}
              <button
                type="button"
                onClick={() => setIsEditingContact(true)}
                aria-label={`${t('common.edit')}: ${t('spontaneous.contact.title')}`}
                className="text-stone-500 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
              >
                <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-700">
              <button
                type="button"
                onClick={() => setIsEditingContact(true)}
                className="text-xs text-stone-500 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 flex items-center gap-1"
              >
                <UserPlus className="w-3 h-3" aria-hidden="true" />
                {t('spontaneous.contact.add')}
              </button>
            </div>
          )}

          {/* Notes Section */}
          <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-700">
            {isEditingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  className="w-full text-sm p-2 border rounded-md bg-white dark:bg-stone-700 border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100"
                  rows={3}
                  placeholder={t('spontaneous.addNotesPlaceholder')}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveNotes} className="bg-[var(--c-solid)] hover:bg-[var(--c-solid)] dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-solid)]">{t('common.save')}</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditingNotes(false)} className="border-stone-200 dark:border-stone-700">{t('common.cancel')}</Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingNotes(true)}
                className="w-full text-left text-sm text-stone-600 dark:text-stone-400 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-700 p-1 rounded"
              >
                {company.notes ? (
                  <span className="line-clamp-2 block">{company.notes}</span>
                ) : (
                  <span className="text-stone-500 dark:text-stone-500 italic flex items-center gap-1">
                    <Edit2 className="w-3 h-3" aria-hidden="true" />
                    {t('spontaneous.clickToAddNotes')}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" aria-label={t('spontaneous.companyActions')} className="h-8 w-8 p-0">
              <MoreVertical className="w-4 h-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={openCoverLetter}>
              <Mail className="w-4 h-4 mr-2" />
              {t('spontaneous.writeCoverLetter')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setFollowupValue(company.followup_date || ''); setIsEditingFollowup(true) }}>
              <Clock className="w-4 h-4 mr-2" />
              {t('spontaneous.followup.plan')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsEditingContact(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              {t('spontaneous.contact.title')}
            </DropdownMenuItem>
            {company.priority === 'high' ? (
              <DropdownMenuItem onClick={() => onUpdate({ priority: 'medium' })}>
                <StarOff className="w-4 h-4 mr-2" />
                {t('spontaneous.priorityActions.clearHigh')}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onUpdate({ priority: 'high' })}>
                <Star className="w-4 h-4 mr-2" />
                {t('spontaneous.priorityActions.markHigh')}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onUpdateStatus('to_contact')}>
              <Send className="w-4 h-4 mr-2" />
              {t('spontaneous.markAs')}: {t('spontaneous.status.to_contact')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus('contacted')}>
              <Send className="w-4 h-4 mr-2" />
              {t('spontaneous.markAs')}: {t('spontaneous.status.contacted')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus('waiting')}>
              <Clock className="w-4 h-4 mr-2" />
              {t('spontaneous.markAs')}: {t('spontaneous.status.waiting')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onUpdateStatus('response_positive')}>
              <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
              {t('spontaneous.status.response_positive')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus('response_negative')}>
              <XCircle className="w-4 h-4 mr-2 text-red-600" />
              {t('spontaneous.status.response_negative')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus('no_response')}>
              <AlertCircle className="w-4 h-4 mr-2" />
              {t('spontaneous.status.no_response')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onUpdateStatus('archived')}>
              <Archive className="w-4 h-4 mr-2" />
              {t('spontaneous.archive')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )
}

export default CompanyCard
