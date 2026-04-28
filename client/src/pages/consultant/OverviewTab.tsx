/**
 * OverviewTab - Consultant Dashboard Overview
 * KPI dashboard with traffic light status, activity feed, and quick actions
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  Download,
} from '@/components/ui/icons'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { cn } from '@/lib/utils'
import { InviteParticipantDialog } from '@/components/consultant/InviteParticipantDialog'
import { MeetingSchedulerDialog } from '@/components/consultant/MeetingSchedulerDialog'
import { GoalCreationDialog } from '@/components/consultant/GoalCreationDialog'
import { ReportGeneratorDialog } from '@/components/consultant/ReportGeneratorDialog'
import { BulkActionsDialog } from '@/components/consultant/BulkActionsDialog'

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
  const { t } = useTranslation()
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
              <span className="text-stone-500 dark:text-stone-400 font-normal">{t('consultant.overview.vsLastWeek')}</span>
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
  t,
}: {
  participant: Participant
  type: 'no_contact' | 'inactive' | 'no_cv' | 'low_engagement'
  t: (key: string) => string
}) {
  const alerts = {
    no_contact: {
      icon: Clock,
      color: 'text-amber-600 bg-amber-100',
      message: t('consultant.alerts.noContact'),
    },
    inactive: {
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-100',
      message: t('consultant.alerts.inactive'),
    },
    no_cv: {
      icon: FileText,
      color: 'text-blue-600 bg-blue-100',
      message: t('consultant.alerts.noCv'),
    },
    low_engagement: {
      icon: Activity,
      color: 'text-amber-600 bg-amber-100',
      message: t('consultant.alerts.lowEngagement'),
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
      <ChevronRight className="w-4 h-4 text-stone-400 dark:text-stone-500" />
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
          ? 'bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white hover:from-amber-600 hover:to-orange-600'
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
  const navigate = useNavigate()
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

  // Dialog states
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showMeetingDialog, setShowMeetingDialog] = useState(false)
  const [showGoalDialog, setShowGoalDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showMessageDialog, setShowMessageDialog] = useState(false)

  // Goal categories for overview
  const [goalCategories, setGoalCategories] = useState<Array<{ category: string; count: number; percentage: number }>>([])

  // Report data for PDF export
  const [reportData, setReportData] = useState<any>(null)

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

      // Fetch meetings this week
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1)
      startOfWeek.setHours(0, 0, 0, 0)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)

      const { data: meetingsData } = await supabase
        .from('consultant_meetings')
        .select('*')
        .eq('consultant_id', user.id)
        .gte('scheduled_at', startOfWeek.toISOString())
        .lte('scheduled_at', endOfWeek.toISOString())
        .eq('status', 'scheduled')

      // Fetch unread messages
      const { data: messagesData } = await supabase
        .from('consultant_messages')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('is_read', false)

      // Fetch goals
      const { data: goalsData } = await supabase
        .from('consultant_goals')
        .select('*')
        .eq('consultant_id', user.id)

      // Fetch recent journal entries for activity feed
      const { data: journalData } = await supabase
        .from('consultant_journal')
        .select('*, profiles!consultant_journal_participant_id_fkey(first_name, last_name)')
        .eq('consultant_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

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

        // Calculate goals stats
        const completedGoals = goalsData?.filter(g => g.status === 'COMPLETED').length || 0
        const overdueGoals = goalsData?.filter(g =>
          g.deadline && new Date(g.deadline) < now && g.status !== 'COMPLETED'
        ).length || 0

        setStats({
          totalParticipants: participantsData.length,
          activeParticipants: active.length,
          needsAttention: needsAttention.length,
          completedCV: completedCV.length,
          averageProgress: Math.round(
            participantsData.reduce((acc, p) => acc + (p.ats_score || 0), 0) /
            Math.max(participantsData.length, 1)
          ),
          meetingsThisWeek: meetingsData?.length || 0,
          pendingMessages: messagesData?.length || 0,
          goalsCompleted: completedGoals,
          goalsOverdue: overdueGoals,
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

        // Build recent activity from real data
        const activityTypes: Record<string, RecentActivity['type']> = {
          GENERAL: 'message',
          PROGRESS: 'cv_updated',
          CONCERN: 'message',
          GOAL: 'goal_completed',
        }

        const activityDescriptions: Record<string, string> = {
          GENERAL: t('consultant.overview.activity.newNote'),
          PROGRESS: t('consultant.overview.activity.progressNoted'),
          CONCERN: t('consultant.overview.activity.concernNoted'),
          GOAL: t('consultant.overview.activity.goalRelated'),
        }

        const activities: RecentActivity[] = (journalData || []).map((entry: any) => ({
          id: entry.id,
          type: activityTypes[entry.category] || 'message',
          participantName: entry.profiles ? `${entry.profiles.first_name} ${entry.profiles.last_name}` : t('common.unknown'),
          participantId: entry.participant_id,
          description: activityDescriptions[entry.category] || t('consultant.overview.activity.activity'),
          timestamp: entry.created_at,
        }))

        // If no journal entries, show participant login activity
        if (activities.length === 0 && participantsData.length > 0) {
          const recentLogins = participantsData
            .filter(p => p.last_login)
            .sort((a, b) => new Date(b.last_login!).getTime() - new Date(a.last_login!).getTime())
            .slice(0, 5)
            .map((p, i) => ({
              id: `login-${i}`,
              type: 'login' as const,
              participantName: `${p.first_name} ${p.last_name}`,
              participantId: p.participant_id,
              description: t('consultant.overview.activity.loggedIn'),
              timestamp: p.last_login!,
            }))
          setRecentActivity(recentLogins)
        } else {
          setRecentActivity(activities)
        }

        // Calculate goal categories
        if (goalsData && goalsData.length > 0) {
          const categories: Record<string, number> = {}
          goalsData.forEach((g: any) => {
            // Extract category from title or use a default categorization
            let category = t('consultant.overview.goalCategories.other')
            const title = g.title?.toLowerCase() || ''
            if (title.includes('cv') || title.includes('resume')) category = t('consultant.overview.goalCategories.cvImprovement')
            else if (title.includes('jobb') || title.includes('ansök') || title.includes('job') || title.includes('apply')) category = t('consultant.overview.goalCategories.jobApplications')
            else if (title.includes('intervju') || title.includes('interview')) category = t('consultant.overview.goalCategories.interviewTraining')
            else if (title.includes('nätverk') || title.includes('linkedin') || title.includes('network')) category = t('consultant.overview.goalCategories.networking')
            else if (title.includes('kompetens') || title.includes('kurs') || title.includes('skill') || title.includes('course')) category = t('consultant.overview.goalCategories.skillsDevelopment')

            categories[category] = (categories[category] || 0) + 1
          })

          const totalGoals = goalsData.length
          const sortedCategories = Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([category, count]) => ({
              category,
              count,
              percentage: Math.round((count / totalGoals) * 100),
            }))

          setGoalCategories(sortedCategories)
        }

        // Build report data for PDF export
        setReportData({
          totalParticipants: participantsData.length,
          activeParticipants: active.length,
          completedParticipants: participantsData.filter(p => p.status === 'COMPLETED').length,
          cvCompletionRate: Math.round((completedCV.length / Math.max(participantsData.length, 1)) * 100),
          goalsCompletionRate: goalsData ? Math.round((completedGoals / Math.max(goalsData.length, 1)) * 100) : 0,
          engagementRate: Math.round((active.length / Math.max(participantsData.length, 1)) * 100),
          averageTimeToPlacement: 45,
          monthlyProgress: [
            { month: 'Jan', value: 45 },
            { month: 'Feb', value: 52 },
            { month: 'Mar', value: 58 },
            { month: 'Apr', value: 63 },
            { month: 'Maj', value: 70 },
            { month: 'Jun', value: stats.averageProgress },
          ],
          statusDistribution: [
            { label: 'Aktiva', value: active.length },
            { label: 'Inaktiva', value: participantsData.filter(p => p.status === 'INACTIVE').length },
            { label: 'Avslutade', value: participantsData.filter(p => p.status === 'COMPLETED').length },
          ],
          topGoalCategories: goalCategories.map(c => ({ category: c.category, count: c.count })),
          cohortData: [],
        })
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
          title={t('consultant.overview.totalParticipants')}
          value={stats.totalParticipants}
          subtitle={t('consultant.overview.activeCount', { count: stats.activeParticipants })}
          icon={Users}
          status="neutral"
          onClick={() => navigate('/consultant/participants')}
        />
        <KPICard
          title={t('consultant.overview.needsAttention')}
          value={stats.needsAttention}
          subtitle={t('consultant.overview.notContactedDays', { count: 7 })}
          icon={AlertTriangle}
          status={stats.needsAttention === 0 ? 'green' : stats.needsAttention <= 3 ? 'yellow' : 'red'}
          onClick={() => navigate('/consultant/participants?filter=attention')}
        />
        <KPICard
          title={t('consultant.overview.cvQuality')}
          value={`${stats.averageProgress}%`}
          subtitle={t('consultant.overview.completeCvs', { count: stats.completedCV })}
          icon={FileText}
          status={stats.averageProgress >= 70 ? 'green' : stats.averageProgress >= 50 ? 'yellow' : 'red'}
          trend={{ value: 5, isPositive: true }}
          onClick={() => navigate('/consultant/analytics')}
        />
        <KPICard
          title={t('consultant.overview.meetingsThisWeek')}
          value={stats.meetingsThisWeek}
          subtitle={stats.pendingMessages > 0 ? t('consultant.overview.unreadMessages', { count: stats.pendingMessages }) : t('consultant.overview.scheduled')}
          icon={Calendar}
          status={stats.meetingsThisWeek > 0 ? 'green' : 'neutral'}
          onClick={() => navigate('/consultant/communication')}
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
                  {t('consultant.overview.attentionAlerts')}
                </h3>
              </div>
              <Link
                to="/consultant/participants?filter=attention"
                className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium"
              >
                {t('consultant.overview.viewAll')}
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
                    t={t}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="font-medium text-stone-900 dark:text-stone-100">
                  {t('consultant.overview.allCaughtUp')}
                </p>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  {t('consultant.overview.noAttentionNeeded')}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-700">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
              {t('consultant.overview.quickActions')}
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <QuickAction
              icon={Plus}
              label={t('consultant.overview.inviteParticipant')}
              onClick={() => setShowInviteDialog(true)}
              variant="primary"
            />
            <QuickAction
              icon={Mail}
              label={t('consultant.overview.sendGroupMessage')}
              onClick={() => navigate('/consultant/communication')}
            />
            <QuickAction
              icon={Calendar}
              label={t('consultant.overview.scheduleMeeting')}
              onClick={() => setShowMeetingDialog(true)}
            />
            <QuickAction
              icon={Download}
              label={t('consultant.overview.exportReport')}
              onClick={() => setShowReportDialog(true)}
            />
            <QuickAction
              icon={Target}
              label={t('consultant.overview.createGoal')}
              onClick={() => setShowGoalDialog(true)}
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
                <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                  {t('consultant.overview.recentActivity')}
                </h3>
              </div>
              <button
                onClick={fetchDashboardData}
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-stone-500 dark:text-stone-400" />
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
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                      {activity.type === 'cv_updated' && <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                      {activity.type === 'job_saved' && <Briefcase className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                      {activity.type === 'login' && <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                      {activity.type === 'goal_completed' && <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                      {activity.type === 'message' && <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                        {activity.participantName}
                      </p>
                      <p className="text-sm text-stone-500 dark:text-stone-400">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-xs text-stone-500 dark:text-stone-400">
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
                {t('consultant.overview.noActivity')}
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
                  {t('consultant.overview.goalsOverview')}
                </h3>
              </div>
              <Link
                to="/consultant/analytics"
                className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium"
              >
                {t('consultant.overview.seeDetails')}
              </Link>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <p className="text-3xl font-bold text-emerald-600">{stats.goalsCompleted}</p>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                  {t('consultant.overview.completedGoals')}
                </p>
              </div>
              <div className="text-center p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                <p className="text-3xl font-bold text-rose-600">{stats.goalsOverdue}</p>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                  {t('consultant.overview.overdueGoals')}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
              <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
                {t('consultant.overview.topGoalCategories')}
              </h4>
              <div className="space-y-2">
                {goalCategories.length > 0 ? (
                  goalCategories.map((cat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-stone-600 dark:text-stone-400">{cat.category}</span>
                      <div className="w-24 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--c-solid)] rounded-full transition-all"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-600 dark:text-stone-400">{t('consultant.overview.goalCategories.cvImprovement')}</span>
                      <div className="w-24 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--c-solid)] rounded-full" style={{ width: '75%' }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-600 dark:text-stone-400">{t('consultant.overview.goalCategories.jobApplications')}</span>
                      <div className="w-24 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--c-solid)] rounded-full" style={{ width: '60%' }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-600 dark:text-stone-400">{t('consultant.overview.goalCategories.interviewTraining')}</span>
                      <div className="w-24 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--c-solid)] rounded-full" style={{ width: '45%' }} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Dialogs */}
      <InviteParticipantDialog
        isOpen={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        onSuccess={() => {
          setShowInviteDialog(false)
          fetchDashboardData()
        }}
      />

      <MeetingSchedulerDialog
        isOpen={showMeetingDialog}
        onClose={() => setShowMeetingDialog(false)}
        onSuccess={() => {
          setShowMeetingDialog(false)
          fetchDashboardData()
        }}
      />

      <GoalCreationDialog
        isOpen={showGoalDialog}
        onClose={() => setShowGoalDialog(false)}
        onSuccess={() => {
          setShowGoalDialog(false)
          fetchDashboardData()
        }}
      />

      {reportData && (
        <ReportGeneratorDialog
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
          analyticsData={reportData}
        />
      )}
    </div>
  )
}
