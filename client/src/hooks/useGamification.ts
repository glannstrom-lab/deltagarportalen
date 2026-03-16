/**
 * Gamification Hook
 * React hook for accessing gamification data with caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import gamificationService, {
  type UserMilestone,
  type Achievement,
  type UserAchievement,
  type ActivityLogItem
} from '@/services/gamificationService'

const QUERY_KEYS = {
  gamification: 'gamification',
  milestones: 'milestones',
  achievements: 'achievements',
  userAchievements: 'userAchievements',
  activityLog: 'activityLog',
  stats: 'gamificationStats',
} as const

/**
 * Main gamification hook - gets all data needed for the dashboard
 */
export function useGamification() {
  return useQuery({
    queryKey: [QUERY_KEYS.gamification],
    queryFn: gamificationService.getGamificationDashboard,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

/**
 * Hook for milestones only
 */
export function useMilestones() {
  return useQuery({
    queryKey: [QUERY_KEYS.milestones],
    queryFn: gamificationService.getMilestonesWithProgress,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook for achievements
 */
export function useAchievements() {
  return useQuery({
    queryKey: [QUERY_KEYS.achievements],
    queryFn: gamificationService.getAchievements,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook for user's unlocked achievements
 */
export function useUserAchievements() {
  return useQuery({
    queryKey: [QUERY_KEYS.userAchievements],
    queryFn: gamificationService.getUserAchievements,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook for activity log
 */
export function useActivityLog(limit = 20) {
  return useQuery({
    queryKey: [QUERY_KEYS.activityLog, limit],
    queryFn: () => gamificationService.getActivityLog(limit),
    staleTime: 1 * 60 * 1000,
  })
}

/**
 * Hook for logging activities
 */
export function useLogActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      activityType,
      title,
      description,
      points,
      metadata
    }: {
      activityType: string
      title: string
      description?: string
      points?: number
      metadata?: Record<string, unknown>
    }) => gamificationService.logActivity(activityType, title, description, points, metadata),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.gamification] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.activityLog] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] })
    },
  })
}

/**
 * Hook for updating milestone progress
 */
export function useUpdateMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ milestoneKey, progress }: { milestoneKey: string; progress: number }) =>
      gamificationService.updateMilestoneProgress(milestoneKey, progress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.gamification] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.milestones] })
    },
  })
}

/**
 * Hook for unlocking achievements
 */
export function useUnlockAchievement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (achievementId: string) => gamificationService.unlockAchievement(achievementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.gamification] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.userAchievements] })
    },
  })
}

/**
 * Helper to get milestone by category
 */
export function filterMilestonesByCategory(milestones: UserMilestone[], category: string) {
  return milestones.filter(m => m.milestone?.category === category)
}

/**
 * Helper to get completion percentage
 */
export function getMilestonePercentage(milestone: UserMilestone): number {
  if (!milestone.milestone) return 0
  return Math.round((milestone.current_progress / milestone.milestone.max_progress) * 100)
}

/**
 * Helper to format activity timestamp
 */
export function formatActivityTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'Just nu'
  if (minutes < 60) return `${minutes} min sedan`
  if (hours < 24) return `${hours} tim sedan`
  if (days === 1) return 'Igår'
  if (days < 7) return `${days} dagar sedan`

  return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
}

/**
 * Helper to get icon for activity type
 */
export function getActivityIcon(activityType: string): string {
  const iconMap: Record<string, string> = {
    cv_updated: 'FileText',
    job_saved: 'Briefcase',
    job_applied: 'Send',
    article_read: 'BookOpen',
    article_saved: 'Bookmark',
    interview_completed: 'MessageSquare',
    mood_logged: 'Heart',
    milestone_completed: 'Trophy',
    achievement_unlocked: 'Award',
    login: 'LogIn',
    profile_updated: 'User',
    linkedin_analyzed: 'Linkedin',
  }
  return iconMap[activityType] || 'Activity'
}

export default useGamification
