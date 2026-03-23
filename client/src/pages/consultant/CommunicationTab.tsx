/**
 * CommunicationTab - Messaging and Meeting Management
 * Message center, meeting scheduler, and group communication
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MessageSquare,
  Mail,
  Calendar,
  Users,
  Send,
  Search,
  Plus,
  Clock,
  Video,
  Phone,
  MapPin,
  ChevronRight,
  Check,
  X,
  RefreshCw,
  Bell,
  Inbox,
  Archive,
  Star,
  MoreVertical,
  Edit2,
  Trash2,
  Loader2,
  Reply,
} from 'lucide-react'
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
  isStarred: boolean
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

// Message Item Component
function MessageItem({
  message,
  onRead,
  onStar,
  onClick,
}: {
  message: Message
  onRead: (id: string) => void
  onStar: (id: string) => void
  onClick: (message: Message) => void
}) {
  return (
    <button
      onClick={() => onClick(message)}
      className={cn(
        'w-full text-left p-4 border-b border-stone-100 dark:border-stone-800',
        'hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors',
        !message.isRead && 'bg-violet-50/50 dark:bg-violet-900/10'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 font-medium flex-shrink-0">
          {message.participantName.split(' ').map(n => n[0]).join('').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={cn(
              'font-medium truncate',
              message.isRead
                ? 'text-stone-700 dark:text-stone-300'
                : 'text-stone-900 dark:text-stone-100'
            )}>
              {message.participantName}
            </p>
            <span className="text-xs text-stone-500 dark:text-stone-400 flex-shrink-0">
              {new Date(message.createdAt).toLocaleDateString('sv-SE', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <p className={cn(
            'text-sm truncate mt-0.5',
            message.isRead ? 'text-stone-500' : 'text-stone-700 dark:text-stone-300'
          )}>
            {message.content}
          </p>
        </div>
        <button
          onClick={e => {
            e.stopPropagation()
            onStar(message.id)
          }}
          className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg"
        >
          <Star className={cn(
            'w-4 h-4',
            message.isStarred ? 'fill-amber-400 text-amber-400' : 'text-stone-400'
          )} />
        </button>
      </div>
    </button>
  )
}

// Meeting Card Component
function MeetingCard({
  meeting,
  onEdit,
  onCancel,
}: {
  meeting: Meeting
  onEdit: (meeting: Meeting) => void
  onCancel: (id: string) => void
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
    <Card className={cn(
      'p-4',
      isToday && 'ring-2 ring-violet-500'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={cn(
            'p-2.5 rounded-xl',
            meeting.type === 'video' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' :
            meeting.type === 'phone' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' :
            'bg-amber-100 dark:bg-amber-900/40 text-amber-600'
          )}>
            <TypeIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-stone-900 dark:text-stone-100">
              {meeting.participantName}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-stone-500 dark:text-stone-400">
                {new Date(meeting.scheduledAt).toLocaleDateString('sv-SE', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <span className="text-stone-300 dark:text-stone-600">|</span>
              <span className="text-sm text-stone-500 dark:text-stone-400">
                {new Date(meeting.scheduledAt).toLocaleTimeString('sv-SE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="text-stone-300 dark:text-stone-600">|</span>
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
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          <Video className="w-4 h-4" />
          Anslut till möte
        </a>
      )}
    </Card>
  )
}

// New Message Dialog
function NewMessageDialog({
  isOpen,
  onClose,
  participants,
  onSend,
}: {
  isOpen: boolean
  onClose: () => void
  participants: Participant[]
  onSend: (participantIds: string[], message: string) => void
}) {
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

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
            Nytt meddelande
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {/* Participant Selection */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Till
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                placeholder="Sök deltagare..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full pl-10 pr-4 py-2.5 rounded-xl',
                  'bg-stone-100 dark:bg-stone-800',
                  'border-2 border-transparent focus:border-violet-500',
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
                      className="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-full text-sm"
                    >
                      {p.first_name} {p.last_name}
                      <button
                        onClick={() => setSelectedParticipants(prev => prev.filter(p => p !== id))}
                        className="hover:text-violet-900"
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
                    selectedParticipants.includes(p.participant_id) && 'bg-violet-50 dark:bg-violet-900/20'
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center',
                    selectedParticipants.includes(p.participant_id)
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'border-stone-300 dark:border-stone-600'
                  )}>
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

          {/* Message Input */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Meddelande
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Skriv ditt meddelande..."
              rows={4}
              className={cn(
                'w-full px-4 py-3 rounded-xl',
                'bg-stone-100 dark:bg-stone-800',
                'border-2 border-transparent focus:border-violet-500',
                'text-stone-900 dark:text-stone-100',
                'resize-none'
              )}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-4 border-t border-stone-200 dark:border-stone-700">
          <Button variant="ghost" onClick={onClose}>
            Avbryt
          </Button>
          <Button
            onClick={handleSend}
            disabled={selectedParticipants.length === 0 || !message.trim()}
          >
            <Send className="w-4 h-4 mr-2" />
            Skicka
          </Button>
        </div>
      </div>
    </div>
  )
}

