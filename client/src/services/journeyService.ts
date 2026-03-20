/**
 * Journey Service - API for "Min Jobbresa"
 * Integrates with existing gamification, CV, and activity data
 */

import { supabase } from '@/lib/supabase'
import { JOURNEY_PHASES, getLevelFromXP, getPhaseFromXP } from '@/data/journeyData'
import type {
  UserJourneyProgress,
  JourneyActivity,
  JourneyStats,
  NextStep,
  WeeklySummary,
  PhaseProgress
} from '@/types/journey.types'

/**
 * Get complete journey progress for the current user
 */
export async function getJourneyProgress(): Promise<UserJourneyProgress | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Fetch gamification stats
    const { data: gamification } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const totalXP = gamification?.total_points || 0
    const levelInfo = getLevelFromXP(totalXP)
    const currentPhase = getPhaseFromXP(totalXP)

    // Fetch completed milestones
    const { data: userMilestones } = await supabase
      .from('user_milestones')
      .select('milestone_id, is_completed')
      .eq('user_id', user.id)
      .eq('is_completed', true)

    const completedMilestoneIds = (userMilestones || []).map(m => m.milestone_id)

    // Fetch user achievements for additional milestone tracking
    const { data: achievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', user.id)

    // Calculate phase progress
    const phaseProgress: Record<number, PhaseProgress> = {}

    for (const phase of JOURNEY_PHASES) {
      const totalMilestones = phase.milestones.length
      const completed = phase.milestones.filter(m =>
        completedMilestoneIds.includes(m.id) ||
        completedMilestoneIds.includes(m.key)
      ).length

      phaseProgress[phase.id] = {
        phaseId: phase.id,
        progress: totalMilestones > 0 ? Math.round((completed / totalMilestones) * 100) : 0,
        isCompleted: completed === totalMilestones && totalMilestones > 0,
        startedAt: new Date().toISOString(),
        milestonesCompleted: completed,
        totalMilestones
      }
    }

    // Count completed phases
    const phasesCompleted = Object.values(phaseProgress).filter(p => p.isCompleted).length

    return {
      currentPhase: currentPhase.id,
      totalXP,
      level: levelInfo.level,
      levelTitle: levelInfo.title,
      nextLevelXP: levelInfo.nextLevelXP,
      currentStreak: gamification?.current_streak || 0,
      longestStreak: gamification?.longest_streak || 0,
      phasesCompleted,
      totalPhases: JOURNEY_PHASES.length,
      milestonesCompleted: completedMilestoneIds,
      phaseProgress
    }
  } catch (error) {
    console.error('Error fetching journey progress:', error)
    return null
  }
}

/**
 * Get journey statistics
 */
export async function getJourneyStats(): Promise<JourneyStats | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Fetch gamification data
    const { data: gamification } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Fetch CV progress
    const { data: cv } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    // Fetch applications count
    const { count: applicationsCount } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Fetch articles read (from article_progress)
    const { count: articlesRead } = await supabase
      .from('article_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('progress', 80)

    // Fetch milestones
    const { data: milestones } = await supabase
      .from('user_milestones')
      .select('is_completed')
      .eq('user_id', user.id)

    // Fetch achievements/badges
    const { data: badges } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id)

    const { count: totalBadges } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true })

    // Calculate CV progress
    let cvProgress = 0
    if (cv) {
      const sections = ['personal_info', 'work_experience', 'education', 'skills', 'summary']
      const filledSections = sections.filter(s => {
        const value = cv[s]
        if (Array.isArray(value)) return value.length > 0
        if (typeof value === 'object') return Object.keys(value || {}).length > 0
        return !!value
      })
      cvProgress = Math.round((filledSections.length / sections.length) * 100)
    }

    const totalXP = gamification?.total_points || 0
    const levelInfo = getLevelFromXP(totalXP)

    // Calculate days active
    const { data: activityDays } = await supabase
      .from('user_activity_log')
      .select('created_at')
      .eq('user_id', user.id)

    const uniqueDays = new Set(
      (activityDays || []).map(a =>
        new Date(a.created_at).toDateString()
      )
    )

    return {
      totalXP,
      level: levelInfo.level,
      levelTitle: levelInfo.title,
      currentStreak: gamification?.current_streak || 0,
      longestStreak: gamification?.longest_streak || 0,
      daysActive: uniqueDays.size,
      totalMilestones: milestones?.length || 0,
      milestonesCompleted: milestones?.filter(m => m.is_completed).length || 0,
      totalBadges: totalBadges || 0,
      badgesUnlocked: badges?.length || 0,
      applicationsCount: applicationsCount || 0,
      articlesRead: articlesRead || 0,
      cvProgress
    }
  } catch (error) {
    console.error('Error fetching journey stats:', error)
    return null
  }
}

/**
 * Get recent journey activities
 */
export async function getJourneyActivities(limit = 20): Promise<JourneyActivity[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
      .from('user_activity_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    return (data || []).map(activity => ({
      id: activity.id,
      type: activity.activity_type,
      title: activity.title,
      description: activity.description,
      xpEarned: activity.points_earned || 0,
      timestamp: activity.created_at,
      icon: getActivityIcon(activity.activity_type),
      badgeUnlocked: activity.metadata?.badge_unlocked,
      milestoneCompleted: activity.metadata?.milestone_completed
    }))
  } catch (error) {
    console.error('Error fetching journey activities:', error)
    return []
  }
}

/**
 * Get personalized next steps based on user progress
 */
