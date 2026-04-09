/**
 * Network Tab - Build and maintain professional network with enhanced tracking
 */
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users, Plus, MessageCircle, Mail, Phone, Linkedin,
  ChevronRight, Star, Clock, CheckCircle2, Send, AlertCircle,
  Calendar, BookOpen, Copy, X, TrendingUp, Zap
} from '@/components/ui/icons'
import { Card, Button, Input } from '@/components/ui'
import { NetworkingAssistant } from '@/components/ai'
import { cn } from '@/lib/utils'

interface Contact {
  id: string
  name: string
  relationship: string
  company?: string
  lastContact?: string
  nextReminder?: string
  priority: 'high' | 'medium' | 'low'
  notes?: string
}

const initialContacts: Contact[] = [
  {
    id: '1',
    name: 'Anna Svensson',
    relationship: 'Tidigare kollega',
    company: 'Tech Solutions AB',
    lastContact: '2026-02-15',
    nextReminder: '2026-04-15',
    priority: 'high',
    notes: 'Jobbar nu som produktägare på Spotify'
  },
  {
    id: '2',
    name: 'Marcus Johansson',
    relationship: 'Kurskamrat',
    lastContact: '2026-01-20',
    nextReminder: '2026-04-20',
    priority: 'medium',
  },
  {
    id: '3',
    name: 'Lisa Nilsson',
    relationship: 'LinkedIn-kontakt',
    company: 'Digital Agency',
    nextReminder: '2026-05-01',
    priority: 'low',
  },
]

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

const linkedinTips = [
  {
    title: 'Optimera din profil',
    description: 'Se till att ditt profilbild är professionell och ditt sammanfattningsavsnitt väl skrivet.',
    icon: '📸'
  },
  {
    title: 'Regelbundna uppdateringar',
    description: 'Dela relevanta artiklar och erfarenheter för att stanna synlig i andras flöden.',
    icon: '📝'
  },
  {
    title: 'Personligt meddelande',
    description: 'När du skickar en kontaktförfrågan, lägg alltid till ett personligt meddelande.',
    icon: '💬'
  },
  {
    title: 'Engagera dig i grupper',
    description: 'Betala in relevanta LinkedIn-grupper i din bransch för att bygga nätverk.',
    icon: '👥'
  },
]

const networkingScripts = [
  {
    title: 'Vid en konferens',
    script: 'Hej! Jag heter [namn]. Jag är intresserad av [område]. Vad är du fokuserad på för tillfället?'
  },
  {
    title: 'Efter en möte',
    script: 'Det var mycket givande att prata med dig idag om [ämne]. Jag skulle gärna vilja hålla kontakten. Vill du följa varandra på LinkedIn?'
  },
  {
    title: 'Informativa samtal',
    script: 'Hej [namn], jag beundrar ditt arbete på [företag]. Skulle du ha tid för ett kort samtal om din karriärsväg?'
  },
]