export function CommunicationTab() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'messages' | 'meetings'>('messages')
  const [messages, setMessages] = useState<Message[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [showMeetingDialog, setShowMeetingDialog] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [messageFilter, setMessageFilter] = useState<'all' | 'unread' | 'starred'>('all')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [replyContent, setReplyContent] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch participants
      const { data: participantsData } = await supabase
        .from('consultant_dashboard_participants')
        .select('participant_id, first_name, last_name, email')
        .eq('consultant_id', user.id)

      if (participantsData) {
        setParticipants(participantsData)

        // Create a map for quick participant lookup
        const participantMap = new Map(
          participantsData.map(p => [p.participant_id, p])
        )

        // Fetch real messages
        const { data: messagesData } = await supabase
          .from('consultant_messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(50)

        if (messagesData && messagesData.length > 0) {
          const formattedMessages: Message[] = messagesData.map(m => {
            const isIncoming = m.receiver_id === user.id
            const participantId = isIncoming ? m.sender_id : m.receiver_id
            const participant = participantMap.get(participantId)

            return {
              id: m.id,
              participantId,
              participantName: participant
                ? `${participant.first_name} ${participant.last_name}`
                : 'Okänd',
              participantEmail: participant?.email || '',
              content: m.content,
              isRead: m.is_read,
              isStarred: false, // TODO: Add starred field to messages table
              createdAt: m.created_at,
              direction: isIncoming ? 'incoming' : 'outgoing',
            }
          })
          setMessages(formattedMessages)
        } else {
          // Fallback to sample messages if no real messages exist
          const sampleMessages: Message[] = participantsData.slice(0, 3).map((p, i) => ({
            id: `sample-${i}`,
            participantId: p.participant_id,
            participantName: `${p.first_name} ${p.last_name}`,
            participantEmail: p.email,
            content: [
              'Hej! Jag har uppdaterat mitt CV, kan du kolla på det?',
              'Tack för hjälpen med jobbansökan!',
              'Har du tid för ett möte nästa vecka?'
            ][i % 3],
            isRead: i > 0,
            isStarred: i === 0,
            createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
            direction: 'incoming' as const,
          }))
          setMessages(sampleMessages)
        }

        // Fetch real meetings
        const { data: meetingsData } = await supabase
          .from('consultant_meetings')
          .select('*')
          .eq('consultant_id', user.id)
          .gte('scheduled_at', new Date().toISOString())
          .eq('status', 'scheduled')
          .order('scheduled_at', { ascending: true })

        if (meetingsData && meetingsData.length > 0) {
          const formattedMeetings: Meeting[] = meetingsData.map(m => {
            const participant = participantMap.get(m.participant_id)
            return {
              id: m.id,
              participantId: m.participant_id,
              participantName: participant
                ? `${participant.first_name} ${participant.last_name}`
                : 'Okänd',
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

  const handleReadMessage = async (id: string) => {
    // Update local state immediately
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m))

    // Update in database
    try {
      await supabase
        .from('consultant_messages')
        .update({ is_read: true })
        .eq('id', id)
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const handleStarMessage = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isStarred: !m.isStarred } : m))
  }

  const handleSendMessage = async (participantIds: string[], content: string) => {
    setSendingMessage(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Send message to each participant
      const messages = participantIds.map(participantId => ({
        sender_id: user.id,
        receiver_id: participantId,
        content,
        is_read: false,
      }))

      const { error } = await supabase
        .from('consultant_messages')
        .insert(messages)

      if (error) throw error

      // Refresh messages
      fetchData()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleReplyToMessage = async () => {
    if (!selectedMessage || !replyContent.trim()) return

    setSendingMessage(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('consultant_messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedMessage.participantId,
          content: replyContent.trim(),
          is_read: false,
        })

      if (error) throw error

      setReplyContent('')
      setSelectedMessage(null)
      fetchData()
    } catch (error) {
      console.error('Error sending reply:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleCancelMeeting = async (meetingId: string) => {
    if (!confirm('Är du säker på att du vill avboka detta möte?')) return

    try {
      const { error } = await supabase
        .from('consultant_meetings')
        .update({ status: 'cancelled' })
        .eq('id', meetingId)

      if (error) throw error

      // Remove from local state
      setMeetings(prev => prev.filter(m => m.id !== meetingId))
    } catch (error) {
      console.error('Error cancelling meeting:', error)
    }
  }

  const handleScheduleMeeting = async (meetingData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('consultant_meetings')
        .insert({
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

  const filteredMessages = messages.filter(m => {
    if (messageFilter === 'unread') return !m.isRead
    if (messageFilter === 'starred') return m.isStarred
    return true
  })

  const upcomingMeetings = meetings
    .filter(m => new Date(m.scheduledAt) > new Date() && m.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  if (loading) {
    return <LoadingState type="list" />
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-4 border-b border-stone-200 dark:border-stone-700">
        <button
          onClick={() => setActiveTab('messages')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 font-medium transition-colors',
            activeTab === 'messages'
              ? 'text-violet-600 border-b-2 border-violet-600'
              : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
          )}
        >
          <MessageSquare className="w-5 h-5" />
          Meddelanden
          {messages.filter(m => !m.isRead).length > 0 && (
            <span className="px-2 py-0.5 bg-violet-600 text-white text-xs rounded-full">
              {messages.filter(m => !m.isRead).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('meetings')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 font-medium transition-colors',
            activeTab === 'meetings'
              ? 'text-violet-600 border-b-2 border-violet-600'
              : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
          )}
        >
          <Calendar className="w-5 h-5" />
          Möten
          {upcomingMeetings.length > 0 && (
            <span className="px-2 py-0.5 bg-emerald-600 text-white text-xs rounded-full">
              {upcomingMeetings.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message List */}
          <Card className="lg:col-span-2 overflow-hidden">
            <div className="p-4 border-b border-stone-200 dark:border-stone-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <select
                    value={messageFilter}
                    onChange={e => setMessageFilter(e.target.value as typeof messageFilter)}
                    className={cn(
                      'px-3 py-2 rounded-lg',
                      'bg-stone-100 dark:bg-stone-800',
                      'border-0',
                      'text-sm text-stone-900 dark:text-stone-100'
                    )}
                  >
                    <option value="all">Alla meddelanden</option>
                    <option value="unread">Olästa</option>
                    <option value="starred">Stjärnmärkta</option>
                  </select>
                </div>
                <Button size="sm" onClick={() => setShowNewMessage(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Nytt meddelande
                </Button>
              </div>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {filteredMessages.length > 0 ? (
                filteredMessages.map(message => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    onRead={handleReadMessage}
                    onStar={handleStarMessage}
                    onClick={m => {
                      setSelectedMessage(m)
                      handleReadMessage(m.id)
                    }}
                  />
                ))
              ) : (
                <div className="p-8 text-center">
                  <Inbox className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
                  <p className="text-stone-500 dark:text-stone-400">
                    Inga meddelanden
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions & Templates */}
          <div className="space-y-4">
            <Card className="p-4">
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-3">
                Snabbmeddelanden
              </h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowNewMessage(true)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Påminnelse om möte
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowNewMessage(true)}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Check-in meddelande
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowNewMessage(true)}
                >
                  <Star className="w-4 h-4 mr-2" />
                  Grattis till framsteg
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-3">
                Gruppmeddelande
              </h4>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">
                Skicka samma meddelande till alla eller valda deltagare.
              </p>
              <Button className="w-full" onClick={() => setShowNewMessage(true)}>
                <Users className="w-4 h-4 mr-2" />
                Skicka till grupp
              </Button>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'meetings' && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
              Kommande möten
            </h3>
            <Button onClick={() => setShowMeetingDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Boka nytt möte
            </Button>
          </div>

          {/* Today's Meetings */}
          {upcomingMeetings.some(m =>
            new Date(m.scheduledAt).toDateString() === new Date().toDateString()
          ) && (
            <div>
              <h4 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-3">
                Idag
              </h4>
              <div className="space-y-3">
                {upcomingMeetings
                  .filter(m => new Date(m.scheduledAt).toDateString() === new Date().toDateString())
                  .map(meeting => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      onEdit={m => setShowMeetingDialog(true)}
                      onCancel={handleCancelMeeting}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* This Week */}
          <div>
            <h4 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-3">
              Denna vecka
            </h4>
            <div className="space-y-3">
              {upcomingMeetings
                .filter(m => new Date(m.scheduledAt).toDateString() !== new Date().toDateString())
                .map(meeting => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onEdit={m => setShowMeetingDialog(true)}
                    onCancel={handleCancelMeeting}
                  />
                ))}
            </div>
          </div>

          {upcomingMeetings.length === 0 && (
            <Card className="p-12 text-center">
              <Calendar className="w-16 h-16 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
                Inga kommande möten
              </h3>
              <p className="text-stone-500 dark:text-stone-400 mb-6">
                Boka ett möte med en deltagare för att komma igång.
              </p>
              <Button onClick={() => setShowMeetingDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Boka möte
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* New Message Dialog */}
      <NewMessageDialog
        isOpen={showNewMessage}
        onClose={() => setShowNewMessage(false)}
        participants={participants}
        onSend={handleSendMessage}
      />

      {/* Meeting Scheduler Dialog */}
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

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 font-medium">
                  {selectedMessage.participantName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-stone-900 dark:text-stone-100">
                    {selectedMessage.participantName}
                  </p>
                  <p className="text-sm text-stone-500">{selectedMessage.participantEmail}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedMessage(null)
                  setReplyContent('')
                }}
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <p className="text-xs text-stone-500 mb-2">
                  {new Date(selectedMessage.createdAt).toLocaleString('sv-SE')}
                </p>
                <p className="text-stone-900 dark:text-stone-100 whitespace-pre-wrap">
                  {selectedMessage.content}
                </p>
              </div>

              {/* Reply section */}
              <div className="pt-4 border-t border-stone-200 dark:border-stone-700">
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Svara
                </label>
                <textarea
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  placeholder="Skriv ditt svar..."
                  rows={3}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl',
                    'bg-stone-100 dark:bg-stone-800',
                    'border-2 border-transparent focus:border-violet-500',
                    'text-stone-900 dark:text-stone-100',
                    'resize-none'
                  )}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-stone-200 dark:border-stone-700">
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedMessage(null)
                  setReplyContent('')
                }}
              >
                Stäng
              </Button>
              <Button
                onClick={handleReplyToMessage}
                disabled={!replyContent.trim() || sendingMessage}
              >
                {sendingMessage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Skickar...
                  </>
                ) : (
                  <>
                    <Reply className="w-4 h-4 mr-2" />
                    Skicka svar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
