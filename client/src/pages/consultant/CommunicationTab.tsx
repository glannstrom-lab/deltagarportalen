/**
 * CommunicationTab — meddelanden + möten mellan konsulent och deltagare.
 *
 * Messages-läge: konversations-vy (en deltagare = en tråd). Vänster panel
 * listar alla pågående konversationer, höger panel visar hela tråden med
 * skicka-svar-input. Realtime via Supabase channel — nya meddelanden
 * dyker upp utan reload.
 *
 * Meetings-läge: oförändrat — schemalagda möten med möteslänk/typ.
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MessageSquare,
  Mail,
  Calendar,
  Users,
  Send,
  Search,
  Plus,
  Video,
  Phone,
  MapPin,
  Check,
  X,
  Bell,
  Inbox,
  Edit2,
  Loader2,
} from '@/components/ui/icons'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { cn } from '@/lib/utils'
import { MeetingSchedulerDialog } from '@/components/consultant/MeetingSchedulerDialog'

interface Message {
  id: string
  participantId: string
  participantName: string
  participantEmail: string
  content: string
  isRead: boolean
  createdAt: string
  direction: 'incoming' | 'outgoing'
}

interface Meeting {
  id: string
  participantId: string
  participantName: string
  scheduledAt: string
  duration: number
  type: 'video' | 'phone' | 'physical'
  location?: string
  meetingLink?: string
  notes?: string
  status: 'scheduled' | 'completed' | 'cancelled'
}

interface Participant {
  participant_id: string
  first_name: string
  last_name: string
  email: string
}

interface Conversation {
  participantId: string
  participantName: string
  participantEmail: string
  messages: Message[]
  latestMessage: Message
  unreadCount: number
}

// Mallar för Quick Messages — fyller compose-rutan så konsulenten slipper börja från noll.
const QUICK_TEMPLATES = {
  meetingReminder:
    'Hej! Påminner om vårt möte. Säg till om något kommer i vägen så hittar vi en ny tid.',
  checkIn:
    'Hej! Hur har veckan varit? Säg till om det är något du behöver hjälp med.',
  congrats:
    'Snyggt jobbat! Det är roligt att se framstegen — fortsätt så.',
} as const

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatRelativeDate(isoString: string, locale: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / (60 * 1000))
  const diffHour = Math.floor(diffMs / (60 * 60 * 1000))
  const diffDay = Math.floor(diffMs / (24 * 60 * 60 * 1000))

  if (diffMin < 1) return locale === 'en' ? 'just now' : 'nyss'
  if (diffMin < 60) return `${diffMin} ${locale === 'en' ? 'min' : 'min'}`
  if (diffHour < 24) return `${diffHour}${locale === 'en' ? 'h' : 'h'}`
  if (diffDay < 7) return `${diffDay}${locale === 'en' ? 'd' : 'd'}`
  return date.toLocaleDateString(locale === 'en' ? 'en-SE' : 'sv-SE', {
    month: 'short',
    day: 'numeric',
  })
}

// ============================================================================
// Conversation list item (left panel)
// ============================================================================
function ConversationListItem({
  conversation,
  isActive,
  onClick,
  locale,
}: {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
  locale: string
}) {
  const { participantName, latestMessage, unreadCount } = conversation
  const preview =
    (latestMessage.direction === 'outgoing' ? (locale === 'en' ? 'You: ' : 'Du: ') : '') +
    latestMessage.content

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 border-b border-stone-100 dark:border-stone-800',
        'hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors',
        isActive && 'bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30',
        unreadCount > 0 && !isActive && 'bg-[var(--c-bg)]/40 dark:bg-[var(--c-bg)]/15'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-solid)] flex items-center justify-center font-medium flex-shrink-0">
          {initialsOf(participantName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                'truncate',
                unreadCount > 0
                  ? 'font-semibold text-stone-900 dark:text-stone-100'
                  : 'font-medium text-stone-700 dark:text-stone-200'
              )}
            >
              {participantName}
            </p>
            <span className="text-xs text-stone-500 dark:text-stone-400 flex-shrink-0">
              {formatRelativeDate(latestMessage.createdAt, locale)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p
              className={cn(
                'text-sm truncate',
                unreadCount > 0
                  ? 'text-stone-700 dark:text-stone-300'
                  : 'text-stone-500 dark:text-stone-400'
              )}
            >
              {preview}
            </p>
            {unreadCount > 0 && (
              <span className="flex-shrink-0 px-2 py-0.5 bg-[var(--c-solid)] text-white text-[11px] rounded-full font-semibold tabular-nums">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

// ============================================================================
// Conversation thread (right panel) — bubbla-stil
// ============================================================================
function ConversationThread({
  conversation,
  onSendReply,
  isSending,
  t,
  locale,
}: {
  conversation: Conversation
  onSendReply: (content: string) => Promise<void>
  isSending: boolean
  t: (key: string, fallback?: string) => string
  locale: string
}) {
  const [reply, setReply] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation.messages.length])

  const handleSend = async () => {
    const content = reply.trim()
    if (!content) return
    await onSendReply(content)
    setReply('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="p-4 border-b border-stone-200 dark:border-stone-700 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-solid)] flex items-center justify-center font-medium">
          {initialsOf(conversation.participantName)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-stone-900 dark:text-stone-100 truncate">
            {conversation.participantName}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
            {conversation.participantEmail}
          </p>
        </div>
      </div>

      {/* Bubblor */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-stone-50/40 dark:bg-stone-900/20">
        {conversation.messages.map(m => {
          const isOwn = m.direction === 'outgoing'
          return (
            <div
              key={m.id}
              className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[78%] px-3.5 py-2 rounded-2xl',
                  isOwn
                    ? 'bg-[var(--c-solid)] text-white rounded-br-sm'
                    : 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-bl-sm border border-stone-200 dark:border-stone-700'
                )}
              >
                <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>
                <p
                  className={cn(
                    'text-[11px] mt-1 tabular-nums',
                    isOwn ? 'text-white/75' : 'text-stone-500 dark:text-stone-400'
                  )}
                >
                  {new Date(m.createdAt).toLocaleString(
                    locale === 'en' ? 'en-SE' : 'sv-SE',
                    { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }
                  )}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* Reply input */}
      <div className="p-3 border-t border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900">
        <div className="flex gap-2 items-end">
          <textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={t('consultant.communication.writeReply', 'Skriv svar… (Ctrl+Enter för att skicka)')}
            rows={2}
            className={cn(
              'flex-1 px-3 py-2 rounded-xl resize-none',
              'bg-stone-100 dark:bg-stone-800',
              'border border-transparent focus:border-[var(--c-accent)] focus:outline-none',
              'text-stone-900 dark:text-stone-100 text-sm'
            )}
          />
          <Button
            onClick={handleSend}
            disabled={!reply.trim() || isSending}
            size="sm"
            className="h-fit"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Meeting card (oförändrad — meetings-fliken är intakt)
// ============================================================================
function MeetingCard({
  meeting,
  onEdit,
  onCancel,
  joinMeetingLabel,
}: {
  meeting: Meeting
  onEdit: (meeting: Meeting) => void
  onCancel: (id: string) => void
  joinMeetingLabel: string
}) {
  const typeIcons = {
    video: Video,
    phone: Phone,
    physical: MapPin,
  }
  const TypeIcon = typeIcons[meeting.type]

  const isUpcoming = new Date(meeting.scheduledAt) > new Date()
  const isToday = new Date(meeting.scheduledAt).toDateString() === new Date().toDateString()

  return (
    <Card className={cn('p-4', isToday && 'ring-2 ring-[var(--c-solid)]')}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 text-[var(--c-solid)] dark:text-[var(--c-solid)]">
            <TypeIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-stone-900 dark:text-stone-100">
              {meeting.participantName}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-stone-500 dark:text-stone-400">
                {new Date(meeting.scheduledAt).toLocaleDateString('sv-SE', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <span className="text-stone-300 dark:text-stone-500">|</span>
              <span className="text-sm text-stone-500 dark:text-stone-400">
                {new Date(meeting.scheduledAt).toLocaleTimeString('sv-SE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="text-stone-300 dark:text-stone-500">|</span>
              <span className="text-sm text-stone-500 dark:text-stone-400">
                {meeting.duration} min
              </span>
            </div>
            {meeting.location && (
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {meeting.location}
              </p>
            )}
          </div>
        </div>
        {isUpcoming && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(meeting)}
              className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4 text-stone-500" />
            </button>
            <button
              onClick={() => onCancel(meeting.id)}
              className="p-2 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-rose-500" />
            </button>
          </div>
        )}
      </div>
      {isUpcoming && meeting.meetingLink && (
        <a
          href={meeting.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[var(--c-solid)] text-white rounded-lg text-sm font-medium hover:brightness-95 transition-all"
        >
          <Video className="w-4 h-4" />
          {joinMeetingLabel}
        </a>
      )}
    </Card>
  )
}

// ============================================================================
// New Message Dialog — accepterar nu en initialContent-prop för Quick Messages
// ============================================================================
function NewMessageDialog({
  isOpen,
  onClose,
  participants,
  onSend,
  initialContent = '',
  t,
}: {
  isOpen: boolean
  onClose: () => void
  participants: Participant[]
  onSend: (participantIds: string[], message: string) => void
  initialContent?: string
  t: (key: string, fallback?: string) => string
}) {
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [message, setMessage] = useState(initialContent)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isOpen) setMessage(initialContent)
  }, [isOpen, initialContent])

  if (!isOpen) return null

  const filteredParticipants = participants.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSend = () => {
    if (selectedParticipants.length > 0 && message.trim()) {
      onSend(selectedParticipants, message)
      setSelectedParticipants([])
      setMessage('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">
            {t('consultant.communication.newMessage', 'Nytt meddelande')}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              {t('consultant.communication.to', 'Till')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600" />
              <input
                type="text"
                placeholder={t('consultant.communication.searchParticipants', 'Sök deltagare')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full pl-10 pr-4 py-2.5 rounded-xl',
                  'bg-stone-100 dark:bg-stone-800',
                  'border-2 border-transparent focus:border-[var(--c-accent)]',
                  'text-stone-900 dark:text-stone-100'
                )}
              />
            </div>
            {selectedParticipants.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedParticipants.map(id => {
                  const p = participants.find(p => p.participant_id === id)
                  if (!p) return null
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/40 text-[var(--c-text)] dark:text-[var(--c-solid)] rounded-full text-sm"
                    >
                      {p.first_name} {p.last_name}
                      <button
                        onClick={() => setSelectedParticipants(prev => prev.filter(p => p !== id))}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
            <div className="max-h-40 overflow-y-auto mt-2 border border-stone-200 dark:border-stone-700 rounded-xl">
              {filteredParticipants.map(p => (
                <button
                  key={p.participant_id}
                  onClick={() => {
                    if (selectedParticipants.includes(p.participant_id)) {
                      setSelectedParticipants(prev => prev.filter(id => id !== p.participant_id))
                    } else {
                      setSelectedParticipants(prev => [...prev, p.participant_id])
                    }
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors',
                    selectedParticipants.includes(p.participant_id) && 'bg-[var(--c-bg)]/40 dark:bg-[var(--c-bg)]/20'
                  )}
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center',
                      selectedParticipants.includes(p.participant_id)
                        ? 'bg-[var(--c-solid)] border-[var(--c-solid)] text-white'
                        : 'border-stone-300 dark:border-stone-600'
                    )}
                  >
                    {selectedParticipants.includes(p.participant_id) && (
                      <Check className="w-3 h-3" />
                    )}
                  </div>
                  <span className="text-stone-900 dark:text-stone-100">
                    {p.first_name} {p.last_name}
                  </span>
                  <span className="text-sm text-stone-500">{p.email}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              {t('consultant.communication.message', 'Meddelande')}
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={t('consultant.communication.writeMessage', 'Skriv ditt meddelande')}
              rows={4}
              className={cn(
                'w-full px-4 py-3 rounded-xl',
                'bg-stone-100 dark:bg-stone-800',
                'border-2 border-transparent focus:border-[var(--c-accent)]',
                'text-stone-900 dark:text-stone-100',
                'resize-none'
              )}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-4 border-t border-stone-200 dark:border-stone-700">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel', 'Avbryt')}
          </Button>
          <Button
            onClick={handleSend}
            disabled={selectedParticipants.length === 0 || !message.trim()}
          >
            <Send className="w-4 h-4 mr-2" />
            {t('consultant.communication.send', 'Skicka')}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Main component
// ============================================================================
export function CommunicationTab() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'messages' | 'meetings'>('messages')
  const [messages, setMessages] = useState<Message[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [composeTemplate, setComposeTemplate] = useState('')
  const [showMeetingDialog, setShowMeetingDialog] = useState(false)
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  // Realtime — när någon skickar/uppdaterar meddelande där jag är inblandad,
  // re-fetcha. Filtret begränsar till min user.id för att slippa stora payloads.
  useEffect(() => {
    let isMounted = true
    let channelCleanup: (() => void) | null = null

    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || !isMounted) return

      const channel = supabase
        .channel(`consultant-messages-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'consultant_messages',
            filter: `receiver_id=eq.${user.id}`,
          },
          () => {
            if (isMounted) fetchData()
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'consultant_messages',
            filter: `sender_id=eq.${user.id}`,
          },
          () => {
            if (isMounted) fetchData()
          }
        )
        .subscribe()

      channelCleanup = () => {
        supabase.removeChannel(channel)
      }
    })()

    return () => {
      isMounted = false
      channelCleanup?.()
    }
  }, [])

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: participantsData } = await supabase
        .from('consultant_dashboard_participants')
        .select('participant_id, first_name, last_name, email')
        .eq('consultant_id', user.id)

      if (participantsData) {
        setParticipants(participantsData)
        const participantMap = new Map(participantsData.map(p => [p.participant_id, p]))

        const { data: messagesData } = await supabase
          .from('consultant_messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: true })
          .limit(500)

        if (messagesData) {
          const formatted: Message[] = messagesData.map(m => {
            const isIncoming = m.receiver_id === user.id
            const participantId = isIncoming ? m.sender_id : m.receiver_id
            const p = participantMap.get(participantId)
            return {
              id: m.id,
              participantId,
              participantName: p ? `${p.first_name} ${p.last_name}` : 'Okänd',
              participantEmail: p?.email || '',
              content: m.content,
              isRead: m.is_read,
              createdAt: m.created_at,
              direction: isIncoming ? 'incoming' : 'outgoing',
            }
          })
          setMessages(formatted)
        } else {
          setMessages([])
        }

        const { data: meetingsData } = await supabase
          .from('consultant_meetings')
          .select('*')
          .eq('consultant_id', user.id)
          .gte('scheduled_at', new Date().toISOString())
          .eq('status', 'scheduled')
          .order('scheduled_at', { ascending: true })

        if (meetingsData && meetingsData.length > 0) {
          const formattedMeetings: Meeting[] = meetingsData.map(m => {
            const p = participantMap.get(m.participant_id)
            return {
              id: m.id,
              participantId: m.participant_id,
              participantName: p ? `${p.first_name} ${p.last_name}` : 'Okänd',
              scheduledAt: m.scheduled_at,
              duration: m.duration_minutes,
              type: m.meeting_type as 'video' | 'phone' | 'physical',
              location: m.location,
              meetingLink: m.meeting_link,
              notes: m.notes,
              status: m.status as 'scheduled' | 'completed' | 'cancelled',
            }
          })
          setMeetings(formattedMeetings)
        } else {
          setMeetings([])
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Bygg konversationer från flat messages-array — en per deltagare.
  const conversations = useMemo<Conversation[]>(() => {
    const map = new Map<string, Conversation>()
    for (const m of messages) {
      const existing = map.get(m.participantId)
      if (existing) {
        existing.messages.push(m)
        if (new Date(m.createdAt) > new Date(existing.latestMessage.createdAt)) {
          existing.latestMessage = m
        }
        if (m.direction === 'incoming' && !m.isRead) existing.unreadCount += 1
      } else {
        map.set(m.participantId, {
          participantId: m.participantId,
          participantName: m.participantName,
          participantEmail: m.participantEmail,
          messages: [m],
          latestMessage: m,
          unreadCount: m.direction === 'incoming' && !m.isRead ? 1 : 0,
        })
      }
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.latestMessage.createdAt).getTime() -
        new Date(a.latestMessage.createdAt).getTime()
    )
  }, [messages])

  const activeConversation = activeParticipantId
    ? conversations.find(c => c.participantId === activeParticipantId)
    : null

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  // Auto-välj första konversationen när data laddats
  useEffect(() => {
    if (!activeParticipantId && conversations.length > 0) {
      setActiveParticipantId(conversations[0].participantId)
    }
  }, [conversations, activeParticipantId])

  // När man öppnar en konversation, markera incoming-meddelanden som lästa
  useEffect(() => {
    if (!activeConversation) return
    const unreadIds = activeConversation.messages
      .filter(m => m.direction === 'incoming' && !m.isRead)
      .map(m => m.id)
    if (unreadIds.length === 0) return

    setMessages(prev =>
      prev.map(m => (unreadIds.includes(m.id) ? { ...m, isRead: true } : m))
    )

    supabase
      .from('consultant_messages')
      .update({ is_read: true })
      .in('id', unreadIds)
      .then(({ error }) => {
        if (error) console.error('Mark-as-read failed:', error)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeParticipantId])

  const handleSendMessage = async (participantIds: string[], content: string) => {
    setSendingMessage(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const newRows = participantIds.map(participantId => ({
        sender_id: user.id,
        receiver_id: participantId,
        content,
        is_read: false,
      }))

      const { error } = await supabase.from('consultant_messages').insert(newRows)
      if (error) throw error

      // Realtime-channel kommer triggar fetchData, men anropa direkt också för UI-snabbhet
      fetchData()

      // Öppna konversationen med första mottagaren
      if (participantIds.length > 0) {
        setActiveParticipantId(participantIds[0])
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleSendReply = async (content: string) => {
    if (!activeConversation) return
    setSendingMessage(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('consultant_messages').insert({
        sender_id: user.id,
        receiver_id: activeConversation.participantId,
        content,
        is_read: false,
      })
      if (error) throw error

      fetchData()
    } catch (error) {
      console.error('Error sending reply:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleCancelMeeting = async (meetingId: string) => {
    if (!confirm(t('consultant.communication.confirmCancelMeeting', 'Avboka mötet?'))) return
    try {
      const { error } = await supabase
        .from('consultant_meetings')
        .update({ status: 'cancelled' })
        .eq('id', meetingId)
      if (error) throw error
      setMeetings(prev => prev.filter(m => m.id !== meetingId))
    } catch (error) {
      console.error('Error cancelling meeting:', error)
    }
  }

  const handleScheduleMeeting = async (meetingData: any) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('consultant_meetings').insert({
        consultant_id: user.id,
        participant_id: meetingData.participantId,
        scheduled_at: meetingData.dateTime,
        duration_minutes: meetingData.duration,
        meeting_type: meetingData.type,
        meeting_link: meetingData.meetingLink,
        location: meetingData.location,
        notes: meetingData.notes,
        status: 'scheduled',
      })
      if (error) throw error

      setShowMeetingDialog(false)
      fetchData()
    } catch (error) {
      console.error('Error scheduling meeting:', error)
    }
  }

  const upcomingMeetings = meetings
    .filter(m => new Date(m.scheduledAt) > new Date() && m.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  const openCompose = (template: string = '') => {
    setComposeTemplate(template)
    setShowNewMessage(true)
  }

  if (loading) return <LoadingState type="list" />

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex items-center gap-4 border-b border-stone-200 dark:border-stone-700">
        <button
          onClick={() => setActiveTab('messages')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 font-medium transition-colors',
            activeTab === 'messages'
              ? 'text-[var(--c-text)] dark:text-[var(--c-solid)] border-b-2 border-[var(--c-solid)]'
              : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
          )}
        >
          <MessageSquare className="w-5 h-5" />
          {t('consultant.communication.messages', 'Meddelanden')}
          {totalUnread > 0 && (
            <span className="px-2 py-0.5 bg-[var(--c-solid)] text-white text-xs rounded-full font-semibold">
              {totalUnread}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('meetings')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 font-medium transition-colors',
            activeTab === 'meetings'
              ? 'text-[var(--c-text)] dark:text-[var(--c-solid)] border-b-2 border-[var(--c-solid)]'
              : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
          )}
        >
          <Calendar className="w-5 h-5" />
          {t('consultant.communication.meetings', 'Möten')}
          {upcomingMeetings.length > 0 && (
            <span className="px-2 py-0.5 bg-[var(--c-solid)] text-white text-xs rounded-full font-semibold">
              {upcomingMeetings.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Vänster: konversationslista */}
          <Card className="lg:col-span-4 overflow-hidden flex flex-col h-[600px]">
            <div className="p-3 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
              <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                {t('consultant.communication.conversations', 'Konversationer')}
              </h3>
              <Button size="sm" onClick={() => openCompose('')}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length > 0 ? (
                conversations.map(c => (
                  <ConversationListItem
                    key={c.participantId}
                    conversation={c}
                    isActive={c.participantId === activeParticipantId}
                    onClick={() => setActiveParticipantId(c.participantId)}
                    locale={locale}
                  />
                ))
              ) : (
                <div className="p-8 text-center">
                  <Inbox className="w-12 h-12 text-stone-300 dark:text-stone-500 mx-auto mb-3" />
                  <p className="text-stone-500 dark:text-stone-400 text-sm">
                    {t('consultant.communication.noMessages', 'Inga meddelanden ännu')}
                  </p>
                  <Button size="sm" className="mt-4" onClick={() => openCompose('')}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    {t('consultant.communication.newMessage', 'Nytt meddelande')}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Höger: aktiv tråd eller quick-actions */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {activeConversation ? (
              <Card className="overflow-hidden h-[600px]">
                <ConversationThread
                  conversation={activeConversation}
                  onSendReply={handleSendReply}
                  isSending={sendingMessage}
                  t={t}
                  locale={locale}
                />
              </Card>
            ) : (
              <Card className="p-12 text-center flex flex-col items-center justify-center h-[600px]">
                <MessageSquare className="w-16 h-16 text-stone-300 dark:text-stone-500 mb-4" />
                <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
                  {t('consultant.communication.selectConversation', 'Välj en konversation')}
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm mb-6">
                  {t(
                    'consultant.communication.selectConversationDesc',
                    'Klicka på en konversation till vänster eller starta ett nytt meddelande.'
                  )}
                </p>

                {/* Quick templates — fungerar nu på riktigt */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => openCompose(QUICK_TEMPLATES.meetingReminder)}>
                    <Mail className="w-4 h-4 mr-2" />
                    {t('consultant.communication.meetingReminder', 'Mötespåminnelse')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openCompose(QUICK_TEMPLATES.checkIn)}>
                    <Bell className="w-4 h-4 mr-2" />
                    {t('consultant.communication.checkInMessage', 'Check-in')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openCompose(QUICK_TEMPLATES.congrats)}>
                    <Users className="w-4 h-4 mr-2" />
                    {t('consultant.communication.congratsProgress', 'Grattis till framsteg')}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'meetings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
              {t('consultant.communication.upcomingMeetings', 'Kommande möten')}
            </h3>
            <Button onClick={() => setShowMeetingDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('consultant.communication.bookNewMeeting', 'Boka nytt möte')}
            </Button>
          </div>

          {upcomingMeetings.some(
            m => new Date(m.scheduledAt).toDateString() === new Date().toDateString()
          ) && (
            <div>
              <h4 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-3">
                {t('common.today', 'Idag')}
              </h4>
              <div className="space-y-3">
                {upcomingMeetings
                  .filter(m => new Date(m.scheduledAt).toDateString() === new Date().toDateString())
                  .map(meeting => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      onEdit={() => setShowMeetingDialog(true)}
                      onCancel={handleCancelMeeting}
                      joinMeetingLabel={t('consultant.communication.joinMeeting', 'Anslut till möte')}
                    />
                  ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-3">
              {t('consultant.communication.thisWeek', 'Denna vecka')}
            </h4>
            <div className="space-y-3">
              {upcomingMeetings
                .filter(m => new Date(m.scheduledAt).toDateString() !== new Date().toDateString())
                .map(meeting => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onEdit={() => setShowMeetingDialog(true)}
                    onCancel={handleCancelMeeting}
                    joinMeetingLabel={t('consultant.communication.joinMeeting', 'Anslut till möte')}
                  />
                ))}
            </div>
          </div>

          {upcomingMeetings.length === 0 && (
            <Card className="p-12 text-center">
              <Calendar className="w-16 h-16 text-stone-300 dark:text-stone-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
                {t('consultant.communication.noMeetings', 'Inga möten ännu')}
              </h3>
              <p className="text-stone-500 dark:text-stone-400 mb-6">
                {t('consultant.communication.noMeetingsDesc', 'Boka ditt första möte med en deltagare.')}
              </p>
              <Button onClick={() => setShowMeetingDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('consultant.communication.bookMeeting', 'Boka möte')}
              </Button>
            </Card>
          )}
        </div>
      )}

      <NewMessageDialog
        isOpen={showNewMessage}
        onClose={() => {
          setShowNewMessage(false)
          setComposeTemplate('')
        }}
        participants={participants}
        onSend={handleSendMessage}
        initialContent={composeTemplate}
        t={t}
      />

      <MeetingSchedulerDialog
        isOpen={showMeetingDialog}
        onClose={() => setShowMeetingDialog(false)}
        participants={participants.map(p => ({
          id: p.participant_id,
          name: `${p.first_name} ${p.last_name}`,
          email: p.email,
        }))}
        onSchedule={handleScheduleMeeting}
      />
    </div>
  )
}
