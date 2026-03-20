/**
 * Cloud Storage Service
 * Centraliserad hantering av all datalagring i molnet (Supabase)
 * Ersätter all localStorage-användning
 * 
 * OBS: Alla funktioner hanterar RLS-fel (42501) genom att falla tillbaka på localStorage
 */

import { supabase } from '@/lib/supabase'
import { storageLogger } from '@/lib/logger'

// Hjälpfunktion för att hämta aktuell användare
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Hjälpfunktion för att hantera fel
function handleStorageError(error: any, context: string): void {
  // RLS-policy fel (42501) - logga tyst
  if (error?.code === '42501') {
    storageLogger.debug(`RLS policy förhindrar ${context} - använder fallback`)
    return
  }
  // Användaren inte inloggad
  if (error?.code === 'PGRST116' || error?.status === 401 || error?.status === 406) {
    storageLogger.debug(`Användare inte inloggad för ${context} - använder fallback`)
    return
  }
  // Andra fel - logga för debugging
  storageLogger.error(`Fel vid ${context}:`, error)
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
      return JSON.parse(localStorage.getItem('article_bookmarks') || '[]')
    }
    return data?.map(d => d.article_id) || []
  },

  async add(articleId: string) {
    const user = await getCurrentUser()
    if (!user) {
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
      const bookmarks = JSON.parse(localStorage.getItem('article_bookmarks') || '[]')
      if (!bookmarks.includes(articleId)) {
        bookmarks.push(articleId)
        localStorage.setItem('article_bookmarks', JSON.stringify(bookmarks))
      }
    }
  },

  async remove(articleId: string) {
    const user = await getCurrentUser()
    if (!user) {
      const bookmarks = JSON.parse(localStorage.getItem('article_bookmarks') || '[]')
      const filtered = bookmarks.filter((id: string) => id !== articleId)
      localStorage.setItem('article_bookmarks', JSON.stringify(filtered))
      return
    }

    const { error } = await supabase
      .from('article_bookmarks')
      .delete()
      .eq('article_id', articleId)
      .eq('user_id', user.id)
    
    if (error) {
      handleStorageError(error, 'ta bort bokmärke')
      const bookmarks = JSON.parse(localStorage.getItem('article_bookmarks') || '[]')
      const filtered = bookmarks.filter((id: string) => id !== articleId)
      localStorage.setItem('article_bookmarks', JSON.stringify(filtered))
    }
  },

  async isBookmarked(articleId: string) {
    const user = await getCurrentUser()
    if (!user) {
      const bookmarks = JSON.parse(localStorage.getItem('article_bookmarks') || '[]')
      return bookmarks.includes(articleId)
    }

    const { data, error } = await supabase
      .from('article_bookmarks')
      .select('id')
      .eq('article_id', articleId)
      .eq('user_id', user.id)
      .limit(1)
    
    if (error) {
      handleStorageError(error, 'kolla bokmärke')
      const bookmarks = JSON.parse(localStorage.getItem('article_bookmarks') || '[]')
      return bookmarks.includes(articleId)
    }
    return data && data.length > 0
  }
}

