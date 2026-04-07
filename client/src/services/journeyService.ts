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

    // Fetch articles read (from article_reading_progress)
    const { count: articlesRead } = await supabase
      .from('article_reading_progress')
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
      case 'profile_complete': {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone, location')
          .eq('id', user.id)
          .maybeSingle()

        if (profile) {
          const fields = ['full_name', 'phone', 'location']
          const filled = fields.filter(f => !!(profile as Record<string, unknown>)[f])
          currentValue = filled.length >= 2 ? 1 : 0
        }
        break
      }

      case 'onboarding_complete': {
        const { data } = await supabase
          .from('user_preferences')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .maybeSingle()
        currentValue = data?.onboarding_completed ? 1 : 0
        break
      }

      case 'page_visited': {
        const { count } = await supabase
          .from('user_activity_log')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('activity_type', 'page_visit')
        currentValue = count || 0
        break
      }

      case 'cv_started': {
        const { data: cv } = await supabase
          .from('cvs')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()
        currentValue = cv ? 1 : 0
        break
      }

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

      case 'cv_complete': {
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
          currentValue = filled.length === sections.length ? 1 : 0
        }
        break
      }

      case 'cv_ats_score': {
        const { data: cv } = await supabase
          .from('cvs')
          .select('ats_score')
          .eq('user_id', user.id)
          .maybeSingle()
        currentValue = cv?.ats_score || 0
        break
      }

      case 'interest_guide_complete': {
        const { data } = await supabase
          .from('interest_results')
          .select('riasec_profile')
          .eq('user_id', user.id)
          .maybeSingle()
        currentValue = data?.riasec_profile ? 1 : 0
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

      case 'cover_letter_created': {
        const { count } = await supabase
          .from('cover_letters')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
        currentValue = count || 0
        break
      }

      case 'articles_read': {
        const { count } = await supabase
          .from('article_reading_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('progress', 80)
        currentValue = count || 0
        break
      }

      case 'interview_practice': {
        const { count } = await supabase
          .from('exercise_answers')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
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

      case 'linkedin_analyzed': {
        const { data } = await supabase
          .from('personal_brand_audit')
          .select('linkedin_score')
          .eq('user_id', user.id)
          .maybeSingle()
        currentValue = data?.linkedin_score && data.linkedin_score > 0 ? 1 : 0
        break
      }

      case 'level_reached': {
        const { data: gamification } = await supabase
          .from('user_gamification')
          .select('total_points')
          .eq('user_id', user.id)
          .single()
        const xp = gamification?.total_points || 0
        const levelInfo = getLevelFromXP(xp)
        currentValue = levelInfo.level
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

/**
 * Check and auto-complete milestones that meet requirements
 */
export async function checkAndCompleteMilestones(): Promise<{
  completed: string[]
  xpEarned: number
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { completed: [], xpEarned: 0 }

    // Get currently completed milestones
    const { data: existingMilestones } = await supabase
      .from('user_milestones')
      .select('milestone_id')
      .eq('user_id', user.id)
      .eq('is_completed', true)

    const completedIds = new Set((existingMilestones || []).map(m => m.milestone_id))
    const newlyCompleted: string[] = []
    let totalXpEarned = 0

    // Check all milestones
    for (const phase of JOURNEY_PHASES) {
      for (const milestone of phase.milestones) {
        // Skip already completed
        if (completedIds.has(milestone.id) || completedIds.has(milestone.key)) {
          continue
        }

        // Check progress
        const progress = await getMilestoneProgress(
          milestone.requirementType,
          milestone.requirementValue
        )

        // If 100% complete, mark as done
        if (progress >= 100) {
          // Insert or update milestone
          await supabase
            .from('user_milestones')
            .upsert({
              user_id: user.id,
              milestone_id: milestone.id,
              is_completed: true,
              completed_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,milestone_id'
            })

          // Award XP
          await supabase.rpc('increment_user_points', {
            p_user_id: user.id,
            p_points: milestone.xpReward
          })

          // Log activity
          await supabase.from('user_activity_log').insert({
            user_id: user.id,
            activity_type: 'milestone_completed',
            title: `Milstolpe uppnådd: ${milestone.name}`,
            description: milestone.description,
            points_earned: milestone.xpReward,
            metadata: {
              milestone_id: milestone.id,
              milestone_key: milestone.key,
              phase_id: phase.id
            }
          })

          newlyCompleted.push(milestone.id)
          totalXpEarned += milestone.xpReward
        }
      }
    }

    return { completed: newlyCompleted, xpEarned: totalXpEarned }
  } catch (error) {
    console.error('Error checking milestones:', error)
    return { completed: [], xpEarned: 0 }
  }
}

/**
 * Get user goals
 */
export interface UserGoal {
  id: string
  user_id: string
  type: 'weekly' | 'monthly' | 'custom'
  title: string
  description?: string
  target_value: number
  current_value: number
  metric: string
  deadline?: string
  is_completed: boolean
  created_at: string
  updated_at: string
}

export async function getUserGoals(): Promise<UserGoal[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return data || []
  } catch (error) {
    console.error('Error fetching user goals:', error)
    return []
  }
}

/**
 * Create a new user goal
 */
export async function createUserGoal(goal: {
  type: 'weekly' | 'monthly' | 'custom'
  title: string
  description?: string
  target_value: number
  metric: string
  deadline?: string
}): Promise<UserGoal | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('user_goals')
      .insert({
        user_id: user.id,
        ...goal,
        current_value: 0,
        is_completed: false
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating user goal:', error)
    return null
  }
}

/**
 * Update goal progress
 */
export async function updateGoalProgress(
  goalId: string,
  currentValue: number
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: goal } = await supabase
      .from('user_goals')
      .select('target_value')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single()

    if (!goal) return

    const isCompleted = currentValue >= goal.target_value

    await supabase
      .from('user_goals')
      .update({
        current_value: currentValue,
        is_completed: isCompleted,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .eq('user_id', user.id)
  } catch (error) {
    console.error('Error updating goal progress:', error)
  }
}

/**
 * Delete a user goal
 */
export async function deleteUserGoal(goalId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('user_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', user.id)
  } catch (error) {
    console.error('Error deleting user goal:', error)
  }
}

/**
 * Get user achievements/badges
 */
export interface Achievement {
  id: string
  key: string
  name: string
  description: string
  icon: string
  category: string
  xp_reward: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  unlocked_at?: string
  is_unlocked: boolean
}

export async function getAchievements(): Promise<Achievement[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get all achievements
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*')
      .order('category', { ascending: true })

    // Get user's unlocked achievements
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', user.id)

    const unlockedMap = new Map(
      (userAchievements || []).map(ua => [ua.achievement_id, ua.unlocked_at])
    )

    return (allAchievements || []).map(a => ({
      ...a,
      unlocked_at: unlockedMap.get(a.id),
      is_unlocked: unlockedMap.has(a.id)
    }))
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return []
  }
}

