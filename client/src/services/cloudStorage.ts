/**
 * Cloud Storage Service
 * Centraliserad hantering av all datalagring i molnet (Supabase)
 * Ersätter all localStorage-användning
 * 
 * OBS: Alla funktioner hanterar RLS-fel (42501) genom att falla tillbaka på localStorage
 */

import { supabase } from '@/lib/supabase'

// Hjälpfunktion för att hantera fel
function handleStorageError(error: any, context: string): void {
  // RLS-policy fel (42501) - logga tyst
  if (error?.code === '42501') {
    console.log(`[CloudStorage] RLS policy förhindrar ${context} - använder fallback`)
    return
  }
  // Användaren inte inloggad
  if (error?.code === 'PGRST116' || error?.status === 401) {
    console.log(`[CloudStorage] Användare inte inloggad för ${context} - använder fallback`)
    return
  }
  // Andra fel - logga för debugging
  console.error(`[CloudStorage] Fel vid ${context}:`, error)
}

// ============================================
// ARTIKLAR
// ============================================
export const articleBookmarksApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('article_bookmarks')
      .select('*')
      .order('bookmarked_at', { ascending: false })
    
    if (error) {
      handleStorageError(error, 'hämta bokmärken')
      // Fallback till localStorage
      return JSON.parse(localStorage.getItem('article_bookmarks') || '[]')
    }
    return data?.map(d => d.article_id) || []
  },

  async add(articleId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('[CloudStorage] Ingen användare inloggad - sparar till localStorage')
      const bookmarks = JSON.parse(localStorage.getItem('article_bookmarks') || '[]')
      if (!bookmarks.includes(articleId)) {
        bookmarks.push(articleId)
        localStorage.setItem('article_bookmarks', JSON.stringify(bookmarks))
      }
      return
    }

    const { error } = await supabase
      .from('article_bookmarks')
      .insert({ 
        user_id: user.id,
        article_id: articleId 
      })
    
    if (error) {
      handleStorageError(error, 'lägga till bokmärke')
      // Fallback till localStorage
      const bookmarks = JSON.parse(localStorage.getItem('article_bookmarks') || '[]')
      if (!bookmarks.includes(articleId)) {
        bookmarks.push(articleId)
        localStorage.setItem('article_bookmarks', JSON.stringify(bookmarks))
      }
      return
    }
  },

  async remove(articleId: string) {
    const { error } = await supabase
      .from('article_bookmarks')
      .delete()
      .eq('article_id', articleId)
    
    if (error) {
      handleStorageError(error, 'ta bort bokmärke')
      // Fallback till localStorage
      const bookmarks = JSON.parse(localStorage.getItem('article_bookmarks') || '[]')
      const filtered = bookmarks.filter((id: string) => id !== articleId)
      localStorage.setItem('article_bookmarks', JSON.stringify(filtered))
      return
    }
  },

  async isBookmarked(articleId: string) {
    const { data, error } = await supabase
      .from('article_bookmarks')
      .select('id')
      .eq('article_id', articleId)
      .single()
    
    if (error) {
      handleStorageError(error, 'kolla bokmärke')
      // Fallback till localStorage
      const bookmarks = JSON.parse(localStorage.getItem('article_bookmarks') || '[]')
      return bookmarks.includes(articleId)
    }
    return !!data
  }
}

export const articleProgressApi = {
  async get(articleId: string) {
    const { data, error } = await supabase
      .from('article_reading_progress')
      .select('*')
      .eq('article_id', articleId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async update(articleId: string, progress: number, isCompleted = false) {
    const updateData: any = {
      progress_percent: progress,
      updated_at: new Date().toISOString()
    }
    
    if (isCompleted) {
      updateData.is_completed = true
      updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('article_reading_progress')
      .upsert({
        article_id: articleId,
        ...updateData
      }, {
        onConflict: 'user_id,article_id'
      })
    
    // Kasta inte fel för RLS-policy fel (42501) - hanteras i komponenten
    if (error && error.code !== '42501') throw error
  },

  async pause(articleId: string) {
    const { error } = await supabase
      .from('article_reading_progress')
      .upsert({
        article_id: articleId,
        paused_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,article_id'
      })
    
    // Kasta inte fel för RLS-policy fel (42501) - hanteras i komponenten
    if (error && error.code !== '42501') throw error
  }
}

export const articleChecklistApi = {
  async get(articleId: string) {
    const { data, error } = await supabase
      .from('article_checklists')
      .select('checked_items')
      .eq('article_id', articleId)
      .single()
    
    if (error) {
      handleStorageError(error, 'hämta checklista')
      // Fallback till localStorage
      const checklists = JSON.parse(localStorage.getItem('article_checklists') || '{}')
      return checklists[articleId] || []
    }
    return data?.checked_items || []
  },

  async update(articleId: string, checkedItems: string[]) {
    const { error } = await supabase
      .from('article_checklists')
      .upsert({
        article_id: articleId,
        checked_items: checkedItems
      }, {
        onConflict: 'user_id,article_id'
      })
    
    if (error) {
      handleStorageError(error, 'uppdatera checklista')
      // Fallback till localStorage
      const checklists = JSON.parse(localStorage.getItem('article_checklists') || '{}')
      checklists[articleId] = checkedItems
      localStorage.setItem('article_checklists', JSON.stringify(checklists))
      return
    }
  }
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
      // Fallback till localStorage
      return JSON.parse(localStorage.getItem('dashboard_preferences') || 'null')
    }
    // Return first item or null
    return data?.[0] || null
  },

  async update(preferences: {
    visible_widgets?: string[]
    widget_sizes?: Record<string, string>
    widget_order?: string[]
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('[CloudStorage] Ingen användare inloggad - sparar till localStorage')
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
      // Fallback till localStorage
      localStorage.setItem('dashboard_preferences', JSON.stringify(preferences))
      return
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
      // Fallback till localStorage
      return JSON.parse(localStorage.getItem('user_preferences') || 'null')
    }
    // Return first item or null
    return data?.[0] || null
  },

  async update(preferences: {
    dark_mode?: boolean
    font_size?: string
    language?: string
    energy_level?: string
    onboarding_completed?: boolean
    onboarding_skipped?: boolean
    onboarding_progress?: any
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('[CloudStorage] Ingen användare inloggad - sparar till localStorage')
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
      return
    }
  }
}

// ============================================
// WELLNESS (HUMÖR & DAGBOK)
// ============================================
export const moodHistoryApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('mood_history')
      .select('*')
      .order('recorded_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async add(mood: number, note?: string) {
    const { error } = await supabase
      .from('mood_history')
      .insert({ mood, note })
    
    if (error) throw error
  },

  async getStats() {
    const { data, error } = await supabase
      .from('mood_history')
      .select('mood, recorded_at')
      .order('recorded_at', { ascending: false })
      .limit(30)
    
    if (error) throw error
    return data || []
  }
}