export const articleProgressApi = {
  async get(articleId: string) {
    const user = await getCurrentUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('article_reading_progress')
      .select('*')
      .eq('article_id', articleId)
      .eq('user_id', user.id)
      .limit(1)
    
    if (error && error.code !== 'PGRST116') {
      storageLogger.error('Error getting progress:', error)
    }
    return data?.[0] || null
  },

  async update(articleId: string, progress: number, isCompleted = false) {
    const user = await getCurrentUser()
    if (!user) return

    const updateData: any = {
      user_id: user.id,
      article_id: articleId,
      progress_percent: progress,
      updated_at: new Date().toISOString()
    }
    
    if (isCompleted) {
      updateData.is_completed = true
      updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('article_reading_progress')
      .upsert(updateData, {
        onConflict: 'user_id,article_id'
      })
    
    if (error && error.code !== '42501') {
      storageLogger.error('Error updating progress:', error)
    }
  },

  async pause(articleId: string) {
    const user = await getCurrentUser()
    if (!user) return

    const { error } = await supabase
      .from('article_reading_progress')
      .upsert({
        user_id: user.id,
        article_id: articleId,
        paused_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,article_id'
      })
    
    if (error && error.code !== '42501') {
      storageLogger.error('Error pausing progress:', error)
    }
  }
}

export const articleChecklistApi = {
  async get(articleId: string) {
    const user = await getCurrentUser()
    if (!user) {
      const checklists = JSON.parse(localStorage.getItem('article_checklists') || '{}')
      return checklists[articleId] || []
    }

    const { data, error } = await supabase
      .from('article_checklists')
      .select('checked_items')
      .eq('article_id', articleId)
      .eq('user_id', user.id)
      .limit(1)
    
    if (error) {
      handleStorageError(error, 'hämta checklista')
      const checklists = JSON.parse(localStorage.getItem('article_checklists') || '{}')
      return checklists[articleId] || []
    }
    return data?.[0]?.checked_items || []
  },

  async update(articleId: string, checkedItems: string[]) {
    const user = await getCurrentUser()
    if (!user) {
      const checklists = JSON.parse(localStorage.getItem('article_checklists') || '{}')
      checklists[articleId] = checkedItems
      localStorage.setItem('article_checklists', JSON.stringify(checklists))
      return
    }

    const { error } = await supabase
      .from('article_checklists')
      .upsert({
        user_id: user.id,
        article_id: articleId,
        checked_items: checkedItems,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,article_id'
      })
    
    if (error) {
      handleStorageError(error, 'uppdatera checklista')
      const checklists = JSON.parse(localStorage.getItem('article_checklists') || '{}')
      checklists[articleId] = checkedItems
      localStorage.setItem('article_checklists', JSON.stringify(checklists))
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
    onboarding_progress?: any
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
      .order('created_at', { ascending: false })
    
    if (error) {
      handleStorageError(error, 'hämta humörhistorik')
      return []
    }
    return data || []
  },

  async add(mood: number, note?: string) {
    const user = await getCurrentUser()
    if (!user) {
      storageLogger.debug('Ingen användare inloggad - humör sparas inte')
      return
    }

    const { error } = await supabase
      .from('mood_history')
      .insert({
        user_id: user.id,
        mood,
        note
      })
    
    if (error) {
      handleStorageError(error, 'lägga till humör')
    }
  },

  async getStats() {
    const { data, error } = await supabase
      .from('mood_history')
      .select('mood, created_at')
      .order('created_at', { ascending: false })
      .limit(30)
    
    if (error) {
      handleStorageError(error, 'hämta humörstatistik')
      return []
    }
    return data || []
  }
}

export const journalApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      handleStorageError(error, 'hämta dagboksinlägg')
      return []
    }
    return data || []
  },

  async add(content: string, mood?: number, tags?: string[]) {
    const user = await getCurrentUser()
    if (!user) {
      storageLogger.debug('Ingen användare inloggad - dagbok sparas inte')
      return
    }

    const { error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        content,
        mood,
        tags
      })
    
    if (error) {
      handleStorageError(error, 'lägga till dagboksinlägg')
    }
  },

  async update(id: string, content: string, mood?: number, tags?: string[]) {
    const { error } = await supabase
      .from('journal_entries')
      .update({ content, mood, tags, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) {
      handleStorageError(error, 'uppdatera dagboksinlägg')
    }
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)
    
    if (error) {
      handleStorageError(error, 'ta bort dagboksinlägg')
    }
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
      .limit(1)
    
    if (error && error.code !== 'PGRST116') {
      storageLogger.error('Error getting interest guide progress:', error)
    }
    return data?.[0] || null
  },

  async saveProgress(progress: {
    current_step?: number
    answers?: any
    energy_level?: string
    is_completed?: boolean
  }) {
    const user = await getCurrentUser()
    if (!user) {
      storageLogger.debug('Ingen användare inloggad - intresseguide sparas inte')
      return
    }

    const { error } = await supabase
      .from('interest_guide_progress')
      .upsert({
        user_id: user.id,
        ...progress,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
    
    if (error) {
      handleStorageError(error, 'spara intresseguide')
    }
  },

  async reset() {
    const user = await getCurrentUser()
    if (!user) return

    const { error } = await supabase
      .from('interest_guide_progress')
      .delete()
      .eq('user_id', user.id)
    
    if (error) {
      handleStorageError(error, 'återställa intresseguide')
    }
  }
}

// ============================================
// NOTIFIKATIONER
// ============================================
export const notificationsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      handleStorageError(error, 'hämta notifikationer')
      return []
    }
    return data || []
  },

  async getUnread() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
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

  async updatePreferences(preferences: any) {
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

  async save(draftType: string, draftKey: string, data: any) {
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

// ============================================
// JOBBANSÖKNINGAR
// ============================================
export const jobApplicationsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      handleStorageError(error, 'hämta jobbansökningar')
      return []
    }
    return data || []
  },

  async add(application: any) {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Användaren måste vara inloggad för att lägga till jobbansökning')
    }

    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        ...application,
        user_id: user.id
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: any) {
    const { error } = await supabase
      .from('job_applications')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
    
    if (error) {
      handleStorageError(error, 'uppdatera jobbansökning')
    }
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', id)
    
    if (error) {
      handleStorageError(error, 'ta bort jobbansökning')
    }
  },

  async updateStatus(id: string, status: string) {
    const updates: any = { 
      status,
      updated_at: new Date().toISOString()
    }
    if (status === 'applied') {
      updates.applied_at = new Date().toISOString()
    }
    
    const { error } = await supabase
      .from('job_applications')
      .update(updates)
      .eq('id', id)
    
    if (error) {
      handleStorageError(error, 'uppdatera jobbansökningsstatus')
    }
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
    
    if (error) {
      handleStorageError(error, 'hämta intervjusessioner')
      return []
    }
    return data || []
  },

  async create(session: any) {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Användaren måste vara inloggad för att skapa intervjusession')
    }

    const { data, error } = await supabase
      .from('interview_sessions')
      .insert({
        ...session,
        user_id: user.id
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: any) {
    const { error } = await supabase
      .from('interview_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
    
    if (error) {
      handleStorageError(error, 'uppdatera intervjusession')
    }
  }
}


// ============================================
// SPARADE JOBB (för CoverLetterGenerator)
// ============================================
export const savedJobsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      handleStorageError(error, 'hämta sparade jobb')
      // Fallback till localStorage
      return JSON.parse(localStorage.getItem('savedJobs') || '[]')
    }
    return data || []
  },

  async add(job: any) {
    const user = await getCurrentUser()
    if (!user) {
      const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]')
      saved.push(job)
      localStorage.setItem('savedJobs', JSON.stringify(saved))
      return job
    }

    const { data, error } = await supabase
      .from('saved_jobs')
      .insert({
        user_id: user.id,
        job_id: job.id,
        job_data: job
      })
      .select()
      .single()
    
    if (error) {
      handleStorageError(error, 'spara jobb')
      const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]')
      saved.push(job)
      localStorage.setItem('savedJobs', JSON.stringify(saved))
      return job
    }
    return data
  },

  async remove(jobId: string) {
    const user = await getCurrentUser()
    if (!user) {
      const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]')
      const filtered = saved.filter((j: any) => j.id !== jobId)
      localStorage.setItem('savedJobs', JSON.stringify(filtered))
      return
    }

    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('job_id', jobId)
      .eq('user_id', user.id)
    
    if (error) {
      handleStorageError(error, 'ta bort sparat jobb')
      const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]')
      const filtered = saved.filter((j: any) => j.id !== jobId)
      localStorage.setItem('savedJobs', JSON.stringify(filtered))
    }
  },

  async isSaved(jobId: string) {
    const user = await getCurrentUser()
    if (!user) {
      const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]')
      return saved.some((j: any) => j.id === jobId)
    }

    const { data, error } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('job_id', jobId)
      .eq('user_id', user.id)
      .limit(1)
    
    if (error) {
      handleStorageError(error, 'kolla om jobb är sparat')
      const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]')
      return saved.some((j: any) => j.id === jobId)
    }
    return data && data.length > 0
  }
}

