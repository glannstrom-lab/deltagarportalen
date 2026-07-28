import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useSupabase'
import { supabase } from '@/lib/supabase'
import { applicationsApi } from '@/services/applicationsApi'
import type { JobsokSummary } from './hubSummaryTypes'

/** Stable query key — exported so tests and DevTools can target it. */
export const JOBSOK_HUB_KEY = (userId: string) => ['hub', 'jobsok', userId] as const

type AppRow = { status: string; archivedAt: string | null }
type SponRow = { id: string; followup_date: string | null; status: string }

// Statusar där uppföljning inte längre är aktuell (speglar useSpontaneousCompanies)
const SPON_FOLLOWUP_DONE = ['archived', 'response_positive', 'response_negative']

function buildSpontaneousFollowups(rows: SponRow[]) {
  const horizon = new Date()
  horizon.setDate(horizon.getDate() + 30)
  const horizonStr = horizon.toISOString().split('T')[0]
  const upcoming = rows
    .filter(r => r.followup_date && r.followup_date <= horizonStr && !SPON_FOLLOWUP_DONE.includes(r.status))
    .sort((a, b) => (a.followup_date! < b.followup_date! ? -1 : 1))
  return { count: upcoming.length, nextDate: upcoming[0]?.followup_date ?? null }
}

function buildApplicationStats(allRows: AppRow[]) {
  // Arkiverade räknas inte — hubbkortet ska spegla det Ansökningar-sidan visar.
  const rows = allRows.filter(r => !r.archivedAt)
  const byStatus: Record<string, number> = {}
  // Status kommer redan i gemener från applicationsApi.getStatusRows().
  // Tidigare lästes tabellen direkt här, och nycklarna nedan jämfördes mot
  // VERSALER från databasen — alla segment blev noll. Bara `total` stämde, och
  // eftersom hubbkortet bara läser `total` syntes felet aldrig.
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
        supabase.from('cvs').select('id, updated_at').eq('user_id', userId).maybeSingle(),
        supabase.from('cover_letters').select('id, title, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
        supabase.from('interview_sessions').select('id, score, created_at').eq('user_id', userId).not('completed_at', 'is', null).order('created_at', { ascending: false }).limit(8),
        // Via applicationsApi — enda ägaren av saved_jobs (E12). Returnerar
        // status i gemener, så ingen skiftlägeskunskap behövs här.
        applicationsApi.getStatusRows(),
        supabase.from('spontaneous_companies').select('id, followup_date, status').eq('user_id', userId),
      ])

      const sponRows = (sponR.data as SponRow[] | null) ?? []
      const summary: JobsokSummary = {
        cv: cvR.data ?? null,
        coverLetters: lettersR.data ?? [],
        interviewSessions: sessionsR.data ?? [],
        applicationStats: buildApplicationStats(appsR ?? []),
        spontaneousCount: sponRows.length,
        spontaneousFollowups: buildSpontaneousFollowups(sponRows),
      }

      // INGEN cache-sync till andra hooks nycklar. Den fanns här som
      // "deep-link cache sync", men skrev FEL FORM till nycklar som ägs av
      // andra hooks (UX8, 2026-07-27):
      //   ['application-stats'] ägs av useApplications  → platt {total,active,applied,…}
      //   ['cv-versions']       ägs av useDocuments     → hela CVVersion[]
      //   ['cover-letters']     ägs av useDocuments     → hela CoverLetter[]
      // Hubbens former är andra (byStatus/segments, en stubbe med två fält, max 3 brev),
      // så skrivningen förgiftade sidorna: Ansökningar visade "Du har inte börjat söka
      // jobb än" trots 24 rader i saved_jobs. En nyckel = en form = en ägare.
      // Sidorna hämtar sin egen data — det är korrekt och kostar en extra fetch.

      return summary
    },
  })
}
