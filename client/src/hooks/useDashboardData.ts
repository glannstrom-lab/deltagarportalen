import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cvApi, interestApi, coverLetterApi, activityApi, savedJobsApi } from '@/services/supabaseApi'
import type { DashboardWidgetData } from '@/types/dashboard'
import { supabase } from '@/lib/supabase'

// Query keys för caching
const DASHBOARD_QUERY_KEY = 'dashboard' as const

export interface UseDashboardDataReturn {
  data: DashboardWidgetData | null
  loading: boolean
  error: string | null
  refetch: () => void
  isRefetching: boolean
}

// Forward declaration
function getDefaultDashboardData(): DashboardWidgetData

// Funktion för att hämta all dashboard-data
async function fetchDashboardData(): Promise<DashboardWidgetData> {
  try {
  // Parallella anrop för bättre prestanda
  const [
    cv,
    atsAnalysis,
    interestResult,
    savedJobs,
    coverLetters,
    activities,
    applicationCount,
    cvVersions,
    exerciseAnswers,
    calendarEvents,
    quests,
    userStreaks,
  ] = await Promise.all([
    cvApi.getCV().catch(() => null),
    cvApi.getATSAnalysis().catch(() => null),
    interestApi.getResult().catch(() => null),
    savedJobsApi.getAll().catch(() => []),
    coverLetterApi.getAll().catch(() => []),
    activityApi.getActivities().catch(() => []),
    activityApi.getCount('application_sent').catch(() => 0),
    cvApi.getVersions().catch(() => []),
    fetchExerciseProgress(),
    fetchCalendarEvents(),
    fetchQuests(),
    fetchUserStreaks(),
  ])

  // Beräkna CV-progress
  const cvProgress = calculateCVProgress(cv)
  const hasCV = !!cv && (!!cv.summary || !!(cv.work_experience && cv.work_experience.length > 0))

  // Hämta nyligen sparade jobb (max 3)
  const recentJobs = savedJobs.slice(0, 3).map((savedJob: any) => {
    const jobData = savedJob.job_data || {}
    return {
      id: savedJob.job_id || savedJob.id,
      title: jobData.headline || jobData.title || 'Okänt jobb',
      company: jobData.employer?.name || jobData.company || 'Okänt företag',
      location: jobData.workplace_address?.municipality || jobData.location,
      deadline: jobData.application_deadline,
    }
  })

  // Hämta nyligen skapade brev (max 3)
  const recentLetters = coverLetters.slice(0, 3).map((letter: any) => ({
    id: letter.id,
    title: letter.title || 'Nytt brev',
    company: letter.company || 'Okänt företag',
    createdAt: letter.created_at,
    jobTitle: letter.job_title,
  }))

  // Räkna streak
  const streakDays = calculateStreak(activities)

  // Beräkna övningsprogress
  const completedExercises = exerciseAnswers.filter((ea: any) => ea.is_completed).length

  // Hämta kommande händelser
  const upcomingEvents = calendarEvents
    .filter((e: any) => new Date(e.date) >= new Date())
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3)

  return {
    cv: {
      hasCV,
      progress: cvProgress,
      atsScore: atsAnalysis?.score || 0,
      atsFeedback: atsAnalysis?.feedback || [],
      lastEdited: cv?.updated_at || null,
      missingSections: getMissingSections(cv),
      // Mina CV data
      savedCVs: cvVersions.map((v: any) => ({
        id: v.id,
        name: v.name,
        createdAt: v.created_at,
        isDefault: v.is_default,
      })),
      // Mall-data
      currentTemplate: cv?.template || 'modern',
    },
    interest: {
      hasResult: !!interestResult,
      topRecommendations: interestResult?.recommended_occupations?.slice(0, 3).map((o: any) => ({
        name: o.name,
        matchPercentage: o.match_percentage || o.match,
      })) || [],
      completedAt: interestResult?.created_at || null,
      // RIASEC-data
      riasecProfile: interestResult?.riasec_profile || null,
      // Quiz-progress
      answeredQuestions: interestResult?.answers ? Object.keys(interestResult.answers).length : 0,
      totalQuestions: 36,
    },
    jobs: {
      savedCount: savedJobs.length,
      newMatches: 0,
      recentSavedJobs: recentJobs,
    },
    applications: {
      total: applicationCount,
      statusBreakdown: {
        applied: applicationCount,
        interview: 0,
        rejected: 0,
        offer: 0,
      },
      nextFollowUp: null,
    },
    coverLetters: {
      count: coverLetters.length,
      recentLetters,
      drafts: coverLetters.filter((l: any) => !l.is_completed).length,
    },
    exercises: {
      totalExercises: 38, // Totalt antal övningar
      completedExercises,
      completionRate: Math.round((completedExercises / 38) * 100),
      streakDays,
    },
    calendar: {
      upcomingEvents: upcomingEvents.map((e: any) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time,
        type: e.type,
      })),
      eventsThisWeek: calendarEvents.filter((e: any) => {
        const eventDate = new Date(e.date)
        const now = new Date()
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        return eventDate >= now && eventDate <= weekFromNow
      }).length,
      hasConsultantMeeting: calendarEvents.some((e: any) => e.type === 'meeting'),
    },
    activity: {
      weeklyApplications: applicationCount,
      streakDays: userStreaks?.current_streak || streakDays,
    },
    quests: {
      total: quests?.length || 3,
      completed: quests?.filter((q: any) => q.is_completed).length || 0,
      items: quests?.map((q: any) => ({
        id: q.id,
        title: q.title,
        completed: q.is_completed,
        points: q.points,
        category: q.category,
      })) || [],
    },
    wellness: {
      moodToday: null,
      streakDays: streakDays,
      completedActivities: activities.filter((a: any) => 
        a.activity_type === 'wellness' || a.activity_type === 'mood_logged'
      ).length,
      lastEntryDate: activities.find((a: any) => a.activity_type === 'mood_logged')?.created_at || null,
    },
  }
  } catch (err) {
    console.error('Error in fetchDashboardData:', err)
    return getDefaultDashboardData()
  }
}

