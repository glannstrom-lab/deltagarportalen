/**
 * Achievement Tracker Hook
 * Use this hook to track user actions and automatically update milestones
 */

import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

type ActivityType =
  | 'cv_updated'
  | 'cv_section_added'
  | 'job_saved'
  | 'job_applied'
  | 'article_read'
  | 'article_saved'
  | 'interview_completed'
  | 'mood_logged'
  | 'diary_entry'
  | 'linkedin_analyzed'
  | 'profile_updated'
  | 'page_visited'
  | 'login'

interface TrackOptions {
  title: string
  description?: string
  points?: number
  metadata?: Record<string, unknown>
}

/**
 * Hook for tracking user activities and updating milestones
 */
export function useAchievementTracker() {
  const queryClient = useQueryClient()

  /**
   * Track an activity and log it to the database
   */
  const trackActivity = useCallback(async (
    activityType: ActivityType,
    options: TrackOptions
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Log the activity
      const { error } = await supabase.rpc('log_user_activity', {
        p_user_id: user.id,
        p_activity_type: activityType,
        p_title: options.title,
        p_description: options.description || null,
        p_points: options.points || getDefaultPoints(activityType),
        p_metadata: options.metadata || {}
      })

      if (error) {
        console.error('Error logging activity:', error)
        return
      }

      // Update relevant milestones based on activity type
      await updateMilestonesForActivity(user.id, activityType)

      // Invalidate gamification queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['gamification'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err) {
      console.error('Error tracking activity:', err)
    }
  }, [queryClient])

  /**
   * Track CV updates
   */
  const trackCVUpdate = useCallback((section?: string) => {
    trackActivity('cv_updated', {
      title: section ? `Uppdaterade ${section}` : 'Uppdaterade CV',
      description: section,
      points: 10,
      metadata: { section }
    })
  }, [trackActivity])

  /**
   * Track job saved
   */
  const trackJobSaved = useCallback((jobTitle?: string, company?: string) => {
    trackActivity('job_saved', {
      title: 'Sparade ett jobb',
      description: jobTitle ? `${jobTitle} på ${company}` : undefined,
      points: 5,
      metadata: { jobTitle, company }
    })
  }, [trackActivity])

  /**
   * Track job application
   */
  const trackJobApplied = useCallback((jobTitle?: string, company?: string) => {
    trackActivity('job_applied', {
      title: 'Skickade en ansökan',
      description: jobTitle ? `${jobTitle} på ${company}` : undefined,
      points: 25,
      metadata: { jobTitle, company }
    })
  }, [trackActivity])

  /**
   * Track article read
   */
  const trackArticleRead = useCallback((articleTitle?: string) => {
    trackActivity('article_read', {
      title: 'Läste en artikel',
      description: articleTitle,
      points: 5,
      metadata: { articleTitle }
    })
  }, [trackActivity])

  /**
   * Track article saved
   */
  const trackArticleSaved = useCallback((articleTitle?: string) => {
    trackActivity('article_saved', {
      title: 'Sparade en artikel',
      description: articleTitle,
      points: 3,
      metadata: { articleTitle }
    })
  }, [trackActivity])

  /**
   * Track interview training completed
   */
  const trackInterviewCompleted = useCallback((score?: number) => {
    trackActivity('interview_completed', {
      title: 'Genomförde intervjuträning',
      description: score ? `Resultat: ${score}%` : undefined,
      points: 20,
      metadata: { score }
    })
  }, [trackActivity])

  /**
   * Track mood logged
   */
  const trackMoodLogged = useCallback((mood?: string) => {
    trackActivity('mood_logged', {
      title: 'Loggade mående',
      description: mood,
      points: 5,
      metadata: { mood }
    })
  }, [trackActivity])

  /**
   * Track diary entry
   */
  const trackDiaryEntry = useCallback(() => {
    trackActivity('diary_entry', {
      title: 'Skrev i dagboken',
      points: 10
    })
  }, [trackActivity])

  /**
   * Track LinkedIn profile analyzed
   */
  const trackLinkedInAnalyzed = useCallback((score?: number) => {
    trackActivity('linkedin_analyzed', {
      title: 'Analyserade LinkedIn-profil',
      description: score ? `Profilstyrka: ${score}%` : undefined,
      points: 15,
      metadata: { score }
    })
  }, [trackActivity])

  /**
   * Track interview scheduled (from application pipeline)
   */
  const trackInterviewScheduled = useCallback((jobTitle?: string, company?: string) => {
    trackActivity('interview_completed', {
      title: 'Bokade intervju',
      description: jobTitle ? `${jobTitle} på ${company}` : 'Intervju bokad',
      points: 30,
      metadata: { jobTitle, company, type: 'scheduled' }
    })
  }, [trackActivity])

  /**
   * Track offer received
   */
  const trackOfferReceived = useCallback((jobTitle?: string, company?: string) => {
    trackActivity('job_applied', {
      title: 'Fick jobberbjudande!',
      description: jobTitle ? `${jobTitle} på ${company}` : undefined,
      points: 100,
      metadata: { jobTitle, company, type: 'offer' }
    })
  }, [trackActivity])

  /**
   * Track job accepted
   */
  const trackJobAccepted = useCallback((jobTitle?: string, company?: string) => {
    trackActivity('job_applied', {
      title: 'Accepterade jobberbjudande!',
      description: jobTitle ? `${jobTitle} på ${company}` : undefined,
      points: 200,
      metadata: { jobTitle, company, type: 'accepted' }
    })
  }, [trackActivity])

  return {
    trackActivity,
    trackCVUpdate,
    trackJobSaved,
    trackJobApplied,
    trackArticleRead,
    trackArticleSaved,
    trackInterviewCompleted,
    trackMoodLogged,
    trackDiaryEntry,
    trackLinkedInAnalyzed,
    trackInterviewScheduled,
    trackOfferReceived,
    trackJobAccepted,
  }
}