export default function NetworkTab() {
  const { t, i18n } = useTranslation()
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [isAdding, setIsAdding] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [newContact, setNewContact] = useState({ name: '', relationship: '', company: '' })
  const [showLikedInTips, setShowLinkedInTips] = useState(false)
  const [showNetworkingScripts, setShowNetworkingScripts] = useState(false)
  const [copiedScript, setCopiedScript] = useState<string | null>(null)

  // Build translated message templates
  const messageTemplates = useMemo(() => messageTemplateDefs.map(def => ({
    id: def.id,
    title: t(`career.network.templates.${def.titleKey}`),
    text: t(`career.network.templates.${def.textKey}`)
  })), [t])

  const addContact = () => {
    if (!newContact.name.trim()) return
    const contact: Contact = {
      id: Date.now().toString(),
      name: newContact.name,
      relationship: newContact.relationship,
      company: newContact.company || undefined,
      priority: 'medium',
    }
    setContacts(prev => [...prev, contact])
    setNewContact({ name: '', relationship: '', company: '' })
    setIsAdding(false)
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
    if (!c.nextReminder) return false
    const daysUntil = Math.floor((new Date(c.nextReminder).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil <= 7 && daysUntil >= 0
  }).length

  const overdueFollowUps = contacts.filter(c => {
    if (!c.nextReminder) return false
    const daysUntil = Math.floor((new Date(c.nextReminder).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil < 0
  }).length

  const networkingEvents = [
    { title: 'Tech Meetup Stockholm', date: '2026-04-10', attendees: 25 },
    { title: 'Career Fair 2026', date: '2026-04-22', attendees: 150 },
    { title: 'LinkedIn Networking Brunch', date: '2026-05-05', attendees: 40 },
  ]

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {(needsFollowUp > 0 || overdueFollowUps > 0) && (
        <Card className={cn(
          'p-4 flex items-start gap-3',
          overdueFollowUps > 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
        )}>
          <AlertCircle className={cn(
            'w-5 h-5 flex-shrink-0 mt-0.5',
            overdueFollowUps > 0 ? 'text-red-600' : 'text-amber-600'
          )} />
          <div className="flex-1">
            <h4 className={cn(
              'font-semibold mb-1',
              overdueFollowUps > 0 ? 'text-red-900' : 'text-amber-900'
            )}>
              {overdueFollowUps > 0
                ? `${overdueFollowUps} överdue follow-ups`
                : `${needsFollowUp} follow-ups denna veckan`}
            </h4>
            <p className={cn(
              'text-sm',
              overdueFollowUps > 0 ? 'text-red-700' : 'text-amber-700'
            )}>
              {overdueFollowUps > 0
                ? 'Slå in och ta kontakt!'
                : 'Planera din uppföljning för att hålla nätverk aktivt.'}
            </p>
          </div>
        </Card>
      )}

      {/* AI Networking Assistant */}
      <NetworkingAssistant />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <Users className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-800">{contacts.length}</p>
          <p className="text-xs text-slate-500">Kontakter</p>
        </Card>
        <Card className="p-4 text-center">
          <MessageCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-800">
            {contacts.filter(c => c.lastContact && getDaysSinceContact(c.lastContact)! < 30).length}
          </p>
          <p className="text-xs text-slate-500">Aktiv denna månad</p>
        </Card>
        <Card className="p-4 text-center">
          <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-800">
            {contacts.filter(c => c.priority === 'high').length}
          </p>
          <p className="text-xs text-slate-500">Högt prioriterad</p>
        </Card>
        <Card className="p-4 text-center">
          <Calendar className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-800">{needsFollowUp}</p>
          <p className="text-xs text-slate-500">Uppföljning denna veckan</p>
        </Card>
      </div>

      {/* Add Contact */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">{t('career.network.myNetwork')}</h3>
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-1" />
            {t('career.network.addContact')}
          </Button>
        </div>

        {isAdding && (
          <div className="mb-4 p-4 bg-slate-50 rounded-xl">
            <div className="grid gap-3">
              <Input
                placeholder={t('career.network.name')}
                value={newContact.name}
                onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder={t('career.network.relationPlaceholder')}
                value={newContact.relationship}
                onChange={(e) => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
              />
              <Input
                placeholder={t('career.network.companyOptional')}
                value={newContact.company}
                onChange={(e) => setNewContact(prev => ({ ...prev, company: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={addContact}>{t('career.network.save')}</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>{t('career.network.cancel')}</Button>
            </div>
          </div>
        )}

        {/* Contacts List */}
        <div className="space-y-3">
          {contacts.map((contact) => {
            const daysSince = getDaysSinceContact(contact.lastContact)
            const daysUntilReminder = contact.nextReminder ? Math.floor((new Date(contact.nextReminder).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
            const isReminderSoon = daysUntilReminder !== null && daysUntilReminder <= 7 && daysUntilReminder >= 0
            const isReminderOverdue = daysUntilReminder !== null && daysUntilReminder < 0

            return (
              <div
                key={contact.id}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all',
                  isReminderOverdue
                    ? 'bg-red-50 border-red-200'
                    : isReminderSoon
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-white border-slate-200 hover:border-indigo-300'
                )}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-indigo-600">
                      {contact.name.charAt(0)}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                          {contact.name}
                          {contact.priority === 'high' && (
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          )}
                        </h4>
                        <p className="text-xs text-slate-600">{contact.relationship}</p>
                        {contact.company && (
                          <p className="text-xs text-slate-500">{contact.company}</p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className={cn(
                          'text-xs font-medium',
                          daysSince && daysSince > 60 ? 'text-red-600' : 'text-slate-600'
                        )}>
                          {daysSince === 0
                            ? 'Idag'
                            : daysSince === 1
                            ? 'Igår'
                            : daysSince ? `${daysSince} dagar sedan` : 'Aldrig'}
                        </p>
                        {contact.nextReminder && (
                          <p className={cn(
                            'text-xs mt-1',
                            isReminderOverdue
                              ? 'text-red-600 font-semibold'
                              : isReminderSoon
                              ? 'text-amber-600 font-semibold'
                              : 'text-slate-500'
                          )}>
                            {isReminderOverdue && '⚠️ '}
                            {daysUntilReminder === 0
                              ? 'Idag'
                              : daysUntilReminder === 1
                              ? 'Imorgon'
                              : daysUntilReminder && daysUntilReminder > 0
                              ? `Om ${daysUntilReminder} dagar`
                              : 'Överdue'}
                          </p>
                        )}
                      </div>
                    </div>

                    {contact.notes && (
                      <p className="text-xs text-slate-600 mt-2 p-2 bg-slate-50 rounded italic">
                        "{contact.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" className="text-xs">
                    <Mail className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    <MessageCircle className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Networking Events */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-600" />
          Nätvärksarrangemang
        </h3>
        <div className="space-y-3">
          {networkingEvents.map((event, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-slate-800">{event.title}</h4>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                  {event.attendees} deltagare
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <Calendar className="w-3 h-3" />
                {new Date(event.date).toLocaleDateString('sv-SE')}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Message Templates */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('career.network.messageTemplates')}</h3>
        <div className="space-y-3">
          {messageTemplates.map((template) => (
            <div
              key={template.id}
              className={cn(
                'p-4 rounded-xl border-2 cursor-pointer transition-all',
                selectedTemplate === template.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:border-indigo-300'
              )}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <h4 className="font-semibold text-slate-800 mb-2">{template.title}</h4>
              {selectedTemplate === template.id && (
                <div className="mt-3 space-y-3">
                  <p className="text-sm text-slate-600 bg-white p-3 rounded-lg">
                    {template.text}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(template.text)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    {copiedScript === template.text ? 'Kopierad!' : 'Kopiera'}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* LinkedIn Tips */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setShowLinkedInTips(!showLikedInTips)}>
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-blue-600" />
            LinkedIn Tips
          </h3>
          <ChevronRight className={cn('w-5 h-5 transition-transform', showLikedInTips && 'rotate-90')} />
        </div>

        {showLikedInTips && (
          <div className="space-y-3">
            {linkedinTips.map((tip, idx) => (
              <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 flex items-center gap-2 mb-1">
                  <span className="text-lg">{tip.icon}</span>
                  {tip.title}
                </h4>
                <p className="text-sm text-blue-800">{tip.description}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Networking Scripts */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setShowNetworkingScripts(!showNetworkingScripts)}>
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            Nätvärksscript
          </h3>
          <ChevronRight className={cn('w-5 h-5 transition-transform', showNetworkingScripts && 'rotate-90')} />
        </div>

        {showNetworkingScripts && (
          <div className="space-y-3">
            {networkingScripts.map((script, idx) => (
              <div key={idx} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2">{script.title}</h4>
                <p className="text-sm text-purple-800 italic mb-2">
                  "{script.script}"
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(script.script)}
                  className="text-xs"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  {copiedScript === script.script ? 'Kopierad!' : 'Kopiera'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* LinkedIn Integration */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Linkedin className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800">{t('career.network.syncWithLinkedIn')}</h3>
            <p className="text-sm text-slate-600">{t('career.network.importContacts')}</p>
          </div>
          <Button variant="outline">{t('career.network.connect')}</Button>
        </div>
      </Card>
    </div>
  )
}