// Default dashboard data fallback
export function getDefaultDashboardData(): DashboardWidgetData {
  return {
    cv: {
      hasCV: false,
      progress: 0,
      atsScore: 0,
      atsFeedback: [],
      lastEdited: null,
      missingSections: ['profile', 'summary', 'work_experience', 'education', 'skills'],
      savedCVs: [],
      currentTemplate: 'modern',
    },
    interest: {
      hasResult: false,
      topRecommendations: [],
      completedAt: null,
      riasecProfile: null,
      answeredQuestions: 0,
      totalQuestions: 36,
    },
    jobs: {
      savedCount: 0,
      newMatches: 0,
      recentSavedJobs: [],
    },
    applications: {
      total: 0,
      statusBreakdown: { applied: 0, interview: 0, rejected: 0, offer: 0 },
      nextFollowUp: null,
    },
    coverLetters: {
      count: 0,
      drafts: 0,
      recentLetters: [],
    },
    exercises: {
      totalExercises: 38,
      completedExercises: 0,
      completionRate: 0,
      streakDays: 0,
    },
    calendar: {
      upcomingEvents: [],
      eventsThisWeek: 0,
      hasConsultantMeeting: false,
    },
    activity: {
      weeklyApplications: 0,
      streakDays: 0,
    },
    knowledge: {
      readCount: 0,
      savedCount: 0,
      totalArticles: 0,
      recentlyRead: [],
      recommendedArticle: null,
    },
    quests: {
      total: 3,
      completed: 0,
      items: [],
    },
    wellness: {
      moodToday: null,
      streakDays: 0,
      completedActivities: 0,
      lastEntryDate: null,
    },
  }
}

