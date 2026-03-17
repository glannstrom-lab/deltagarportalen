/**
 * useDiary - Hook for managing diary entries and related data
 */

import { useState, useEffect, useCallback } from 'react'
import {
  diaryEntriesApi,
  moodLogsApi,
  weeklyGoalsApi,
  gratitudeApi,
  diaryStreaksApi,
  writingPromptsApi,
  type DiaryEntry,
  type MoodLog,
  type WeeklyGoal,
  type GratitudeEntry,
  type DiaryStreaks,
  type WritingPrompt
} from '@/services/diaryApi'

// ============================================
// DIARY ENTRIES HOOK
// ============================================

export function useDiaryEntries() {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEntries = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await diaryEntriesApi.getAll()
      setEntries(data)
    } catch (err) {
      setError('Kunde inte ladda dagboksinlägg')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const createEntry = async (entry: Omit<DiaryEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newEntry = await diaryEntriesApi.create(entry)
    if (newEntry) {
      setEntries(prev => [newEntry, ...prev])
    }
    return newEntry
  }

  const updateEntry = async (id: string, updates: Partial<DiaryEntry>) => {
    const updated = await diaryEntriesApi.update(id, updates)
    if (updated) {
      setEntries(prev => prev.map(e => e.id === id ? updated : e))
    }
    return updated
  }

  const deleteEntry = async (id: string) => {
    const success = await diaryEntriesApi.delete(id)
    if (success) {
      setEntries(prev => prev.filter(e => e.id !== id))
    }
    return success
  }

  const toggleFavorite = async (id: string) => {
    const success = await diaryEntriesApi.toggleFavorite(id)
    if (success) {
      setEntries(prev => prev.map(e =>
        e.id === id ? { ...e, is_favorite: !e.is_favorite } : e
      ))
    }
    return success
  }

  const searchByTags = async (tags: string[]) => {
    const results = await diaryEntriesApi.searchByTags(tags)
    return results
  }

  return {
    entries,
    isLoading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    toggleFavorite,
    searchByTags,
    refresh: loadEntries
  }
}

// ============================================
// MOOD LOGS HOOK
// ============================================

export function useMoodLogs() {
  const [logs, setLogs] = useState<MoodLog[]>([])
  const [todayMood, setTodayMood] = useState<MoodLog | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const [allLogs, today] = await Promise.all([
        moodLogsApi.getAll(30),
        moodLogsApi.getToday()
      ])
      setLogs(allLogs)
      setTodayMood(today)
    } catch (err) {
      console.error('Error loading mood logs:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const logMood = async (log: Omit<MoodLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newLog = await moodLogsApi.upsert(log)
    if (newLog) {
      setTodayMood(newLog)
      // Update logs list
      setLogs(prev => {
        const exists = prev.find(l => l.log_date === newLog.log_date)
        if (exists) {
          return prev.map(l => l.log_date === newLog.log_date ? newLog : l)
        }
        return [newLog, ...prev]
      })
    }
    return newLog
  }

  const getByDateRange = async (startDate: string, endDate: string) => {
    return await moodLogsApi.getByDateRange(startDate, endDate)
  }

  // Calculate statistics
  const stats = {
    averageMood: logs.length > 0
      ? logs.reduce((sum, l) => sum + l.mood_level, 0) / logs.length
      : 0,
    averageEnergy: logs.filter(l => l.energy_level).length > 0
      ? logs.filter(l => l.energy_level).reduce((sum, l) => sum + (l.energy_level || 0), 0) / logs.filter(l => l.energy_level).length
      : 0,
    averageStress: logs.filter(l => l.stress_level).length > 0
      ? logs.filter(l => l.stress_level).reduce((sum, l) => sum + (l.stress_level || 0), 0) / logs.filter(l => l.stress_level).length
      : 0,
    totalLogs: logs.length
  }

  return {
    logs,
    todayMood,
    isLoading,
    logMood,
    getByDateRange,
    stats,
    refresh: loadLogs
  }
}

// ============================================
// WEEKLY GOALS HOOK
// ============================================

