/**
 * Diary API - Cloud storage for diary, mood, goals, and gratitude
 */

import { supabase } from '@/lib/supabase'

// ============================================
// TYPES
// ============================================

export interface DiaryEntry {
  id: string
  user_id: string
  title: string | null
  content: string
  mood: number | null
  energy_level: number | null
  tags: string[]
  word_count: number
  entry_date: string
  entry_type: 'diary' | 'gratitude' | 'reflection' | 'goal'
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface MoodLog {
  id: string
  user_id: string
  log_date: string
  mood_level: number
  energy_level: number | null
  stress_level: number | null
  sleep_quality: number | null
  activities: string[]
  note: string | null
  created_at: string
  updated_at: string
}

export interface WeeklyGoal {
  id: string
  user_id: string
  week_start: string
  goal_text: string
  category: 'career' | 'health' | 'personal' | 'learning' | 'general'
  is_completed: boolean
  completed_at: string | null
  reflection: string | null
  priority: number
  created_at: string
  updated_at: string
}

export interface GratitudeEntry {
  id: string
  user_id: string
  entry_date: string
  item1: string
  item2: string | null
  item3: string | null
  reflection: string | null
  created_at: string
}

export interface DiaryStreaks {
  id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_entry_date: string | null
  total_entries: number
  total_words: number
  updated_at: string
}

export interface WritingPrompt {
  id: string
  prompt_text: string
  category: string
  is_active: boolean
}

// ============================================
// DIARY ENTRIES API
// ============================================

export const diaryEntriesApi = {
  async getAll(limit = 50, offset = 0): Promise<DiaryEntry[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching diary entries:', error)
      return []
    }
    return data || []
  },

  async getByType(entryType: string, limit = 50): Promise<DiaryEntry[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('entry_type', entryType)
      .order('entry_date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching diary entries by type:', error)
      return []
    }
    return data || []
  },

  async getByDateRange(startDate: string, endDate: string): Promise<DiaryEntry[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate)
      .order('entry_date', { ascending: false })

    if (error) {
      console.error('Error fetching diary entries by date range:', error)
      return []
    }
    return data || []
  },

  async searchByTags(tags: string[]): Promise<DiaryEntry[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', user.id)
      .overlaps('tags', tags)
      .order('entry_date', { ascending: false })

    if (error) {
      console.error('Error searching diary entries:', error)
      return []
    }
    return data || []
  },

  async create(entry: Omit<DiaryEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<DiaryEntry | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('diary_entries')
      .insert({
        ...entry,
        user_id: user.id,
        word_count: entry.content.split(/\s+/).filter(w => w).length
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating diary entry:', error)
      return null
    }

    // Update streaks
    await diaryStreaksApi.updateAfterEntry(entry.word_count || entry.content.split(/\s+/).filter(w => w).length)

    return data
  },

  async update(id: string, updates: Partial<DiaryEntry>): Promise<DiaryEntry | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Recalculate word count if content changed
    if (updates.content) {
      updates.word_count = updates.content.split(/\s+/).filter(w => w).length
    }

    const { data, error } = await supabase
      .from('diary_entries')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating diary entry:', error)
      return null
    }
    return data
  },

  async delete(id: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('diary_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting diary entry:', error)
      return false
    }
    return true
  },

  async toggleFavorite(id: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // Get current state
    const { data: current } = await supabase
      .from('diary_entries')
      .select('is_favorite')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!current) return false

    const { error } = await supabase
      .from('diary_entries')
      .update({ is_favorite: !current.is_favorite })
      .eq('id', id)
      .eq('user_id', user.id)

    return !error
  }
}

// ============================================
// MOOD LOGS API
// ============================================

