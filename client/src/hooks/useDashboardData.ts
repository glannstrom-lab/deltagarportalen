import { useState, useEffect, useCallback } from 'react'
import { cvApi, interestApi, coverLetterApi, activityApi, savedJobsApi } from '@/services/api'
import type { DashboardWidgetData } from '@/types/dashboard'

export interface UseDashboardDataReturn {
  data: DashboardWidgetData | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardWidgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

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

      // Räkna streak (förenklad - dagar med aktivitet i rad)
      const streakDays = calculateStreak(activities)

      // Hämta kommande events (mock för nu)
      const upcomingEvents: any[] = []
      const eventsThisWeek = 0

      setData({
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
          newMatches: 0, // Kan implementeras senare
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
          upcomingEvents,
          eventsThisWeek,
          hasConsultantMeeting: false,
        },
        activity: {
          weeklyApplications: applicationCount,
          streakDays,
        },
      })
    } catch (err) {
      console.error('Fel vid hämtning av dashboard-data:', err)
      setError('Kunde inte ladda dashboard-data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

// Hjälpfunktioner
function calculateCVProgress(cv: any): number {
  if (!cv) return 0
  
  let score = 0
  const sections = [
    { check: () => cv.personal_info?.first_name && cv.personal_info?.last_name, points: 10 },
    { check: () => cv.personal_info?.email, points: 5 },
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
  
  if (!cv.personal_info?.first_name) missing.push('profile')
  if (!cv.summary) missing.push('summary')
  if (!cv.work_experience?.length) missing.push('work_experience')
  if (!cv.education?.length) missing.push('education')
  if (!cv.skills?.length) missing.push('skills')
  
  return missing
}

function calculateStreak(activities: any[]): number {
  if (!activities || activities.length === 0) return 0
  
  // Sortera aktiviteter efter datum (nyast först)
  const sortedActivities = [...activities].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  
  // Förenklad streak-beräkning: antal unika dagar med aktivitet
  const uniqueDays = new Set(
    sortedActivities.map(a => new Date(a.created_at).toDateString())
  )
  
  return Math.min(uniqueDays.size, 7) // Max 7 dagar för nu
}
