/**
 * Achievement Tracker Hook
 *
 * Loggar användarens aktiviteter till `user_activity_log` via RPC:n
 * `log_user_activity`. Anropas från 6 ytor (CV, sparade jobb, ansökningar,
 * artiklar, mående, intervjusimulator).
 *
 * ## G9-beslutet (2026-07-27): milstolps- och poängmaskineriet borttaget
 *
 * Roadmapens G9 var "gör intjänade poäng synliga — eller sluta logga".
 * Importspårning visade att INGET i klienten läser `user_gamification`,
 * `user_milestones` eller `milestones` — kedjan var helt skrivriktad. Den
 * enda läsaren av `user_activity_log` var hookens egen `getActivityCount`,
 * som räknade fram milstolpar som ingen vy visade. Cirkulärt.
 *
 * Valet blev "sluta logga det osynliga", av tre skäl:
 *  1. Deltagarens framsteg syns redan på Översikt — varje hubbkort visar sin
 *     senaste händelse ur `useOversiktHubSummary` ("Du sparade ett jobb —
 *     2 dagar sen"), byggt på riktig domändata. Den fulla listan finns i
 *     `/oversikt/historik` (som G9-arbetet dessutom länkade in — sidan var
 *     routad men olänkad).
 *  2. Poäng och märken är Gamification 2.0 — förbjuden riktning enligt
 *     ROADMAP §6, och prestationsmätning strider mot DESIGN.md §1.
 *  3. Maskineriet kostade upp till 5 extra DB-anrop per spårad handling på
 *     heta vägar (spara jobb, uppdatera CV) — för ingenting.
 *
 * `log_user_activity` behålls medvetet: den är billig (ett anrop) och är
 * underlaget som G12 (veckoreflektion för icke-STA-deltagare) behöver.
 * Punkterna i `p_points` är en kolumn i loggen, inte en synlig poängställning.
 *
 * Raderat samtidigt: `updateMilestonesForActivity`, `getActivityCount`,
 * `updateMoodStreak` (~120 rader). `getActivityCount` läste dessutom den
 * utfasade tabellen `job_applications` (E12/H4). Finns i git-historiken.
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

      // Översiktens aktivitetsfeed bygger på domändata (sparade jobb, dagbok
      // m.m.) — invalidera den så handlingen syns direkt. 'gamification'-nyckeln
      // togs bort med G9: ingen vy läste den.
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['hub'] })
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


export default useAchievementTracker
