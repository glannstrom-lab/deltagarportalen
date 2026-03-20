/**
 * Insights Service - Analytics and personalized insights
 */

import { supabase } from '@/lib/supabase'
import { activityApi } from '@/services/supabaseApi'
import { moodApi } from '@/services/cloudStorage'

// ============================================
// TYPES
// ============================================

export interface ActivitySummary {
  total: number
  thisWeek: number
  lastWeek: number
  trend: 'up' | 'down' | 'stable'
  changePercent: number
}

export interface ActivityByType {
  type: string
  count: number
  label: string
}

export interface DailyActivity {
  date: string
  count: number
  dayName: string
}

export interface WeeklyProgress {
  week: number
  applications: number
  exercises: number
  logins: number
}

export interface MoodTrend {
  date: string
  level: number
  note?: string
}

export interface ProductivityPattern {
  hour: number
  dayOfWeek: number
  count: number
}

export interface PersonalizedRecommendation {
  id: string
  action: string
  reason: string
  impact: string
  priority: 'high' | 'medium' | 'low'
  category: 'application' | 'learning' | 'wellness' | 'profile'
}

export interface InsightData {
  activitySummary: ActivitySummary
  activityByType: ActivityByType[]
  dailyActivity: DailyActivity[]
  weeklyProgress: WeeklyProgress[]
  moodTrend: MoodTrend[]
  productivityPatterns: ProductivityPattern[]
  recommendations: PersonalizedRecommendation[]
  streakDays: number
  mostActiveDay: string
  mostActiveHour: number
  averageMoodThisWeek: number
  applicationConversionRate: number
}

// ============================================
// ACTIVITY LABELS
// ============================================

const ACTIVITY_LABELS: Record<string, string> = {
  application_sent: 'Ansökningar',
  cv_viewed: 'CV visningar',
  cv_edited: 'CV redigeringar',
  job_saved: 'Sparade jobb',
  job_viewed: 'Visade jobb',
  article_read: 'Lästa artiklar',
  exercise_completed: 'Genomförda övningar',
  login: 'Inloggningar',
  mood_logged: 'Loggat mående',
  interview_practice: 'Intervjuövningar',
  cover_letter_created: 'Personliga brev',
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

export async function getInsights(): Promise<InsightData> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return getDefaultInsights()
  }

  try {
    const [
      allActivities,
      moodHistory,
      activityCounts
    ] = await Promise.all([
      getAllActivities(user.id),
      moodApi.getHistory(30),
      activityApi.getActivityCounts(30)
    ])

    // Calculate activity summary
    const activitySummary = calculateActivitySummary(allActivities)

    // Activity by type
    const activityByType = calculateActivityByType(allActivities)

    // Daily activity (last 14 days)
    const dailyActivity = calculateDailyActivity(allActivities)

    // Weekly progress (last 4 weeks)
    const weeklyProgress = calculateWeeklyProgress(allActivities)

    // Mood trend
    const moodTrend = moodHistory.map(m => ({
      date: m.logged_at,
      level: moodTypeToLevel(m.mood),
      note: m.note
    }))

    // Productivity patterns
    const productivityPatterns = calculateProductivityPatterns(allActivities)

    // Most active day and hour
    const { mostActiveDay, mostActiveHour } = findMostActiveTime(productivityPatterns)

    // Average mood this week
    const averageMoodThisWeek = calculateAverageMood(moodTrend.slice(0, 7))

    // Generate recommendations
    const recommendations = generateRecommendations({
      activitySummary,
      activityByType,
      moodTrend,
      averageMoodThisWeek,
      mostActiveHour
    })

    // Streak days
    const streakDays = await moodApi.getStreak()

    // Application conversion rate
    const applicationConversionRate = calculateConversionRate(allActivities)

    return {
      activitySummary,
      activityByType,
      dailyActivity,
      weeklyProgress,
      moodTrend,
      productivityPatterns,
      recommendations,
      streakDays,
      mostActiveDay,
      mostActiveHour,
      averageMoodThisWeek,
      applicationConversionRate
    }
  } catch (error) {
    console.error('Error fetching insights:', error)
    return getDefaultInsights()
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getAllActivities(userId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('user_activities')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching activities:', error)
    return []
  }
  return data || []
}

