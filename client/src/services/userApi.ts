/**
 * User-API: profil, preferenser, onboarding-progress, settings.
 *
 * Extraherat från supabaseApi.ts 2026-05-09 (P2-skuld).
 * Typer (OnboardingProgress, ProfilePreferences) bor kvar i supabaseApi.ts
 * och re-exporteras därifrån — alla 54 callers fortsätter funka utan
 * import-ändringar.
 */

import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/supabase'
import { APIError, handleError } from './apiError'
import type { OnboardingProgress, ProfilePreferences, DesiredOccupation } from './supabaseApi'

/**
 * Normaliserar desired_jobs från DB. Stödjer både legacy-format (string[])
 * och nytt strukturerat format (DesiredOccupation[]). Säkerställer alltid
 * att priority är satt och unik.
 */
function normalizeDesiredJobs(raw: unknown): DesiredOccupation[] {
  if (!Array.isArray(raw)) return []
  const result: DesiredOccupation[] = []
  let nextPriority = 1
  for (const item of raw) {
    if (typeof item === 'string') {
      const label = item.trim()
      if (label) result.push({ label, priority: nextPriority++ })
    } else if (item && typeof item === 'object' && 'label' in item) {
      const obj = item as Record<string, unknown>
      const label = typeof obj.label === 'string' ? obj.label.trim() : ''
      if (!label) continue
      const priority = typeof obj.priority === 'number' ? obj.priority : nextPriority
      nextPriority = Math.max(nextPriority, priority + 1)
      result.push({
        label,
        priority,
        conceptId: typeof obj.conceptId === 'string' ? obj.conceptId : undefined,
        ssyk: typeof obj.ssyk === 'string' ? obj.ssyk : undefined,
      })
    }
  }
  // Sortera efter priority + tilldela 1..n om något saknas
  result.sort((a, b) => a.priority - b.priority)
  return result.map((j, i) => ({ ...j, priority: i + 1 }))
}

export const userApi = {
  async getProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) handleError(error)
    return data
  },

  async updateProfile(updates: Partial<Tables['profiles']>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) handleError(error)

    // Sync till useAuthStore så Header, Sidebar, AgentChat och övriga UI-
    // konsumenter direkt ser nya värden — utan denna propagering kunde
    // Settings/FocusProfile/consent-gates skriva till Supabase men UI:s
    // "current user" var fortsatt gammalt (P1-skuld 2026-05-09).
    // Async-import undviker cirkulär dep vid module-init.
    if (data) {
      void (async () => {
        try {
          const { useAuthStore } = await import('../stores/authStore')
          const current = useAuthStore.getState().profile
          if (current) {
            const cleaned: Record<string, unknown> = {}
            for (const [key, value] of Object.entries(updates)) {
              if (value !== undefined) cleaned[key] = value
            }
            useAuthStore.setState({
              profile: { ...current, ...cleaned } as typeof current,
            })
          }
        } catch (err) {
          console.warn('[userApi.updateProfile] could not sync authStore:', err)
        }
      })()
    }

    return data
  },

  // Get profile preferences (desired jobs, interests, onboarding, and extended profile data)
  async getPreferences(): Promise<ProfilePreferences> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('profiles')
      .select('desired_jobs, interests, onboarding_progress, availability, mobility, salary, labor_market_status, work_preferences, physical_requirements, consultant_data, therapist_data, support_goals')
      .eq('id', user.id)
      .single()

    if (error) {
      // Return empty if columns don't exist yet
      if (error.code === '42703') {
        return { desired_jobs: [], interests: [], onboarding_progress: {} }
      }
      handleError(error)
    }

    return {
      desired_jobs: normalizeDesiredJobs(data?.desired_jobs),
      interests: data?.interests || [],
      onboarding_progress: data?.onboarding_progress || {},
      availability: data?.availability || {},
      mobility: data?.mobility || {},
      salary: data?.salary || {},
      labor_market_status: data?.labor_market_status || {},
      work_preferences: data?.work_preferences || {},
      physical_requirements: data?.physical_requirements || {},
      consultant_data: data?.consultant_data || {},
      therapist_data: data?.therapist_data || {},
      support_goals: data?.support_goals || {}
    }
  },

  // Update profile preferences
  async updatePreferences(prefs: ProfilePreferences) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const updates: Record<string, unknown> = {}
    if (prefs.desired_jobs !== undefined) updates.desired_jobs = prefs.desired_jobs
    if (prefs.interests !== undefined) updates.interests = prefs.interests
    if (prefs.onboarding_progress !== undefined) updates.onboarding_progress = prefs.onboarding_progress
    if (prefs.availability !== undefined) updates.availability = prefs.availability
    if (prefs.mobility !== undefined) updates.mobility = prefs.mobility
    if (prefs.salary !== undefined) updates.salary = prefs.salary
    if (prefs.labor_market_status !== undefined) updates.labor_market_status = prefs.labor_market_status
    if (prefs.work_preferences !== undefined) updates.work_preferences = prefs.work_preferences
    if (prefs.physical_requirements !== undefined) updates.physical_requirements = prefs.physical_requirements
    if (prefs.consultant_data !== undefined) updates.consultant_data = prefs.consultant_data
    if (prefs.therapist_data !== undefined) updates.therapist_data = prefs.therapist_data
    if (prefs.support_goals !== undefined) updates.support_goals = prefs.support_goals

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select('desired_jobs, interests, onboarding_progress, availability, mobility, salary, labor_market_status, work_preferences, physical_requirements, consultant_data, therapist_data, support_goals')
      .single()

    if (error) handleError(error)
    return data
  },

  // Update single onboarding step
  async updateOnboardingStep(step: keyof OnboardingProgress, completed: boolean) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    // First get current progress
    const { data: current } = await supabase
      .from('profiles')
      .select('onboarding_progress')
      .eq('id', user.id)
      .single()

    const currentProgress = (current?.onboarding_progress || {}) as OnboardingProgress
    const newProgress = { ...currentProgress, [step]: completed }

    const { data, error } = await supabase
      .from('profiles')
      .update({ onboarding_progress: newProgress })
      .eq('id', user.id)
      .select('onboarding_progress')
      .single()

    if (error) handleError(error)
    return data?.onboarding_progress as OnboardingProgress
  },

  // Get onboarding progress
  async getOnboardingProgress(): Promise<OnboardingProgress> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_progress')
      .eq('id', user.id)
      .single()

    if (error) {
      if (error.code === '42703') return {}
      handleError(error)
    }

    return (data?.onboarding_progress || {}) as OnboardingProgress
  },

  async updateSettings(settings: {
    calmMode?: boolean
    highContrast?: boolean
    largeText?: boolean
    reduceMotion?: boolean
    emailNotifications?: boolean
    jobAlerts?: boolean
    preferredLanguage?: string
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new APIError('Inte inloggad', 'UNAUTHORIZED', 401)

    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        calm_mode: settings.calmMode,
        high_contrast: settings.highContrast,
        large_text: settings.largeText,
        reduce_motion: settings.reduceMotion,
        email_notifications: settings.emailNotifications,
        job_alerts: settings.jobAlerts,
        preferred_language: settings.preferredLanguage,
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) handleError(error)
    return data
  }
}
