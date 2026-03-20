/**
 * Gamification Service
 * Handles milestones, achievements, and activity tracking
 */

import { supabase } from '@/lib/supabase'

// ============================================
// DEFAULT DATA (Fallback when DB tables don't exist)
// ============================================

const DEFAULT_MILESTONES: Milestone[] = [
  // CV Milestones
  { id: 'ms-1', key: 'cv_master', name: 'CV-mästare', description: 'Skapa ett komplett CV', icon: 'FileText', color: 'violet', category: 'cv', max_progress: 100, reward_points: 50, sort_order: 1 },
  { id: 'ms-2', key: 'cv_versions', name: 'CV-variation', description: 'Spara 3 olika CV-versioner', icon: 'Copy', color: 'violet', category: 'cv', max_progress: 3, reward_points: 30, sort_order: 2 },
  { id: 'ms-3', key: 'cv_ats_pro', name: 'ATS-proffs', description: 'Nå 80% ATS-poäng', icon: 'Target', color: 'violet', category: 'cv', max_progress: 80, reward_points: 40, sort_order: 3 },

  // Job Search Milestones
  { id: 'ms-4', key: 'job_hunter', name: 'Jobbjägare', description: 'Spara 10 jobb', icon: 'Briefcase', color: 'blue', category: 'jobs', max_progress: 10, reward_points: 30, sort_order: 4 },
  { id: 'ms-5', key: 'application_pro', name: 'Ansöknings-pro', description: 'Skicka 5 ansökningar', icon: 'Send', color: 'blue', category: 'jobs', max_progress: 5, reward_points: 50, sort_order: 5 },
  { id: 'ms-6', key: 'job_organizer', name: 'Organiserad sökare', description: 'Kategorisera 15 jobb', icon: 'FolderKanban', color: 'blue', category: 'jobs', max_progress: 15, reward_points: 25, sort_order: 6 },

  // Knowledge Milestones
  { id: 'ms-7', key: 'knowledge_seeker', name: 'Kunskapssökare', description: 'Läs 5 artiklar', icon: 'BookOpen', color: 'amber', category: 'knowledge', max_progress: 5, reward_points: 25, sort_order: 7 },
  { id: 'ms-8', key: 'bookworm', name: 'Bokmal', description: 'Läs 20 artiklar', icon: 'Library', color: 'amber', category: 'knowledge', max_progress: 20, reward_points: 75, sort_order: 8 },
  { id: 'ms-9', key: 'saver', name: 'Samlare', description: 'Spara 10 artiklar', icon: 'Bookmark', color: 'amber', category: 'knowledge', max_progress: 10, reward_points: 30, sort_order: 9 },

  // Interview Milestones
  { id: 'ms-10', key: 'interview_starter', name: 'Intervju-start', description: 'Slutför 1 övning', icon: 'MessageSquare', color: 'indigo', category: 'interview', max_progress: 1, reward_points: 20, sort_order: 10 },
  { id: 'ms-11', key: 'interview_pro', name: 'Intervju-proffs', description: 'Slutför 5 övningar', icon: 'Mic', color: 'indigo', category: 'interview', max_progress: 5, reward_points: 50, sort_order: 11 },
  { id: 'ms-12', key: 'interview_master', name: 'Intervju-mästare', description: 'Få 90% på alla övningar', icon: 'GraduationCap', color: 'indigo', category: 'interview', max_progress: 90, reward_points: 100, sort_order: 12 },

  // LinkedIn Milestones
  { id: 'ms-13', key: 'linkedin_starter', name: 'LinkedIn-start', description: 'Analysera din profil', icon: 'Linkedin', color: 'sky', category: 'linkedin', max_progress: 1, reward_points: 25, sort_order: 13 },
  { id: 'ms-14', key: 'linkedin_optimized', name: 'LinkedIn-optimerad', description: 'Nå 80% profilstyrka', icon: 'Magnet', color: 'sky', category: 'linkedin', max_progress: 80, reward_points: 60, sort_order: 14 },

  // Wellness Milestones
  { id: 'ms-15', key: 'mood_tracker', name: 'Humör-spårare', description: 'Logga humör 7 dagar', icon: 'Heart', color: 'rose', category: 'wellness', max_progress: 7, reward_points: 35, sort_order: 15 },
  { id: 'ms-16', key: 'wellness_streak', name: 'Välmående-streak', description: 'Behåll 14-dagars streak', icon: 'Flame', color: 'rose', category: 'wellness', max_progress: 14, reward_points: 70, sort_order: 16 },
  { id: 'ms-17', key: 'reflection_pro', name: 'Reflektions-pro', description: 'Slutför 10 reflektioner', icon: 'PenLine', color: 'rose', category: 'wellness', max_progress: 10, reward_points: 45, sort_order: 17 },

  // Community/General Milestones
  { id: 'ms-18', key: 'first_steps', name: 'Första stegen', description: 'Skapa ditt första CV', icon: 'Footprints', color: 'teal', category: 'community', max_progress: 1, reward_points: 15, sort_order: 18 },
  { id: 'ms-19', key: 'explorer', name: 'Utforskare', description: 'Besök alla sidor', icon: 'Compass', color: 'teal', category: 'community', max_progress: 8, reward_points: 25, sort_order: 19 },
  { id: 'ms-20', key: 'streak_7', name: '7-dagars streak', description: 'Logga in 7 dagar i rad', icon: 'Flame', color: 'orange', category: 'community', max_progress: 7, reward_points: 35, sort_order: 20 },
  { id: 'ms-21', key: 'streak_30', name: '30-dagars streak', description: 'Logga in 30 dagar i rad', icon: 'Crown', color: 'orange', category: 'community', max_progress: 30, reward_points: 150, sort_order: 21 },
]

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'ach-1', name: 'Nybörjare', description: 'Välkommen till plattformen!', icon: 'Star', category: 'general', points: 10, requirement_type: 'login', requirement_value: 1 },
  { id: 'ach-2', name: 'CV-skapare', description: 'Skapade ditt första CV', icon: 'FileText', category: 'cv', points: 25, requirement_type: 'cv_created', requirement_value: 1 },
  { id: 'ach-3', name: 'Jobbsökare', description: 'Sparade ditt första jobb', icon: 'Briefcase', category: 'jobs', points: 15, requirement_type: 'job_saved', requirement_value: 1 },
  { id: 'ach-4', name: 'Kunskapssamlare', description: 'Läste 5 artiklar', icon: 'BookOpen', category: 'knowledge', points: 30, requirement_type: 'articles_read', requirement_value: 5 },
  { id: 'ach-5', name: 'Streakstartare', description: 'Behöll 3-dagars streak', icon: 'Flame', category: 'streak', points: 20, requirement_type: 'streak', requirement_value: 3 },
  { id: 'ach-6', name: 'Intervjumästare', description: 'Slutförde alla intervjuövningar', icon: 'MessageSquare', category: 'interview', points: 100, requirement_type: 'exercises_completed', requirement_value: 5 },
  { id: 'ach-7', name: 'LinkedIn-proffs', description: 'Optimerade din LinkedIn-profil', icon: 'Linkedin', category: 'linkedin', points: 50, requirement_type: 'linkedin_score', requirement_value: 80 },
  { id: 'ach-8', name: 'Välmåendechampion', description: '14 dagars välmående-streak', icon: 'Heart', category: 'wellness', points: 75, requirement_type: 'wellness_streak', requirement_value: 14 },
]

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
  if (!user) return getDefaultMilestones()

  try {
    // First, try to initialize milestones for user if needed
    await supabase.rpc('initialize_user_milestones', { p_user_id: user.id }).catch(() => {
      // RPC might not exist, that's okay
    })

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

    if (error || !data || data.length === 0) {
      // Table might not exist or be empty - use defaults
      return getDefaultMilestones()
    }

    return (data || []).map(item => ({
      ...item,
      milestone: Array.isArray(item.milestone) ? item.milestone[0] : item.milestone
    })) as UserMilestone[]
  } catch {
    // Database error - use fallback
    return getDefaultMilestones()
  }
}

