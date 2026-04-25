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
  // Profile basics
  firstName?: string
  bio?: string
  location?: string
  employmentStatus?: string

  // Career goals
  targetRole?: string
  targetIndustry?: string
  experienceYears?: number
  desiredJobs?: string[]
  careerGoals?: {
    shortTerm?: string
    longTerm?: string
    targetSkills?: string[]
  }
  supportGoals?: {
    goals?: string[]
    challenges?: string[]
    strengths?: string[]
  }

  // Work preferences
  workPreferences?: {
    remote?: boolean
    hybrid?: boolean
    onsite?: boolean
    partTime?: boolean
    fullTime?: boolean
  }
  availability?: {
    startDate?: string
    noticePeriod?: string
  }
  mobility?: {
    canRelocate?: boolean
    driversLicense?: boolean
  }
  salaryExpectation?: number

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

  // Job search activity
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
  interests?: string[]

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
      ctx.bio = profile.bio || undefined
      ctx.location = profile.location || undefined
      ctx.employmentStatus = profile.employment_status || undefined

      // Career goals
      if (profile.desired_jobs) {
        ctx.desiredJobs = profile.desired_jobs.titles || []
        if (profile.desired_jobs.industries?.[0]) {
          ctx.targetIndustry = profile.desired_jobs.industries[0]
        }
        if (profile.desired_jobs.titles?.[0]) {
          ctx.targetRole = profile.desired_jobs.titles[0]
        }
      }

      if (profile.career_goals) {
        ctx.careerGoals = {
          shortTerm: profile.career_goals.shortTerm,
          longTerm: profile.career_goals.longTerm,
          targetSkills: profile.career_goals.skills,
        }
      }

      if (profile.support_goals) {
        ctx.supportGoals = {
          goals: profile.support_goals.goals,
          challenges: profile.support_goals.challenges,
          strengths: profile.support_goals.strengths,
        }
      }

      // Work preferences
      if (profile.work_preferences) {
        ctx.workPreferences = {
          remote: profile.work_preferences.remote,
          hybrid: profile.work_preferences.hybrid,
          onsite: profile.work_preferences.onsite,
          partTime: profile.work_preferences.partTime,
          fullTime: profile.work_preferences.fullTime,
        }
      }

      if (profile.availability) {
        ctx.availability = {
          startDate: profile.availability.startDate,
          noticePeriod: profile.availability.noticePeriod,
        }
      }

      if (profile.mobility) {
        ctx.mobility = {
          canRelocate: profile.mobility.canRelocate,
          driversLicense: profile.mobility.driversLicense,
        }
      }

      if (profile.salary?.minimum) {
        ctx.salaryExpectation = profile.salary.minimum
      }

      if (profile.interests && Array.isArray(profile.interests)) {
        ctx.interests = profile.interests
      }
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

  // Profile section - always included
  const profileParts: string[] = []
  if (context.firstName) profileParts.push(`Namn: ${context.firstName}`)
  if (context.bio) profileParts.push(`Om mig: ${context.bio.substring(0, 300)}`)
  if (context.location) profileParts.push(`Ort: ${context.location}`)
  if (context.employmentStatus) profileParts.push(`Anställningsstatus: ${context.employmentStatus}`)

  if (profileParts.length > 0) {
    sections.push(`[PROFIL]\n${profileParts.join('\n')}`)
  }

  // Career goals section
  const careerParts: string[] = []
  if (context.targetRole) careerParts.push(`Söker jobb som: ${context.targetRole}`)
  if (context.desiredJobs && context.desiredJobs.length > 1) {
    careerParts.push(`Önskade roller: ${context.desiredJobs.slice(0, 5).join(', ')}`)
  }
  if (context.targetIndustry) careerParts.push(`Bransch: ${context.targetIndustry}`)
  if (context.experienceYears !== undefined) careerParts.push(`Erfarenhet: ${context.experienceYears} år`)

  if (context.careerGoals) {
    if (context.careerGoals.shortTerm) careerParts.push(`Kortsiktigt mål: ${context.careerGoals.shortTerm}`)
    if (context.careerGoals.longTerm) careerParts.push(`Långsiktigt mål: ${context.careerGoals.longTerm}`)
    if (context.careerGoals.targetSkills?.length) {
      careerParts.push(`Vill utveckla: ${context.careerGoals.targetSkills.join(', ')}`)
    }
  }

  if (careerParts.length > 0) {
    sections.push(`[KARRIÄRMÅL]\n${careerParts.join('\n')}`)
  }

  // Support goals (for arbetsterapeut and motivationscoach)
  if ((agentId === 'arbetsterapeut' || agentId === 'motivationscoach') && context.supportGoals) {
    const supportParts: string[] = []
    if (context.supportGoals.goals?.length) {
      supportParts.push(`Mål: ${context.supportGoals.goals.join(', ')}`)
    }
    if (context.supportGoals.challenges?.length) {
      supportParts.push(`Utmaningar: ${context.supportGoals.challenges.join(', ')}`)
    }
    if (context.supportGoals.strengths?.length) {
      supportParts.push(`Styrkor: ${context.supportGoals.strengths.join(', ')}`)
    }
    if (supportParts.length > 0) {
      sections.push(`[STÖDMÅL]\n${supportParts.join('\n')}`)
    }
  }

  // Work preferences (for arbetskonsulent)
  if (agentId === 'arbetskonsulent' && context.workPreferences) {
    const prefParts: string[] = []
    const prefs: string[] = []
    if (context.workPreferences.remote) prefs.push('distans')
    if (context.workPreferences.hybrid) prefs.push('hybrid')
    if (context.workPreferences.onsite) prefs.push('på plats')
    if (context.workPreferences.fullTime) prefs.push('heltid')
    if (context.workPreferences.partTime) prefs.push('deltid')
    if (prefs.length > 0) prefParts.push(`Arbetsform: ${prefs.join(', ')}`)

    if (context.availability?.startDate) {
      prefParts.push(`Kan börja: ${context.availability.startDate}`)
    }
    if (context.availability?.noticePeriod) {
      prefParts.push(`Uppsägningstid: ${context.availability.noticePeriod}`)
    }
    if (context.mobility?.canRelocate) {
      prefParts.push(`Kan flytta: Ja`)
    }
    if (context.mobility?.driversLicense) {
      prefParts.push(`Körkort: Ja`)
    }
    if (context.salaryExpectation) {
      prefParts.push(`Löneanspråk: ${context.salaryExpectation.toLocaleString('sv-SE')} kr/mån`)
    }

    if (prefParts.length > 0) {
      sections.push(`[ARBETSPREFERENSER]\n${prefParts.join('\n')}`)
    }
  }

  // Interests
  if (context.interests && context.interests.length > 0) {
    sections.push(`[INTRESSEN]\n${context.interests.slice(0, 10).join(', ')}`)
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
