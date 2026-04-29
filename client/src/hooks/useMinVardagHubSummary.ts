import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useSupabase'
import { supabase } from '@/lib/supabase'
import type { MinVardagSummary } from '@/components/widgets/MinVardagDataContext'

/** Stable query key — exported so tests and DevTools can target it. */
export const MIN_VARDAG_HUB_KEY = (userId: string) => ['hub', 'min-vardag', userId] as const

export function useMinVardagHubSummary() {
  const { user } = useAuth()
  const userId = user?.id ?? ''

  return useQuery<MinVardagSummary>({
    queryKey: MIN_VARDAG_HUB_KEY(userId),
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      // Source of truth for column names: .planning/phases/05-full-hub-coverage-oversikt/05-DB-DISCOVERY.md
      // Note: consultant_participants uses `participant_id` (NOT user_id) per discovery.
      const today = new Date().toISOString().split('T')[0]

      // Promise.all of 6 supabase calls (mood/diary-count/diary-latest/calendar/network-count/consultant-join):
      const [moodR, diaryCountR, diaryLatestR, calR, contactsR, consultantR] = await Promise.all([
        // Hälsa — 7 days
        supabase
          .from('mood_logs')
          .select('mood_level, energy_level, log_date')
          .eq('user_id', userId)
          .order('log_date', { ascending: false })
          .limit(7),
        // Dagbok — count
        supabase
          .from('diary_entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        // Dagbok — latest entry
        supabase
          .from('diary_entries')
          .select('id, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        // Kalender — next 3 upcoming
        supabase
          .from('calendar_events')
          .select('id, title, date, time, type')
          .eq('user_id', userId)
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(3),
        // Nätverk — count via select head
        supabase
          .from('network_contacts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        // Min konsulent — join. Column is `participant_id` per 05-DB-DISCOVERY.md.
        supabase
          .from('consultant_participants')
          .select('consultant_id, profiles:consultant_id(id, full_name, avatar_url)')
          .eq('participant_id', userId)
          .maybeSingle(),
      ])

      const consultantRaw =
        consultantR.data && (consultantR.data as { profiles?: unknown }).profiles
      const profilesObj = consultantRaw as
        | { id: string; full_name?: string | null; avatar_url?: string | null }
        | null
        | undefined
      const consultant = profilesObj
        ? {
            id: profilesObj.id,
            full_name: profilesObj.full_name ?? null,
            avatar_url: profilesObj.avatar_url ?? null,
          }
        : null

      const summary: MinVardagSummary = {
        recentMoodLogs: moodR.data ?? [],
        diaryEntryCount: diaryCountR.count ?? 0,
        latestDiaryEntry: diaryLatestR.data ?? null,
        upcomingEvents: calR.data ?? [],
        networkContactsCount: contactsR.count ?? 0,
        consultant,
      }

      return summary
    },
  })
}
