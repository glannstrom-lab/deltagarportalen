/** Utkast (autosave) i user_drafts, nycklade per typ + nyckel. */

import { supabase } from '@/lib/supabase'
import { storageLogger } from '@/lib/logger'
import { getCurrentUser, handleStorageError } from './_shared'

// ============================================
// DRAFTS (AUTOSAVE)
// ============================================
export const draftsApi = {
  async get(draftType: string, draftKey: string) {
    const user = await getCurrentUser()
    if (!user) {
      const drafts = JSON.parse(localStorage.getItem(`drafts_${draftType}`) || '{}')
      return drafts[draftKey] || null
    }

    const { data, error } = await supabase
      .from('user_drafts')
      .select('data')
      .eq('draft_type', draftType)
      .eq('draft_key', draftKey)
      .eq('user_id', user.id)
      .limit(1)
    
    if (error && error.code !== 'PGRST116') {
      storageLogger.error('Error getting draft:', error)
    }
    return data?.[0]?.data || null
  },

  async save(draftType: string, draftKey: string, data: unknown) {
    const user = await getCurrentUser()
    if (!user) {
      const drafts = JSON.parse(localStorage.getItem(`drafts_${draftType}`) || '{}')
      drafts[draftKey] = data
      localStorage.setItem(`drafts_${draftType}`, JSON.stringify(drafts))
      return
    }

    const { error } = await supabase
      .from('user_drafts')
      .upsert({
        user_id: user.id,
        draft_type: draftType,
        draft_key: draftKey,
        data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,draft_type,draft_key'
      })

    if (error) {
      handleStorageError(error, 'spara utkast')
      const drafts = JSON.parse(localStorage.getItem(`drafts_${draftType}`) || '{}')
      drafts[draftKey] = data
      localStorage.setItem(`drafts_${draftType}`, JSON.stringify(drafts))
    }
  },

  async delete(draftType: string, draftKey: string) {
    const user = await getCurrentUser()
    if (!user) {
      const drafts = JSON.parse(localStorage.getItem(`drafts_${draftType}`) || '{}')
      delete drafts[draftKey]
      localStorage.setItem(`drafts_${draftType}`, JSON.stringify(drafts))
      return
    }

    const { error } = await supabase
      .from('user_drafts')
      .delete()
      .eq('draft_type', draftType)
      .eq('draft_key', draftKey)
      .eq('user_id', user.id)
    
    if (error) {
      handleStorageError(error, 'ta bort utkast')
    }
  },

  async getAllByType(draftType: string) {
    const user = await getCurrentUser()
    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from('user_drafts')
      .select('*')
      .eq('draft_type', draftType)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    
    if (error) {
      handleStorageError(error, 'hämta utkast')
      return []
    }
    return data || []
  }
}
