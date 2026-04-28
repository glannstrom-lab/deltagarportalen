/**
 * Network Tab - Build and maintain professional network with cloud storage
 */
import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users, Plus, MessageCircle, Mail, Phone, Linkedin,
  ChevronRight, Star, Clock, CheckCircle2, Send, AlertCircle,
  Calendar, BookOpen, Copy, X, TrendingUp, Zap, Trash2, Edit2, Loader2
} from '@/components/ui/icons'
import { Card, Button, Input } from '@/components/ui'
import { NetworkingAssistant } from '@/components/ai'
import { cn } from '@/lib/utils'
import { networkApi, networkingEventsApi, type NetworkContact, type NetworkingEvent } from '@/services/careerApi'

// Message template definitions with i18n keys
const messageTemplateDefs = [
  {
    id: '1',
    titleKey: 'reconnect',
    textKey: 'reconnectText',
  },
  {
    id: '2',
    titleKey: 'askAdvice',
    textKey: 'askAdviceText',
  },
  {
    id: '3',
    titleKey: 'internship',
    textKey: 'internshipText',
  },
]

// LinkedIn tips with i18n keys
const linkedinTipKeys = [
  { key: 'optimizeProfile', icon: '📸' },
  { key: 'regularUpdates', icon: '📝' },
  { key: 'personalMessage', icon: '💬' },
  { key: 'engageInGroups', icon: '👥' },
]

// Networking script keys
const networkingScriptKeys = ['conference', 'afterMeeting', 'informational']

