/**
 * OverviewTab - Consultant Dashboard Overview
 * KPI dashboard with traffic light status, activity feed, and quick actions
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Users,
  FileText,
  Briefcase,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Mail,
  MessageSquare,
  Target,
  Activity,
  ChevronRight,
  Plus,
  Bell,
  RefreshCw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { cn } from '@/lib/utils'

interface DashboardStats {
  totalParticipants: number
  activeParticipants: number
  needsAttention: number
  completedCV: number
  averageProgress: number
  meetingsThisWeek: number
  pendingMessages: number
  goalsCompleted: number
  goalsOverdue: number
}

interface Participant {
  participant_id: string
  email: string
  first_name: string
  last_name: string
  status: string
  has_cv: boolean
  ats_score: number | null
  last_contact_at: string | null
  last_login: string | null
  saved_jobs_count: number
}

interface RecentActivity {
  id: string
  type: 'cv_updated' | 'job_saved' | 'login' | 'goal_completed' | 'message'
  participantName: string
  participantId: string
  description: string
  timestamp: string
}

// KPI Card Component
function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  status,
  onClick,
}: {
  title: string
  value: number | string
  subtitle?: string
  icon: React.ElementType
  trend?: { value: number; isPositive: boolean }
  status?: 'green' | 'yellow' | 'red' | 'neutral'
  onClick?: () => void
}) {
  const statusColors = {
    green: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
    yellow: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
    red: 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800',
    neutral: 'bg-stone-50 border-stone-200 dark:bg-stone-800/50 dark:border-stone-700',
  }

  const iconColors = {
    green: 'text-emerald-600 dark:text-emerald-400',
    yellow: 'text-amber-600 dark:text-amber-400',
    red: 'text-rose-600 dark:text-rose-400',
    neutral: 'text-stone-600 dark:text-stone-400',
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 sm:p-5 rounded-xl border-2 transition-all duration-200',
        'hover:shadow-md hover:scale-[1.02]',
        statusColors[status || 'neutral']
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-stone-600 dark:text-stone-400">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm font-medium',
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            )}>
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
              <span className="text-stone-400 font-normal">vs förra veckan</span>
            </div>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-xl',
          status === 'green' ? 'bg-emerald-100 dark:bg-emerald-900/40' :
          status === 'yellow' ? 'bg-amber-100 dark:bg-amber-900/40' :
          status === 'red' ? 'bg-rose-100 dark:bg-rose-900/40' :
          'bg-stone-100 dark:bg-stone-700'
        )}>
          <Icon className={cn('w-6 h-6', iconColors[status || 'neutral'])} />
        </div>
      </div>
    </button>
  )
}

// Attention Alert Component
function AttentionAlert({
  participant,
  type,
}: {
  participant: Participant
  type: 'no_contact' | 'inactive' | 'no_cv' | 'low_engagement'
}) {
  const alerts = {
    no_contact: {
      icon: Clock,
      color: 'text-amber-600 bg-amber-100',
      message: 'Ej kontaktad på 7+ dagar',
    },
    inactive: {
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-100',
      message: 'Inaktiv i 14+ dagar',
    },
    no_cv: {
      icon: FileText,
      color: 'text-blue-600 bg-blue-100',
      message: 'CV saknas',
    },
    low_engagement: {
      icon: Activity,
      color: 'text-amber-600 bg-amber-100',
      message: 'Lågt engagemang',
    },
  }

  const alert = alerts[type]
  const Icon = alert.icon

  return (
    <Link
      to={`/consultant/participants/${participant.participant_id}`}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
    >
      <div className={cn('p-2 rounded-lg', alert.color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
          {participant.first_name} {participant.last_name}
        </p>
        <p className="text-sm text-stone-500 dark:text-stone-400">{alert.message}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-stone-400" />
    </Link>
  )
}

// Quick Action Button Component
function QuickAction({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
}: {
  icon: React.ElementType
  label: string
  onClick: () => void
  variant?: 'default' | 'primary'
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full p-3 rounded-lg transition-all duration-200',
        variant === 'primary'
          ? 'bg-violet-600 text-white hover:bg-violet-700'
          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  )
}

export function OverviewTab() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalParticipants: 0,
    activeParticipants: 0,
    needsAttention: 0,
    completedCV: 0,
    averageProgress: 0,
    meetingsThisWeek: 0,
    pendingMessages: 0,
    goalsCompleted: 0,
    goalsOverdue: 0,
  })
  const [participants, setParticipants] = useState<Participant[]>([])
  const [attentionList, setAttentionList] = useState<Array<{ participant: Participant; type: 'no_contact' | 'inactive' | 'no_cv' | 'low_engagement' }>>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch participants
      const { data: participantsData } = await supabase
        .from('consultant_dashboard_participants')
        .select('*')
        .eq('consultant_id', user.id)

      if (participantsData) {
        setParticipants(participantsData)

        // Calculate stats
        const now = new Date()
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

        const active = participantsData.filter(p => p.status === 'ACTIVE')
        const needsAttention = participantsData.filter(p =>
          !p.last_contact_at || new Date(p.last_contact_at) < sevenDaysAgo
        )
        const completedCV = participantsData.filter(p =>
          p.has_cv && (p.ats_score || 0) >= 70
        )

        setStats({
          totalParticipants: participantsData.length,
          activeParticipants: active.length,
          needsAttention: needsAttention.length,
          completedCV: completedCV.length,
          averageProgress: Math.round(
            participantsData.reduce((acc, p) => acc + (p.ats_score || 0), 0) /
            Math.max(participantsData.length, 1)
          ),
          meetingsThisWeek: 0, // TODO: Fetch from meetings table
          pendingMessages: 0, // TODO: Fetch from messages table
          goalsCompleted: 0, // TODO: Fetch from goals table
          goalsOverdue: 0, // TODO: Fetch from goals table
        })

        // Build attention list
        const attention: Array<{ participant: Participant; type: 'no_contact' | 'inactive' | 'no_cv' | 'low_engagement' }> = []

        participantsData.forEach(p => {
          if (!p.last_contact_at || new Date(p.last_contact_at) < sevenDaysAgo) {
            attention.push({ participant: p, type: 'no_contact' })
          }
          if (p.last_login && new Date(p.last_login) < fourteenDaysAgo) {
            attention.push({ participant: p, type: 'inactive' })
          }
          if (!p.has_cv) {
            attention.push({ participant: p, type: 'no_cv' })
          }
        })

        setAttentionList(attention.slice(0, 5))

        // Generate mock recent activity (TODO: Fetch from actual activity log)
        const mockActivity: RecentActivity[] = participantsData.slice(0, 5).map((p, i) => ({
          id: `activity-${i}`,
          type: ['cv_updated', 'job_saved', 'login', 'goal_completed'][Math.floor(Math.random() * 4)] as RecentActivity['type'],
          participantName: `${p.first_name} ${p.last_name}`,
          participantId: p.participant_id,
          description: 'Uppdaterade sitt CV',
          timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        }))
        setRecentActivity(mockActivity)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingState type="dashboard" />
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Totalt deltagare"
          value={stats.totalParticipants}
          subtitle={`${stats.activeParticipants} aktiva`}
          icon={Users}
          status="neutral"
        />
        <KPICard
          title="Kräver uppmärksamhet"
          value={stats.needsAttention}
          subtitle="Ej kontaktade 7+ dagar"
          icon={AlertTriangle}
          status={stats.needsAttention === 0 ? 'green' : stats.needsAttention <= 3 ? 'yellow' : 'red'}
        />
        <KPICard
          title="CV-kvalitet"
          value={`${stats.averageProgress}%`}
          subtitle={`${stats.completedCV} kompletta`}
          icon={FileText}
          status={stats.averageProgress >= 70 ? 'green' : stats.averageProgress >= 50 ? 'yellow' : 'red'}
          trend={{ value: 5, isPositive: true }}
        />
        <KPICard
          title="Möten denna vecka"
          value={stats.meetingsThisWeek}
          subtitle="Schemalagda"
          icon={Calendar}
          status="neutral"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attention Alerts */}
        <Card className="lg:col-span-2">
          <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                  Kräver uppmärksamhet
                </h3>
              </div>
              <Link
                to="/consultant/participants?filter=attention"
                className="text-sm text-violet-600 hover:text-violet-700 font-medium"
              >
                Visa alla
              </Link>
            </div>
          </div>
          <div className="p-2">
            {attentionList.length > 0 ? (
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {attentionList.map((item, i) => (
                  <AttentionAlert
                    key={`${item.participant.participant_id}-${item.type}-${i}`}
                    participant={item.participant}
                    type={item.type}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="font-medium text-stone-900 dark:text-stone-100">
                  Alla deltagare följs upp!
                </p>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  Inga deltagare kräver omedelbar uppmärksamhet.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-700">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
              Snabbåtgärder
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <QuickAction
              icon={Plus}
              label="Bjud in deltagare"
              onClick={() => {}}
              variant="primary"
            />
            <QuickAction
              icon={Mail}
              label="Skicka gruppmeddelande"
              onClick={() => {}}
            />
            <QuickAction
              icon={Calendar}
              label="Schemalägg möte"
              onClick={() => {}}
            />
            <QuickAction
              icon={FileText}
              label="Exportera rapport"
              onClick={() => {}}
            />
            <QuickAction
              icon={Target}
              label="Skapa mål för deltagare"
              onClick={() => {}}
            />
          </div>
        </Card>
      </div>

      {/* Recent Activity & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-600" />
                <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                  Senaste aktivitet
                </h3>
              </div>
              <button
                onClick={fetchDashboardData}
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-stone-500" />
              </button>
            </div>
          </div>
          <div className="p-2">
            {recentActivity.length > 0 ? (
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {recentActivity.map(activity => (
                  <Link
                    key={activity.id}
                    to={`/consultant/participants/${activity.participantId}`}
                    className="flex items-center gap-3 p-3 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/40">
                      {activity.type === 'cv_updated' && <FileText className="w-4 h-4 text-violet-600" />}
                      {activity.type === 'job_saved' && <Briefcase className="w-4 h-4 text-violet-600" />}
                      {activity.type === 'login' && <Users className="w-4 h-4 text-violet-600" />}
                      {activity.type === 'goal_completed' && <Target className="w-4 h-4 text-emerald-600" />}
                      {activity.type === 'message' && <MessageSquare className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                        {activity.participantName}
                      </p>
                      <p className="text-sm text-stone-500 dark:text-stone-400">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-xs text-stone-400">
                      {new Date(activity.timestamp).toLocaleTimeString('sv-SE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-stone-500">
                Ingen aktivitet ännu
              </div>
            )}
          </div>
        </Card>

        {/* Goals Overview */}
        <Card>
          <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                  Målöversikt
                </h3>
              </div>
              <Link
                to="/consultant/analytics"
                className="text-sm text-violet-600 hover:text-violet-700 font-medium"
              >
                Se detaljer
              </Link>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <p className="text-3xl font-bold text-emerald-600">{stats.goalsCompleted}</p>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                  Avklarade mål
                </p>
              </div>
              <div className="text-center p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                <p className="text-3xl font-bold text-rose-600">{stats.goalsOverdue}</p>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                  Försenade mål
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
              <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
                Vanligaste målkategorierna
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-600 dark:text-stone-400">CV-förbättring</span>
                  <div className="w-24 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-600 rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-600 dark:text-stone-400">Jobbansökningar</span>
                  <div className="w-24 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-600 rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-600 dark:text-stone-400">Intervjuträning</span>
                  <div className="w-24 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-600 rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