// Hämta övningsprogress från Supabase
async function fetchExerciseProgress() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    
    const { data, error } = await supabase
      .from('exercise_answers')
      .select('*')
      .eq('user_id', user.id)
    
    if (error) {
      // Table might not exist yet, return empty array
      console.warn('Exercise answers not available:', error.message)
      return []
    }
    return data || []
  } catch {
    return []
  }
}

// Hämta kalenderhändelser från Supabase
async function fetchCalendarEvents() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
    
    if (error) {
      // Table might not exist yet, return empty array
      console.warn('Calendar events not available:', error.message)
      return []
    }
    return data || []
  } catch {
    return []
  }
}

// Hämta quests från Supabase
async function fetchQuests() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', user.id)
      .eq('assigned_date', new Date().toISOString().split('T')[0])
    
    if (error) {
      // Table might not exist yet, return empty array
      console.warn('Quests not available:', error.message)
      return []
    }
    return data || []
  } catch {
    return []
  }
}

// Hämta user streaks från Supabase
async function fetchUserStreaks() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .eq('streak_type', 'general')
      .maybeSingle()
    
    if (error) {
      console.warn('User streaks not available:', error.message)
      return null
    }
    return data
  } catch {
    return null
  }
}

// React Query hook (rekommenderad)
export function useDashboardDataQuery() {
  return useQuery({
    queryKey: [DASHBOARD_QUERY_KEY],
    queryFn: fetchDashboardData,
    staleTime: 5 * 60 * 1000, // 5 minuter
    gcTime: 10 * 60 * 1000, // 10 minuter
    retry: 1,
    refetchOnWindowFocus: false,
  })
}

// Legacy hook för bakåtkompatibilitet
export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardWidgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefetching, setIsRefetching] = useState(false)

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true)
    } else {
      setIsRefetching(true)
    }
    setError(null)

    try {
      const dashboardData = await fetchDashboardData()
      setData(dashboardData)
    } catch (err) {
      console.error('Fel vid hämtning av dashboard-data:', err)
      // Use default data as fallback so UI still works
      // Don't set error since fallback data allows UI to function
      setData(getDefaultDashboardData())
    } finally {
      setLoading(false)
      setIsRefetching(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { 
    data, 
    loading, 
    error, 
    refetch: () => fetchData(true),
    isRefetching 
  }
}

// Hjälpfunktioner
function calculateCVProgress(cv: any): number {
  if (!cv) return 0
  
  let score = 0
  const sections = [
    { check: () => cv.first_name || cv.personal_info?.first_name, points: 10 },
    { check: () => cv.email || cv.personal_info?.email, points: 5 },
    { check: () => cv.summary, points: 20 },
    { check: () => cv.work_experience?.length > 0, points: 25 },
    { check: () => cv.education?.length > 0, points: 15 },
    { check: () => cv.skills?.length > 0, points: 15 },
    { check: () => cv.languages?.length > 0, points: 10 },
  ]

  sections.forEach(section => {
    if (section.check()) score += section.points
  })

  return Math.min(100, score)
}

function getMissingSections(cv: any): string[] {
  if (!cv) return ['profile', 'summary', 'work_experience', 'education', 'skills']
  
  const missing: string[] = []
  
  if (!cv.first_name && !cv.personal_info?.first_name) missing.push('profile')
  if (!cv.summary) missing.push('summary')
  if (!cv.work_experience?.length) missing.push('work_experience')
  if (!cv.education?.length) missing.push('education')
  if (!cv.skills?.length) missing.push('skills')
  
  return missing
}

function calculateStreak(activities: any[]): number {
  if (!activities || activities.length === 0) return 0
  
  const sortedActivities = [...activities].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  
  const uniqueDays = new Set(
    sortedActivities.map(a => new Date(a.created_at).toDateString())
  )
  
  return Math.min(uniqueDays.size, 7)
}

export default useDashboardData
