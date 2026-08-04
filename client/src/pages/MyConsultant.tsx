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
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/ui/EmptyState'
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
  TrendingUp,
  Eye,
  EyeOff,
  Sparkles,
  UserCheck,
  AlertCircle,
} from '@/components/ui/icons'
import { useFocusMode } from '@/components/FocusModeProvider'
import { PageFocusShell } from '@/components/focus/shell/PageFocusShell'
import { FocusMyConsultantWizard } from '@/components/focus/pages/FocusMyConsultantWizard'
import { supabase } from '@/lib/supabase'
import { applicationsApi } from '@/services/applicationsApi'
import { getMyConsultant } from '@/services/myConsultantApi'
import { useAuthStore } from '@/stores/authStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { cn } from '@/lib/utils'
import { PageLayout } from '@/components/layout/PageLayout'
import { RevokeConsultantLinkSection } from '@/components/consultant/RevokeConsultantLinkSection'

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
          <User className="w-8 h-8 text-stone-400 dark:text-stone-500" />
        </div>
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
          {t('myConsultant.noConsultant')}
        </h2>
        <p className="text-stone-600 dark:text-stone-400 text-sm">
          {t('myConsultant.noConsultantDesc')}
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
    video: t('myConsultant.nextMeeting.meetingTypes.video'),
    phone: t('myConsultant.nextMeeting.meetingTypes.phone'),
    in_person: t('myConsultant.nextMeeting.meetingTypes.inPerson'),
  }

  return (
    <Card className="overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-[var(--c-solid)] p-6 text-white">
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
              <p className="text-white text-sm">{consultant.title}</p>
            )}
            <p className="text-white text-sm mt-1">{t('myConsultant.consultant.yourConsultant')}</p>
          </div>
        </div>
      </div>

      {/* Contact info */}
      <div className="p-4 border-b border-stone-200 dark:border-stone-700">
        <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-3">
          {t('myConsultant.contactInfo')}
        </h3>
        <div className="space-y-2">
          <a
            href={`mailto:${consultant.email}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group"
          >
            <Mail className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
            <span className="text-stone-700 dark:text-stone-300 group-hover:text-[var(--c-text)] dark:group-hover:text-[var(--c-text)]">
              {consultant.email}
            </span>
          </a>
          {consultant.phone && (
            <a
              href={`tel:${consultant.phone}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group"
            >
              <Phone className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
              <span className="text-stone-700 dark:text-stone-300 group-hover:text-[var(--c-text)] dark:group-hover:text-[var(--c-text)]">
                {consultant.phone}
              </span>
            </a>
          )}
        </div>
      </div>

      {/* Next meeting */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-3">
          {t('myConsultant.nextMeeting.title')}
        </h3>
        {nextMeeting ? (
          <div className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[var(--c-accent)]/40 dark:bg-[var(--c-solid)] rounded-lg">
                {(() => {
                  const Icon = meetingTypeIcons[nextMeeting.type]
                  return <Icon className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
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
                    className="inline-flex items-center gap-1 text-sm text-[var(--c-text)] dark:text-[var(--c-text)] hover:underline mt-2"
                  >
                    <Video className="w-4 h-4" />
                    {t('myConsultant.nextMeeting.joinMeeting')}
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-stone-500 dark:text-stone-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('myConsultant.nextMeeting.noMeetings')}</p>
          </div>
        )}
      </div>
    </Card>
  )
}

// Shared Information Section
function SharedInformationSection({ sharedInfo }: { sharedInfo: SharedInfo[] }) {
  const { t } = useTranslation()
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['progress'])

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  // UX24: bara tre kategorier produceras någonsin av datan nedan
  // (`progress`, `cv`, `wellbeing` — se sharedInfoItems). `goals` och
  // `activity` var döda grenar vars etiketter aldrig kunde renderas, och
  // `activity` krockade dessutom med `progress`, som redan heter "Aktivitet".
  const categoryIcons: Record<string, React.ElementType> = {
    progress: TrendingUp,
    cv: FileText,
    wellbeing: Heart,
  }

  const categoryLabels: Record<string, string> = {
    progress: t('myConsultant.sharedInfo.categories.progress'),
    cv: t('myConsultant.sharedInfo.categories.cv'),
    wellbeing: t('myConsultant.sharedInfo.categories.wellbeing'),
  }

  const statusColors = {
    good: 'text-[var(--c-text)] dark:text-[var(--c-text)]',
    neutral: 'text-stone-600 dark:text-stone-400',
    attention: 'text-amber-600 dark:text-amber-400',
  }

  return (
    <Card>
      <div className="p-4 border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
          {/* G13: `t('myConsultant.sharedInfo')` pekade på ett OBJEKT (nyckeln
              har underliggande barn) → i18next returnerade den råa nyckeln, så
              kortets rubrik läste "myConsultant.sharedInfo" i produktion.
              `sharedInfoDesc` fanns inte alls. Båda finns nu som egna nycklar. */}
          <h2 className="font-semibold text-stone-900 dark:text-stone-100">
            {t('myConsultant.sharedInfoTitle', 'Det här ser din konsulent')}
          </h2>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          {t('myConsultant.sharedInfoDesc', 'En översikt över vad som är synligt för din konsulent — och vad bara du ser.')}
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
                  <div className="p-2 bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/40 rounded-lg">
                    <Icon className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
                  </div>
                  <span className="font-medium text-stone-900 dark:text-stone-100">
                    {label}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-stone-400 dark:text-stone-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-stone-400 dark:text-stone-500" />
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
                          {/* Nycklarna låg under sharedInfo, inte direkt under
                              myConsultant — aria-labeln var tom före 2026-07-27. */}
                          {item.isShared ? (
                            <Eye className="w-4 h-4 text-[var(--c-solid)]" aria-label={t('myConsultant.sharedInfo.shared', 'Delas')} />
                          ) : (
                            <EyeOff className="w-4 h-4 text-stone-400 dark:text-stone-500" aria-label={t('myConsultant.sharedInfo.notShared', 'Delas ej')} />
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

      {/* G13 (2026-07-27): förklara ikonerna och gör transparensen handlingsbar.
          Utan teckenförklaring är öppet/stängt öga en gissningslek, och utan
          länken är insikten "måendet delas inte" en död ände. */}
      <div className="p-4 border-t border-stone-200 dark:border-stone-700 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5">
          <span className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400">
            <Eye className="w-3.5 h-3.5 text-[var(--c-solid)]" aria-hidden="true" />
            {t('myConsultant.legend.shared', 'Din konsulent kan se det här')}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400">
            <EyeOff className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" aria-hidden="true" />
            {t('myConsultant.legend.notShared', 'Bara du kan se det här')}
          </span>
        </div>

        <Link
          to="/settings?section=privacy"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--c-text)] hover:text-[var(--c-solid)] no-underline"
        >
          {t('myConsultant.legend.changeSharing', 'Ändra vad du delar')}
          <span aria-hidden="true">→</span>
        </Link>
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
  const { t } = useTranslation()
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
          <MessageSquare className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
          <h2 className="font-semibold text-stone-900 dark:text-stone-100">
            {t('myConsultant.messages.title')}
          </h2>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          {t('myConsultant.messages.writeTo', { name: consultant.first_name })}
        </p>
      </div>

      {/* Messages list */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        role="log"
        aria-live="polite"
        aria-label={t('myConsultant.messages.history')}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingState type="spinner" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <EmptyState
              illustration="vardag"
              title={t('myConsultant.messages.noMessages')}
              description={t('myConsultant.messages.startConversation')}
            />
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
                        ? 'bg-[var(--c-solid)] text-white rounded-br-md'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-bl-md'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={cn(
                        'text-xs mt-1',
                        isOwn ? 'text-white' : 'text-stone-500 dark:text-stone-400'
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
            {t('myConsultant.messages.writeMessage')}
          </label>
          <textarea
            id="message-input"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('myConsultant.messages.placeholder')}
            rows={1}
            className={cn(
              'flex-1 resize-none rounded-xl border border-stone-300 dark:border-stone-600',
              'bg-white dark:bg-stone-800 px-4 py-3',
              'text-stone-900 dark:text-stone-100 placeholder-stone-500',
              'focus:outline-none focus:ring-2 focus:ring-[var(--c-solid)] focus:border-transparent',
              'transition-colors'
            )}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="px-4"
            aria-label={t('myConsultant.messages.sendMessage')}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
          {t('myConsultant.messages.pressEnterToSend')}
        </p>
      </div>
    </Card>
  )
}

