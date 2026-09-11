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

    const { data, error } = await supabase
      .from('user_preferences')
      .select('integration_checklist')
      .eq('user_id', user.id)
      .single()

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

  async toggleItem(
    itemId: string,
    completed: boolean,
    notes?: string
  ): Promise<boolean> {
    const current = await this.getProgress()
    const items = current?.items || {}

    items[itemId] = {
      id: itemId,
      completed,
      completedAt: completed ? new Date().toISOString() : undefined,
      notes: notes || items[itemId]?.notes,
      targetDate: items[itemId]?.targetDate,
    }

    return this.saveProgress(items)
  },

  async updateItemNotes(itemId: string, notes: string): Promise<boolean> {
    const current = await this.getProgress()
    const items = current?.items || {}

    if (!items[itemId]) {
      items[itemId] = {
        id: itemId,
        completed: false,
        notes,
      }
    } else {
      items[itemId].notes = notes
    }

    return this.saveProgress(items)
  },

  async setTargetDate(itemId: string, targetDate: string): Promise<boolean> {
    const current = await this.getProgress()
    const items = current?.items || {}

    if (!items[itemId]) {
      items[itemId] = {
        id: itemId,
        completed: false,
        targetDate,
      }
    } else {
      items[itemId].targetDate = targetDate
    }

    return this.saveProgress(items)
  },

  async exportProgress(): Promise<string> {
    const data = await this.getProgress()
    return JSON.stringify(data, null, 2)
  },
}
