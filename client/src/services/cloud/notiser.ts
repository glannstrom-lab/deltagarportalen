/** Notiser: notifications (den levande tabellen) och notification_preferences. */

import { supabase } from '@/lib/supabase'
import { storageLogger } from '@/lib/logger'
import { getCurrentUser, handleStorageError } from './_shared'

interface NotificationPreferences {
  email_notifications?: boolean
  push_notifications?: boolean
  job_alerts?: boolean
  article_updates?: boolean
  [key: string]: unknown
}

// ============================================
// NOTIFIKATIONER
// ============================================
export const notificationsApi = {
  async getAll() {
    // E11 (2026-07-23): explicit kolumnlista — samma 10 kolumner som
    // useNotifications.ts (den faktiska produktionsvägen) redan låser.
    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, message, read, read_at, action_url, data, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      handleStorageError(error, 'hämta notifikationer')
      return []
    }
    return data || []
  },

  async getUnread() {
    // E11 (2026-07-23): explicit kolumnlista — se getAll ovan.
    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, message, read, read_at, action_url, data, created_at')
      .eq('read', false)
      .order('created_at', { ascending: false })
    
    if (error) {
      handleStorageError(error, 'hämta olästa notifikationer')
      return []
    }
    return data || []
  },

  async markAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', id)
    
    if (error) {
      handleStorageError(error, 'markera notifikation som läst')
    }
  },

  async markAllAsRead() {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('read', false)
    
    if (error) {
      handleStorageError(error, 'markera alla notifikationer som lästa')
    }
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
    
    if (error) {
      handleStorageError(error, 'ta bort notifikation')
    }
  },

  async getPreferences() {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .limit(1)
    
    if (error && error.code !== 'PGRST116') {
      storageLogger.error('Error getting notification preferences:', error)
    }
    return data?.[0] || null
  },

  async updatePreferences(preferences: NotificationPreferences) {
    const user = await getCurrentUser()
    if (!user) {
      storageLogger.debug('Ingen användare inloggad - notifikationsinställningar sparas inte')
      return
    }

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      handleStorageError(error, 'uppdatera notifikationsinställningar')
    }
  }
}
