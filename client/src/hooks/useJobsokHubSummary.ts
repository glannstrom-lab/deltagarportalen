import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useSupabase'
import { supabase } from '@/lib/supabase'
import type { JobsokSummary } from '@/components/widgets/JobsokDataContext'

/** Stable query key — exported so tests and DevTools can target it. */
export const JOBSOK_HUB_KEY = (userId: string) => ['hub', 'jobsok', userId] as const

type AppRow = { status: string }

function buildApplicationStats(rows: AppRow[]) {
  const byStatus: Record<string, number> = {}
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1
  // segments mirror Phase 2 ApplicationsWidget MOCK shape (anti-shaming: closed segment de-emphasized)
  const segments = [
    { label: 'aktiva',        count: byStatus['saved']     ?? 0 },
    { label: 'svar inväntas', count: byStatus['applied']   ?? 0 },
    { label: 'intervju',      count: byStatus['interview'] ?? 0 },
    { label: 'avslutade',     count: (byStatus['rejected'] ?? 0) + (byStatus['closed'] ?? 0), deEmphasized: true },
  ]
  return { total: rows.length, byStatus, segments }
}

export function useJobsokHubSummary() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const queryClient = useQueryClient()

  return useQuery<JobsokSummary>({
    queryKey: JOBSOK_HUB_KEY(userId),
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      // NOTE: interview_sessions uses completed_at TIMESTAMPTZ (not a boolean completed column).
      // Schema discovery from Plan 01 (03-01-SUMMARY.md). Use .not('completed_at', 'is', null)
      // to filter completed sessions — NOT .eq('completed', true).
      // salary_data and international_targets tables do NOT exist in live DB (Plan 01 verified).
      // Those widgets stay in empty-state mode — not included in this Promise.all.
      const [cvR, lettersR, sessionsR, appsR, sponR] = await Promise.all([
        supabase.from('cvs').select('id, updated_at, completion_pct').eq('user_id', userId).maybeSingle(),
        supabase.from('cover_letters').select('id, title, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
        supabase.from('interview_sessions').select('id, score, created_at').eq('user_id', userId).not('completed_at', 'is', null).order('created_at', { ascending: false }).limit(8),
        supabase.from('job_applications').select('status').eq('user_id', userId),
        supabase.from('spontaneous_companies').select('id').eq('user_id', userId),
      ])

      const summary: JobsokSummary = {
        cv: cvR.data ?? null,
        coverLetters: lettersR.data ?? [],
        interviewSessions: sessionsR.data ?? [],
        applicationStats: buildApplicationStats((appsR.data as AppRow[] | null) ?? []),
        spontaneousCount: sponR.data?.length ?? 0,
      }

      // Deep-link cache sync — write to EXACT keys used by useDocuments + useApplications
      queryClient.setQueryData(['application-stats'], summary.applicationStats)
      queryClient.setQueryData(['cv-versions'], summary.cv ? [summary.cv] : [])
      queryClient.setQueryData(['cover-letters'], summary.coverLetters)

      return summary
    },
  })
}