interface Activity {
  id: string
  activity_type: string
  created_at: string
  activity_data?: Record<string, unknown>
}

function calculateActivitySummary(activities: Activity[]): ActivitySummary {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const thisWeek = activities.filter(a => new Date(a.created_at) >= weekAgo).length
  const lastWeek = activities.filter(a => {
    const date = new Date(a.created_at)
    return date >= twoWeeksAgo && date < weekAgo
  }).length

  const changePercent = lastWeek === 0
    ? (thisWeek > 0 ? 100 : 0)
    : Math.round(((thisWeek - lastWeek) / lastWeek) * 100)

  let trend: 'up' | 'down' | 'stable' = 'stable'
  if (changePercent > 10) trend = 'up'
  else if (changePercent < -10) trend = 'down'

  return {
    total: activities.length,
    thisWeek,
    lastWeek,
    trend,
    changePercent
  }
}

function calculateActivityByType(activities: Activity[]): ActivityByType[] {
  const counts = new Map<string, number>()

  activities.forEach(a => {
    const current = counts.get(a.activity_type) || 0
    counts.set(a.activity_type, current + 1)
  })

  return Array.from(counts.entries())
    .map(([type, count]) => ({
      type,
      count,
      label: ACTIVITY_LABELS[type] || type
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
}

function calculateDailyActivity(activities: Activity[]): DailyActivity[] {
  const days = 14
  const result: DailyActivity[] = []
  const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör']

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const dateStr = date.toISOString().split('T')[0]

    const count = activities.filter(a =>
      a.created_at.startsWith(dateStr)
    ).length

    result.push({
      date: dateStr,
      count,
      dayName: dayNames[date.getDay()]
    })
  }

  return result
}

function calculateWeeklyProgress(activities: Activity[]): WeeklyProgress[] {
  const result: WeeklyProgress[] = []

  for (let week = 3; week >= 0; week--) {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - (week + 1) * 7)
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const weekActivities = activities.filter(a => {
      const date = new Date(a.created_at)
      return date >= weekStart && date < weekEnd
    })

    result.push({
      week: 4 - week,
      applications: weekActivities.filter(a => a.activity_type === 'application_sent').length,
      exercises: weekActivities.filter(a => a.activity_type === 'exercise_completed').length,
      logins: weekActivities.filter(a => a.activity_type === 'login').length
    })
  }

  return result
}

function calculateProductivityPatterns(activities: Activity[]): ProductivityPattern[] {
  const patterns: ProductivityPattern[] = []

  activities.forEach(a => {
    const date = new Date(a.created_at)
    const hour = date.getHours()
    const dayOfWeek = date.getDay()

    const existing = patterns.find(p => p.hour === hour && p.dayOfWeek === dayOfWeek)
    if (existing) {
      existing.count++
    } else {
      patterns.push({ hour, dayOfWeek, count: 1 })
    }
  })

  return patterns
}

function findMostActiveTime(patterns: ProductivityPattern[]): { mostActiveDay: string; mostActiveHour: number } {
  const dayNames = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']

  const byDay = new Map<number, number>()
  const byHour = new Map<number, number>()

  patterns.forEach(p => {
    byDay.set(p.dayOfWeek, (byDay.get(p.dayOfWeek) || 0) + p.count)
    byHour.set(p.hour, (byHour.get(p.hour) || 0) + p.count)
  })

  let maxDay = 0
  let maxDayCount = 0
  byDay.forEach((count, day) => {
    if (count > maxDayCount) {
      maxDayCount = count
      maxDay = day
    }
  })

  let maxHour = 9
  let maxHourCount = 0
  byHour.forEach((count, hour) => {
    if (count > maxHourCount) {
      maxHourCount = count
      maxHour = hour
    }
  })

  return {
    mostActiveDay: dayNames[maxDay],
    mostActiveHour: maxHour
  }
}

function calculateAverageMood(moodTrend: MoodTrend[]): number {
  if (moodTrend.length === 0) return 0
  const sum = moodTrend.reduce((acc, m) => acc + m.level, 0)
  return Math.round((sum / moodTrend.length) * 10) / 10
}

function moodTypeToLevel(mood: string): number {
  const levels: Record<string, number> = {
    great: 5,
    good: 4,
    okay: 3,
    low: 2,
    bad: 1
  }
  return levels[mood] || 3
}

function calculateConversionRate(activities: Activity[]): number {
  const applications = activities.filter(a => a.activity_type === 'application_sent').length
  const interviews = activities.filter(a =>
    a.activity_type === 'interview_scheduled' ||
    a.activity_type === 'interview_practice'
  ).length

  if (applications === 0) return 0
  return Math.round((interviews / applications) * 100)
}

interface RecommendationContext {
  activitySummary: ActivitySummary
  activityByType: ActivityByType[]
  moodTrend: MoodTrend[]
  averageMoodThisWeek: number
  mostActiveHour: number
}

function generateRecommendations(context: RecommendationContext): PersonalizedRecommendation[] {
  const recommendations: PersonalizedRecommendation[] = []
  const { activitySummary, activityByType, moodTrend, averageMoodThisWeek, mostActiveHour } = context

  // Check activity trend
  if (activitySummary.trend === 'down') {
    recommendations.push({
      id: 'activity-down',
      action: 'Öka din aktivitet denna vecka',
      reason: `Din aktivitet har minskat med ${Math.abs(activitySummary.changePercent)}% jämfört med förra veckan.`,
      impact: 'Håller dig på rätt spår',
      priority: 'high',
      category: 'application'
    })
  }

  // Check applications
  const applications = activityByType.find(a => a.type === 'application_sent')
  if (!applications || applications.count < 3) {
    recommendations.push({
      id: 'more-applications',
      action: 'Skicka fler jobbansökningar',
      reason: 'Du har skickat få ansökningar de senaste 30 dagarna.',
      impact: '+25% chans till intervju',
      priority: 'high',
      category: 'application'
    })
  }

  // Check mood
  if (averageMoodThisWeek < 3 && moodTrend.length > 0) {
    recommendations.push({
      id: 'wellbeing-focus',
      action: 'Fokusera på välmående',
      reason: 'Ditt mående har varit lågt. Ta en paus och gör något du tycker om.',
      impact: 'Bättre energi och fokus',
      priority: 'high',
      category: 'wellness'
    })
  }

  // Check CV activity
  const cvActivity = activityByType.find(a => a.type === 'cv_edited')
  if (!cvActivity) {
    recommendations.push({
      id: 'update-cv',
      action: 'Uppdatera ditt CV',
      reason: 'Du har inte redigerat ditt CV på ett tag.',
      impact: 'Fräscht CV ökar svarsfrekvensen',
      priority: 'medium',
      category: 'profile'
    })
  }

  // Optimal time suggestion
  const optimalTime = `${mostActiveHour.toString().padStart(2, '0')}:00`
  recommendations.push({
    id: 'optimal-time',
    action: `Jobba kring ${optimalTime}`,
    reason: 'Du är mest produktiv runt denna tid baserat på dina tidigare aktiviteter.',
    impact: 'Mer effektiv jobbsökning',
    priority: 'low',
    category: 'application'
  })

  // Check exercises
  const exercises = activityByType.find(a => a.type === 'exercise_completed')
  if (!exercises || exercises.count < 5) {
    recommendations.push({
      id: 'do-exercises',
      action: 'Gör fler övningar',
      reason: 'Övningar hjälper dig förbereda för intervjuer och utveckla dina färdigheter.',
      impact: 'Bättre förberedd',
      priority: 'medium',
      category: 'learning'
    })
  }

  return recommendations.slice(0, 4)
}

function getDefaultInsights(): InsightData {
  return {
    activitySummary: {
      total: 0,
      thisWeek: 0,
      lastWeek: 0,
      trend: 'stable',
      changePercent: 0
    },
    activityByType: [],
    dailyActivity: [],
    weeklyProgress: [],
    moodTrend: [],
    productivityPatterns: [],
    recommendations: [
      {
        id: 'get-started',
        action: 'Kom igång med din jobbsökning',
        reason: 'Börja med att fylla i ditt CV och spara några jobb.',
        impact: 'Första steget mot nytt jobb',
        priority: 'high',
        category: 'application'
      }
    ],
    streakDays: 0,
    mostActiveDay: 'Måndag',
    mostActiveHour: 9,
    averageMoodThisWeek: 0,
    applicationConversionRate: 0
  }
}

export default { getInsights }
