/**
 * AI Team Context Hook
 *
 * Collects user data from across the app to provide context for AI agents.
 * This allows agents to give personalized responses based on the user's
 * CV, saved jobs, applications, profile, and more.
 */

import { useMemo } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useCV } from '@/hooks/useSupabase'
import { useApplications } from '@/hooks/useApplications'
import { useInterestProfile } from '@/hooks/useInterestProfile'
import type { AgentId } from '@/components/ai-team/types'

export interface AITeamUserContext {
  // Profile
  firstName?: string
  targetRole?: string
  targetIndustry?: string
  experienceYears?: number
  location?: string

  // CV data
  hasCV: boolean
  cvSummary?: string
  cvTitle?: string
  workExperience?: Array<{
    title: string
    company: string
    duration?: string
  }>
  education?: Array<{
    degree: string
    school: string
  }>
  skills?: string[]
  languages?: string[]

  // Job search
  savedJobsCount: number
  appliedJobsCount: number
  interviewsCount: number
  recentSavedJobs?: Array<{
    title: string
    company: string
    location?: string
  }>

  // Interest profile
  riasecTypes?: string[]
  suggestedCareers?: string[]

  // Current state
  energyLevel: 'low' | 'medium' | 'high'
  language: 'sv' | 'en'
}

/**
 * Hook that collects all relevant user context for AI agents
 */
export function useAITeamContext() {
  const { profile, user } = useAuthStore()
  const { energyLevel, language } = useSettingsStore()
  const { cv, loading: cvLoading } = useCV(user?.id)
  const { applications, stats, isLoading: appsLoading } = useApplications()
  const { profile: interestProfile } = useInterestProfile()

  const context = useMemo<AITeamUserContext>(() => {
    const ctx: AITeamUserContext = {
      hasCV: false,
      savedJobsCount: 0,
      appliedJobsCount: 0,
      interviewsCount: 0,
      energyLevel: energyLevel || 'medium',
      language: language || 'sv',
    }

    // Profile info
    if (profile) {
      ctx.firstName = profile.first_name || undefined
      ctx.targetRole = profile.target_role || undefined
      ctx.targetIndustry = profile.target_industry || undefined
      ctx.experienceYears = profile.experience_years || undefined
      ctx.location = profile.city || profile.location || undefined
    }

    // CV data
    if (cv) {
      ctx.hasCV = true
      ctx.cvTitle = cv.title || undefined
      ctx.cvSummary = cv.summary || undefined

      // Work experience
      if (cv.work_experience && Array.isArray(cv.work_experience)) {
        ctx.workExperience = cv.work_experience.slice(0, 5).map((exp: Record<string, unknown>) => ({
          title: (exp.title || exp.position || '') as string,
          company: (exp.company || exp.employer || '') as string,
          duration: exp.duration as string || undefined,
        }))
      }

      // Education
      if (cv.education && Array.isArray(cv.education)) {
        ctx.education = cv.education.slice(0, 3).map((edu: Record<string, unknown>) => ({
          degree: (edu.degree || edu.field || '') as string,
          school: (edu.school || edu.institution || '') as string,
        }))
      }

      // Skills
      if (cv.skills && Array.isArray(cv.skills)) {
        ctx.skills = cv.skills.slice(0, 10).map((s: string | { name: string }) =>
          typeof s === 'string' ? s : s.name
        )
      }

      // Languages
      if (cv.languages && Array.isArray(cv.languages)) {
        ctx.languages = cv.languages.slice(0, 5).map((l: string | { name: string }) =>
          typeof l === 'string' ? l : l.name
        )
      }
    }

    // Job applications stats
    if (stats) {
      ctx.savedJobsCount = stats.saved || 0
      ctx.appliedJobsCount = stats.applied || 0
      ctx.interviewsCount = (stats.interview || 0) + (stats.phone || 0)
    }

    // Recent saved jobs (last 5)
    if (applications && applications.length > 0) {
      const savedJobs = applications
        .filter(a => a.status === 'saved' || a.status === 'interested')
        .slice(0, 5)

      ctx.recentSavedJobs = savedJobs.map(app => ({
        title: app.jobTitle || (app.jobData as { headline?: string })?.headline || 'Okänd titel',
        company: app.companyName || (app.jobData as { employer?: { name?: string } })?.employer?.name || 'Okänt företag',
        location: app.location || (app.jobData as { workplace_address?: { municipality?: string } })?.workplace_address?.municipality,
      }))
    }

    // Interest profile (RIASEC)
    if (interestProfile) {
      if (interestProfile.dominantTypes && interestProfile.dominantTypes.length > 0) {
        ctx.riasecTypes = interestProfile.dominantTypes.slice(0, 3).map(t => t.code)
      }
      if (interestProfile.suggestedCareers && interestProfile.suggestedCareers.length > 0) {
        ctx.suggestedCareers = interestProfile.suggestedCareers.slice(0, 5)
      }
    }

    return ctx
  }, [profile, cv, applications, stats, interestProfile, energyLevel, language])

  const isLoading = cvLoading || appsLoading

  return { context, isLoading }
}