/**
 * Get default points for activity type
 */
function getDefaultPoints(activityType: ActivityType): number {
  const pointsMap: Record<ActivityType, number> = {
    cv_updated: 10,
    cv_section_added: 15,
    job_saved: 5,
    job_applied: 25,
    article_read: 5,
    article_saved: 3,
    interview_completed: 20,
    mood_logged: 5,
    diary_entry: 10,
    linkedin_analyzed: 15,
    profile_updated: 10,
    page_visited: 1,
    login: 5,
  }
  return pointsMap[activityType] || 5
}

/**
 * Update milestones based on activity type
 */
async function updateMilestonesForActivity(userId: string, activityType: ActivityType) {
  // Get current counts to update milestones
  const milestonesToUpdate: { key: string; countQuery: string }[] = []

  switch (activityType) {
    case 'job_saved':
      milestonesToUpdate.push({ key: 'job_hunter', countQuery: 'saved_jobs' })
      milestonesToUpdate.push({ key: 'job_organizer', countQuery: 'saved_jobs' })
      break
    case 'job_applied':
      milestonesToUpdate.push({ key: 'application_pro', countQuery: 'job_applications' })
      break
    case 'article_read':
      milestonesToUpdate.push({ key: 'knowledge_seeker', countQuery: 'articles_read' })
      milestonesToUpdate.push({ key: 'bookworm', countQuery: 'articles_read' })
      break
    case 'article_saved':
      milestonesToUpdate.push({ key: 'saver', countQuery: 'articles_saved' })
      break
    case 'interview_completed':
      milestonesToUpdate.push({ key: 'interview_starter', countQuery: 'interviews' })
      milestonesToUpdate.push({ key: 'interview_pro', countQuery: 'interviews' })
      break
    case 'mood_logged':
      // For mood tracking, we need to count consecutive days
      await updateMoodStreak(userId)
      break
    case 'diary_entry':
      milestonesToUpdate.push({ key: 'reflection_pro', countQuery: 'diary_entries' })
      break
  }

  // Update each milestone
  for (const milestone of milestonesToUpdate) {
    const count = await getActivityCount(userId, milestone.countQuery)
    if (count > 0) {
      await supabase.rpc('update_milestone_progress', {
        p_user_id: userId,
        p_milestone_key: milestone.key,
        p_new_progress: count
      })
    }
  }
}

/**
 * Get count of activities for milestone tracking
 */
async function getActivityCount(userId: string, countType: string): Promise<number> {
  let count = 0

  try {
    switch (countType) {
      case 'saved_jobs': {
        const { count: jobCount } = await supabase
          .from('saved_jobs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
        count = jobCount || 0
        break
      }
      case 'job_applications': {
        const { count: appCount } = await supabase
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
        count = appCount || 0
        break
      }
      case 'articles_read': {
        const { count: readCount } = await supabase
          .from('user_activity_log')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('activity_type', 'article_read')
        count = readCount || 0
        break
      }
      case 'articles_saved': {
        const { count: savedCount } = await supabase
          .from('user_activity_log')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('activity_type', 'article_saved')
        count = savedCount || 0
        break
      }
      case 'interviews': {
        const { count: interviewCount } = await supabase
          .from('user_activity_log')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('activity_type', 'interview_completed')
        count = interviewCount || 0
        break
      }
      case 'diary_entries': {
        const { count: diaryCount } = await supabase
          .from('user_activity_log')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('activity_type', 'diary_entry')
        count = diaryCount || 0
        break
      }
    }
  } catch (err) {
    console.error('Error getting activity count:', err)
  }

  return count
}

/**
 * Update mood tracking streak milestone
 */
async function updateMoodStreak(userId: string) {
  try {
    // Get mood logs for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: moodLogs } = await supabase
      .from('mood_logs')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (!moodLogs || moodLogs.length === 0) return

    // Calculate streak
    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    const logDates = moodLogs.map(log => {
      const d = new Date(log.created_at)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })

    const uniqueDates = [...new Set(logDates)]

    for (let i = 0; i < 30; i++) {
      if (uniqueDates.includes(currentDate.getTime())) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    // Update milestones
    if (streak > 0) {
      await supabase.rpc('update_milestone_progress', {
        p_user_id: userId,
        p_milestone_key: 'mood_tracker',
        p_new_progress: streak
      })
      await supabase.rpc('update_milestone_progress', {
        p_user_id: userId,
        p_milestone_key: 'wellness_streak',
        p_new_progress: streak
      })
    }
  } catch (err) {
    console.error('Error updating mood streak:', err)
  }
}

export default useAchievementTracker
