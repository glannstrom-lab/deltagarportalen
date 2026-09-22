/** Användarens inställningar: dashboard_preferences och user_preferences. */

import { supabase } from '@/lib/supabase'
import { getCurrentUser, handleStorageError } from './_shared'
import { formatLocalDate } from '../aktivitetSchema'

interface OnboardingProgress {
  currentStep?: number
  completedSteps?: string[]
  [key: string]: unknown
}

// ============================================
// DASHBOARD
// ============================================
export const dashboardPreferencesApi = {
  async get() {
    const { data, error } = await supabase
      .from('dashboard_preferences')
      .select('*')
      .limit(1)
    
    if (error) {
      handleStorageError(error, 'hämta dashboard-inställningar')
      return JSON.parse(localStorage.getItem('dashboard_preferences') || 'null')
    }
    return data?.[0] || null
  },

  async update(preferences: {
    visible_widgets?: string[]
    widget_sizes?: Record<string, string>
    widget_order?: string[]
  }) {
    const user = await getCurrentUser()
    if (!user) {
      localStorage.setItem('dashboard_preferences', JSON.stringify(preferences))
      return
    }

    const { error } = await supabase
      .from('dashboard_preferences')
      .upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
    
    if (error) {
      handleStorageError(error, 'uppdatera dashboard-inställningar')
      localStorage.setItem('dashboard_preferences', JSON.stringify(preferences))
    }
  }
}

// ============================================
// ANVÄNDARINSTÄLLNINGAR
// ============================================
export const userPreferencesApi = {
  async get() {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .limit(1)
    
    if (error) {
      handleStorageError(error, 'hämta användarinställningar')
      return JSON.parse(localStorage.getItem('user_preferences') || 'null')
    }
    return data?.[0] || null
  },

  async update(preferences: {
    dark_mode?: boolean
    font_size?: string
    language?: string
    energy_level?: string
    onboarding_completed?: boolean
    onboarding_skipped?: boolean
    onboarding_progress?: OnboardingProgress
    default_cv_id?: string
  }) {
    const user = await getCurrentUser()
    if (!user) {
      localStorage.setItem('user_preferences', JSON.stringify(preferences))
      return
    }

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
    
    if (error) {
      handleStorageError(error, 'uppdatera användarinställningar')
      localStorage.setItem('user_preferences', JSON.stringify(preferences))
    }
  },

  async updateLastLogin(): Promise<void> {
    const user = await getCurrentUser()
    const today = formatLocalDate(new Date())
    const todayString = new Date().toDateString()

    if (!user) {
      localStorage.setItem('lastLoginDate', todayString)
      return
    }

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        last_login_at: new Date().toISOString(),
        last_login_date: today,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      handleStorageError(error, 'uppdatera senaste inloggning')
      localStorage.setItem('lastLoginDate', todayString)
    } else {
      localStorage.removeItem('lastLoginDate')
    }
  }
}