/**
 * Get default milestones (fallback when DB not available)
 */
function getDefaultMilestones(): UserMilestone[] {
  return DEFAULT_MILESTONES.map(milestone => ({
    id: `user-${milestone.id}`,
    milestone_id: milestone.id,
    current_progress: 0,
    is_completed: false,
    completed_at: null,
    milestone
  }))
}

/**
 * Get all achievements
 */
export async function getAchievements(): Promise<Achievement[]> {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('category', { ascending: true })

    if (error || !data || data.length === 0) {
      return DEFAULT_ACHIEVEMENTS
    }

    return data
  } catch {
    return DEFAULT_ACHIEVEMENTS
  }
}

/**
 * Get user's unlocked achievements
 */
export async function getUserAchievements(): Promise<UserAchievement[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  try {
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
      // Table might not exist - return empty (no achievements unlocked yet)
      return []
    }

    return (data || []).map(item => ({
      ...item,
      achievement: Array.isArray(item.achievement) ? item.achievement[0] : item.achievement
    })) as UserAchievement[]
  } catch {
    return []
  }
}

/**
 * Get user's gamification stats
 */
export async function getGamificationStats(): Promise<UserGamification | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return getDefaultStats(null)

  try {
    const { data, error } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      // Table might not exist - use default stats
      return getDefaultStats(user.id)
    }

    // If no stats exist, try to create or return defaults
    if (!data) {
      try {
        const { data: newData } = await supabase
          .from('user_gamification')
          .insert({ user_id: user.id })
          .select()
          .single()
        return newData || getDefaultStats(user.id)
      } catch {
        return getDefaultStats(user.id)
      }
    }

    return data
  } catch {
    return getDefaultStats(user.id)
  }
}