// ============================================
// PLATSBANKEN (sparade jobb och sökningar)
// ============================================
export const platsbankenApi = {
  // Sparade jobb
  async getSavedJobs() {
    const { data, error } = await supabase
      .from('platsbanken_saved_jobs')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      handleStorageError(error, 'hämta platsbanken-sparade jobb')
      return JSON.parse(localStorage.getItem('platsbanken_saved_jobs') || '[]')
    }
    return data?.map((d: any) => d.job_data) || []
  },

  async saveJob(job: any) {
    const user = await getCurrentUser()
    if (!user) {
      const saved = JSON.parse(localStorage.getItem('platsbanken_saved_jobs') || '[]')
      if (!saved.find((j: any) => j.id === job.id)) {
        saved.push(job)
        localStorage.setItem('platsbanken_saved_jobs', JSON.stringify(saved))
      }
      return job
    }

    const { error } = await supabase
      .from('platsbanken_saved_jobs')
      .insert({
        user_id: user.id,
        job_id: job.id,
        job_data: job
      })
    
    if (error) {
      handleStorageError(error, 'spara platsbanken-jobb')
      const saved = JSON.parse(localStorage.getItem('platsbanken_saved_jobs') || '[]')
      if (!saved.find((j: any) => j.id === job.id)) {
        saved.push(job)
        localStorage.setItem('platsbanken_saved_jobs', JSON.stringify(saved))
      }
    }
    return job
  },

  async removeSavedJob(jobId: string) {
    const user = await getCurrentUser()
    if (!user) {
      const saved = JSON.parse(localStorage.getItem('platsbanken_saved_jobs') || '[]')
      const filtered = saved.filter((j: any) => j.id !== jobId)
      localStorage.setItem('platsbanken_saved_jobs', JSON.stringify(filtered))
      return
    }

    const { error } = await supabase
      .from('platsbanken_saved_jobs')
      .delete()
      .eq('job_id', jobId)
      .eq('user_id', user.id)
    
    if (error) {
      handleStorageError(error, 'ta bort platsbanken-sparat jobb')
      const saved = JSON.parse(localStorage.getItem('platsbanken_saved_jobs') || '[]')
      const filtered = saved.filter((j: any) => j.id !== jobId)
      localStorage.setItem('platsbanken_saved_jobs', JSON.stringify(filtered))
    }
  },

  // Sparade sökningar
  async getSavedSearches() {
    const { data, error } = await supabase
      .from('platsbanken_saved_searches')
      .select('*')
      .order('updated_at', { ascending: false })
    
    if (error) {
      handleStorageError(error, 'hämta sparade sökningar')
      return JSON.parse(localStorage.getItem('platsbanken_saved_searches') || '[]')
    }
    return data || []
  },

  async saveSearch(search: any) {
    const user = await getCurrentUser()
    if (!user) {
      const searches = JSON.parse(localStorage.getItem('platsbanken_saved_searches') || '[]')
      searches.push(search)
      localStorage.setItem('platsbanken_saved_searches', JSON.stringify(searches))
      return search
    }

    const { data, error } = await supabase
      .from('platsbanken_saved_searches')
      .insert({
        user_id: user.id,
        name: search.name,
        query: search.query,
        municipality: search.municipality,
        employment_type: search.employment_type,
        remote: search.remote
      })
      .select()
      .single()
    
    if (error) {
      handleStorageError(error, 'spara sökning')
      const searches = JSON.parse(localStorage.getItem('platsbanken_saved_searches') || '[]')
      searches.push(search)
      localStorage.setItem('platsbanken_saved_searches', JSON.stringify(searches))
      return search
    }
    return data
  },

  async removeSavedSearch(searchId: string) {
    const user = await getCurrentUser()
    if (!user) {
      const searches = JSON.parse(localStorage.getItem('platsbanken_saved_searches') || '[]')
      const filtered = searches.filter((s: any) => s.id !== searchId)
      localStorage.setItem('platsbanken_saved_searches', JSON.stringify(filtered))
      return
    }

    const { error } = await supabase
      .from('platsbanken_saved_searches')
      .delete()
      .eq('id', searchId)
      .eq('user_id', user.id)
    
    if (error) {
      handleStorageError(error, 'ta bort sparad sökning')
      const searches = JSON.parse(localStorage.getItem('platsbanken_saved_searches') || '[]')
      const filtered = searches.filter((s: any) => s.id !== searchId)
      localStorage.setItem('platsbanken_saved_searches', JSON.stringify(filtered))
    }
  }
}

