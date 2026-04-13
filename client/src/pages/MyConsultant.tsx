/**
 * MyConsultant - Min konsulent-sidan
 * Visar deltagarens koppling till sin arbetskonsulent
 *
 * Design baserad på input från:
 * - Arbetskonsulent: Delad information, uppföljning
 * - Långtidsarbetssökande: Trygghet, energianpassat, positiv ton
 * - UX-designer: Progressiv disclosure, max 3-5 val
 * - Accessibility Specialist: WCAG 2.1 AA
 */

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  User,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Send,
  FileText,
  Target,
  Activity,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Video,
  MapPin,
  Heart,
  Briefcase,
  TrendingUp,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
} from '@/components/ui/icons'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { cn } from '@/lib/utils'

// Types
interface ConsultantInfo {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  avatar_url?: string
  title?: string
}

interface NextMeeting {
  id: string
  scheduled_at: string
  type: 'video' | 'phone' | 'in_person'
  location?: string
  meeting_link?: string
  notes?: string
}

interface SharedInfo {
  category: string
  items: {
    label: string
    value: string
    status: 'good' | 'neutral' | 'attention'
    isShared: boolean
  }[]
}

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  is_read: boolean
}

interface Goal {
  id: string
  title: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  deadline?: string
}

// Consultant Profile Card
function ConsultantCard({ consultant, nextMeeting }: { consultant: ConsultantInfo | null; nextMeeting: NextMeeting | null }) {
  const { t } = useTranslation()

  if (!consultant) {
    return (
      <Card className="p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 mx-auto mb-4 flex items-center justify-center">
          <User className="w-8 h-8 text-stone-400" />
        </div>
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
          Ingen konsulent kopplad
        </h2>
        <p className="text-stone-600 dark:text-stone-400 text-sm">
          Du har för närvarande ingen arbetskonsulent kopplad till ditt konto.
        </p>
      </Card>
    )
  }

  const meetingTypeIcons = {
    video: Video,
    phone: Phone,
    in_person: MapPin,
  }

  const meetingTypeLabels = {
    video: 'Videomöte',
    phone: 'Telefonmöte',
    in_person: 'Fysiskt möte',
  }

  return (
    <Card className="overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 p-6 text-white">
        <div className="flex items-center gap-4">
          {consultant.avatar_url ? (
            <img
              src={consultant.avatar_url}
              alt=""
              className="w-16 h-16 rounded-full border-2 border-white/30"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold">
              {consultant.first_name} {consultant.last_name}
            </h2>
            {consultant.title && (
              <p className="text-teal-100 text-sm">{consultant.title}</p>
            )}
            <p className="text-teal-100 text-sm mt-1">Din arbetskonsulent</p>
          </div>
        </div>
      </div>

      {/* Contact info */}
      <div className="p-4 border-b border-stone-200 dark:border-stone-700">
        <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-3">
          Kontaktuppgifter
        </h3>
        <div className="space-y-2">
          <a
            href={`mailto:${consultant.email}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group"
          >
            <Mail className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span className="text-stone-700 dark:text-stone-300 group-hover:text-teal-600 dark:group-hover:text-teal-400">
              {consultant.email}
            </span>
          </a>
          {consultant.phone && (
            <a
              href={`tel:${consultant.phone}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group"
            >
              <Phone className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span className="text-stone-700 dark:text-stone-300 group-hover:text-teal-600 dark:group-hover:text-teal-400">
                {consultant.phone}
              </span>
            </a>
          )}
        </div>
      </div>

      {/* Next meeting */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-3">
          Nästa möte
        </h3>
        {nextMeeting ? (
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-800 rounded-lg">
                {(() => {
                  const Icon = meetingTypeIcons[nextMeeting.type]
                  return <Icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                })()}
              </div>
              <div className="flex-1">
                <p className="font-medium text-stone-900 dark:text-stone-100">
                  {meetingTypeLabels[nextMeeting.type]}
                </p>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                  {new Date(nextMeeting.scheduled_at).toLocaleDateString('sv-SE', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {nextMeeting.location && (
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                    {nextMeeting.location}
                  </p>
                )}
                {nextMeeting.meeting_link && (
                  <a
                    href={nextMeeting.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 hover:underline mt-2"
                  >
                    <Video className="w-4 h-4" />
                    Gå med i möte
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-stone-500 dark:text-stone-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Inget möte inbokat</p>
          </div>
        )}
      </div>
    </Card>
  )
}

// Shared Information Section
function SharedInformationSection({ sharedInfo }: { sharedInfo: SharedInfo[] }) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['progress'])

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const categoryIcons: Record<string, React.ElementType> = {
    progress: TrendingUp,
    cv: FileText,
    goals: Target,
    activity: Activity,
    wellbeing: Heart,
  }

  const categoryLabels: Record<string, string> = {
    progress: 'Dina framsteg',
    cv: 'CV-status',
    goals: 'Mål & handlingsplan',
    activity: 'Aktivitet',
    wellbeing: 'Välmående',
  }

  const statusColors = {
    good: 'text-emerald-600 dark:text-emerald-400',
    neutral: 'text-stone-600 dark:text-stone-400',
    attention: 'text-amber-600 dark:text-amber-400',
  }

  return (
    <Card>
      <div className="p-4 border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h2 className="font-semibold text-stone-900 dark:text-stone-100">
            Delad information
          </h2>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          Det här kan din konsulent se för att kunna hjälpa dig bättre
        </p>
      </div>

      <div className="divide-y divide-stone-200 dark:divide-stone-700">
        {sharedInfo.map(category => {
          const isExpanded = expandedCategories.includes(category.category)
          const Icon = categoryIcons[category.category] || Activity
          const label = categoryLabels[category.category] || category.category

          return (
            <div key={category.category}>
              <button
                onClick={() => toggleCategory(category.category)}
                aria-expanded={isExpanded}
                aria-controls={`shared-${category.category}`}
                className="w-full flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-100 dark:bg-teal-900/40 rounded-lg">
                    <Icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <span className="font-medium text-stone-900 dark:text-stone-100">
                    {label}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-stone-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-stone-400" />
                )}
              </button>

              {isExpanded && (
                <div
                  id={`shared-${category.category}`}
                  role="region"
                  aria-labelledby={`shared-${category.category}-header`}
                  className="px-4 pb-4"
                >
                  <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl p-4 space-y-3">
                    {category.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {item.isShared ? (
                            <Eye className="w-4 h-4 text-teal-500" aria-label="Delas med konsulenten" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-stone-400" aria-label="Delas inte" />
                          )}
                          <span className="text-sm text-stone-600 dark:text-stone-400">
                            {item.label}
                          </span>
                        </div>
                        <span className={cn('text-sm font-medium', statusColors[item.status])}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// Messages Section
function MessagesSection({
  messages,
  consultant,
  onSendMessage,
  loading,
}: {
  messages: Message[]
  consultant: ConsultantInfo | null
  onSendMessage: (content: string) => Promise<void>
  loading: boolean
}) {
  const { user } = useAuthStore()
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return
    setSending(true)
    try {
      await onSendMessage(newMessage.trim())
      setNewMessage('')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!consultant) {
    return null
  }

  return (
    <Card className="flex flex-col h-[500px]">
      <div className="p-4 border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h2 className="font-semibold text-stone-900 dark:text-stone-100">
            Meddelanden
          </h2>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          Skriv till {consultant.first_name}
        </p>
      </div>

      {/* Messages list */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        role="log"
        aria-live="polite"
        aria-label="Meddelandehistorik"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingState type="spinner" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-stone-600 dark:text-stone-400">
              Inga meddelanden ännu
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              Skicka ett meddelande för att starta en konversation
            </p>
          </div>
        ) : (
          <>
            {messages.map(message => {
              const isOwn = message.sender_id === user?.id
              return (
                <div
                  key={message.id}
                  className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3',
                      isOwn
                        ? 'bg-teal-600 text-white rounded-br-md'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-bl-md'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={cn(
                        'text-xs mt-1',
                        isOwn ? 'text-teal-200' : 'text-stone-500 dark:text-stone-400'
                      )}
                    >
                      {new Date(message.created_at).toLocaleTimeString('sv-SE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input */}
      <div className="p-4 border-t border-stone-200 dark:border-stone-700">
        <div className="flex gap-2">
          <label htmlFor="message-input" className="sr-only">
            Skriv ett meddelande
          </label>
          <textarea
            id="message-input"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Skriv ett meddelande..."
            rows={1}
            className={cn(
              'flex-1 resize-none rounded-xl border border-stone-300 dark:border-stone-600',
              'bg-white dark:bg-stone-800 px-4 py-3',
              'text-stone-900 dark:text-stone-100 placeholder-stone-500',
              'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent',
              'transition-colors'
            )}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="px-4"
            aria-label="Skicka meddelande"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
          Tryck Enter för att skicka
        </p>
      </div>
    </Card>
  )
}

// Goals Section
function GoalsSection({ goals }: { goals: Goal[] }) {
  if (goals.length === 0) {
    return null
  }

  const statusConfig = {
    NOT_STARTED: {
      label: 'Ej påbörjat',
      color: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
      icon: Clock,
    },
    IN_PROGRESS: {
      label: 'Pågående',
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
      icon: Activity,
    },
    COMPLETED: {
      label: 'Klart',
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
      icon: CheckCircle,
    },
  }

  const completedCount = goals.filter(g => g.status === 'COMPLETED').length

  return (
    <Card>
      <div className="p-4 border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h2 className="font-semibold text-stone-900 dark:text-stone-100">
              Överenskomna mål
            </h2>
          </div>
          <div role="status" aria-live="polite">
            <span className="text-sm text-stone-500 dark:text-stone-400">
              {completedCount} av {goals.length} klara
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {goals.map(goal => {
          const config = statusConfig[goal.status]
          const Icon = config.icon

          return (
            <div
              key={goal.id}
              className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl"
            >
              <div className={cn('p-2 rounded-lg', config.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                  {goal.title}
                </p>
                {goal.deadline && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Deadline: {new Date(goal.deadline).toLocaleDateString('sv-SE')}
                  </p>
                )}
              </div>
              <span className={cn('text-xs font-medium px-2 py-1 rounded-full', config.color)}>
                {config.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Encouragement message */}
      {completedCount > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Bra jobbat! Du har slutfört {completedCount} {completedCount === 1 ? 'mål' : 'mål'}.
              Fortsätt så!
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}

// Quick Actions
function QuickActions({ consultant, onBookMeeting }: { consultant: ConsultantInfo | null; onBookMeeting: () => void }) {
  if (!consultant) return null

  return (
    <Card className="p-4">
      <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">
        Snabbåtgärder
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <a
          href={`mailto:${consultant.email}`}
          className={cn(
            'flex items-center gap-3 p-4 rounded-xl transition-all duration-200',
            'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700',
            'text-stone-700 dark:text-stone-300'
          )}
        >
          <Mail className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span className="font-medium">Skicka e-post</span>
        </a>
        {consultant.phone && (
          <a
            href={`tel:${consultant.phone}`}
            className={cn(
              'flex items-center gap-3 p-4 rounded-xl transition-all duration-200',
              'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700',
              'text-stone-700 dark:text-stone-300'
            )}
          >
            <Phone className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span className="font-medium">Ring</span>
          </a>
        )}
        <button
          onClick={onBookMeeting}
          className={cn(
            'flex items-center gap-3 p-4 rounded-xl transition-all duration-200',
            'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700',
            'text-white'
          )}
        >
          <Calendar className="w-5 h-5" />
          <span className="font-medium">Boka möte</span>
        </button>
      </div>
    </Card>
  )
}

// Main Page Component
export default function MyConsultant() {
  const { t } = useTranslation()
  const { user, profile } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [consultant, setConsultant] = useState<ConsultantInfo | null>(null)
  const [nextMeeting, setNextMeeting] = useState<NextMeeting | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [messagesLoading, setMessagesLoading] = useState(true)
  const [sharedInfo, setSharedInfo] = useState<SharedInfo[]>([])

  useEffect(() => {
    if (user) {
      fetchConsultantData()
    }
  }, [user])

  const fetchConsultantData = async () => {
    try {
      setLoading(true)

      // Get user's consultant_id from profile
      const consultantId = profile?.consultant_id

      if (!consultantId) {
        setLoading(false)
        return
      }

      // Fetch consultant profile
      const { data: consultantData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, avatar_url')
        .eq('id', consultantId)
        .single()

      if (consultantData) {
        setConsultant({
          ...consultantData,
          title: 'Arbetskonsulent',
        })
      }

      // Fetch next meeting
      const { data: meetingData } = await supabase
        .from('consultant_meetings')
        .select('*')
        .eq('participant_id', user?.id)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .single()

      if (meetingData) {
        setNextMeeting(meetingData)
      }

      // Fetch messages
      setMessagesLoading(true)
      const { data: messagesData } = await supabase
        .from('consultant_messages')
        .select('*')
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .or(`sender_id.eq.${consultantId},receiver_id.eq.${consultantId}`)
        .order('created_at', { ascending: true })
        .limit(50)

      if (messagesData) {
        // Filter to only show messages between user and their consultant
        const relevantMessages = messagesData.filter(
          m =>
            (m.sender_id === user?.id && m.receiver_id === consultantId) ||
            (m.sender_id === consultantId && m.receiver_id === user?.id)
        )
        setMessages(relevantMessages)
      }
      setMessagesLoading(false)

      // Fetch goals
      const { data: goalsData } = await supabase
        .from('consultant_goals')
        .select('id, title, status, deadline')
        .eq('participant_id', user?.id)
        .order('created_at', { ascending: false })

      if (goalsData) {
        setGoals(goalsData)
      }

      // Build shared info based on user data
      await buildSharedInfo()
    } catch (error) {
      console.error('Error fetching consultant data:', error)
    } finally {
      setLoading(false)
    }
  }

  const buildSharedInfo = async () => {
    // Fetch CV data
    const { data: cvData } = await supabase
      .from('cvs')
      .select('ats_score, updated_at')
      .eq('user_id', user?.id)
      .single()

    // Fetch saved jobs count
    const { count: jobsCount } = await supabase
      .from('saved_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id)

    // Fetch applications count
    const { count: applicationsCount } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id)

    // Fetch wellness data
    const { data: wellnessData } = await supabase
      .from('wellness_entries')
      .select('energy_level, mood')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const info: SharedInfo[] = [
      {
        category: 'progress',
        items: [
          {
            label: 'Senaste inloggning',
            value: profile?.last_login
              ? new Date(profile.last_login).toLocaleDateString('sv-SE')
              : 'Idag',
            status: 'good',
            isShared: true,
          },
          {
            label: 'Sparade jobb',
            value: `${jobsCount || 0} st`,
            status: (jobsCount || 0) > 0 ? 'good' : 'neutral',
            isShared: true,
          },
          {
            label: 'Skickade ansökningar',
            value: `${applicationsCount || 0} st`,
            status: (applicationsCount || 0) > 0 ? 'good' : 'neutral',
            isShared: true,
          },
        ],
      },
      {
        category: 'cv',
        items: [
          {
            label: 'CV-status',
            value: cvData ? 'Skapat' : 'Ej skapat',
            status: cvData ? 'good' : 'attention',
            isShared: true,
          },
          {
            label: 'ATS-poäng',
            value: cvData?.ats_score ? `${cvData.ats_score}%` : 'Ej beräknat',
            status: cvData?.ats_score && cvData.ats_score >= 70 ? 'good' : cvData?.ats_score ? 'attention' : 'neutral',
            isShared: true,
          },
          {
            label: 'Senast uppdaterat',
            value: cvData?.updated_at
              ? new Date(cvData.updated_at).toLocaleDateString('sv-SE')
              : '-',
            status: 'neutral',
            isShared: true,
          },
        ],
      },
      {
        category: 'wellbeing',
        items: [
          {
            label: 'Energinivå',
            value: wellnessData?.energy_level
              ? `${wellnessData.energy_level}/5`
              : 'Ej loggat',
            status: wellnessData?.energy_level && wellnessData.energy_level >= 3 ? 'good' : wellnessData?.energy_level ? 'attention' : 'neutral',
            isShared: true,
          },
          {
            label: 'Senaste humör',
            value: wellnessData?.mood || 'Ej loggat',
            status: 'neutral',
            isShared: true,
          },
        ],
      },
    ]

    setSharedInfo(info)
  }

  const handleSendMessage = async (content: string) => {
    if (!consultant || !user) return

    const { data, error } = await supabase
      .from('consultant_messages')
      .insert({
        sender_id: user.id,
        receiver_id: consultant.id,
        content,
        is_read: false,
      })
      .select()
      .single()

    if (!error && data) {
      setMessages(prev => [...prev, data])
    }
  }

  const handleBookMeeting = () => {
    // For now, open email with meeting request
    if (consultant) {
      window.location.href = `mailto:${consultant.email}?subject=Bokningsförfrågan&body=Hej ${consultant.first_name},%0D%0A%0D%0AJag skulle vilja boka ett möte.%0D%0A%0D%0AMed vänliga hälsningar`
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <LoadingState type="dashboard" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
          Min konsulent
        </h1>
        <p className="text-stone-600 dark:text-stone-400 mt-2">
          {consultant
            ? `Håll kontakten med ${consultant.first_name} och följ dina framsteg`
            : 'Här ser du information om din arbetskonsulent'}
        </p>
      </div>

      {/* No consultant message */}
      {!consultant && (
        <Card className="p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-stone-100 dark:bg-stone-800 mx-auto mb-6 flex items-center justify-center">
            <User className="w-10 h-10 text-stone-400" />
          </div>
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-3">
            Ingen konsulent kopplad
          </h2>
          <p className="text-stone-600 dark:text-stone-400 max-w-md mx-auto">
            Du har för närvarande ingen arbetskonsulent kopplad till ditt konto.
            Om du förväntar dig att ha en konsulent, kontakta din organisation.
          </p>
        </Card>
      )}

      {/* Main content grid */}
      {consultant && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Consultant info */}
          <div className="space-y-6">
            <ConsultantCard consultant={consultant} nextMeeting={nextMeeting} />
            <GoalsSection goals={goals} />
          </div>

          {/* Middle column - Messages */}
          <div className="lg:col-span-1">
            <MessagesSection
              messages={messages}
              consultant={consultant}
              onSendMessage={handleSendMessage}
              loading={messagesLoading}
            />
          </div>

          {/* Right column - Shared info */}
          <div className="space-y-6">
            <SharedInformationSection sharedInfo={sharedInfo} />
          </div>
        </div>
      )}

      {/* Quick actions - full width */}
      {consultant && (
        <div className="mt-6">
          <QuickActions consultant={consultant} onBookMeeting={handleBookMeeting} />
        </div>
      )}
    </div>
  )
}
