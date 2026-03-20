/**
 * useJourney Hook - React hook for Min Jobbresa
 */

import { useState, useEffect, useCallback } from 'react'
import { JOURNEY_PHASES } from '@/data/journeyData'
import { journeyService } from '@/services/journeyService'
import type {
  UserJourneyProgress,
  JourneyStats,
  JourneyActivity,
  NextStep,
  WeeklySummary,
  JourneyPhase
} from '@/types/journey.types'

interface UseJourneyReturn {
  // Data
  progress: UserJourneyProgress | null
  stats: JourneyStats | null
  activities: JourneyActivity[]
  nextSteps: NextStep[]
  weeklySummary: WeeklySummary | null
  phases: JourneyPhase[]
  currentPhase: JourneyPhase | null

  // State
  isLoading: boolean
  error: string | null

  // Actions
  refresh: () => Promise<void>
  logActivity: (type: string, title: string, points?: number) => Promise<void>
}

export function useJourney(): UseJourneyReturn {
  const [progress, setProgress] = useState<UserJourneyProgress | null>(null)
  const [stats, setStats] = useState<JourneyStats | null>(null)
  const [activities, setActivities] = useState<JourneyActivity[]>([])
  const [nextSteps, setNextSteps] = useState<NextStep[]>([])
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentPhase = progress
    ? JOURNEY_PHASES.find(p => p.id === progress.currentPhase) || JOURNEY_PHASES[0]
    : null

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [
        progressData,
        statsData,
        activitiesData,
        nextStepsData,
        weeklyData
      ] = await Promise.all([
        journeyService.getJourneyProgress(),
        journeyService.getJourneyStats(),
        journeyService.getJourneyActivities(20),
        journeyService.getNextSteps(3),
        journeyService.getWeeklySummary()
      ])

      setProgress(progressData)
      setStats(statsData)
      setActivities(activitiesData)
      setNextSteps(nextStepsData)
      setWeeklySummary(weeklyData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ett fel uppstod'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logActivity = useCallback(async (
    type: string,
    title: string,
    points: number = 0
  ) => {
    await journeyService.logJourneyActivity(type, title, points)
    // Refresh data after logging
    await fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    progress,
    stats,
    activities,
    nextSteps,
    weeklySummary,
    phases: JOURNEY_PHASES,
    currentPhase,
    isLoading,
    error,
    refresh: fetchData,
    logActivity
  }
}

export default useJourney