export const moodLogsApi = {
  async getAll(limit = 30): Promise<MoodLog[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching mood logs:', error)
      return []
    }
    return data || []
  },

  async getByDateRange(startDate: string, endDate: string): Promise<MoodLog[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('log_date', startDate)
      .lte('log_date', endDate)
      .order('log_date', { ascending: true })

    if (error) {
      console.error('Error fetching mood logs by date:', error)
      return []
    }
    return data || []
  },

  async getToday(): Promise<MoodLog | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('log_date', today)
      .maybeSingle()

    if (error) {
      console.warn('Could not fetch today mood:', error.message)
      return null
    }
    return data
  },

  async upsert(log: Omit<MoodLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<MoodLog | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('mood_logs')
      .upsert({
        ...log,
        user_id: user.id
      }, {
        onConflict: 'user_id,log_date'
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting mood log:', error)
      return null
    }
    return data
  },

  async delete(id: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('mood_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    return !error
  }
}

// ============================================
// WEEKLY GOALS API
// ============================================

export const weeklyGoalsApi = {
  async getCurrentWeek(): Promise<WeeklyGoal[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get Monday of current week
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    const weekStart = monday.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('weekly_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .order('priority', { ascending: true })

    if (error) {
      console.error('Error fetching weekly goals:', error)
      return []
    }
    return data || []
  },

  async getByWeek(weekStart: string): Promise<WeeklyGoal[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('weekly_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .order('priority', { ascending: true })

    if (error) {
      console.error('Error fetching weekly goals:', error)
      return []
    }
    return data || []
  },

  async create(goal: { goal_text: string; category?: string; priority?: number }): Promise<WeeklyGoal | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Get Monday of current week
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    const weekStart = monday.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('weekly_goals')
      .insert({
        ...goal,
        user_id: user.id,
        week_start: weekStart
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating weekly goal:', error)
      return null
    }
    return data
  },

  async toggleComplete(id: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // Get current state
    const { data: current } = await supabase
      .from('weekly_goals')
      .select('is_completed')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!current) return false

    const { error } = await supabase
      .from('weekly_goals')
      .update({
        is_completed: !current.is_completed,
        completed_at: !current.is_completed ? new Date().toISOString() : null
      })
      .eq('id', id)
      .eq('user_id', user.id)

    return !error
  },

  async addReflection(id: string, reflection: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('weekly_goals')
      .update({ reflection })
      .eq('id', id)
      .eq('user_id', user.id)

    return !error
  },

  async delete(id: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('weekly_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    return !error
  }
}

// ============================================
// GRATITUDE ENTRIES API
// ============================================

export const gratitudeApi = {
  async getAll(limit = 30): Promise<GratitudeEntry[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('gratitude_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching gratitude entries:', error)
      return []
    }
    return data || []
  },

  async getToday(): Promise<GratitudeEntry | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('gratitude_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('entry_date', today)
      .maybeSingle()

    if (error) {
      console.warn('Could not fetch today gratitude:', error.message)
      return null
    }
    return data
  },

  async create(entry: { item1: string; item2?: string; item3?: string; reflection?: string }): Promise<GratitudeEntry | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('gratitude_entries')
      .insert({
        ...entry,
        user_id: user.id,
        entry_date: today
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating gratitude entry:', error)
      return null
    }
    return data
  },

  async update(id: string, updates: Partial<GratitudeEntry>): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('gratitude_entries')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)

    return !error
  }
}

// ============================================
// DIARY STREAKS API
// ============================================

export const diaryStreaksApi = {
  async get(): Promise<DiaryStreaks | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('diary_streaks')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      // Table might not exist yet - return default values
      console.warn('Could not fetch diary streaks:', error.message)
      return null
    }
    return data
  },

  async updateAfterEntry(wordCount: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]

    // Get current streaks
    let streaks = await this.get()

    if (!streaks) {
      // Create new streaks record
      await supabase
        .from('diary_streaks')
        .insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_entry_date: today,
          total_entries: 1,
          total_words: wordCount
        })
      return
    }

    // Calculate new streak
    const lastDate = streaks.last_entry_date ? new Date(streaks.last_entry_date) : null
    const todayDate = new Date(today)
    let newStreak = streaks.current_streak

    if (lastDate) {
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        // Same day, don't change streak
      } else if (diffDays === 1) {
        // Consecutive day
        newStreak = streaks.current_streak + 1
      } else {
        // Streak broken
        newStreak = 1
      }
    }

    const newLongest = Math.max(newStreak, streaks.longest_streak)

    await supabase
      .from('diary_streaks')
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_entry_date: today,
        total_entries: streaks.total_entries + 1,
        total_words: streaks.total_words + wordCount
      })
      .eq('user_id', user.id)
  }
}

// ============================================
// WRITING PROMPTS API
// ============================================

// Default writing prompts if table doesn't exist
const DEFAULT_PROMPTS: WritingPrompt[] = [
  { id: '1', prompt_text: 'Vad är du mest tacksam för idag?', category: 'gratitude', is_active: true },
  { id: '2', prompt_text: 'Beskriv ett ögonblick som gjorde dig glad idag.', category: 'reflection', is_active: true },
  { id: '3', prompt_text: 'Vilka är dina tre viktigaste mål just nu?', category: 'career', is_active: true },
  { id: '4', prompt_text: 'Vad har du lärt dig den senaste veckan?', category: 'reflection', is_active: true },
  { id: '5', prompt_text: 'Beskriv din perfekta arbetsdag.', category: 'career', is_active: true },
]

export const writingPromptsApi = {
  async getRandom(category?: string): Promise<WritingPrompt | null> {
    try {
      let query = supabase
        .from('writing_prompts')
        .select('*')
        .eq('is_active', true)

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error || !data || data.length === 0) {
        // Use default prompts as fallback
        const filtered = category
          ? DEFAULT_PROMPTS.filter(p => p.category === category)
          : DEFAULT_PROMPTS
        return filtered[Math.floor(Math.random() * filtered.length)] || DEFAULT_PROMPTS[0]
      }

      // Return random prompt
      return data[Math.floor(Math.random() * data.length)]
    } catch (err) {
      // Return default prompt on any error
      return DEFAULT_PROMPTS[Math.floor(Math.random() * DEFAULT_PROMPTS.length)]
    }
  },

  async getAll(): Promise<WritingPrompt[]> {
    try {
      const { data, error } = await supabase
        .from('writing_prompts')
        .select('*')
        .eq('is_active', true)

      if (error || !data || data.length === 0) {
        return DEFAULT_PROMPTS
      }
      return data
    } catch (err) {
      return DEFAULT_PROMPTS
    }
  }
}
