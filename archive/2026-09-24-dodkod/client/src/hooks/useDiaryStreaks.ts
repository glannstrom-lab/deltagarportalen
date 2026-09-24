/**
 * ARKIVERAD 2026-09-24 (LS1). Låg i client/src/hooks/useDiary.ts.
 * Enda konsumenten var Diary.tsx (streak-räknaren "N dagar" och troférna),
 * som DESIGN.md §1 förbjuder. Skrivvägen diaryStreaksApi.updateAfterEntry i
 * services/diaryApi.ts finns kvar tills vidare.
 */
import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { diaryStreaksApi, type DiaryStreaks } from '@/services/diaryApi'

export const DIARY_STREAKS_KEY = ['diary-streaks'] as const
const STALE_TIME = 60_000

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

