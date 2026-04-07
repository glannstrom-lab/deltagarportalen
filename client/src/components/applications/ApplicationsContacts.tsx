/**
 * ApplicationsContacts Component
 * CRM-style view for managing recruiter contacts
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  User, Mail, Phone, Linkedin, Building2, MoreVertical,
  Plus, Edit2, Trash2, MessageSquare, Clock
} from '@/components/ui/icons'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { applicationContactsApi } from '@/services/applicationsApi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApplicationContact } from '@/types/application.types'

function ContactCard({
  contact,
  onEdit,
  onDelete,
  onMarkContacted
}: {
  contact: ApplicationContact
  onEdit: (contact: ApplicationContact) => void
  onDelete: (id: string) => void
  onMarkContacted: (id: string) => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  const daysSinceContact = contact.lastContactedAt
    ? Math.floor((Date.now() - new Date(contact.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Card className="p-4 hover:shadow-md transition-shadow group">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-slate-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                {contact.name}
                {contact.isPrimary && (
                  <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-xs font-medium">
                    Primär
                  </span>
                )}
              </h3>
              {contact.title && (
                <p className="text-sm text-slate-500">{contact.title}</p>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4 text-slate-400" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 min-w-[150px]">
                    <button
                      onClick={() => { onMarkContacted(contact.id); setShowMenu(false) }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Markera kontaktad
                    </button>
                    <button
                      onClick={() => { onEdit(contact); setShowMenu(false) }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Redigera
                    </button>
                    <button
                      onClick={() => { onDelete(contact.id); setShowMenu(false) }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Ta bort
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Contact info */}
          <div className="flex flex-wrap gap-3 mt-3">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-600"
              >
                <Mail className="w-4 h-4" />
                {contact.email}
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-600"
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
                className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-600"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </a>
            )}
          </div>

          {/* Notes */}
          {contact.notes && (
            <p className="text-sm text-slate-500 mt-2 italic">"{contact.notes}"</p>
          )}

          {/* Last contacted */}
          {contact.lastContactedAt && (
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Senast kontaktad: {daysSinceContact === 0 ? 'Idag' : `${daysSinceContact} dagar sedan`}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

export function ApplicationsContacts() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['application-contacts-all'],
    queryFn: () => applicationContactsApi.getAll(),
    staleTime: 60 * 1000
  })

  const markContactedMutation = useMutation({
    mutationFn: (id: string) => applicationContactsApi.markContacted(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-contacts-all'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => applicationContactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-contacts-all'] })
    }
  })

  const handleEdit = (contact: ApplicationContact) => {
    // TODO: Open edit modal
    console.log('Edit contact:', contact)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Ta bort denna kontakt?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleMarkContacted = async (id: string) => {
    await markContactedMutation.mutateAsync(id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Kontakter</h2>
          <p className="text-sm text-slate-500">
            {contacts.length} kontakt{contacts.length !== 1 ? 'er' : ''} sparade
          </p>
        </div>
      </div>

      {contacts.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Inga kontakter än</h3>
          <p className="text-slate-500 mb-4 max-w-md mx-auto">
            Lägg till kontakter från dina ansökningar för att hålla koll på rekryterare och kontaktpersoner.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {contacts.map(contact => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMarkContacted={handleMarkContacted}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ApplicationsContacts
