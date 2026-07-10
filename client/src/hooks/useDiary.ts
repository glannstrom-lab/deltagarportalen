/**
 * useDiary - Hook for managing diary entries and related data
 * React Query-baserad: en delad cache mellan komponenterna (Diary-flikarna
 * monterar samma hook flera gånger) i stället för en fetch per instans.
 * Mutationer uppdaterar cachen direkt via queryClient.setQueryData —
 * samma mönster som useSpontaneousCompanies.
 */

import { useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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

export const DIARY_ENTRIES_KEY = ['diary-entries'] as const
export const MOOD_LOGS_KEY = ['mood-logs'] as const
export const WEEKLY_GOALS_KEY = ['weekly-goals'] as const
export const GRATITUDE_ENTRIES_KEY = ['gratitude-entries'] as const
export const DIARY_STREAKS_KEY = ['diary-streaks'] as const
export const WRITING_PROMPTS_KEY = ['writing-prompts'] as const

const STALE_TIME = 60_000

// ============================================
// DIARY ENTRIES HOOK
// ============================================

export function useDiaryEntries() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: DIARY_ENTRIES_KEY,
    // Fel sväljs precis som tidigare — tabellerna kanske inte finns än
    queryFn: async (): Promise<DiaryEntry[]> => {
      try {
        const data = await diaryEntriesApi.getAll()
        return data || []
      } catch (err) {
        console.warn('Could not load diary entries:', err)
        return []
      }
    },
    staleTime: STALE_TIME,
  })

  const entries = useMemo(() => query.data ?? [], [query.data])

  const setEntries = useCallback((updater: (prev: DiaryEntry[]) => DiaryEntry[]) => {
    queryClient.setQueryData<DiaryEntry[]>(DIARY_ENTRIES_KEY, (prev) => updater(prev ?? []))
  }, [queryClient])

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: DIARY_ENTRIES_KEY })
  }, [queryClient])

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

  // error sattes aldrig i gamla hooken ("tables might not exist yet")
  const error: string | null = null

  return {
    entries,
    isLoading: query.isLoading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    toggleFavorite,
    searchByTags,
    refresh
  }
}

// ============================================
// MOOD LOGS HOOK
// ============================================

interface MoodLogsData {
  logs: MoodLog[]
  todayMood: MoodLog | null
}

export function useMoodLogs() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: MOOD_LOGS_KEY,
    queryFn: async (): Promise<MoodLogsData> => {
      try {
        const [allLogs, today] = await Promise.all([
          moodLogsApi.getAll(30).catch(() => []),
          moodLogsApi.getToday().catch(() => null)
        ])
        return { logs: allLogs || [], todayMood: today }
      } catch (err) {
        console.warn('Could not load mood logs:', err)
        return { logs: [], todayMood: null }
      }
    },
    staleTime: STALE_TIME,
  })

  const logs = useMemo(() => query.data?.logs ?? [], [query.data])
  const todayMood = query.data?.todayMood ?? null

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: MOOD_LOGS_KEY })
  }, [queryClient])

  const logMood = async (log: Omit<MoodLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newLog = await moodLogsApi.upsert(log)
    if (newLog) {
      queryClient.setQueryData<MoodLogsData>(MOOD_LOGS_KEY, (prev) => {
        const base = prev ?? { logs: [], todayMood: null }
        const exists = base.logs.find(l => l.log_date === newLog.log_date)
        const nextLogs = exists
          ? base.logs.map(l => l.log_date === newLog.log_date ? newLog : l)
          : [newLog, ...base.logs]
        return { logs: nextLogs, todayMood: newLog }
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
    isLoading: query.isLoading,
    logMood,
    getByDateRange,
    stats,
    refresh
  }
}

// ============================================
// WEEKLY GOALS HOOK
// ============================================

export function useWeeklyGoals() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: WEEKLY_GOALS_KEY,
    queryFn: async (): Promise<WeeklyGoal[]> => {
      try {
        const data = await weeklyGoalsApi.getCurrentWeek()
        return data || []
      } catch (err) {
        console.warn('Could not load weekly goals:', err)
        return []
      }
    },
    staleTime: STALE_TIME,
  })

  const goals = useMemo(() => query.data ?? [], [query.data])

  const setGoals = useCallback((updater: (prev: WeeklyGoal[]) => WeeklyGoal[]) => {
    queryClient.setQueryData<WeeklyGoal[]>(WEEKLY_GOALS_KEY, (prev) => updater(prev ?? []))
  }, [queryClient])

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: WEEKLY_GOALS_KEY })
  }, [queryClient])

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
    isLoading: query.isLoading,
    createGoal,
    toggleComplete,
    addReflection,
    deleteGoal,
    completedCount,
    totalCount,
    progress,
    refresh
  }
}