export const journalApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async add(content: string, mood?: number, tags?: string[]) {
    const { error } = await supabase
      .from('journal_entries')
      .insert({ content, mood, tags })
    
    if (error) throw error
  },

  async update(id: string, content: string, mood?: number, tags?: string[]) {
    const { error } = await supabase
      .from('journal_entries')
      .update({ content, mood, tags, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) throw error
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// ============================================
// INTRESSEGUIDE
// ============================================
export const interestGuideApi = {
  async getProgress() {
    const { data, error } = await supabase
      .from('interest_guide_progress')
      .select('*')
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async saveProgress(progress: {
    current_step?: number
    answers?: any
    energy_level?: string
    is_completed?: boolean
  }) {
    const { error } = await supabase
      .from('interest_guide_progress')
      .upsert(progress, {
        onConflict: 'user_id'
      })
    
    if (error) throw error
  },

  async reset() {
    const { error } = await supabase
      .from('interest_guide_progress')
      .delete()
    
    if (error) throw error
  }
}

// ============================================
// NOTIFIKATIONER
// ============================================
export const notificationsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getUnread() {
    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async markAsRead(id: string) {
    const { error } = await supabase
      .from('user_notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', id)
    
    if (error) throw error
  },

  async markAllAsRead() {
    const { error } = await supabase
      .from('user_notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('is_read', false)
    
    if (error) throw error
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('user_notifications')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async getPreferences() {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async updatePreferences(preferences: any) {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert(preferences, {
        onConflict: 'user_id'
      })
    
    if (error) throw error
  }
}

// ============================================
// DRAFTS (AUTOSAVE)
// ============================================
export const draftsApi = {
  async get(draftType: string, draftKey: string) {
    const { data, error } = await supabase
      .from('user_drafts')
      .select('data')
      .eq('draft_type', draftType)
      .eq('draft_key', draftKey)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data?.data
  },

  async save(draftType: string, draftKey: string, data: any) {
    const { error } = await supabase
      .from('user_drafts')
      .upsert({
        draft_type: draftType,
        draft_key: draftKey,
        data
      }, {
        onConflict: 'user_id,draft_type,draft_key'
      })
    
    if (error) throw error
  },

  async delete(draftType: string, draftKey: string) {
    const { error } = await supabase
      .from('user_drafts')
      .delete()
      .eq('draft_type', draftType)
      .eq('draft_key', draftKey)
    
    if (error) throw error
  },

  async getAllByType(draftType: string) {
    const { data, error } = await supabase
      .from('user_drafts')
      .select('*')
      .eq('draft_type', draftType)
      .order('updated_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}

// ============================================
// JOBBANSÖKNINGAR
// ============================================
export const jobApplicationsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async add(application: any) {
    const { data, error } = await supabase
      .from('job_applications')
      .insert(application)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: any) {
    const { error } = await supabase
      .from('job_applications')
      .update(updates)
      .eq('id', id)
    
    if (error) throw error
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async updateStatus(id: string, status: string) {
    const updates: any = { status }
    if (status === 'APPLIED') {
      updates.applied_at = new Date().toISOString()
    }
    
    const { error } = await supabase
      .from('job_applications')
      .update(updates)
      .eq('id', id)
    
    if (error) throw error
  }
}

// ============================================
// INTERVJU-FÖRBEREDELSER
// ============================================
export const interviewSessionsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(session: any) {
    const { data, error } = await supabase
      .from('interview_sessions')
      .insert(session)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: any) {
    const { error } = await supabase
      .from('interview_sessions')
      .update(updates)
      .eq('id', id)
    
    if (error) throw error
  }
}
