/**
 * useProfileStatus - Hook for accessing profile status across the app
 * Provides quick access to key profile metrics for integration
 */

import { useState, useEffect, useCallback } from 'react'
import { userApi, type ProfilePreferences } from '@/services/supabaseApi'

export interface ProfileStatus {
  // Basic completion
  isProfileComplete: boolean
  profileCompletionPercent: number

  // CV Status
  cvStatus: 'complete' | 'needs_update' | 'missing' | null

  // Activity metrics
  applicationsSent: number
  interviews: number
  employerContacts: number

  // Energy & capacity
  sustainableHoursPerDay: number | null
  sustainableDaysPerWeek: number | null
  rehabilitationPhase: string | null

  // Goals
  shortTermGoal: string | null
  shortTermProgress: number
  longTermGoal: string | null
  longTermProgress: number

  // Next steps
  pendingSteps: number
  nextStepActivity: string | null
  nextStepDate: string | null

  // Barriers
  workBarriers: string[]
  hasAdaptationNeeds: boolean

  // AF Status
  registeredAtAF: boolean
  participatingInProgram: boolean
  programName: string | null

  // Internship
  hasActiveInternship: boolean
  internshipCompany: string | null

  // Raw data access
  preferences: ProfilePreferences | null
}

export function useProfileStatus() {
  const [status, setStatus] = useState<ProfileStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const prefs = await userApi.getPreferences()
      const profile = await userApi.getProfile()

      // Calculate completion
      let filled = 0
      const total = 12
      if (profile.first_name) filled++
      if (profile.last_name) filled++
      if (profile.phone) filled++
      if (profile.location) filled++
      if ((prefs.desired_jobs?.length || 0) > 0) filled++
      if (prefs.availability?.status) filled++
      if (prefs.consultant_data?.cvStatus) filled++
      if (prefs.therapist_data?.energyLevel?.sustainableHoursPerDay) filled++
      if (prefs.support_goals?.shortTerm?.goal) filled++
      if (prefs.support_goals?.longTerm?.goal) filled++
      if (prefs.labor_market_status?.registeredAtAF !== undefined) filled++
      if ((prefs.work_preferences?.sectors?.length || 0) > 0) filled++

      const nextSteps = prefs.consultant_data?.nextSteps || []
      const pendingSteps = nextSteps.filter(s => !s.completed)
      const nextStep = pendingSteps[0]

      const newStatus: ProfileStatus = {
        isProfileComplete: filled >= total * 0.8,
        profileCompletionPercent: Math.round((filled / total) * 100),

        cvStatus: prefs.consultant_data?.cvStatus || null,

        applicationsSent: prefs.consultant_data?.activityLevel?.applicationsSent || 0,
        interviews: prefs.consultant_data?.activityLevel?.interviews || 0,
        employerContacts: prefs.consultant_data?.activityLevel?.employerContacts || 0,

        sustainableHoursPerDay: prefs.therapist_data?.energyLevel?.sustainableHoursPerDay || null,
        sustainableDaysPerWeek: prefs.therapist_data?.energyLevel?.sustainableDaysPerWeek || null,
        rehabilitationPhase: prefs.therapist_data?.rehabilitationPhase || null,

        shortTermGoal: prefs.support_goals?.shortTerm?.goal || null,
        shortTermProgress: prefs.support_goals?.shortTerm?.progress || 0,
        longTermGoal: prefs.support_goals?.longTerm?.goal || null,
        longTermProgress: prefs.support_goals?.longTerm?.progress || 0,

        pendingSteps: pendingSteps.length,
        nextStepActivity: nextStep?.activity || null,
        nextStepDate: nextStep?.date || null,

        workBarriers: prefs.consultant_data?.workBarriers || [],
        hasAdaptationNeeds: prefs.physical_requirements?.hasAdaptationNeeds || false,

        registeredAtAF: prefs.labor_market_status?.registeredAtAF || false,
        participatingInProgram: prefs.labor_market_status?.participatingInProgram || false,
        programName: prefs.labor_market_status?.programName || null,

        hasActiveInternship: prefs.consultant_data?.internship?.active || false,
        internshipCompany: prefs.consultant_data?.internship?.company || null,

        preferences: prefs
      }

      setStatus(newStatus)
    } catch (err) {
      console.error('Error loading profile status:', err)
      setError('Kunde inte ladda profilstatus')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  return {
    status,
    loading,
    error,
    refresh: loadStatus
  }
}

/**
 * Helper functions for profile status
 */

export function getCvStatusLabel(status: ProfileStatus['cvStatus']): string {
  switch (status) {
    case 'complete': return 'Komplett'
    case 'needs_update': return 'Behöver uppdateras'
    case 'missing': return 'Saknas'
    default: return 'Okänd'
  }
}

export function getRehabPhaseLabel(phase: string | null): string {
  switch (phase) {
    case 'early': return 'Tidig'
    case 'ongoing': return 'Pågående'
    case 'late': return 'Sen'
    case 'completed': return 'Avslutad'
    default: return 'Ej angiven'
  }
}

export function getActivityScore(status: ProfileStatus): number {
  const apps = status.applicationsSent
  const interviews = status.interviews
  const contacts = status.employerContacts

  // Weighted score: interviews count most, then contacts, then applications
  return (apps * 1) + (contacts * 2) + (interviews * 5)
}

export function getGoalCompletionStatus(status: ProfileStatus): 'on_track' | 'behind' | 'no_goals' {
  if (!status.shortTermGoal && !status.longTermGoal) {
    return 'no_goals'
  }

  const avgProgress = (status.shortTermProgress + status.longTermProgress) / 2
  return avgProgress >= 50 ? 'on_track' : 'behind'
}