export default function NetworkTab() {
  const { t } = useTranslation()
  const [contacts, setContacts] = useState<NetworkContact[]>([])
  const [events, setEvents] = useState<NetworkingEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isAddingEvent, setIsAddingEvent] = useState(false)
  const [editingContact, setEditingContact] = useState<NetworkContact | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [newContact, setNewContact] = useState({
    name: '',
    relationship: '',
    company: '',
    email: '',
    notes: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    next_reminder: ''
  })
  const [newEvent, setNewEvent] = useState({
    title: '',
    event_date: '',
    location: '',
    expected_attendees: 0
  })
  const [showLinkedInTips, setShowLinkedInTips] = useState(false)
  const [showNetworkingScripts, setShowNetworkingScripts] = useState(false)
  const [copiedScript, setCopiedScript] = useState<string | null>(null)

  // Load contacts and events from cloud
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [contactsData, eventsData] = await Promise.all([
        networkApi.getAll(),
        networkingEventsApi.getUpcoming()
      ])
      setContacts(contactsData)
      setEvents(eventsData)
    } catch (err) {
      console.error('Failed to load network data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Build translated message templates
  const messageTemplates = useMemo(() => messageTemplateDefs.map(def => ({
    id: def.id,
    title: t(`career.network.templates.${def.titleKey}`),
    text: t(`career.network.templates.${def.textKey}`)
  })), [t])

  // Build translated LinkedIn tips
  const linkedinTips = useMemo(() => linkedinTipKeys.map(tip => ({
    title: t(`career.networkTab.linkedinTips.${tip.key}.title`),
    description: t(`career.networkTab.linkedinTips.${tip.key}.description`),
    icon: tip.icon
  })), [t])

  // Build translated networking scripts
  const networkingScripts = useMemo(() => networkingScriptKeys.map(key => ({
    title: t(`career.networkTab.networkingScripts.${key}.title`),
    script: t(`career.networkTab.networkingScripts.${key}.script`)
  })), [t])

  const addContact = async () => {
    if (!newContact.name.trim()) return
    setIsSaving(true)
    try {
      const saved = await networkApi.save({
        name: newContact.name,
        relationship: newContact.relationship as NetworkContact['relationship'] || 'other',
        company: newContact.company || undefined,
        email: newContact.email || undefined,
        notes: newContact.notes || undefined,
        status: 'active',
        tags: [],
        next_contact_date: newContact.next_reminder || undefined
      })
      setContacts(prev => [saved, ...prev])
      setNewContact({ name: '', relationship: '', company: '', email: '', notes: '', priority: 'medium', next_reminder: '' })
      setIsAdding(false)
    } catch (err) {
      console.error('Failed to save contact:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const updateContact = async (id: string, updates: Partial<NetworkContact>) => {
    setIsSaving(true)
    try {
      const updated = await networkApi.update(id, updates)
      setContacts(prev => prev.map(c => c.id === id ? updated : c))
      setEditingContact(null)
    } catch (err) {
      console.error('Failed to update contact:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const deleteContact = async (id: string) => {
    if (!confirm(t('career.networkTab.confirmDeleteContact'))) return
    try {
      await networkApi.delete(id)
      setContacts(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('Failed to delete contact:', err)
    }
  }

  const markContacted = async (id: string) => {
    try {
      const updated = await networkApi.markContacted(id)
      setContacts(prev => prev.map(c => c.id === id ? updated : c))
    } catch (err) {
      console.error('Failed to mark contacted:', err)
    }
  }

  const addEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.event_date) return
    setIsSaving(true)
    try {
      const saved = await networkingEventsApi.create({
        title: newEvent.title,
        event_date: newEvent.event_date,
        location: newEvent.location || undefined,
        expected_attendees: newEvent.expected_attendees || undefined,
        is_attending: false
      })
      setEvents(prev => [...prev, saved].sort((a, b) => a.event_date.localeCompare(b.event_date)))
      setNewEvent({ title: '', event_date: '', location: '', expected_attendees: 0 })
      setIsAddingEvent(false)
    } catch (err) {
      console.error('Failed to save event:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleEventAttending = async (id: string) => {
    try {
      const updated = await networkingEventsApi.toggleAttending(id)
      setEvents(prev => prev.map(e => e.id === id ? updated : e))
    } catch (err) {
      console.error('Failed to toggle attending:', err)
    }
  }

  const deleteEvent = async (id: string) => {
    if (!confirm(t('career.networkTab.confirmDeleteEvent'))) return
    try {
      await networkingEventsApi.delete(id)
      setEvents(prev => prev.filter(e => e.id !== id))
    } catch (err) {
      console.error('Failed to delete event:', err)
    }
  }

  const getDaysSinceContact = (date?: string) => {
    if (!date) return null
    const days = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedScript(text)
    setTimeout(() => setCopiedScript(null), 2000)
  }

  const needsFollowUp = contacts.filter(c => {
    if (!c.next_contact_date) return false
    const daysUntil = Math.floor((new Date(c.next_contact_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil <= 7 && daysUntil >= 0
  }).length

  const overdueFollowUps = contacts.filter(c => {
    if (!c.next_contact_date) return false
    const daysUntil = Math.floor((new Date(c.next_contact_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil < 0
  }).length

  // Helper function to format days text
  const formatDaysOverdue = (days: number) => {
    return `${days} ${days === 1 ? t('career.networkTab.dayOverdue') : t('career.networkTab.daysOverdue')}`
  }

  const formatDaysUntil = (days: number) => {
    if (days === 0) return t('career.network.today')
    if (days === 1) return t('career.networkTab.tomorrow')
    return t('career.networkTab.inDays', { count: days })
  }

  const formatDaysSince = (days: number | null) => {
    if (days === null) return t('career.networkTab.neverContacted')
    if (days === 0) return t('career.network.today')
    if (days === 1) return t('career.network.yesterday')
    return `${days} ${t('career.network.daysAgo')}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--c-text)]" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">{t('career.networkTab.loading')}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Follow-up Reminders Section */}
      {(needsFollowUp > 0 || overdueFollowUps > 0) && (
        <Card className="p-4 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700" role="region" aria-label={t('career.networkTab.followUpReminders')}>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            {t('career.networkTab.followUpReminders')}
            <span className="ml-auto text-sm font-normal px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              {overdueFollowUps + needsFollowUp} {t('career.networkTab.toHandle')}
            </span>
          </h3>

          <div className="space-y-2" role="list" aria-label={t('career.networkTab.followUpReminders')}>
            {/* Overdue contacts first */}
            {contacts.filter(c => {
              if (!c.next_contact_date) return false
              const daysUntil = Math.floor((new Date(c.next_contact_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              return daysUntil < 0
            }).map(contact => {
              const daysOverdue = Math.abs(Math.floor((new Date(contact.next_contact_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
              return (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  role="listitem"
                >
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-red-600 dark:text-red-300">{contact.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-red-900 dark:text-red-100 truncate">{contact.name}</p>
                    <p className="text-xs text-red-700 dark:text-red-300">
                      {formatDaysOverdue(daysOverdue)}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {contact.email && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-red-300 text-red-700 hover:bg-red-100"
                        onClick={() => window.location.href = `mailto:${contact.email}`}
                        aria-label={`${t('career.network.sendEmail')} ${contact.name}`}
                      >
                        <Mail className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="text-xs bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => markContacted(contact.id)}
                      aria-label={`${t('career.network.markContacted')} ${contact.name}`}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {t('career.networkTab.done')}
                    </Button>
                  </div>
                </div>
              )
            })}

            {/* Upcoming follow-ups */}
            {contacts.filter(c => {
              if (!c.next_contact_date) return false
              const daysUntil = Math.floor((new Date(c.next_contact_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              return daysUntil >= 0 && daysUntil <= 7
            }).map(contact => {
              const daysUntil = Math.floor((new Date(contact.next_contact_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              return (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                  role="listitem"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-300">{contact.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-amber-900 dark:text-amber-100 truncate">{contact.name}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      {formatDaysUntil(daysUntil)}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {contact.email && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                        onClick={() => window.location.href = `mailto:${contact.email}`}
                        aria-label={`${t('career.network.sendEmail')} ${contact.name}`}
                      >
                        <Mail className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={() => markContacted(contact.id)}
                      aria-label={`${t('career.network.markContacted')} ${contact.name}`}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {t('career.networkTab.done')}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* AI Networking Assistant */}
      <NetworkingAssistant />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 text-center bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <Users className="w-6 h-6 text-[var(--c-text)] dark:text-[var(--c-text)] mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{contacts.length}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{t('career.network.contacts')}</p>
        </Card>
        <Card className="p-4 text-center bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <MessageCircle className="w-6 h-6 text-[var(--c-text)] dark:text-[var(--c-text)] mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {contacts.filter(c => c.last_contact_date && getDaysSinceContact(c.last_contact_date)! < 30).length}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{t('career.network.activeThisMonth')}</p>
        </Card>
        <Card className="p-4 text-center bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {contacts.filter(c => c.status === 'reconnect').length}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{t('career.networkTab.toReconnect')}</p>
        </Card>
        <Card className="p-4 text-center bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
          <Calendar className="w-6 h-6 text-[var(--c-text)] dark:text-[var(--c-text)] mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{needsFollowUp}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{t('career.networkTab.followUpThisWeek')}</p>
        </Card>
      </div>

      {/* Add Contact */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('career.network.myNetwork')}</h3>
          <Button size="sm" onClick={() => setIsAdding(true)} className="bg-[var(--c-solid)] hover:bg-[var(--c-solid)]/90 dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-text)]">
            <Plus className="w-4 h-4 mr-1" />
            {t('career.network.addContact')}
          </Button>
        </div>

        {isAdding && (
          <div className="mb-4 p-4 bg-stone-50 dark:bg-stone-700 rounded-xl">
            <div className="grid gap-3">
              <Input
                placeholder={t('career.network.name')}
                value={newContact.name}
                onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                className="bg-white dark:bg-stone-600 border-stone-300 dark:border-stone-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder={t('career.network.relationPlaceholder')}
                  value={newContact.relationship}
                  onChange={(e) => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
                  className="bg-white dark:bg-stone-600 border-stone-300 dark:border-stone-500"
                />
                <Input
                  placeholder={t('career.network.companyOptional')}
                  value={newContact.company}
                  onChange={(e) => setNewContact(prev => ({ ...prev, company: e.target.value }))}
                  className="bg-white dark:bg-stone-600 border-stone-300 dark:border-stone-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="email"
                  placeholder={t('career.networkTab.emailOptional')}
                  value={newContact.email}
                  onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-white dark:bg-stone-600 border-stone-300 dark:border-stone-500"
                />
                <Input
                  type="date"
                  placeholder={t('career.networkTab.nextReminder')}
                  value={newContact.next_reminder}
                  onChange={(e) => setNewContact(prev => ({ ...prev, next_reminder: e.target.value }))}
                  className="bg-white dark:bg-stone-600 border-stone-300 dark:border-stone-500"
                />
              </div>
              <textarea
                placeholder={t('career.networkTab.notesOptional')}
                value={newContact.notes}
                onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-stone-600 border-stone-300 dark:border-stone-500 text-gray-800 dark:text-gray-100"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={addContact} disabled={isSaving} className="bg-[var(--c-solid)] hover:bg-[var(--c-solid)]/90 dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-text)]">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('career.network.save')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>{t('career.network.cancel')}</Button>
            </div>
          </div>
        )}

        {/* Contacts List */}
        <div className="space-y-3">
          {contacts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t('career.networkTab.noContactsYet')}</p>
              <p className="text-sm">{t('career.networkTab.addContactHint')}</p>
            </div>
          ) : contacts.map((contact) => {
            const daysSince = getDaysSinceContact(contact.last_contact_date)
            const daysUntilReminder = contact.next_contact_date ? Math.floor((new Date(contact.next_contact_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
            const isReminderSoon = daysUntilReminder !== null && daysUntilReminder <= 7 && daysUntilReminder >= 0
            const isReminderOverdue = daysUntilReminder !== null && daysUntilReminder < 0

            return (
              <div
                key={contact.id}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all',
                  isReminderOverdue
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : isReminderSoon
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                    : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-[var(--c-accent)] dark:hover:border-[var(--c-solid)]'
                )}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-[var(--c-text)] dark:text-[var(--c-text)]">
                      {contact.name.charAt(0)}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                          {contact.name}
                          {contact.status === 'reconnect' && (
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          )}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{contact.relationship}</p>
                        {contact.company && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{contact.company}</p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className={cn(
                          'text-xs font-medium',
                          daysSince && daysSince > 60 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                        )}>
                          {formatDaysSince(daysSince)}
                        </p>
                        {contact.next_contact_date && (
                          <p className={cn(
                            'text-xs mt-1',
                            isReminderOverdue
                              ? 'text-red-600 dark:text-red-400 font-semibold'
                              : isReminderSoon
                              ? 'text-amber-600 dark:text-amber-400 font-semibold'
                              : 'text-gray-500 dark:text-gray-400'
                          )}>
                            {daysUntilReminder === 0
                              ? t('career.network.today')
                              : daysUntilReminder === 1
                              ? t('career.networkTab.tomorrow')
                              : daysUntilReminder && daysUntilReminder > 0
                              ? t('career.networkTab.inDays', { count: daysUntilReminder })
                              : t('career.networkTab.overdue')}
                          </p>
                        )}
                      </div>
                    </div>

                    {contact.notes && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 p-2 bg-stone-50 dark:bg-stone-700 rounded italic">
                        "{contact.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => markContacted(contact.id)} title={t('career.network.markContacted')}>
                    <CheckCircle2 className="w-3 h-3" />
                  </Button>
                  {contact.email && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => window.location.href = `mailto:${contact.email}`}>
                      <Mail className="w-3 h-3" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => deleteContact(contact.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Networking Events */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
            {t('career.networkTab.networkingEvents')}
          </h3>
          <Button size="sm" variant="outline" onClick={() => setIsAddingEvent(true)}>
            <Plus className="w-4 h-4 mr-1" />
            {t('career.networkTab.addEvent')}
          </Button>
        </div>

        {isAddingEvent && (
          <div className="mb-4 p-4 bg-stone-50 dark:bg-stone-700 rounded-xl">
            <div className="grid gap-3">
              <Input
                placeholder={t('career.networkTab.eventName')}
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white dark:bg-stone-600 border-stone-300 dark:border-stone-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={newEvent.event_date}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, event_date: e.target.value }))}
                  className="bg-white dark:bg-stone-600 border-stone-300 dark:border-stone-500"
                />
                <Input
                  placeholder={t('career.networkTab.locationOptional')}
                  value={newEvent.location}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                  className="bg-white dark:bg-stone-600 border-stone-300 dark:border-stone-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={addEvent} disabled={isSaving} className="bg-[var(--c-solid)] hover:bg-[var(--c-solid)]/90">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('career.network.save')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAddingEvent(false)}>{t('career.network.cancel')}</Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('career.networkTab.noUpcomingEvents')}</p>
            </div>
          ) : events.map((event) => (
            <div
              key={event.id}
              className={cn(
                'p-4 rounded-xl border transition-all',
                event.is_attending
                  ? 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 border-[var(--c-accent)]/60 dark:border-[var(--c-accent)]/50'
                  : 'bg-stone-50 dark:bg-stone-700 border-stone-200 dark:border-stone-600 hover:border-[var(--c-accent)] dark:hover:border-[var(--c-solid)]'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100">{event.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(event.event_date).toLocaleDateString('sv-SE')}
                    {event.location && (
                      <>
                        <span>•</span>
                        <span>{event.location}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={event.is_attending ? 'default' : 'outline'}
                    onClick={() => toggleEventAttending(event.id)}
                    className={event.is_attending ? 'bg-[var(--c-solid)]' : ''}
                  >
                    {event.is_attending ? t('career.networkTab.attending') : t('career.networkTab.attend')}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteEvent(event.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Message Templates */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('career.network.messageTemplates')}</h3>
        <div className="space-y-3">
          {messageTemplates.map((template) => (
            <div
              key={template.id}
              className={cn(
                'p-4 rounded-xl border-2 cursor-pointer transition-all',
                selectedTemplate === template.id
                  ? 'border-[var(--c-solid)] dark:border-[var(--c-solid)] bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30'
                  : 'border-stone-200 dark:border-stone-700 hover:border-[var(--c-accent)] dark:hover:border-[var(--c-solid)]'
              )}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">{template.title}</h4>
              {selectedTemplate === template.id && (
                <div className="mt-3 space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-stone-700 p-3 rounded-lg">
                    {template.text}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(template.text)}
                    className="bg-[var(--c-solid)] hover:bg-[var(--c-solid)]/90 dark:bg-[var(--c-solid)] dark:hover:bg-[var(--c-text)]"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    {copiedScript === template.text ? t('career.networkTab.copied') : t('career.networkTab.copy')}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* LinkedIn Tips */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setShowLinkedInTips(!showLinkedInTips)}>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {t('career.networkTab.linkedinTips.title')}
          </h3>
          <ChevronRight className={cn('w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform', showLinkedInTips && 'rotate-90')} />
        </div>

        {showLinkedInTips && (
          <div className="space-y-3">
            {linkedinTips.map((tip, idx) => (
              <div key={idx} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-1">
                  <span className="text-lg">{tip.icon}</span>
                  {tip.title}
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">{tip.description}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Networking Scripts */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setShowNetworkingScripts(!showNetworkingScripts)}>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            {t('career.networkTab.networkingScripts.title')}
          </h3>
          <ChevronRight className={cn('w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform', showNetworkingScripts && 'rotate-90')} />
        </div>

        {showNetworkingScripts && (
          <div className="space-y-3">
            {networkingScripts.map((script, idx) => (
              <div key={idx} className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-800">
                <h4 className="font-semibold text-sky-900 dark:text-sky-100 mb-2">{script.title}</h4>
                <p className="text-sm text-sky-800 dark:text-sky-200 italic mb-2">
                  "{script.script}"
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(script.script)}
                  className="text-xs"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  {copiedScript === script.script ? t('career.networkTab.copied') : t('career.networkTab.copy')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* LinkedIn Integration */}
      <Card className="p-6 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Linkedin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{t('career.network.syncWithLinkedIn')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('career.network.importContacts')}</p>
          </div>
          <Button variant="outline">{t('career.network.connect')}</Button>
        </div>
      </Card>
    </div>
  )
}
