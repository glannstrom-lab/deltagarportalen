/** Integrationschecklistan (Ny i Sverige) i user_preferences.integration_checklist. */

import { supabase } from '@/lib/supabase'
import { getCurrentUser, handleStorageError } from './_shared'

// ============================================
// INTEGRATION CHECKLIST API
// ============================================

interface IntegrationChecklistItem {
  id: string
  completed: boolean
  completedAt?: string
  notes?: string
  targetDate?: string
}

interface IntegrationChecklistData {
  items: Record<string, IntegrationChecklistItem>
  lastUpdated: string
}

export const integrationChecklistApi = {
  async getProgress(): Promise<IntegrationChecklistData | null> {
    const user = await getCurrentUser()
    const localKey = 'integration-checklist'

    if (!user) {
      const cached = localStorage.getItem(localKey)
      if (cached) {
        return { items: JSON.parse(cached), lastUpdated: new Date().toISOString() }
      }
      return null
    }

    // maybeSingle(): user_preferences skapas lazy — en användare utan rad än
    // är normalt, inte ett fel. .single() gav ett onödigt 406 i nätverksloggen
    // och en felmärkt "storage error" för det vanliga fallet.
    const { data, error } = await supabase
      .from('user_preferences')
      .select('integration_checklist')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      handleStorageError(error, 'hämta integrationschecklista')
      const cached = localStorage.getItem(localKey)
      if (cached) {
        return { items: JSON.parse(cached), lastUpdated: new Date().toISOString() }
      }
      return null
    }

    const checklistData = data?.integration_checklist as IntegrationChecklistData | null
    if (checklistData) {
      localStorage.setItem(localKey, JSON.stringify(checklistData.items))
    }
    return checklistData
  },

  async saveProgress(items: Record<string, IntegrationChecklistItem>): Promise<boolean> {
    const user = await getCurrentUser()
    const localKey = 'integration-checklist'
    const data: IntegrationChecklistData = {
      items,
      lastUpdated: new Date().toISOString(),
    }

    // Always save locally first
    localStorage.setItem(localKey, JSON.stringify(items))

    if (!user) {
      return true
    }

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        integration_checklist: data,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      handleStorageError(error, 'spara integrationschecklista')
      return false
    }

    return true
  },

}
