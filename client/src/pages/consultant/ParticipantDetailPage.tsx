/**
 * ParticipantDetailPage - Detailed View for a Single Participant
 * Profile, progress tracker, goals, journal, and communication
 */

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  Briefcase,
  Target,
  MessageSquare,
  Clock,
  TrendingUp,
  Edit2,
  MoreVertical,
  Plus,
  Star,
  AlertTriangle,
  CheckCircle,
  Activity,
  Send,
  Trash2,
  ChevronRight,
} from '@/components/ui/icons'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { cn } from '@/lib/utils'

interface Participant {
  participant_id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  avatar_url: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'ON_HOLD'
  priority: number
  has_cv: boolean
  ats_score: number | null
  completed_interest_test: boolean
  holland_code: string | null
  saved_jobs_count: number
  notes_count: number
  last_contact_at: string | null
  next_meeting_scheduled: string | null
  last_login: string | null
  created_at?: string
}

interface Goal {
  id: string
  title: string
  description: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  deadline: string
  progress: number
}

interface JournalEntry {
  id: string
  content: string
  category: 'GENERAL' | 'PROGRESS' | 'CONCERN' | 'GOAL'
  createdAt: string
}

interface TimelineEvent {
  id: string
  type: 'cv_updated' | 'goal_completed' | 'login' | 'job_saved' | 'note_added' | 'meeting'
  description: string
  timestamp: string
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const badges = {
    ACTIVE: { label: 'Aktiv', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
    INACTIVE: { label: 'Inaktiv', color: 'bg-stone-100 text-stone-800 dark:bg-stone-700 dark:text-stone-300' },
    COMPLETED: { label: 'Avslutad', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
    ON_HOLD: { label: 'Pausad', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  }
  const badge = badges[status as keyof typeof badges] || badges.INACTIVE

  return (
    <span className={cn('px-3 py-1 rounded-full text-sm font-medium', badge.color)}>
      {badge.label}
    </span>
  )
}

// Quick Stat Card
function QuickStat({
  icon: Icon,
  label,
  value,
  status,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  status?: 'good' | 'warning' | 'bad'
}) {
  const statusColors = {
    good: 'text-emerald-600',
    warning: 'text-amber-600',
    bad: 'text-rose-600',
    undefined: 'text-stone-900 dark:text-stone-100',
  }

  return (
    <div className="text-center p-4 bg-stone-50 dark:bg-stone-800 rounded-xl">
      <Icon className="w-6 h-6 text-stone-400 mx-auto mb-2" />
      <p className={cn('text-2xl font-bold', statusColors[status || 'undefined'])}>
        {value}
      </p>
      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{label}</p>
    </div>
  )
}

// Goal Card Component
function GoalCard({
  goal,
  onEdit,
  onComplete,
}: {
  goal: Goal
  onEdit: (goal: Goal) => void
  onComplete: (id: string) => void
}) {
  const statusColors = {
    NOT_STARTED: 'bg-stone-100 text-stone-600',
    IN_PROGRESS: 'bg-blue-100 text-blue-600',
    COMPLETED: 'bg-emerald-100 text-emerald-600',
    BLOCKED: 'bg-rose-100 text-rose-600',
  }

  const priorityColors = {
    HIGH: 'text-rose-600',
    MEDIUM: 'text-amber-600',
    LOW: 'text-stone-500',
  }

  const isOverdue = new Date(goal.deadline) < new Date() && goal.status !== 'COMPLETED'

  return (
    <div className={cn(
      'p-4 rounded-xl border-2 transition-colors',
      isOverdue ? 'border-rose-200 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-900/10' : 'border-stone-200 dark:border-stone-700'
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-stone-900 dark:text-stone-100">
              {goal.title}
            </h4>
            {isOverdue && (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2">
            {goal.description}
          </p>
        </div>
        <button className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg">
          <MoreVertical className="w-4 h-4 text-stone-400" />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', statusColors[goal.status])}>
          {goal.status === 'NOT_STARTED' ? 'Ej påbörjad' :
           goal.status === 'IN_PROGRESS' ? 'Pågår' :
           goal.status === 'COMPLETED' ? 'Klar' : 'Blockerad'}
        </span>
        <span className={cn('text-xs font-medium', priorityColors[goal.priority])}>
          {goal.priority === 'HIGH' ? 'Hög prioritet' :
           goal.priority === 'MEDIUM' ? 'Medel' : 'Låg'}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-stone-500">Framsteg</span>
          <span className="font-medium text-stone-700 dark:text-stone-300">{goal.progress}%</span>
        </div>
        <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              goal.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-violet-600'
            )}
            style={{ width: `${goal.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className={cn(
          'text-xs',
          isOverdue ? 'text-rose-600 font-medium' : 'text-stone-500'
        )}>
          <Clock className="w-3 h-3 inline mr-1" />
          Deadline: {new Date(goal.deadline).toLocaleDateString('sv-SE')}
        </span>
        {goal.status !== 'COMPLETED' && (
          <Button size="sm" variant="ghost" onClick={() => onComplete(goal.id)}>
            <CheckCircle className="w-4 h-4 mr-1" />
            Markera klar
          </Button>
        )}
      </div>
    </div>
  )
}

export function ParticipantDetailPage() {
  const { participantId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [journal, setJournal] = useState<JournalEntry[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'journal' | 'timeline'>('overview')
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    fetchParticipantData()
  }, [participantId])

  const fetchParticipantData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !participantId) return

      // Fetch participant
      const { data: participantData } = await supabase
        .from('consultant_dashboard_participants')
        .select('*')
        .eq('consultant_id', user.id)
        .eq('participant_id', participantId)
        .single()

      if (participantData) {
        setParticipant(participantData)

        // Generate mock goals (TODO: Fetch from real table)
        const mockGoals: Goal[] = [
          {
            id: '1',
            title: 'Förbättra CV till 80+ poäng',
            description: 'Uppdatera CV med relevanta nyckelord och förbättra ATS-poängen',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            progress: 65,
          },
          {
            id: '2',
            title: 'Skicka 10 ansökningar denna vecka',
            description: 'Systematiskt jobbsökande med fokus på IT-branschen',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            progress: 40,
          },
          {
            id: '3',
            title: 'Genomför intressetest',
            description: 'Slutför Holland-koden för att matcha med rätt yrken',
            status: 'COMPLETED',
            priority: 'LOW',
            deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            progress: 100,
          },
        ]
        setGoals(mockGoals)

        // Generate mock journal entries
        const mockJournal: JournalEntry[] = [
          {
            id: '1',
            content: 'Bra samtal idag. Deltagaren är motiverad och har tydliga mål. Fokus på CV-förbättring nästa vecka.',
            category: 'GENERAL',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '2',
            content: 'CV:t har förbättrats från 55 till 72 poäng. Fortsätter med nyckelord för IT-branschen.',
            category: 'PROGRESS',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '3',
            content: 'Lite nedstämd efter avslag. Diskuterade strategier för att hantera motgångar.',
            category: 'CONCERN',
            createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]
        setJournal(mockJournal)

        // Generate mock timeline
        const mockTimeline: TimelineEvent[] = [
          { id: '1', type: 'cv_updated', description: 'Uppdaterade CV', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
          { id: '2', type: 'job_saved', description: 'Sparade 3 nya jobb', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
          { id: '3', type: 'login', description: 'Loggade in', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
          { id: '4', type: 'goal_completed', description: 'Avklarade mål: Genomför intressetest', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
          { id: '5', type: 'meeting', description: 'Uppföljningsmöte', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
        ]
        setTimeline(mockTimeline)
      }
    } catch (error) {
      console.error('Error fetching participant:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = () => {
    if (!newNote.trim()) return
    const newEntry: JournalEntry = {
      id: `note-${Date.now()}`,
      content: newNote,
      category: 'GENERAL',
      createdAt: new Date().toISOString(),
    }
    setJournal(prev => [newEntry, ...prev])
    setNewNote('')
    // TODO: Save to database
  }

  if (loading) {
    return <LoadingState type="profile" />
  }

  if (!participant) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-500">Deltagaren kunde inte hittas</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/consultant/participants')}>
          Tillbaka till deltagare
        </Button>
      </div>
    )
  }

  const getInitials = () => {
    return `${participant.first_name?.[0] || ''}${participant.last_name?.[0] || ''}`.toUpperCase() ||
      participant.email[0].toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/consultant/participants"
        className="inline-flex items-center gap-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Tillbaka till deltagare
      </Link>

      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-2xl font-bold text-violet-600 dark:text-violet-400 flex-shrink-0">
            {getInitials()}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                  {participant.first_name} {participant.last_name}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-stone-500 dark:text-stone-400">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {participant.email}
                  </span>
                  {participant.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {participant.phone}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={participant.status} />
                <Button variant="outline" size="sm">
                  <Edit2 className="w-4 h-4 mr-1" />
                  Redigera
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <QuickStat
                icon={FileText}
                label="CV-poäng"
                value={participant.ats_score ? `${participant.ats_score}%` : '—'}
                status={
                  (participant.ats_score || 0) >= 70 ? 'good' :
                  (participant.ats_score || 0) >= 50 ? 'warning' : 'bad'
                }
              />
              <QuickStat
                icon={Briefcase}
                label="Sparade jobb"
                value={participant.saved_jobs_count}
              />
              <QuickStat
                icon={Target}
                label="Aktiva mål"
                value={goals.filter(g => g.status !== 'COMPLETED').length}
              />
              <QuickStat
                icon={Clock}
                label="Senast kontakt"
                value={participant.last_contact_at
                  ? Math.floor((Date.now() - new Date(participant.last_contact_at).getTime()) / (1000 * 60 * 60 * 24))
                  : '—'}
                status={
                  !participant.last_contact_at ? 'bad' :
                  new Date(participant.last_contact_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? 'warning' : 'good'
                }
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-700 overflow-x-auto">
        {[
          { id: 'overview', label: 'Översikt', icon: Activity },
          { id: 'goals', label: 'Mål', icon: Target },
          { id: 'journal', label: 'Anteckningar', icon: MessageSquare },
          { id: 'timeline', label: 'Tidslinje', icon: Clock },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'text-violet-600 border-b-2 border-violet-600'
                : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
            )}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Goals */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                Aktiva mål
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setActiveTab('goals')}>
                Se alla
              </Button>
            </div>
            <div className="space-y-3">
              {goals.filter(g => g.status !== 'COMPLETED').slice(0, 2).map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={() => {/* TODO: Implement goal editing */}}
                  onComplete={() => {/* TODO: Implement goal completion */}}
                />
              ))}
            </div>
          </Card>

          {/* Quick Note */}
          <Card className="p-5">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">
              Snabbanteckning
            </h3>
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Skriv en anteckning om deltagaren..."
              rows={4}
              className={cn(
                'w-full px-4 py-3 rounded-xl',
                'bg-stone-100 dark:bg-stone-800',
                'border-2 border-transparent focus:border-violet-500',
                'text-stone-900 dark:text-stone-100',
                'resize-none'
              )}
            />
            <Button className="mt-3" onClick={handleAddNote} disabled={!newNote.trim()}>
              <Send className="w-4 h-4 mr-2" />
              Spara anteckning
            </Button>
          </Card>
        </div>
      )}

      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-stone-500">
              {goals.filter(g => g.status !== 'COMPLETED').length} aktiva mål
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nytt mål
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => {/* TODO: Implement goal editing */}}
                onComplete={() => {/* TODO: Implement goal completion */}}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'journal' && (
        <div className="space-y-4">
          <Card className="p-4">
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Skriv en ny anteckning..."
              rows={3}
              className={cn(
                'w-full px-4 py-3 rounded-xl',
                'bg-stone-100 dark:bg-stone-800',
                'border-2 border-transparent focus:border-violet-500',
                'text-stone-900 dark:text-stone-100',
                'resize-none'
              )}
            />
            <div className="flex items-center justify-end mt-3">
              <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Lägg till
              </Button>
            </div>
          </Card>

          <div className="space-y-3">
            {journal.map(entry => {
              const categoryColors = {
                GENERAL: 'border-stone-200 dark:border-stone-700',
                PROGRESS: 'border-emerald-200 dark:border-emerald-800',
                CONCERN: 'border-amber-200 dark:border-amber-800',
                GOAL: 'border-violet-200 dark:border-violet-800',
              }
              return (
                <Card key={entry.id} className={cn('p-4 border-l-4', categoryColors[entry.category])}>
                  <p className="text-stone-900 dark:text-stone-100">{entry.content}</p>
                  <p className="text-xs text-stone-500 mt-2">
                    {new Date(entry.createdAt).toLocaleDateString('sv-SE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <Card className="p-5">
          <div className="space-y-6">
            {timeline.map((event, index) => {
              const icons = {
                cv_updated: FileText,
                goal_completed: CheckCircle,
                login: User,
                job_saved: Briefcase,
                note_added: MessageSquare,
                meeting: Calendar,
              }
              const Icon = icons[event.type]

              return (
                <div key={event.id} className="flex gap-4">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-stone-200 dark:bg-stone-700" />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="font-medium text-stone-900 dark:text-stone-100">
                      {event.description}
                    </p>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      {new Date(event.timestamp).toLocaleDateString('sv-SE', {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