/**
 * Get default stats (fallback when DB not available)
 */
function getDefaultStats(userId: string | null): UserGamification {
  return {
    user_id: userId || 'anonymous',
    total_points: 0,
    current_streak: 0,
    longest_streak: 0,
    last_login_date: null,
    weekly_goal: 100,
    weekly_progress: 0,
    level: 1
  }
}

/**
 * Get recent activity log
 */
export async function getActivityLog(limit = 20): Promise<ActivityLogItem[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  try {
    // First try dedicated activity log table
    const { data, error } = await supabase
      .from('user_activity_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (!error && data && data.length > 0) {
      return data
    }

    // Fallback: try to get from user_activities table
    const { data: activities, error: actError } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (!actError && activities && activities.length > 0) {
      return activities.map(a => ({
        id: a.id,
        activity_type: a.activity_type,
        title: formatActivityTitle(a.activity_type),
        description: formatActivityDescription(a.activity_type, a.activity_data),
        points_earned: getActivityPoints(a.activity_type),
        metadata: a.activity_data || {},
        created_at: a.created_at
      }))
    }

    return []
  } catch {
    return []
  }
}

/**
 * Format activity title from type
 */
function formatActivityTitle(activityType: string): string {
  const titles: Record<string, string> = {
    cv_updated: 'CV uppdaterat',
    cv_created: 'CV skapat',
    job_saved: 'Jobb sparat',
    job_applied: 'Ansökan skickad',
    article_read: 'Artikel läst',
    article_saved: 'Artikel sparad',
    exercise_completed: 'Övning slutförd',
    interview_completed: 'Intervjuövning slutförd',
    mood_logged: 'Humör loggat',
    diary_entry: 'Dagboksanteckning',
    profile_updated: 'Profil uppdaterad',
    linkedin_analyzed: 'LinkedIn analyserad',
    login: 'Inloggning'
  }
  return titles[activityType] || 'Aktivitet'
}

/**
 * Format activity description
 */
function formatActivityDescription(activityType: string, data?: Record<string, unknown>): string | null {
  if (!data) return null

  switch (activityType) {
    case 'article_read':
      return data.article_title as string || null
    case 'job_saved':
      return data.job_title as string || null
    case 'exercise_completed':
      return data.exercise_name as string || null
    default:
      return null
  }
}

/**
 * Get points for activity type
 */