// ============================================
// DARK MODE INSTÄLLNINGAR
// ============================================
export const darkModeApi = {
  async get() {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('dark_mode')
      .limit(1)
    
    if (error) {
      handleStorageError(error, 'hämta dark mode')
      return localStorage.getItem('darkMode') === 'true'
    }
    return data?.[0]?.dark_mode ?? false
  },

  async set(isDark: boolean) {
    const user = await getCurrentUser()
    if (!user) {
      localStorage.setItem('darkMode', isDark.toString())
      return
    }

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        dark_mode: isDark,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
    
    if (error) {
      handleStorageError(error, 'spara dark mode')
      localStorage.setItem('darkMode', isDark.toString())
    }
  }
}

// ============================================
// MOOD LOGGING (Humör)
// ============================================
export type MoodType = 'great' | 'good' | 'okay' | 'bad' | 'terrible'

// Konvertera mood_level (1-5) till MoodType
function moodLevelToType(level: number): MoodType {
  switch (level) {
    case 5: return 'great'
    case 4: return 'good'
    case 3: return 'okay'
    case 2: return 'bad'
    case 1: return 'terrible'
    default: return 'okay'
  }
}

// Konvertera MoodType till mood_level (1-5)
function moodTypeToLevel(mood: MoodType): number {
  switch (mood) {
    case 'great': return 5
    case 'good': return 4
    case 'okay': return 3
    case 'bad': return 2
    case 'terrible': return 1
    default: return 3
  }
}