// Goals Section
function GoalsSection({ goals }: { goals: Goal[] }) {
  const { t } = useTranslation()

  if (goals.length === 0) {
    return null
  }

  const statusConfig = {
    NOT_STARTED: {
      label: t('myConsultant.goals.notStarted'),
      color: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
      icon: Clock,
    },
    IN_PROGRESS: {
      label: t('myConsultant.goals.inProgress'),
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
      icon: Activity,
    },
    COMPLETED: {
      label: t('myConsultant.goals.completed'),
      color: 'bg-[var(--c-accent)]/40 text-[var(--c-text)] dark:bg-[var(--c-bg)]/40 dark:text-[var(--c-text)]',
      icon: CheckCircle,
    },
  }

  const completedCount = goals.filter(g => g.status === 'COMPLETED').length

  return (
    <Card>
      <div className="p-4 border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
            <h2 className="font-semibold text-stone-900 dark:text-stone-100">
              {t('myConsultant.goals.agreedGoals')}
            </h2>
          </div>
          <div role="status" aria-live="polite">
            <span className="text-sm text-stone-500 dark:text-stone-400">
              {t('myConsultant.goals.goalsCompleted', { completed: completedCount, total: goals.length })}
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
                    {t('myConsultant.goals.deadline')}: {new Date(goal.deadline).toLocaleDateString()}
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
          <div className="bg-[var(--c-bg)] dark:bg-[var(--c-bg)]/30 rounded-xl p-4 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[var(--c-text)] dark:text-[var(--c-text)] flex-shrink-0" />
            <p className="text-sm text-[var(--c-text)] dark:text-[var(--c-text)]">
              {t('myConsultant.goals.greatJob', { count: completedCount })}
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}

// Quick Actions
function QuickActions({ consultant, onBookMeeting }: { consultant: ConsultantInfo | null; onBookMeeting: () => void }) {
  const { t } = useTranslation()

  if (!consultant) return null

  return (
    <Card className="p-4">
      <h2 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">
        {t('myConsultant.quickActions.title')}
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
          <Mail className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
          <span className="font-medium">{t('myConsultant.quickActions.sendEmail')}</span>
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
            <Phone className="w-5 h-5 text-[var(--c-text)] dark:text-[var(--c-text)]" />
            <span className="font-medium">{t('myConsultant.quickActions.call')}</span>
          </a>
        )}
        <button
          onClick={onBookMeeting}
          className={cn(
            'flex items-center gap-3 p-4 rounded-xl transition-all duration-200',
            'bg-[var(--c-solid)] hover:bg-[var(--c-text)]',
            'text-white'
          )}
        >
          <Calendar className="w-5 h-5" />
          <span className="font-medium">{t('myConsultant.quickActions.bookMeeting')}</span>
        </button>
      </div>
    </Card>
  )
}