export async function getNextSteps(maxSteps = 3): Promise<NextStep[]> {
  try {
    const progress = await getJourneyProgress()
    if (!progress) return []

    const currentPhase = JOURNEY_PHASES.find(p => p.id === progress.currentPhase) || JOURNEY_PHASES[0]
    const nextSteps: NextStep[] = []

    // Get incomplete milestones from current and next phase
    const phasesToCheck = [currentPhase]
    const nextPhase = JOURNEY_PHASES.find(p => p.id === currentPhase.id + 1)
    if (nextPhase) phasesToCheck.push(nextPhase)

    for (const phase of phasesToCheck) {
      for (const milestone of phase.milestones) {
        if (progress.milestonesCompleted.includes(milestone.id)) continue
        if (progress.milestonesCompleted.includes(milestone.key)) continue

        // Calculate milestone progress
        const milestoneProgress = await getMilestoneProgress(milestone.requirementType, milestone.requirementValue)

        nextSteps.push({
          milestone,
          progress: milestoneProgress,
          isReady: milestoneProgress >= 80,
          priority: phase.id === currentPhase.id ? 'high' : 'medium'
        })

        if (nextSteps.length >= maxSteps) break
      }
      if (nextSteps.length >= maxSteps) break
    }

    // Sort by readiness and priority
    return nextSteps.sort((a, b) => {
      if (a.isReady !== b.isReady) return a.isReady ? -1 : 1
      if (a.priority !== b.priority) return a.priority === 'high' ? -1 : 1
      return b.progress - a.progress
    })
  } catch (error) {
    console.error('Error getting next steps:', error)
    return []
  }
}

/**
 * Get weekly summary
 */
export async function getWeeklySummary(): Promise<WeeklySummary> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return getEmptyWeeklySummary()
    }

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    // Get activities from last week
    const { data: activities } = await supabase
      .from('user_activity_log')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', weekAgo.toISOString())

    // Get applications from last week
    const { count: applicationsSubmitted } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', weekAgo.toISOString())

    // Calculate days active
    const activeDays = new Set(
      (activities || []).map(a =>
        new Date(a.created_at).toDateString()
      )
    )

    // Calculate XP earned
    const xpEarned = (activities || []).reduce((sum, a) => sum + (a.points_earned || 0), 0)

    // Get gamification for streak
    const { data: gamification } = await supabase
      .from('user_gamification')
      .select('current_streak')
      .eq('user_id', user.id)
      .single()

    return {
      daysActive: activeDays.size,
      totalDays: 7,
      minutesSpent: activeDays.size * 15, // Estimate
      xpEarned,
      milestonesCompleted: (activities || []).filter(a =>
        a.activity_type === 'milestone_completed'
      ).length,
      applicationsSubmitted: applicationsSubmitted || 0,
      articlesRead: (activities || []).filter(a =>
        a.activity_type === 'article_read'
      ).length,
      streakMaintained: (gamification?.current_streak || 0) > 0
    }
  } catch (error) {
    console.error('Error getting weekly summary:', error)
    return getEmptyWeeklySummary()
  }
}

/**
 * Log journey activity
 */
export async function logJourneyActivity(
  activityType: string,
  title: string,
  points: number = 0,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('user_activity_log').insert({
      user_id: user.id,
      activity_type: activityType,
      title,
      points_earned: points,
      metadata
    })

    // Update total points
    if (points > 0) {
      await supabase.rpc('increment_user_points', {
        p_user_id: user.id,
        p_points: points
      })
    }
  } catch (error) {
    console.error('Error logging journey activity:', error)
  }
}

// Helper functions

async function getMilestoneProgress(
  requirementType: string,
  requirementValue: number
): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    let currentValue = 0

    switch (requirementType) {
      case 'cv_progress': {
        const { data: cv } = await supabase
          .from('cvs')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (cv) {
          const sections = ['personal_info', 'work_experience', 'education', 'skills', 'summary']
          const filled = sections.filter(s => {
            const val = cv[s]
            return Array.isArray(val) ? val.length > 0 : !!val
          })
          currentValue = Math.round((filled.length / sections.length) * 100)
        }
        break
      }

      case 'jobs_saved': {
        const { count } = await supabase
          .from('saved_jobs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
        currentValue = count || 0
        break
      }

      case 'jobs_applied': {
        const { count } = await supabase
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
        currentValue = count || 0
        break
      }

      case 'articles_read': {
        const { count } = await supabase
          .from('article_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('progress', 80)
        currentValue = count || 0
        break
      }

      case 'diary_entries': {
        const { count } = await supabase
          .from('diary_entries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
        currentValue = count || 0
        break
      }

      case 'streak_days': {
        const { data } = await supabase
          .from('user_gamification')
          .select('current_streak')
          .eq('user_id', user.id)
          .single()
        currentValue = data?.current_streak || 0
        break
      }

      default:
        currentValue = 0
    }

    return Math.min(100, Math.round((currentValue / requirementValue) * 100))
  } catch {
    return 0
  }
}

function getActivityIcon(activityType: string): string {
  const icons: Record<string, string> = {
    cv_updated: 'file-text',
    job_saved: 'bookmark',
    job_applied: 'send',
    article_read: 'book-open',
    diary_entry: 'edit-3',
    milestone_completed: 'award',
    badge_unlocked: 'trophy',
    level_up: 'trending-up',
    streak_updated: 'flame',
    login: 'log-in'
  }
  return icons[activityType] || 'activity'
}

function getEmptyWeeklySummary(): WeeklySummary {
  return {
    daysActive: 0,
    totalDays: 7,
    minutesSpent: 0,
    xpEarned: 0,
    milestonesCompleted: 0,
    applicationsSubmitted: 0,
    articlesRead: 0,
    streakMaintained: false
  }
}

export const journeyService = {
  getJourneyProgress,
  getJourneyStats,
  getJourneyActivities,
  getNextSteps,
  getWeeklySummary,
  logJourneyActivity
}

export default journeyService