// ============================================
// GRATITUDE HOOK
// ============================================

interface GratitudeData {
  entries: GratitudeEntry[]
  todayEntry: GratitudeEntry | null
}

export function useGratitude() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: GRATITUDE_ENTRIES_KEY,
    queryFn: async (): Promise<GratitudeData> => {
      try {
        const [allEntries, today] = await Promise.all([
          gratitudeApi.getAll(30).catch(() => []),
          gratitudeApi.getToday().catch(() => null)
        ])
        return { entries: allEntries || [], todayEntry: today }
      } catch (err) {
        console.warn('Could not load gratitude entries:', err)
        return { entries: [], todayEntry: null }
      }
    },
    staleTime: STALE_TIME,
  })

  const entries = useMemo(() => query.data?.entries ?? [], [query.data])
  const todayEntry = query.data?.todayEntry ?? null

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: GRATITUDE_ENTRIES_KEY })
  }, [queryClient])

  const createEntry = async (entry: { item1: string; item2?: string; item3?: string; reflection?: string }) => {
    const newEntry = await gratitudeApi.create(entry)
    if (newEntry) {
      queryClient.setQueryData<GratitudeData>(GRATITUDE_ENTRIES_KEY, (prev) => {
        const base = prev ?? { entries: [], todayEntry: null }
        return { entries: [newEntry, ...base.entries], todayEntry: newEntry }
      })
    }
    return newEntry
  }

  const updateEntry = async (id: string, updates: Partial<GratitudeEntry>) => {
    const success = await gratitudeApi.update(id, updates)
    if (success) {
      queryClient.setQueryData<GratitudeData>(GRATITUDE_ENTRIES_KEY, (prev) => {
        const base = prev ?? { entries: [], todayEntry: null }
        return {
          entries: base.entries.map(e => e.id === id ? { ...e, ...updates } : e),
          todayEntry: base.todayEntry?.id === id
            ? { ...base.todayEntry, ...updates }
            : base.todayEntry
        }
      })
    }
    return success
  }

  return {
    entries,
    todayEntry,
    isLoading: query.isLoading,
    createEntry,
    updateEntry,
    hasLoggedToday: !!todayEntry,
    refresh
  }
}

// ============================================
// DIARY STREAKS HOOK
// ============================================

export function useDiaryStreaks() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: DIARY_STREAKS_KEY,
    queryFn: async (): Promise<DiaryStreaks | null> => {
      try {
        return await diaryStreaksApi.get()
      } catch (err) {
        // Silently handle - tables might not exist yet
        console.warn('Could not load diary streaks:', err)
        return null
      }
    },
    staleTime: STALE_TIME,
  })

  const streaks = query.data ?? null

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: DIARY_STREAKS_KEY })
  }, [queryClient])

  return {
    streaks,
    isLoading: query.isLoading,
    currentStreak: streaks?.current_streak ?? 0,
    longestStreak: streaks?.longest_streak ?? 0,
    totalEntries: streaks?.total_entries ?? 0,
    totalWords: streaks?.total_words ?? 0,
    refresh
  }
}

// ============================================
// WRITING PROMPTS HOOK
// ============================================

interface WritingPromptsData {
  prompt: WritingPrompt | null
  allPrompts: WritingPrompt[]
}

export function useWritingPrompts() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: WRITING_PROMPTS_KEY,
    queryFn: async (): Promise<WritingPromptsData> => {
      try {
        const [random, all] = await Promise.all([
          writingPromptsApi.getRandom().catch(() => null),
          writingPromptsApi.getAll().catch(() => [])
        ])
        return { prompt: random, allPrompts: all || [] }
      } catch (err) {
        console.warn('Could not load writing prompts:', err)
        return { prompt: null, allPrompts: [] }
      }
    },
    staleTime: STALE_TIME,
  })

  const prompt = query.data?.prompt ?? null
  const allPrompts = useMemo(() => query.data?.allPrompts ?? [], [query.data])

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: WRITING_PROMPTS_KEY })
  }, [queryClient])

  const getNewPrompt = async (category?: string) => {
    const newPrompt = await writingPromptsApi.getRandom(category)
    if (newPrompt) {
      queryClient.setQueryData<WritingPromptsData>(WRITING_PROMPTS_KEY, (prev) => ({
        prompt: newPrompt,
        allPrompts: prev?.allPrompts ?? []
      }))
    }
    return newPrompt
  }

  return {
    prompt,
    allPrompts,
    isLoading: query.isLoading,
    getNewPrompt,
    refresh
  }
}
