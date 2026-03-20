/**
 * Community Activity Logger
 * Automatically posts user activities to the community feed
 */

import { postToFeed } from './communityService'
import type { ActivityType } from '@/types/community.types'

// Activity configurations with Swedish titles
const ACTIVITY_MESSAGES: Record<ActivityType, {
  titleTemplate: (data?: Record<string, unknown>) => string
  descriptionTemplate?: (data?: Record<string, unknown>) => string
}> = {
  application_sent: {
    titleTemplate: (data) => data?.company
      ? `skickade en ansökan till ${data.company}`
      : 'skickade en jobbansökan',
    descriptionTemplate: (data) => data?.position
      ? `Sökte tjänsten: ${data.position}`
      : undefined
  },
  interview_scheduled: {
    titleTemplate: (data) => data?.company
      ? `fick intervju hos ${data.company}!`
      : 'fick intervju!',
    descriptionTemplate: () => 'Ett steg närmare drömjobbet!'
  },
  cv_completed: {
    titleTemplate: () => 'färdigställde sitt CV',
    descriptionTemplate: (data) => data?.score
      ? `CV-poäng: ${data.score}%`
      : undefined
  },
  milestone_reached: {
    titleTemplate: (data) => `nådde milstolpen "${data?.name || 'Ny milstolpe'}"`,
    descriptionTemplate: (data) => data?.xp
      ? `+${data.xp} XP`
      : undefined
  },
  streak_achieved: {
    titleTemplate: (data) => `har en ${data?.days || 7}-dagars streak!`,
    descriptionTemplate: () => 'Aktivitet lönar sig!'
  },
  first_login: {
    titleTemplate: () => 'gick med i communityn',
    descriptionTemplate: () => 'Välkommen!'
  },
  profile_completed: {
    titleTemplate: () => 'fyllde i sin profil',
    descriptionTemplate: () => 'Nu är det lättare att hitta rätt jobb!'
  },
  article_read: {
    titleTemplate: (data) => data?.title
      ? `läste artikeln "${data.title}"`
      : 'läste en artikel',
    descriptionTemplate: () => undefined
  },
  exercise_completed: {
    titleTemplate: (data) => data?.name
      ? `genomförde övningen "${data.name}"`
      : 'genomförde en övning'
  },
  job_offer: {
    titleTemplate: (data) => data?.company
      ? `fick jobberbjudande från ${data.company}!`
      : 'fick ett jobberbjudande!',
    descriptionTemplate: () => 'Grattis!'
  }
}

/**
 * Log an activity to the community feed
 * Call this function from various parts of the app when users do things
 */
export async function logCommunityActivity(
  activityType: ActivityType,
  data?: Record<string, unknown>,
  isPublic = true
): Promise<boolean> {
  try {
    const config = ACTIVITY_MESSAGES[activityType]
    if (!config) {
      console.warn(`Unknown activity type: ${activityType}`)
      return false
    }

    const title = config.titleTemplate(data)
    const description = config.descriptionTemplate?.(data)

    const feedId = await postToFeed(
      activityType,
      title,
      description,
      data || {},
      isPublic
    )

    return feedId !== null
  } catch (error) {
    console.error('Error logging community activity:', error)
    return false
  }
}

// Convenience functions for common activities

export const logApplicationSent = (company?: string, position?: string) =>
  logCommunityActivity('application_sent', { company, position })

export const logInterviewScheduled = (company?: string) =>
  logCommunityActivity('interview_scheduled', { company })

export const logCVCompleted = (score?: number) =>
  logCommunityActivity('cv_completed', { score })

export const logMilestoneReached = (name: string, xp?: number) =>
  logCommunityActivity('milestone_reached', { name, xp })

export const logStreakAchieved = (days: number) =>
  logCommunityActivity('streak_achieved', { days })

export const logFirstLogin = () =>
  logCommunityActivity('first_login')

export const logProfileCompleted = () =>
  logCommunityActivity('profile_completed')

export const logArticleRead = (title?: string) =>
  logCommunityActivity('article_read', { title })

export const logExerciseCompleted = (name?: string) =>
  logCommunityActivity('exercise_completed', { name })

export const logJobOffer = (company?: string) =>
  logCommunityActivity('job_offer', { company })