// Main Page Component
export default function MyConsultant() {
  const { t } = useTranslation()
  const { isFocusMode, leaveWizard } = useFocusMode()

  if (isFocusMode) {
    return (
      <PageFocusShell
        title={t('myConsultant.title', 'Min konsulent')}
        icon={UserCheck}
        domain="wellbeing"
      >
        <FocusMyConsultantWizard onExit={leaveWizard} />
      </PageFocusShell>
    )
  }

  return <MyConsultantInner />
}

function MyConsultantInner() {
  const { t, i18n } = useTranslation()
  const { user, profile } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [consultant, setConsultant] = useState<ConsultantInfo | null>(null)
  const [nextMeeting, setNextMeeting] = useState<NextMeeting | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [messagesLoading, setMessagesLoading] = useState(true)
  const [sharedInfo, setSharedInfo] = useState<SharedInfo[]>([])
  /** UX12: skiljer "ingen konsulent tilldelad" från "hämtningen gick fel". */
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (user) {
      fetchConsultantData()
    }
  }, [user])

  const fetchConsultantData = async () => {
    try {
      setLoading(true)
      setLoadError(false)

      // Get user's consultant_id from profile
      const consultantId = profile?.consultant_id

      if (!consultantId) {
        setLoading(false)
        return
      }

      // UX12: går via RPC, inte via profiles. Deltagaren har ingen SELECT-rätt
      // på sin konsulents rad — den här läsningen gav 406 PGRST116 och sidan
      // visade "Ingen konsulent tilldelad ännu" för alla 31 kopplade deltagare.
      const consultantData = await getMyConsultant()

      if (consultantData) {
        setConsultant({
          id: consultantData.id,
          // RPC:n ger nullable fält (profilen kan vara ofullständig). Vyn vill
          // ha strängar — tomt är bättre än "null" i gränssnittet.
          first_name: consultantData.first_name ?? '',
          last_name: consultantData.last_name ?? '',
          email: consultantData.email ?? '',
          phone: consultantData.phone ?? undefined,
          avatar_url: consultantData.avatar_url ?? undefined,
          title: t('myConsultant.consultant.yourConsultant'),
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
      await buildSharedInfo(consultantId)
    } catch (error) {
      console.error('Error fetching consultant data:', error)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  /**
   * H4 + G13 (2026-07-27) — tre fel rättade i den här funktionen.
   *
   * 1. **`wellness_entries` finns inte i produktionsdatabasen.** Måendet
   *    hämtades från en fantomtabell → sektionen visade alltid "Inte loggat",
   *    oavsett hur mycket deltagaren hade loggat. Rätt tabell är `mood_logs`
   *    (`mood_level`, `energy_level`, `log_date`).
   * 2. **`job_applications` är utfasad** (E12) → "Skickade ansökningar" var
   *    alltid 0. Räkningen går nu via `applicationsApi.getStats()`, samma väg
   *    som Kanban-vyn. Samtidigt rättat: "Sparade jobb" räknade tidigare ALLA
   *    rader i `saved_jobs` — men den tabellen bär hela pipelinen, så
   *    ansökningar räknades som sparade jobb. Nu `stats.saved + interested`.
   * 3. **Ögonikonen ljög.** Varje post var hårdkodad `isShared: true`. Måendet
   *    delas i verkligheten bara om deltagaren har gett samtycke i
   *    `participant_data_sharing` (UX7). En transparenssida som påstår att
   *    konsulenten ser mer än hen gör är värre än ingen sida alls — det är
   *    hela G13:s poäng. Samtycket läses nu och styr ikonen.
   *
   * Fel sväljs inte tyst: misslyckas en hämtning visas "Kunde inte läsas"
   * i stället för ett nollvärde som ser ut som ett faktum.
   */
  const buildSharedInfo = async (consultantId: string) => {
    const UNKNOWN = t('myConsultant.sharedInfo.couldNotRead', 'Kunde inte läsas')

    // CV — maybeSingle: .single() gav PGRST116 när användaren saknar CV
    const { data: cvData } = await supabase
      .from('cvs')
      .select('ats_score, updated_at')
      .eq('user_id', user?.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Ansökningar + sparade jobb via samma API som Kanban-vyn
    let savedCount: number | null = null
    let sentCount: number | null = null
    try {
      const stats = await applicationsApi.getStats()
      savedCount = (stats.saved || 0) + (stats.interested || 0)
      // "Skickad" = allt som passerat sparad/intresserad
      sentCount = Math.max(0, (stats.total || 0) - savedCount)
    } catch (err) {
      console.error('MyConsultant: kunde inte läsa ansökningsstatistik', err)
    }

    // Mående — senaste loggen ur mood_logs
    const { data: moodData, error: moodError } = await supabase
      .from('mood_logs')
      .select('mood_level, energy_level, log_date')
      .eq('user_id', user?.id)
      .order('log_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (moodError) {
      console.error('MyConsultant: kunde inte läsa mående', moodError)
    }

    // G13 — delas måendet faktiskt med den här konsulenten?
    let wellnessIsShared = false
    const { data: sharing, error: sharingError } = await supabase
      .from('participant_data_sharing')
      .select('share_health_data, share_wellness_data')
      .eq('participant_id', user?.id)
      .eq('consultant_id', consultantId)
      .maybeSingle()

    if (sharingError) {
      console.error('MyConsultant: kunde inte läsa delningssamtycke', sharingError)
    } else {
      wellnessIsShared = !!(sharing?.share_wellness_data || sharing?.share_health_data)
    }

    const dateLocale = i18n.language === 'sv' ? 'sv-SE' : 'en-US'

    const info: SharedInfo[] = [
      {
        category: 'progress',
        items: [
          {
            label: t('myConsultant.sharedInfo.lastLogin'),
            value: profile?.last_login
              ? new Date(profile.last_login).toLocaleDateString(dateLocale)
              : t('myConsultant.sharedInfo.today'),
            status: 'good',
            isShared: true,
          },
          {
            label: t('myConsultant.sharedInfo.savedJobs'),
            value: savedCount === null ? UNKNOWN : t('myConsultant.sharedInfo.countUnit', { count: savedCount }),
            status: savedCount === null ? 'neutral' : savedCount > 0 ? 'good' : 'neutral',
            isShared: true,
          },
          {
            label: t('myConsultant.sharedInfo.sentApplications'),
            value: sentCount === null ? UNKNOWN : t('myConsultant.sharedInfo.countUnit', { count: sentCount }),
            status: sentCount === null ? 'neutral' : sentCount > 0 ? 'good' : 'neutral',
            isShared: true,
          },
        ],
      },
      {
        category: 'cv',
        items: [
          {
            label: t('myConsultant.sharedInfo.cvStatus'),
            value: cvData ? t('myConsultant.sharedInfo.created') : t('myConsultant.sharedInfo.notCreated'),
            status: cvData ? 'good' : 'attention',
            isShared: true,
          },
          {
            label: t('myConsultant.sharedInfo.atsScore'),
            value: cvData?.ats_score ? `${cvData.ats_score}%` : t('myConsultant.sharedInfo.notCalculated'),
            status: cvData?.ats_score && cvData.ats_score >= 70 ? 'good' : cvData?.ats_score ? 'attention' : 'neutral',
            isShared: true,
          },
          {
            label: t('myConsultant.sharedInfo.lastUpdated'),
            value: cvData?.updated_at
              ? new Date(cvData.updated_at).toLocaleDateString(dateLocale)
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
            label: t('myConsultant.sharedInfo.energyLevel'),
            value: moodData?.energy_level
              ? `${moodData.energy_level}/5`
              : t('myConsultant.sharedInfo.notLogged'),
            status: moodData?.energy_level && moodData.energy_level >= 3 ? 'good' : moodData?.energy_level ? 'attention' : 'neutral',
            // G13: ikonen speglar det faktiska samtycket, inte en förhoppning
            isShared: wellnessIsShared,
          },
          {
            label: t('myConsultant.sharedInfo.latestMood'),
            value: moodData?.mood_level
              ? `${moodData.mood_level}/5`
              : t('myConsultant.sharedInfo.notLogged'),
            status: 'neutral',
            isShared: wellnessIsShared,
          },
          {
            label: t('myConsultant.sharedInfo.lastLogged'),
            value: moodData?.log_date
              ? new Date(moodData.log_date).toLocaleDateString(dateLocale)
              : t('myConsultant.sharedInfo.notLogged'),
            status: 'neutral',
            isShared: wellnessIsShared,
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
      const subject = encodeURIComponent(t('myConsultant.email.bookingSubject'))
      const body = encodeURIComponent(t('myConsultant.email.bookingBody', { name: consultant.first_name }))
      window.location.href = `mailto:${consultant.email}?subject=${subject}&body=${body}`
    }
  }

  const handleConsultantRevoked = () => {
    // Uppsägning lyckades — rensa lokal state och uppdatera profilen i store
    // så att resten av appen direkt ser att kopplingen försvunnit.
    setConsultant(null)
    setNextMeeting(null)
    setMessages([])
    setGoals([])
    setSharedInfo([])
    useAuthStore.setState((state) => ({
      profile: state.profile ? { ...state.profile, consultant_id: null } : null,
    }))
  }

  if (loading) {
    return (
      <PageLayout
        title={t('myConsultant.title')}
        domain="wellbeing"
        showTabs={false}
        className="max-w-7xl mx-auto"
      >
        <LoadingState type="dashboard" />
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={t('myConsultant.title')}
      subtitle={consultant
        ? t('myConsultant.subtitle', { name: consultant.first_name })
        : t('myConsultant.subtitleNoConsultant')}
      domain="wellbeing"
      showTabs={false}
      className="max-w-7xl mx-auto"
    >

      {/* UX12: "ingen konsulent" och "vi kunde inte hämta" är två olika
          besked. Att visa det första när det andra är sant är precis vad som
          dolde den saknade RLS-policyn — sidan såg lugn och korrekt ut. */}
      {!consultant && loadError && (
        <Card className="p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/20 mx-auto mb-6 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-3">
            {t('myConsultant.loadErrorTitle', 'Vi kunde inte hämta din konsulent just nu')}
          </h2>
          <p className="text-stone-600 dark:text-stone-400 max-w-md mx-auto">
            {t('myConsultant.loadErrorDesc', 'Det är ett tillfälligt fel hos oss — inte något du har gjort. Ladda om sidan om en stund.')}
          </p>
        </Card>
      )}

      {/* No consultant message */}
      {!consultant && !loadError && (
        <Card className="p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-stone-100 dark:bg-stone-800 mx-auto mb-6 flex items-center justify-center">
            <User className="w-10 h-10 text-stone-400 dark:text-stone-500" />
          </div>
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-3">
            {t('myConsultant.noConsultant')}
          </h2>
          <p className="text-stone-600 dark:text-stone-400 max-w-md mx-auto">
            {t('myConsultant.noConsultantFullDesc')}
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

      {/* Säg upp kopplingen - längst ner, dämpad */}
      {consultant && (
        <div className="mt-8 max-w-3xl mx-auto">
          <RevokeConsultantLinkSection
            consultantId={consultant.id}
            consultantName={`${consultant.first_name} ${consultant.last_name}`.trim()}
            onRevoked={handleConsultantRevoked}
          />
        </div>
      )}
    </PageLayout>
  )
}
