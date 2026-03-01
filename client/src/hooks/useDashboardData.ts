import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cvApi, interestApi, coverLetterApi, activityApi, savedJobsApi } from '@/services/supabaseApi'
import type { DashboardWidgetData } from '@/types/dashboard'

// Query keys för caching
const DASHBOARD_QUERY_KEY = 'dashboard' as const

export interface UseDashboardDataReturn {
  data: DashboardWidgetData | null
  loading: boolean
  error: string | null
  refetch: () => void
  isRefetching: boolean
}

// Funktion för att hämta all dashboard-data
async function fetchDashboardData(): Promise<DashboardWidgetData> {
  // Parallella anrop för bättre prestanda
  const [
    cv,
    atsAnalysis,
    interestResult,
    savedJobs,
    coverLetters,
    activities,
    applicationCount,
  ] = await Promise.all([
    cvApi.getCV().catch(() => null),
    cvApi.getATSAnalysis().catch(() => null),
    interestApi.getResult().catch(() => null),
    savedJobsApi.getAll().catch(() => []),
    coverLetterApi.getAll().catch(() => []),
    activityApi.getActivities().catch(() => []),
    activityApi.getCount('application_sent').catch(() => 0),
  ])

  // Beräkna CV-progress
  const cvProgress = calculateCVProgress(cv)
  const hasCV = !!cv && (!!cv.summary || !!(cv.work_experience && cv.work_experience.length > 0))

  // Hämta nyligen sparade jobb (max 3)
  const recentJobs = savedJobs.slice(0, 3).map((job: any) => ({
    id: job.id,
    title: job.title || 'Okänt jobb',
    company: job.company || 'Okänt företag',
  }))

  // Hämta nyligen skapade brev (max 3)
  const recentLetters = coverLetters.slice(0, 3).map((letter: any) => ({
    id: letter.id,
    title: letter.title || 'Nytt brev',
    company: letter.company || 'Okänt företag',
    createdAt: letter.created_at,
  }))

  // Räkna streak
  const streakDays = calculateStreak(activities)

  return {
    cv: {
      hasCV,
      progress: cvProgress,
      atsScore: atsAnalysis?.score || 0,
      lastEdited: cv?.updated_at || null,
      missingSections: getMissingSections(cv),
    },
    interest: {
      hasResult: !!interestResult,
      topRecommendations: interestResult?.recommended_occupations?.slice(0, 3).map((o: any) => o.name) || [],
      completedAt: interestResult?.created_at || null,
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
    },
    calendar: {
      upcomingEvents: [],
      eventsThisWeek: 0,
      hasConsultantMeeting: false,
    },
    activity: {
      weeklyApplications: applicationCount,
      streakDays,
    },
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
      setError('Kunde inte ladda dashboard-data')
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