export const moodApi = {
  async getTodaysMood(): Promise<{ mood: MoodType; note?: string } | null> {
    const user = await getCurrentUser()
    if (!user) return null

    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('mood_logs')
      .select('mood_level, notes')
      .eq('user_id', user.id)
      .eq('log_date', today)
      .maybeSingle()

    if (error) {
      handleStorageError(error, 'hämta dagens humör')
      return null
    }
    if (!data) return null
    return {
      mood: moodLevelToType(data.mood_level),
      note: data.notes
    }
  },

  async logMood(mood: MoodType, note?: string): Promise<boolean> {
    const user = await getCurrentUser()
    if (!user) {
      storageLogger.debug('Ingen användare inloggad - humör sparas inte')
      return false
    }

    const today = new Date().toISOString().split('T')[0]
    const { error } = await supabase
      .from('mood_logs')
      .upsert({
        user_id: user.id,
        mood_level: moodTypeToLevel(mood),
        notes: note,
        log_date: today
      }, {
        onConflict: 'user_id,log_date'
      })

    if (error) {
      handleStorageError(error, 'logga humör')
      return false
    }
    return true
  },

  async getHistory(days: number = 30): Promise<{ mood: MoodType; note?: string; logged_at: string }[]> {
    const user = await getCurrentUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('mood_logs')
      .select('mood_level, notes, log_date')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
      .limit(days)

    if (error) {
      handleStorageError(error, 'hämta humörhistorik')
      return []
    }
    return (data || []).map((d: any) => ({
      mood: moodLevelToType(d.mood_level),
      note: d.notes,
      logged_at: d.log_date
    }))
  },

  async getStreak(): Promise<number> {
    const user = await getCurrentUser()
    if (!user) return 0

    // Beräkna streak manuellt istället för RPC
    const { data, error } = await supabase
      .from('mood_logs')
      .select('log_date')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
      .limit(365)

    if (error) {
      handleStorageError(error, 'hämta humör-streak')
      return 0
    }

    if (!data || data.length === 0) return 0

    // Räkna streak från idag eller igår bakåt
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dates = data.map((d: any) => {
      const date = new Date(d.log_date)
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    })

    // Kolla om vi har en loggning idag eller igår
    const todayTime = today.getTime()
    const yesterdayTime = todayTime - 86400000

    let checkDate = todayTime
    if (!dates.includes(todayTime)) {
      if (dates.includes(yesterdayTime)) {
        checkDate = yesterdayTime
      } else {
        return 0 // Ingen streak om vi inte loggat idag eller igår
      }
    }

    // Räkna streak bakåt
    while (dates.includes(checkDate)) {
      streak++
      checkDate -= 86400000
    }

    return streak
  }
}

