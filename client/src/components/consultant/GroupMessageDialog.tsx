/**
 * GroupMessageDialog
 * Skicka ett meddelande till en eller flera deltagare via consultant_messages.
 * Används från OverviewTab (snabbåtgärd + Min dag) och ResourcesTab (dela jobbsamling).
 */

import { useState, useEffect } from 'react'
import { X, Search, Send, Loader2, CheckSquare, Square } from '@/components/ui/icons'
import { supabase } from '@/lib/supabase'
import { notifications } from '@/lib/toast'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Participant {
  participant_id: string
  first_name: string
  last_name: string
  email: string
}

interface GroupMessageDialogProps {
  isOpen: boolean
  onClose: () => void
  /** Förvalda mottagare (t.ex. en specifik deltagare från Min dag) */
  preselectedIds?: string[]
  /** Förifyllt meddelande (t.ex. en delad jobbsamling) */
  initialMessage?: string
  /** Anropas efter lyckad sändning med mottagarnas id:n */
  onSent?: (recipientIds: string[]) => void
}

export function GroupMessageDialog({
  isOpen,
  onClose,
  preselectedIds,
  initialMessage,
  onSent,
}: GroupMessageDialogProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setMessage(initialMessage || '')
    setSelectedIds(new Set(preselectedIds || []))
    setSearchQuery('')
    fetchParticipants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const fetchParticipants = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('consultant_dashboard_participants')
        .select('participant_id, first_name, last_name, email')
        .eq('consultant_id', user.id)

      if (error) throw error
      setParticipants(data || [])
    } catch (err) {
      console.error('Error fetching participants:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleParticipant = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtered = participants.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const allFilteredSelected = filtered.length > 0 && filtered.every(p => selectedIds.has(p.participant_id))

  const toggleAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        filtered.forEach(p => next.delete(p.participant_id))
      } else {
        filtered.forEach(p => next.add(p.participant_id))
      }
      return next
    })
  }

  const handleSend = async () => {
    if (selectedIds.size === 0 || !message.trim()) return
    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const recipientIds = Array.from(selectedIds)
      const rows = recipientIds.map(receiverId => ({
        sender_id: user.id,
        receiver_id: receiverId,
        content: message.trim(),
      }))

      const { error } = await supabase.from('consultant_messages').insert(rows)
      if (error) throw error

      notifications.success(
        recipientIds.length === 1
          ? 'Meddelandet skickades.'
          : `Meddelandet skickades till ${recipientIds.length} deltagare.`
      )
      onSent?.(recipientIds)
      onClose()
    } catch (err) {
      console.error('Error sending group message:', err)
      notifications.error('Meddelandet kunde inte skickas. Försök igen.')
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-700">
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Skicka meddelande
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              {selectedIds.size === 0
                ? 'Välj mottagare'
                : `${selectedIds.size} ${selectedIds.size === 1 ? 'mottagare' : 'mottagare'} vald${selectedIds.size === 1 ? '' : 'a'}`}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Stäng"
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Recipient picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Mottagare
              </label>
              <button
                onClick={toggleAll}
                className="text-sm text-amber-600 dark:text-amber-400 hover:underline font-medium"
              >
                {allFilteredSelected ? 'Avmarkera alla' : 'Välj alla'}
              </button>
            </div>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="text"
                placeholder="Sök deltagare..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full pl-9 pr-4 py-2 rounded-xl text-sm',
                  'bg-stone-100 dark:bg-stone-800',
                  'border-2 border-transparent focus:border-amber-500 dark:focus:border-amber-400',
                  'text-stone-900 dark:text-stone-100'
                )}
              />
            </div>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-stone-200 dark:border-stone-700 divide-y divide-stone-100 dark:divide-stone-800">
              {loading && (
                <p className="p-4 text-sm text-stone-500 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Hämtar deltagare...
                </p>
              )}
              {!loading && filtered.length === 0 && (
                <p className="p-4 text-sm text-stone-500">Inga deltagare hittades.</p>
              )}
              {!loading && filtered.map(p => {
                const checked = selectedIds.has(p.participant_id)
                return (
                  <button
                    key={p.participant_id}
                    onClick={() => toggleParticipant(p.participant_id)}
                    role="checkbox"
                    aria-checked={checked}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 text-left transition-colors',
                      checked ? 'bg-amber-50 dark:bg-amber-900/20' : 'hover:bg-stone-50 dark:hover:bg-stone-800'
                    )}
                  >
                    {checked
                      ? <CheckSquare className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" aria-hidden="true" />
                      : <Square className="w-5 h-5 text-stone-400 flex-shrink-0" aria-hidden="true" />}
                    <div className="min-w-0">
                      <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{p.email}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="group-message-content" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Meddelande
            </label>
            <textarea
              id="group-message-content"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Skriv ditt meddelande..."
              rows={5}
              className={cn(
                'w-full px-4 py-3 rounded-xl resize-none',
                'bg-stone-100 dark:bg-stone-800',
                'border-2 border-transparent focus:border-amber-500 dark:focus:border-amber-400',
                'text-stone-900 dark:text-stone-100'
              )}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-stone-200 dark:border-stone-700">
          <Button variant="ghost" onClick={onClose}>
            Avbryt
          </Button>
          <Button onClick={handleSend} disabled={sending || selectedIds.size === 0 || !message.trim()}>
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Skickar...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Skicka
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