/**
 * Check and unlock achievements based on requirements
 */
export async function checkAndUnlockAchievements(): Promise<{
  unlocked: Achievement[]
  xpEarned: number
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { unlocked: [], xpEarned: 0 }

    // Get all achievements
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*')

    // Get already unlocked achievements
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', user.id)

    const unlockedIds = new Set((userAchievements || []).map(ua => ua.achievement_id))
    const newlyUnlocked: Achievement[] = []
    let totalXpEarned = 0

    // Check each achievement
    for (const achievement of allAchievements || []) {
      // Skip already unlocked
      if (unlockedIds.has(achievement.id)) continue

      // Skip if no requirement (manual unlock only)
      if (!achievement.requirement_type) continue

      // Check if requirement is met
      const progress = await getAchievementProgress(
        achievement.requirement_type,
        achievement.requirement_value || 1
      )

      if (progress >= 100) {
        // Unlock achievement
        const { error } = await supabase
          .from('user_achievements')
          .insert({
            user_id: user.id,
            achievement_id: achievement.id,
            unlocked_at: new Date().toISOString()
          })

        if (!error) {
          // Award XP
          if (achievement.xp_reward > 0) {
            await supabase.rpc('increment_user_points', {
              p_user_id: user.id,
              p_points: achievement.xp_reward
            })
          }

          // Log activity
          await supabase.from('user_activity_log').insert({
            user_id: user.id,
            activity_type: 'badge_unlocked',
            title: `Badge upplåst: ${achievement.name}`,
            description: achievement.description,
            points_earned: achievement.xp_reward,
            metadata: {
              achievement_id: achievement.id,
              achievement_key: achievement.key,
              rarity: achievement.rarity
            }
          })

          newlyUnlocked.push({
            ...achievement,
            is_unlocked: true,
            unlocked_at: new Date().toISOString()
          })
          totalXpEarned += achievement.xp_reward || 0
        }
      }
    }

    return { unlocked: newlyUnlocked, xpEarned: totalXpEarned }
  } catch (error) {
    console.error('Error checking achievements:', error)
    return { unlocked: [], xpEarned: 0 }
  }
}

/**
 * Get progress for achievement requirement (similar to milestone but with different handling)
 */
async function getAchievementProgress(
  requirementType: string,
  requirementValue: number
): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    let currentValue = 0

    switch (requirementType) {
      case 'login': {
        // Always met if user is logged in
        currentValue = 1
        break
      }

      case 'profile_complete': {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone, location')
          .eq('id', user.id)
          .maybeSingle()

        if (profile) {
          const fields = ['full_name', 'phone', 'location']
          const filled = fields.filter(f => !!(profile as Record<string, unknown>)[f])
          currentValue = filled.length >= 2 ? 1 : 0
        }
        break
      }

      case 'cv_started': {
        const { data: cv } = await supabase
          .from('cvs')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()
        currentValue = cv ? 1 : 0
        break
      }

      case 'cv_complete': {
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
          currentValue = filled.length === sections.length ? 1 : 0
        }
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
          .from('article_reading_progress')
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
          .maybeSingle()
        currentValue = data?.current_streak || 0
        break
      }

      case 'interest_guide_complete': {
        const { data } = await supabase
          .from('interest_results')
          .select('riasec_profile')
          .eq('user_id', user.id)
          .maybeSingle()
        currentValue = data?.riasec_profile ? 1 : 0
        break
      }

      case 'linkedin_analyzed': {
        const { data } = await supabase
          .from('personal_brand_audit')
          .select('linkedin_score')
          .eq('user_id', user.id)
          .maybeSingle()
        currentValue = data?.linkedin_score && data.linkedin_score > 0 ? 1 : 0
        break
      }

      case 'level_reached': {
        const { data: gamification } = await supabase
          .from('user_gamification')
          .select('total_points')
          .eq('user_id', user.id)
          .maybeSingle()
        const xp = gamification?.total_points || 0
        const levelInfo = getLevelFromXP(xp)
        currentValue = levelInfo.level
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

export const journeyService = {
  getJourneyProgress,
  getJourneyStats,
  getJourneyActivities,
  getNextSteps,
  getWeeklySummary,
  logJourneyActivity,
  checkAndCompleteMilestones,
  checkAndUnlockAchievements,
  getUserGoals,
  createUserGoal,
  updateGoalProgress,
  deleteUserGoal,
  getAchievements
}

export default journeyService
