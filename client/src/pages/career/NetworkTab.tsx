/**
 * Network Tab - Build and maintain professional network
 */
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users, Plus, MessageCircle, Mail, Phone, Linkedin,
  ChevronRight, Star, Clock, CheckCircle2, Send
} from 'lucide-react'
import { Card, Button, Input } from '@/components/ui'

interface Contact {
  id: string
  name: string
  relationship: string
  company?: string
  lastContact?: string
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
    priority: 'high',
    notes: 'Jobbar nu som produktägare på Spotify'
  },
  {
    id: '2',
    name: 'Marcus Johansson',
    relationship: 'Kurskamrat',
    lastContact: '2026-01-20',
    priority: 'medium',
  },
  {
    id: '3',
    name: 'Lisa Nilsson',
    relationship: 'LinkedIn-kontakt',
    company: 'Digital Agency',
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

export default function NetworkTab() {
  const { t, i18n } = useTranslation()
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [isAdding, setIsAdding] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [newContact, setNewContact] = useState({ name: '', relationship: '', company: '' })

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

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <Users className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-800">{contacts.length}</p>
          <p className="text-sm text-slate-500">{t('career.network.contacts')}</p>
        </Card>
        <Card className="p-4 text-center">
          <MessageCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-800">
            {contacts.filter(c => c.lastContact && getDaysSinceContact(c.lastContact)! < 30).length}
          </p>
          <p className="text-sm text-slate-500">{t('career.network.activeThisMonth')}</p>
        </Card>
        <Card className="p-4 text-center">
          <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-800">
            {contacts.filter(c => c.priority === 'high').length}
          </p>
          <p className="text-sm text-slate-500">{t('career.network.highPriority')}</p>
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
            return (
              <div
                key={contact.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-indigo-600">
                    {contact.name.charAt(0)}
                  </span>
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-800">{contact.name}</h4>
                  <p className="text-sm text-slate-600">{contact.relationship}</p>
                  {contact.company && (
                    <p className="text-xs text-slate-500">{contact.company}</p>
                  )}
                </div>

                <div className="text-right">
                  {daysSince !== null && (
                    <p className={`text-xs ${daysSince > 60 ? 'text-red-500' : 'text-slate-500'}`}>
                      {daysSince === 0 ? t('career.network.today') : `${daysSince} ${t('career.network.daysAgo')}`}
                    </p>
                  )}
                  {contact.priority === 'high' && (
                    <Star className="w-4 h-4 text-yellow-500 ml-auto mt-1" />
                  )}
                </div>

                <Button size="sm" variant="outline">
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Message Templates */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('career.network.messageTemplates')}</h3>
        <div className="space-y-3">
          {messageTemplates.map((template) => (
            <div
              key={template.id}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedTemplate === template.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:border-indigo-300'
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <h4 className="font-semibold text-slate-800 mb-2">{template.title}</h4>
              {selectedTemplate === template.id && (
                <div className="mt-3">
                  <p className="text-sm text-slate-600 bg-white p-3 rounded-lg mb-3">
                    {template.text}
                  </p>
                  <Button size="sm">
                    <Send className="w-4 h-4 mr-1" />
                    {t('career.network.copyText')}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
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
