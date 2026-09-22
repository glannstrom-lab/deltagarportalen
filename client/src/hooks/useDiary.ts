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

/*
 * 2026-09-22: queryFn:erna nedan fångade tidigare varje fel och returnerade
 * `[]`/`null` ("tabellerna kanske inte finns än" — de har funnits sedan
 * mars). Ett läsfel såg därmed ut som en tom dagbok. Nu når felet React
 * Query, och varje hook exponerar `isError` + `retry` så flikarna kan visa
 * tre lägen: laddar / fel / klart. Tomt är bara tomt när svaret är inne.
 */

// ============================================
// DIARY ENTRIES HOOK
// ============================================

export function useDiaryEntries() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: DIARY_ENTRIES_KEY,
    queryFn: (): Promise<DiaryEntry[]> => diaryEntriesApi.getAll(),
    staleTime: STALE_TIME,
  })

  const entries = useMemo(() => query.data ?? [], [query.data])

  const setEntries = useCallback((updater: (prev: DiaryEntry[]) => DiaryEntry[]) => {
    queryClient.setQueryData<DiaryEntry[]>(DIARY_ENTRIES_KEY, (prev) => updater(prev ?? []))
  }, [queryClient])

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: DIARY_ENTRIES_KEY })
  }, [queryClient])

  /** Returnerar utfallet — `ok: false` betyder att inget sparades. */
  const createEntry = async (entry: Omit<DiaryEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const utfall = await diaryEntriesApi.skapa(entry)
    if (utfall.ok) {
      const newEntry = utfall.entry
      setEntries(prev => [newEntry, ...prev])
    }
    return utfall
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
    isLoading: query.isLoading,
    isError: query.isError,
    retry: refresh,
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
      // `.catch(() => null)` på dagens humör var det farligaste: TodayLogger
      // startade då på standardvärdena och "Spara" skrev över dagens riktiga
      // rad (upsert på user_id,log_date) med dem.
      const [allLogs, today] = await Promise.all([
        moodLogsApi.getAll(30),
        moodLogsApi.getToday()
      ])
      return { logs: allLogs, todayMood: today }
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

  // Snitt utan underlag är `null`, inte 0 — "0.0/5" påstod att man mått så
  // dåligt det går att må, för någon som aldrig loggat.
  const snitt = (varden: number[]): number | null =>
    varden.length > 0 ? varden.reduce((a, b) => a + b, 0) / varden.length : null
  const stats = {
    averageMood: snitt(logs.map(l => l.mood_level)),
    averageEnergy: snitt(logs.map(l => l.energy_level).filter((v): v is number => !!v)),
    averageStress: snitt(logs.map(l => l.stress_level).filter((v): v is number => !!v)),
    totalLogs: logs.length
  }

  return {
    logs,
    todayMood,
    isLoading: query.isLoading,
    isError: query.isError,
    retry: refresh,
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
    queryFn: (): Promise<WeeklyGoal[]> => weeklyGoalsApi.getCurrentWeek(),
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
    isError: query.isError,
    retry: refresh,
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
      const [allEntries, today] = await Promise.all([
        gratitudeApi.getAll(30),
        gratitudeApi.getToday()
      ])
      return { entries: allEntries, todayEntry: today }
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
    isError: query.isError,
    retry: refresh,
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
    queryFn: (): Promise<DiaryStreaks | null> => diaryStreaksApi.get(),
    staleTime: STALE_TIME,
  })

  const streaks = query.data ?? null

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: DIARY_STREAKS_KEY })
  }, [queryClient])

  // `?? 0` nedan är ärligt bara när svaret är inne: ingen rad = inget skrivet.
  // Vid läsfel är talen okända — anroparen ska läsa `isError` först.
  return {
    streaks,
    isLoading: query.isLoading,
    isError: query.isError,
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
