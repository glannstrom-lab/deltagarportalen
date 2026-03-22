/**
 * useJourney Hook - React hook for Min Jobbresa
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { JOURNEY_PHASES } from '@/data/journeyData'
import { journeyService, type UserGoal, type Achievement } from '@/services/journeyService'
import type {
  UserJourneyProgress,
  JourneyStats,
  JourneyActivity,
  NextStep,
  WeeklySummary,
  JourneyPhase
} from '@/types/journey.types'

interface MilestoneCompletion {
  completed: string[]
  xpEarned: number
}

interface UseJourneyReturn {
  // Data
  progress: UserJourneyProgress | null
  stats: JourneyStats | null
  activities: JourneyActivity[]
  nextSteps: NextStep[]
  weeklySummary: WeeklySummary | null
  phases: JourneyPhase[]
  currentPhase: JourneyPhase | null
  goals: UserGoal[]
  achievements: Achievement[]
  recentCompletions: MilestoneCompletion | null

  // State
  isLoading: boolean
  error: string | null

  // Actions
  refresh: () => Promise<void>
  logActivity: (type: string, title: string, points?: number) => Promise<void>
  checkMilestones: () => Promise<MilestoneCompletion>
  createGoal: (goal: Parameters<typeof journeyService.createUserGoal>[0]) => Promise<UserGoal | null>
  updateGoalProgress: (goalId: string, value: number) => Promise<void>
  deleteGoal: (goalId: string) => Promise<void>
  dismissCompletions: () => void
}

export function useJourney(): UseJourneyReturn {
  const [progress, setProgress] = useState<UserJourneyProgress | null>(null)
  const [stats, setStats] = useState<JourneyStats | null>(null)
  const [activities, setActivities] = useState<JourneyActivity[]>([])
  const [nextSteps, setNextSteps] = useState<NextStep[]>([])
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null)
  const [goals, setGoals] = useState<UserGoal[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [recentCompletions, setRecentCompletions] = useState<MilestoneCompletion | null>(null)
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
        weeklyData,
        goalsData,
        achievementsData
      ] = await Promise.all([
        journeyService.getJourneyProgress(),
        journeyService.getJourneyStats(),
        journeyService.getJourneyActivities(20),
        journeyService.getNextSteps(3),
        journeyService.getWeeklySummary(),
        journeyService.getUserGoals(),
        journeyService.getAchievements()
      ])

      setProgress(progressData)
      setStats(statsData)
      setActivities(activitiesData)
      setNextSteps(nextStepsData)
      setWeeklySummary(weeklyData)
      setGoals(goalsData)
      setAchievements(achievementsData)
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
    await fetchData()
  }, [fetchData])

  const checkMilestones = useCallback(async () => {
    const result = await journeyService.checkAndCompleteMilestones()
    if (result.completed.length > 0) {
      setRecentCompletions(result)
      await fetchData()
    }
    return result
  }, [fetchData])

  const createGoal = useCallback(async (
    goal: Parameters<typeof journeyService.createUserGoal>[0]
  ) => {
    const newGoal = await journeyService.createUserGoal(goal)
    if (newGoal) {
      setGoals(prev => [newGoal, ...prev])
    }
    return newGoal
  }, [])

  const updateGoalProgress = useCallback(async (goalId: string, value: number) => {
    await journeyService.updateGoalProgress(goalId, value)
    setGoals(prev => prev.map(g =>
      g.id === goalId
        ? { ...g, current_value: value, is_completed: value >= g.target_value }
        : g
    ))
  }, [])

  const deleteGoal = useCallback(async (goalId: string) => {
    await journeyService.deleteUserGoal(goalId)
    setGoals(prev => prev.filter(g => g.id !== goalId))
  }, [])

  const dismissCompletions = useCallback(() => {
    setRecentCompletions(null)
  }, [])

  const hasCheckedMilestones = useRef(false)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Check milestones on initial load (only once)
  useEffect(() => {
    if (!isLoading && progress && !hasCheckedMilestones.current) {
      hasCheckedMilestones.current = true
      checkMilestones()
    }
  }, [isLoading, progress, checkMilestones])

  return {
    progress,
    stats,
    activities,
    nextSteps,
    weeklySummary,
    phases: JOURNEY_PHASES,
    currentPhase,
    goals,
    achievements,
    recentCompletions,
    isLoading,
    error,
    refresh: fetchData,
    logActivity,
    checkMilestones,
    createGoal,
    updateGoalProgress,
    deleteGoal,
    dismissCompletions
  }
}

export default useJourney