function getActivityPoints(activityType: string): number {
  const points: Record<string, number> = {
    cv_created: 25,
    cv_updated: 10,
    job_saved: 5,
    job_applied: 15,
    article_read: 10,
    article_saved: 5,
    exercise_completed: 20,
    interview_completed: 25,
    mood_logged: 5,
    diary_entry: 10,
    profile_updated: 5,
    linkedin_analyzed: 15,
    login: 2
  }
  return points[activityType] || 5
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

  try {
    // Try RPC first
    const { data, error } = await supabase.rpc('log_user_activity', {
      p_user_id: user.id,
      p_activity_type: activityType,
      p_title: title,
      p_description: description || null,
      p_points: points,
      p_metadata: metadata
    })

    if (!error) return data
  } catch {
    // RPC doesn't exist
  }

  // Fallback: try direct insert to user_activity_log
  try {
    const { data: insertData, error: insertError } = await supabase
      .from('user_activity_log')
      .insert({
        user_id: user.id,
        activity_type: activityType,
        title,
        description: description || null,
        points_earned: points,
        metadata
      })
      .select('id')
      .single()

    if (!insertError && insertData) return insertData.id
  } catch {
    // Table doesn't exist
  }

  // Fallback: try user_activities table
  try {
    const { data: actData, error: actError } = await supabase
      .from('user_activities')
      .insert({
        user_id: user.id,
        activity_type: activityType,
        activity_data: { title, description, ...metadata }
      })
      .select('id')
      .single()

    if (!actError && actData) return actData.id
  } catch {
    // Table doesn't exist either
  }

  return null
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

  try {
    // Try RPC first
    const { error } = await supabase.rpc('update_milestone_progress', {
      p_user_id: user.id,
      p_milestone_key: milestoneKey,
      p_new_progress: newProgress
    })

    if (!error) return true
  } catch {
    // RPC doesn't exist
  }

  // Fallback: try direct upsert
  try {
    // First get the milestone ID
    const { data: milestone } = await supabase
      .from('milestones')
      .select('id, max_progress')
      .eq('key', milestoneKey)
      .single()

    if (milestone) {
      const isCompleted = newProgress >= milestone.max_progress

      await supabase
        .from('user_milestones')
        .upsert({
          user_id: user.id,
          milestone_id: milestone.id,
          current_progress: newProgress,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        }, {
          onConflict: 'user_id,milestone_id'
        })

      return true
    }
  } catch {
    // Tables don't exist
  }

  return false
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
  const [milestones, achievements, userAchievements, stats, activityLog, calculatedStats] = await Promise.all([
    getMilestonesWithProgress(),
    getAchievements(),
    getUserAchievements(),
    getGamificationStats(),
    getActivityLog(10),
    calculateStatsFromActivity()
  ])

  // Use calculated stats if database stats are empty
  const totalPoints = stats?.total_points || calculatedStats.totalPoints
  const currentStreak = stats?.current_streak || calculatedStats.currentStreak
  const levelInfo = calculateLevel(totalPoints)

  return {
    milestones,
    achievements,
    userAchievements,
    stats: {
      totalPoints,
      currentStreak,
      longestStreak: stats?.longest_streak || currentStreak,
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

/**
 * Calculate stats from actual user activity
 */
async function calculateStatsFromActivity(): Promise<{ totalPoints: number; currentStreak: number }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { totalPoints: 0, currentStreak: 0 }

  let totalPoints = 0
  let currentStreak = 0

  try {
    // Count articles read
    const { count: articlesRead } = await supabase
      .from('article_reading_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_completed', true)

    totalPoints += (articlesRead || 0) * 10

    // Count exercises completed
    const { count: exercisesCompleted } = await supabase
      .from('exercise_answers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_completed', true)

    totalPoints += (exercisesCompleted || 0) * 20

    // Count jobs saved
    const { count: jobsSaved } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    totalPoints += (jobsSaved || 0) * 5

    // Count diary entries / mood logs
    const { count: diaryEntries } = await supabase
      .from('diary_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    totalPoints += (diaryEntries || 0) * 5

    // Get streak from user_streaks
    const { data: streakData } = await supabase
      .from('user_streaks')
      .select('current_streak')
      .eq('user_id', user.id)
      .eq('streak_type', 'daily')
      .maybeSingle()

    currentStreak = streakData?.current_streak || 0

    // If no streak from user_streaks, try to calculate from activities
    if (currentStreak === 0) {
      const { data: activities } = await supabase
        .from('user_activities')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)

      if (activities && activities.length > 0) {
        currentStreak = calculateStreakFromActivities(activities.map(a => a.created_at))
      }
    }

  } catch {
    // Some tables might not exist
  }

  return { totalPoints, currentStreak }
}

/**
 * Calculate streak from activity dates
 */
function calculateStreakFromActivities(dates: string[]): number {
  if (dates.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Convert to unique dates
  const uniqueDates = new Set<string>()
  dates.forEach(d => {
    const date = new Date(d)
    uniqueDates.add(date.toISOString().split('T')[0])
  })

  const sortedDates = Array.from(uniqueDates).sort().reverse()
  let streak = 0
  let currentDate = today

  for (const dateStr of sortedDates) {
    const date = new Date(dateStr)
    const diff = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diff === 0 || diff === 1) {
      streak++
      currentDate = date
    } else {
      break
    }
  }

  return streak
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
