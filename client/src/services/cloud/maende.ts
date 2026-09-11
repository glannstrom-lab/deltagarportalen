/**
 * Mående: humörhistorik (mood_history), dagbok (journal_entries), dagens humör
 * (mood_logs, art. 9-data bakom hälsosamtycket) och wellness-datan i
 * user_preferences. Alla fyra i samma fil eftersom journalApi får
 * getWellnessData/saveWellnessData från wellnessDataApi via Object.assign
 * längst ned — det kräver samma modul, annars en importcirkel.
 */

import { supabase } from '@/lib/supabase'
import { storageLogger } from '@/lib/logger'
import { getCurrentUser, handleStorageError } from './_shared'

interface MoodLogData {
  mood_level: number
  note?: string
  log_date: string
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
      .select('mood_level, note')
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
      note: data.note
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
        note: note,
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
      .select('mood_level, note, log_date')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
      .limit(days)

    if (error) {
      handleStorageError(error, 'hämta humörhistorik')
      return []
    }
    return (data || []).map((d: MoodLogData) => ({
      mood: moodLevelToType(d.mood_level),
      note: d.note,
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

    const dates = data.map((d: MoodLogData) => {
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