export function useWeeklyGoals() {
  const [goals, setGoals] = useState<WeeklyGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadGoals = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await weeklyGoalsApi.getCurrentWeek()
      setGoals(data)
    } catch (err) {
      console.error('Error loading weekly goals:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGoals()
  }, [loadGoals])

  const createGoal = async (goal: { goal_text: string; category?: string; priority?: number }) => {
    const newGoal = await weeklyGoalsApi.create(goal)
    if (newGoal) {
      setGoals(prev => [...prev, newGoal])
    }
    return newGoal
  }

  const toggleComplete = async (id: string) => {
    const success = await weeklyGoalsApi.toggleComplete(id)
    if (success) {
      setGoals(prev => prev.map(g =>
        g.id === id ? { ...g, is_completed: !g.is_completed, completed_at: !g.is_completed ? new Date().toISOString() : null } : g
      ))
    }
    return success
  }

  const addReflection = async (id: string, reflection: string) => {
    const success = await weeklyGoalsApi.addReflection(id, reflection)
    if (success) {
      setGoals(prev => prev.map(g =>
        g.id === id ? { ...g, reflection } : g
      ))
    }
    return success
  }

  const deleteGoal = async (id: string) => {
    const success = await weeklyGoalsApi.delete(id)
    if (success) {
      setGoals(prev => prev.filter(g => g.id !== id))
    }
    return success
  }

  // Statistics
  const completedCount = goals.filter(g => g.is_completed).length
  const totalCount = goals.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return {
    goals,
    isLoading,
    createGoal,
    toggleComplete,
    addReflection,
    deleteGoal,
    completedCount,
    totalCount,
    progress,
    refresh: loadGoals
  }
}

// ============================================
// GRATITUDE HOOK
// ============================================

export function useGratitude() {
  const [entries, setEntries] = useState<GratitudeEntry[]>([])
  const [todayEntry, setTodayEntry] = useState<GratitudeEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadEntries = useCallback(async () => {
    setIsLoading(true)
    try {
      const [allEntries, today] = await Promise.all([
        gratitudeApi.getAll(30),
        gratitudeApi.getToday()
      ])
      setEntries(allEntries)
      setTodayEntry(today)
    } catch (err) {
      console.error('Error loading gratitude entries:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const createEntry = async (entry: { item1: string; item2?: string; item3?: string; reflection?: string }) => {
    const newEntry = await gratitudeApi.create(entry)
    if (newEntry) {
      setTodayEntry(newEntry)
      setEntries(prev => [newEntry, ...prev])
    }
    return newEntry
  }

  const updateEntry = async (id: string, updates: Partial<GratitudeEntry>) => {
    const success = await gratitudeApi.update(id, updates)
    if (success) {
      setEntries(prev => prev.map(e =>
        e.id === id ? { ...e, ...updates } : e
      ))
      if (todayEntry?.id === id) {
        setTodayEntry(prev => prev ? { ...prev, ...updates } : prev)
      }
    }
    return success
  }

  return {
    entries,
    todayEntry,
    isLoading,
    createEntry,
    updateEntry,
    hasLoggedToday: !!todayEntry,
    refresh: loadEntries
  }
}

// ============================================
// DIARY STREAKS HOOK
// ============================================

export function useDiaryStreaks() {
  const [streaks, setStreaks] = useState<DiaryStreaks | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadStreaks = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await diaryStreaksApi.get()
      setStreaks(data)
    } catch (err) {
      console.error('Error loading diary streaks:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStreaks()
  }, [loadStreaks])

  return {
    streaks,
    isLoading,
    currentStreak: streaks?.current_streak || 0,
    longestStreak: streaks?.longest_streak || 0,
    totalEntries: streaks?.total_entries || 0,
    totalWords: streaks?.total_words || 0,
    refresh: loadStreaks
  }
}

// ============================================
// WRITING PROMPTS HOOK
// ============================================

export function useWritingPrompts() {
  const [prompt, setPrompt] = useState<WritingPrompt | null>(null)
  const [allPrompts, setAllPrompts] = useState<WritingPrompt[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadPrompts = useCallback(async () => {
    setIsLoading(true)
    try {
      const [random, all] = await Promise.all([
        writingPromptsApi.getRandom(),
        writingPromptsApi.getAll()
      ])
      setPrompt(random)
      setAllPrompts(all)
    } catch (err) {
      console.error('Error loading writing prompts:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPrompts()
  }, [loadPrompts])

  const getNewPrompt = async (category?: string) => {
    const newPrompt = await writingPromptsApi.getRandom(category)
    if (newPrompt) {
      setPrompt(newPrompt)
    }
    return newPrompt
  }

  return {
    prompt,
    allPrompts,
    isLoading,
    getNewPrompt,
    refresh: loadPrompts
  }
}
