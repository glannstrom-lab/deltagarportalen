/**
 * Activity Tab - Gamification Dashboard
 * Shows milestones, achievements, and activity timeline
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Trophy, Flame, Star, Award, Target, Zap,
  Crown, TrendingUp, ChevronRight, Lock, CheckCircle2,
  FileText, Briefcase, BookOpen, MessageSquare, Linkedin,
  Heart, Compass, Users, Send, Bookmark, PenLine,
  Footprints, FolderKanban, Copy, Mic, Library, GraduationCap,
  Magnet, LogIn, User, Activity
} from '@/components/ui/icons'
import { useGamification, formatActivityTime, getMilestonePercentage } from '@/hooks/useGamification'
import { cn } from '@/lib/utils'
import { useDashboardData } from '@/hooks/useDashboardData'

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  FileText, Briefcase, BookOpen, MessageSquare, Linkedin,
  Heart, Compass, Users, Send, Bookmark, PenLine,
  Footprints, FolderKanban, Copy, Mic, Library, GraduationCap,
  Magnet, LogIn, User, Activity, Trophy, Award, Target, Zap,
  Crown, TrendingUp, Star, Flame, CheckCircle2, Lock
}

const getIcon = (iconName: string): React.ElementType => {
  return iconMap[iconName] || Target
}

// Color mapping for Tailwind
const colorClasses: Record<string, { bg: string; text: string; border: string; progress: string }> = {
  violet: {
    bg: 'bg-teal-100 dark:bg-teal-900/40',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-700',
    progress: 'bg-teal-500'
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-700',
    progress: 'bg-blue-500'
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-700',
    progress: 'bg-amber-500'
  },
  indigo: {
    bg: 'bg-sky-100 dark:bg-sky-900/40',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-700',
    progress: 'bg-sky-500'
  },
  sky: {
    bg: 'bg-sky-100 dark:bg-sky-900/40',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-700',
    progress: 'bg-sky-500'
  },
  rose: {
    bg: 'bg-rose-100 dark:bg-rose-900/40',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-700',
    progress: 'bg-rose-500'
  },
  teal: {
    bg: 'bg-teal-100 dark:bg-teal-900/40',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-700',
    progress: 'bg-teal-500'
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/40',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-700',
    progress: 'bg-orange-500'
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-700',
    progress: 'bg-emerald-500'
  },
}

// Route mapping for milestones
const milestoneRoutes: Record<string, string> = {
  cv: '/cv',
  jobs: '/job-search',
  knowledge: '/knowledge-base',
  interview: '/interview-simulator',
  linkedin: '/linkedin-optimizer',
  wellness: '/diary',
  general: '/'
}

export default function ActivityTab() {
  const { t } = useTranslation()
  const { data: gamification, isLoading: gamificationLoading } = useGamification()
  const { data: dashboardData, loading: dashboardLoading } = useDashboardData()

  const loading = gamificationLoading || dashboardLoading

  if (loading) {
    return <ActivityTabSkeleton />
  }

  // Calculate real progress from dashboard data
  const realProgress = calculateRealProgress(dashboardData as DashboardData | null)

  // Merge real progress with gamification milestones
  const milestonesWithRealData = gamification?.milestones?.map(milestone => ({
    ...milestone,
    current_progress: realProgress[milestone.milestone?.key || ''] ?? milestone.current_progress,
    is_completed: (realProgress[milestone.milestone?.key || ''] ?? milestone.current_progress) >= (milestone.milestone?.max_progress || 100)
  })) || []

  const stats = gamification?.stats || {
    totalPoints: 0,
    currentStreak: 0,
    level: 1,
    levelTitle: t('dashboard.activity.levels.beginner'),
    nextLevelPoints: 100,
    milestonesCompleted: 0,
    totalMilestones: 0,
    achievementsUnlocked: 0,
    totalAchievements: 0
  }

  const completedMilestones = milestonesWithRealData.filter(m => m.is_completed)
  const inProgressMilestones = milestonesWithRealData.filter(m => !m.is_completed && m.current_progress > 0)
  const notStartedMilestones = milestonesWithRealData.filter(m => !m.is_completed && m.current_progress === 0)

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<Star size={24} />}
          value={stats.totalPoints}
          label={t('dashboard.activity.stats.points')}
          color="amber"
          suffix=" XP"
        />
        <StatsCard
          icon={<Flame size={24} />}
          value={stats.currentStreak}
          label={t('dashboard.activity.stats.streak')}
          color="orange"
          suffix={` ${t('dashboard.activity.stats.days')}`}
        />
        <StatsCard
          icon={<Trophy size={24} />}
          value={completedMilestones.length}
          label={t('dashboard.activity.stats.milestones')}
          color="violet"
          suffix={` / ${milestonesWithRealData.length}`}
        />
        <StatsCard
          icon={<Award size={24} />}
          value={gamification?.userAchievements?.length || 0}
          label={t('dashboard.activity.stats.badges')}
          color="emerald"
          suffix={` / ${gamification?.achievements?.length || 0}`}
        />
      </div>

      {/* Level Progress */}
      <LevelProgress
        level={stats.level}
        title={stats.levelTitle}
        currentPoints={stats.totalPoints}
        nextLevelPoints={stats.nextLevelPoints}
        t={t}
      />

      {/* Active Milestones (In Progress) */}
      {inProgressMilestones.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-teal-500" />
            {t('dashboard.activity.sections.activeMilestones')}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {inProgressMilestones.slice(0, 4).map(milestone => (
              <MilestoneCard key={milestone.id} milestone={milestone} progressLabel={t('dashboard.activity.progress')} />
            ))}
          </div>
        </section>
      )}

      {/* Available Milestones (Not Started) */}
      {notStartedMilestones.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
            <Target size={20} className="text-stone-600" />
            {t('dashboard.activity.sections.availableMilestones')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {notStartedMilestones.slice(0, 6).map(milestone => (
              <MilestoneCardCompact key={milestone.id} milestone={milestone} />
            ))}
          </div>
        </section>
      )}

      {/* Completed Milestones */}
      {completedMilestones.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-500" />
            {t('dashboard.activity.sections.completedMilestones', { count: completedMilestones.length })}
          </h2>
          <div className="flex flex-wrap gap-2">
            {completedMilestones.map(milestone => (
              <CompletedBadge key={milestone.id} milestone={milestone} />
            ))}
          </div>
        </section>
      )}

      {/* Unlocked Badges */}
      {(gamification?.userAchievements?.length || 0) > 0 && (
        <section>
          <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
            <Award size={20} className="text-amber-500" />
            {t('dashboard.activity.sections.unlockedBadges')}
          </h2>
          <div className="flex flex-wrap gap-3">
            {gamification?.userAchievements?.map(ua => (
              <BadgeCard key={ua.id} achievement={ua.achievement} earnedAt={ua.earned_at} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Activity */}
      {(gamification?.activityLog?.length || 0) > 0 && (
        <section>
          <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
            <Activity size={20} className="text-blue-500" />
            {t('dashboard.activity.sections.recentActivity')}
          </h2>
          <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 divide-y divide-stone-100 dark:divide-stone-700">
            {gamification?.activityLog?.slice(0, 5).map(activity => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

function StatsCard({ icon, value, label, color, suffix = '' }: {
  icon: React.ReactNode
  value: number
  label: string
  color: string
  suffix?: string
}) {
  const colors = colorClasses[color] || colorClasses.violet

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4 text-center">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2", colors.bg)}>
        <span className={colors.text}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">
        {value}{suffix}
      </p>
      <p className="text-sm text-stone-500 dark:text-stone-400">{label}</p>
    </div>
  )
}

function LevelProgress({ level, title, currentPoints, nextLevelPoints, t }: {
  level: number
  title: string
  currentPoints: number
  nextLevelPoints: number
  t: (key: string, options?: any) => string
}) {
  const progress = nextLevelPoints > currentPoints
    ? Math.round((currentPoints / nextLevelPoints) * 100)
    : 100

  return (
    <div className="bg-gradient-to-r from-teal-500 to-sky-600 rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
            <Crown size={28} />
          </div>
          <div>
            <p className="text-white/80 text-sm">{t('dashboard.activity.level', { level })}</p>
            <p className="text-xl font-bold">{title}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{currentPoints} XP</p>
          <p className="text-white/80 text-sm">{t('dashboard.activity.nextLevel', { points: nextLevelPoints })}</p>
        </div>
      </div>
      <div className="h-3 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-white rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

interface Milestone {
  id: string
  current_progress: number
  is_completed: boolean
  milestone?: {
    key?: string
    name: string
    description: string
    icon: string
    color: string
    category: string
    max_progress: number
    reward_points: number
  }
}

function MilestoneCard({ milestone, progressLabel }: { milestone: Milestone; progressLabel: string }) {
  const m = milestone.milestone
  if (!m) return null

  const Icon = getIcon(m.icon)
  const colors = colorClasses[m.color] || colorClasses.violet
  const percentage = getMilestonePercentage(milestone)
  const route = milestoneRoutes[m.category] || '/'

  return (
    <Link
      to={route}
      className={cn(
        "group block bg-white dark:bg-stone-800 rounded-xl border-2 p-5 transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-0.5",
        colors.border
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colors.bg)}>
            <Icon size={24} className={colors.text} />
          </div>
          <div>
            <h3 className="font-semibold text-stone-800 dark:text-stone-100">{m.name}</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">{m.description}</p>
          </div>
        </div>
        <ChevronRight size={20} className="text-stone-300 dark:text-stone-400 group-hover:text-teal-500 transition-colors" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500 dark:text-stone-400">{progressLabel}</span>
          <span className={cn("font-bold", colors.text)}>
            {milestone.current_progress} / {m.max_progress}
          </span>
        </div>
        <div className="h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", colors.progress)}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-600">{percentage}%</span>
          <span className={cn("flex items-center gap-1", colors.text)}>
            <Zap size={12} />
            +{m.reward_points} XP
          </span>
        </div>
      </div>
    </Link>
  )
}

function MilestoneCardCompact({ milestone }: { milestone: Milestone }) {
  const m = milestone.milestone
  if (!m) return null

  const Icon = getIcon(m.icon)
  const colors = colorClasses[m.color] || colorClasses.violet
  const route = milestoneRoutes[m.category] || '/'

  return (
    <Link
      to={route}
      className="group flex items-center gap-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-md transition-all"
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", colors.bg)}>
        <Icon size={20} className={colors.text} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-stone-800 dark:text-stone-100 text-sm truncate">{m.name}</p>
        <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
          <Zap size={10} />
          +{m.reward_points} XP
        </p>
      </div>
      <ChevronRight size={16} className="text-stone-300 group-hover:text-teal-500 transition-colors" />
    </Link>
  )
}

function CompletedBadge({ milestone }: { milestone: Milestone }) {
  const m = milestone.milestone
  if (!m) return null

  const Icon = getIcon(m.icon)
  const colors = colorClasses[m.color] || colorClasses.violet

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-full border",
        colors.bg, colors.border
      )}
      title={m.description}
    >
      <Icon size={16} className={colors.text} />
      <span className={cn("text-sm font-medium", colors.text)}>{m.name}</span>
      <CheckCircle2 size={14} className="text-emerald-500" />
    </div>
  )
}

interface Achievement {
  icon: string
  name: string
}

function BadgeCard({ achievement, earnedAt }: { achievement: Achievement; earnedAt: string }) {
  const Icon = getIcon(achievement.icon)

  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3">
      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center">
        <Icon size={20} className="text-amber-600 dark:text-amber-400" />
      </div>
      <div>
        <p className="font-medium text-stone-800 dark:text-stone-100 text-sm">{achievement.name}</p>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {formatActivityTime(earnedAt)}
        </p>
      </div>
    </div>
  )
}

interface ActivityLog {
  id: string
  activity_type: string
  title: string
  description?: string
  points_earned: number
  created_at: string
}

function ActivityItem({ activity }: { activity: ActivityLog }) {
  const Icon = getIcon(getActivityIcon(activity.activity_type))

  return (
    <div className="flex items-center gap-4 p-4">
      <div className="w-10 h-10 bg-stone-100 dark:bg-stone-700 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-stone-500 dark:text-stone-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-stone-800 dark:text-stone-100 text-sm">{activity.title}</p>
        {activity.description && (
          <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{activity.description}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        {activity.points_earned > 0 && (
          <p className="text-sm font-medium text-teal-600 dark:text-teal-400">+{activity.points_earned} XP</p>
        )}
        <p className="text-xs text-stone-600">{formatActivityTime(activity.created_at)}</p>
      </div>
    </div>
  )
}

function getActivityIcon(activityType: string): string {
  const iconMap: Record<string, string> = {
    cv_updated: 'FileText',
    job_saved: 'Briefcase',
    job_applied: 'Send',
    article_read: 'BookOpen',
    article_saved: 'Bookmark',
    interview_completed: 'MessageSquare',
    mood_logged: 'Heart',
    milestone_completed: 'Trophy',
    achievement_unlocked: 'Award',
    login: 'LogIn',
    profile_updated: 'User',
    linkedin_analyzed: 'Linkedin',
  }
  return iconMap[activityType] || 'Activity'
}

function ActivityTabSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-stone-200 dark:bg-stone-700 rounded-xl h-32" />
        ))}
      </div>
      <div className="bg-stone-200 dark:bg-stone-700 rounded-2xl h-32" />
      <div className="space-y-4">
        <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => (
            <div key={i} className="bg-stone-200 dark:bg-stone-700 rounded-xl h-40" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// REAL DATA CALCULATION
// ============================================

interface DashboardData {
  cv?: {
    hasCV?: boolean
    progress?: number
    savedCVs?: unknown[]
    atsScore?: number
  }
  jobs?: {
    savedCount?: number
  }
  applications?: {
    total?: number
  }
  knowledge?: {
    readCount?: number
    savedCount?: number
  }
  exercises?: {
    completedExercises?: number
  }
  wellness?: {
    streakDays?: number
    completedActivities?: number
  }
  activity?: {
    streakDays?: number
  }
}

function calculateRealProgress(data: DashboardData | null): Record<string, number> {
  if (!data) return {}

  return {
    // CV Milestones
    cv_master: data.cv?.progress || 0,
    cv_versions: data.cv?.savedCVs?.length || 0,
    cv_ats_pro: data.cv?.atsScore || 0,

    // Job Search Milestones
    job_hunter: data.jobs?.savedCount || 0,
    application_pro: data.applications?.total || 0,
    job_organizer: data.jobs?.savedCount || 0,

    // Knowledge Milestones
    knowledge_seeker: data.knowledge?.readCount || 0,
    bookworm: data.knowledge?.readCount || 0,
    saver: data.knowledge?.savedCount || 0,

    // Interview Milestones
    interview_starter: data.exercises?.completedExercises || 0,
    interview_pro: data.exercises?.completedExercises || 0,
    interview_master: 0, // Would need actual interview scores

    // LinkedIn Milestones
    linkedin_starter: 0, // Would need LinkedIn analysis data
    linkedin_optimized: 0,

    // Wellness Milestones
    mood_tracker: data.wellness?.streakDays || 0,
    wellness_streak: data.wellness?.streakDays || 0,
    reflection_pro: data.wellness?.completedActivities || 0,

    // General Milestones
    first_steps: data.cv?.hasCV ? 1 : 0,
    explorer: 0, // Would need page visit tracking
    streak_7: data.activity?.streakDays || 0,
    streak_30: data.activity?.streakDays || 0,
  }
}