/**
 * Format the context into a readable string for AI prompts
 */
export function formatAITeamContext(context: AITeamUserContext, agentId: AgentId): string {
  const sections: string[] = []

  // Profile section
  const profileParts: string[] = []
  if (context.firstName) profileParts.push(`Namn: ${context.firstName}`)
  if (context.targetRole) profileParts.push(`Söker: ${context.targetRole}`)
  if (context.targetIndustry) profileParts.push(`Bransch: ${context.targetIndustry}`)
  if (context.experienceYears !== undefined) profileParts.push(`Erfarenhet: ${context.experienceYears} år`)
  if (context.location) profileParts.push(`Ort: ${context.location}`)

  if (profileParts.length > 0) {
    sections.push(`[PROFIL]\n${profileParts.join('\n')}`)
  }

  // CV section (mainly for arbetskonsulent)
  if (context.hasCV && (agentId === 'arbetskonsulent' || agentId === 'digitalcoach')) {
    const cvParts: string[] = []
    if (context.cvTitle) cvParts.push(`Titel: ${context.cvTitle}`)
    if (context.cvSummary) cvParts.push(`Sammanfattning: ${context.cvSummary.substring(0, 200)}...`)

    if (context.workExperience && context.workExperience.length > 0) {
      cvParts.push(`\nArbetslivserfarenhet:`)
      context.workExperience.forEach(exp => {
        cvParts.push(`- ${exp.title} på ${exp.company}${exp.duration ? ` (${exp.duration})` : ''}`)
      })
    }

    if (context.education && context.education.length > 0) {
      cvParts.push(`\nUtbildning:`)
      context.education.forEach(edu => {
        cvParts.push(`- ${edu.degree} från ${edu.school}`)
      })
    }

    if (context.skills && context.skills.length > 0) {
      cvParts.push(`\nKompetenser: ${context.skills.join(', ')}`)
    }

    if (context.languages && context.languages.length > 0) {
      cvParts.push(`\nSpråk: ${context.languages.join(', ')}`)
    }

    if (cvParts.length > 0) {
      sections.push(`[CV-DATA]\n${cvParts.join('\n')}`)
    }
  }

  // Job search section (for arbetskonsulent)
  if (agentId === 'arbetskonsulent') {
    const jobParts: string[] = []
    jobParts.push(`Sparade jobb: ${context.savedJobsCount}`)
    jobParts.push(`Ansökningar: ${context.appliedJobsCount}`)
    jobParts.push(`Intervjuer: ${context.interviewsCount}`)

    if (context.recentSavedJobs && context.recentSavedJobs.length > 0) {
      jobParts.push(`\nSenast sparade jobb:`)
      context.recentSavedJobs.forEach(job => {
        jobParts.push(`- ${job.title} på ${job.company}${job.location ? ` i ${job.location}` : ''}`)
      })
    }

    sections.push(`[JOBBSÖKNING]\n${jobParts.join('\n')}`)
  }

  // Interest profile (for studievagledare and motivationscoach)
  if ((agentId === 'studievagledare' || agentId === 'motivationscoach') && context.riasecTypes) {
    const interestParts: string[] = []

    const riasecNames: Record<string, string> = {
      R: 'Realistisk (praktisk)',
      I: 'Undersökande (analytisk)',
      A: 'Artistisk (kreativ)',
      S: 'Social (hjälpsam)',
      E: 'Entreprenöriell (ledande)',
      C: 'Konventionell (strukturerad)',
    }

    interestParts.push(`Personlighetstyp: ${context.riasecTypes.map(t => riasecNames[t] || t).join(', ')}`)

    if (context.suggestedCareers && context.suggestedCareers.length > 0) {
      interestParts.push(`Föreslagna yrken: ${context.suggestedCareers.join(', ')}`)
    }

    sections.push(`[INTRESSEPROFIL]\n${interestParts.join('\n')}`)
  }

  // Energy level (for arbetsterapeut)
  if (agentId === 'arbetsterapeut') {
    const energyText = context.energyLevel === 'low' ? 'Låg energi - ge kortare svar'
      : context.energyLevel === 'high' ? 'Hög energi'
      : 'Normal energinivå'
    sections.push(`[ENERGINIVÅ]\n${energyText}`)
  }

  // Language
  if (context.language === 'en') {
    sections.push('[SPRÅK]\nRespond in English.')
  }

  return sections.length > 0 ? `\n\n--- ANVÄNDARKONTEXT ---\n${sections.join('\n\n')}\n--- SLUT KONTEXT ---\n` : ''
}

export default useAITeamContext
