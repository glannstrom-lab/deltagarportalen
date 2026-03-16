/**
 * Gamification Service
 * Handles milestones, achievements, and activity tracking
 */

import { supabase } from '@/lib/supabase'

// ============================================
// TYPES
// ============================================

export interface Milestone {
  id: string
  key: string
  name: string
  description: string
  icon: string
  color: string
  category: 'cv' | 'jobs' | 'knowledge' | 'interview' | 'linkedin' | 'wellness' | 'community'
  max_progress: number
  reward_points: number
  sort_order: number
}

export interface UserMilestone {
  id: string
  milestone_id: string
  current_progress: number
  is_completed: boolean
  completed_at: string | null
  milestone: Milestone
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  points: number
  requirement_type: string
  requirement_value: number
}

export interface UserAchievement {
  id: string
  achievement_id: string
  earned_at: string
  achievement: Achievement
}

export interface UserGamification {
  user_id: string
  total_points: number
  current_streak: number
  longest_streak: number
  last_login_date: string | null
  weekly_goal: number
  weekly_progress: number
  level: number
}

export interface ActivityLogItem {
  id: string
  activity_type: string
  title: string
  description: string | null
  points_earned: number
  metadata: Record<string, unknown>
  created_at: string
}

export interface GamificationStats {
  totalPoints: number
  currentStreak: number
  longestStreak: number
  level: number
  milestonesCompleted: number
  totalMilestones: number
  achievementsUnlocked: number
  totalAchievements: number
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get all milestones with user progress
 */
export async function getMilestonesWithProgress(): Promise<UserMilestone[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // First, initialize milestones for user if needed
  await supabase.rpc('initialize_user_milestones', { p_user_id: user.id })

  // Get milestones with progress
  const { data, error } = await supabase
    .from('user_milestones')
    .select(`
      id,
      milestone_id,
      current_progress,
      is_completed,
      completed_at,
      milestone:milestones (
        id,
        key,
        name,
        description,
        icon,
        color,
        category,
        max_progress,
        reward_points,
        sort_order
      )
    `)
    .eq('user_id', user.id)
    .order('milestone(sort_order)', { ascending: true })

  if (error) {
    console.error('Error fetching milestones:', error)
    return []
  }

  return (data || []).map(item => ({
    ...item,
    milestone: Array.isArray(item.milestone) ? item.milestone[0] : item.milestone
  })) as UserMilestone[]
}

/**
 * Get all achievements
 */
export async function getAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('category', { ascending: true })

  if (error) {
    console.error('Error fetching achievements:', error)
    return []
  }

  return data || []
}

/**
 * Get user's unlocked achievements
 */
export async function getUserAchievements(): Promise<UserAchievement[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      id,
      achievement_id,
      earned_at,
      achievement:achievements (*)
    `)
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false })

  if (error) {
    console.error('Error fetching user achievements:', error)
    return []
  }

  return (data || []).map(item => ({
    ...item,
    achievement: Array.isArray(item.achievement) ? item.achievement[0] : item.achievement
  })) as UserAchievement[]
}

/**
 * Get user's gamification stats
 */
export async function getGamificationStats(): Promise<UserGamification | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_gamification')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching gamification stats:', error)
    return null
  }

  // If no stats exist, create default
  if (!data) {
    const { data: newData } = await supabase
      .from('user_gamification')
      .insert({ user_id: user.id })
      .select()
      .single()
    return newData
  }

  return data
}

/**
 * Get recent activity log
 */
export async function getActivityLog(limit = 20): Promise<ActivityLogItem[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('user_activity_log')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching activity log:', error)
    return []
  }

  return data || []
}

/**
 * Log an activity and earn points
 */
export async function logActivity(
  activityType: string,
  title: string,
  description?: string,
  points: number = 0,
  metadata: Record<string, unknown> = {}
): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase.rpc('log_user_activity', {
    p_user_id: user.id,
    p_activity_type: activityType,
    p_title: title,
    p_description: description || null,
    p_points: points,
    p_metadata: metadata
  })

  if (error) {
    console.error('Error logging activity:', error)
    return null
  }

  return data
}

/**
 * Update milestone progress
 */
export async function updateMilestoneProgress(
  milestoneKey: string,
  newProgress: number
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase.rpc('update_milestone_progress', {
    p_user_id: user.id,
    p_milestone_key: milestoneKey,
    p_new_progress: newProgress
  })

  if (error) {
    console.error('Error updating milestone:', error)
    return false
  }

  return true
}

/**
 * Unlock an achievement
 */
export async function unlockAchievement(achievementId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('user_achievements')
    .insert({
      user_id: user.id,
      achievement_id: achievementId
    })

  if (error) {
    // Might already be unlocked
    if (error.code === '23505') return true
    console.error('Error unlocking achievement:', error)
    return false
  }

  return true
}

/**
 * Calculate user level based on points
 */
export function calculateLevel(points: number): { level: number; title: string; nextLevelPoints: number } {
  const levels = [
    { level: 1, points: 0, title: 'Nybörjare' },
    { level: 2, points: 100, title: 'Utforskare' },
    { level: 3, points: 250, title: 'Jobbsökare' },
    { level: 4, points: 500, title: 'Kandidat' },
    { level: 5, points: 800, title: 'Professionell' },
    { level: 6, points: 1200, title: 'Expert' },
    { level: 7, points: 1800, title: 'Mästare' },
    { level: 8, points: 2500, title: 'Legend' },
    { level: 9, points: 3500, title: 'Champion' },
    { level: 10, points: 5000, title: 'Jobbkung' },
  ]

  let currentLevel = levels[0]
  let nextLevel = levels[1]

  for (let i = levels.length - 1; i >= 0; i--) {
    if (points >= levels[i].points) {
      currentLevel = levels[i]
      nextLevel = levels[i + 1] || levels[i]
      break
    }
  }

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    nextLevelPoints: nextLevel.points
  }
}

/**
 * Get combined gamification data for dashboard
 */
export async function getGamificationDashboard() {
  const [milestones, achievements, userAchievements, stats, activityLog] = await Promise.all([
    getMilestonesWithProgress(),
    getAchievements(),
    getUserAchievements(),
    getGamificationStats(),
    getActivityLog(10)
  ])

  const totalPoints = stats?.total_points || 0
  const levelInfo = calculateLevel(totalPoints)

  return {
    milestones,
    achievements,
    userAchievements,
    stats: {
      totalPoints,
      currentStreak: stats?.current_streak || 0,
      longestStreak: stats?.longest_streak || 0,
      level: levelInfo.level,
      levelTitle: levelInfo.title,
      nextLevelPoints: levelInfo.nextLevelPoints,
      milestonesCompleted: milestones.filter(m => m.is_completed).length,
      totalMilestones: milestones.length,
      achievementsUnlocked: userAchievements.length,
      totalAchievements: achievements.length,
    },
    activityLog
  }
}

export default {
  getMilestonesWithProgress,
  getAchievements,
  getUserAchievements,
  getGamificationStats,
  getActivityLog,
  logActivity,
  updateMilestoneProgress,
  unlockAchievement,
  calculateLevel,
  getGamificationDashboard
}