// ============================================
// WELLNESS DATA (Aktiviteter & Reflektioner)
// ============================================
export const wellnessDataApi = {
  async get(): Promise<{ activities?: Record<string, boolean>; reflections?: string[] } | null> {
    const user = await getCurrentUser()
    if (!user) {
      const data = localStorage.getItem('wellness_data')
      return data ? JSON.parse(data) : null
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('wellness_data')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      handleStorageError(error, 'hämta wellness data')
      const localData = localStorage.getItem('wellness_data')
      return localData ? JSON.parse(localData) : null
    }
    return data?.wellness_data || null
  },

  async save(wellnessData: { activities?: Record<string, boolean>; reflections?: string[] }): Promise<void> {
    const user = await getCurrentUser()
    if (!user) {
      localStorage.setItem('wellness_data', JSON.stringify(wellnessData))
      return
    }

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        wellness_data: wellnessData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      handleStorageError(error, 'spara wellness data')
      localStorage.setItem('wellness_data', JSON.stringify(wellnessData))
    }
  }
}

// Legacy support for journalApi.getWellnessData/saveWellnessData
Object.assign(journalApi, {
  getWellnessData: wellnessDataApi.get,
  saveWellnessData: wellnessDataApi.save
})

// ============================================
// ONBOARDING PROGRESS
// ============================================
export const onboardingApi = {
  async getProgress() {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('onboarding_progress, onboarding_completed, onboarding_skipped')
      .limit(1)
    
    if (error) {
      handleStorageError(error, 'hämta onboarding progress')
      return {
        progress: parseInt(localStorage.getItem('onboarding-progress-v2') || '0'),
        completed: localStorage.getItem('has-seen-onboarding-v2') === 'true',
        skipped: localStorage.getItem('onboarding-skipped-v2') === 'true'
      }
    }
    return {
      progress: data?.[0]?.onboarding_progress || 0,
      completed: data?.[0]?.onboarding_completed || false,
      skipped: data?.[0]?.onboarding_skipped || false
    }
  },

  async saveProgress(progress: number, completed: boolean, skipped: boolean = false) {
    const user = await getCurrentUser()
    if (!user) {
      localStorage.setItem('onboarding-progress-v2', progress.toString())
      localStorage.setItem('has-seen-onboarding-v2', completed.toString())
      localStorage.setItem('onboarding-skipped-v2', skipped.toString())
      return
    }

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        onboarding_progress: progress,
        onboarding_completed: completed,
        onboarding_skipped: skipped,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
    
    if (error) {
      handleStorageError(error, 'spara onboarding progress')
      localStorage.setItem('onboarding-progress-v2', progress.toString())
      localStorage.setItem('has-seen-onboarding-v2', completed.toString())
      localStorage.setItem('onboarding-skipped-v2', skipped.toString())
    }
  }
}
