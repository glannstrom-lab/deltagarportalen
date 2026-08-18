import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useSupabase'
import { supabase } from '@/lib/supabase'
import { applicationsApi } from '@/services/applicationsApi'
import type { JobsokSummary } from './hubSummaryTypes'
import type { ApplicationStatus } from '@/types/application.types'

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

/**
 * Segmenten måste täcka VARJE status i `ApplicationStatus` — annars visar
 * Översikt ett totaltal som inte går ihop med raden under det.
 *
 * Så var det fram till 2026-08-18: fyra segment slog upp fem nycklar
 * (`saved`, `applied`, `interview`, `rejected`, `closed`) av elva. `closed`
 * finns dessutom inte i typen och kunde aldrig matcha. Sju statusar föll ur —
 * `interested`, `screening`, `phone`, `assessment`, `offer`, `accepted`,
 * `withdrawn` — men räknades i `total`. Uppmätt i prod: två av sex användare
 * med ansökningar såg "ANSÖKNINGAR 5" över "2 + 1 + 0 + 0". Fick man jobbet
 * (`accepted`) försvann ansökan ur pipelinen.
 *
 * Grupperingen följer vad användaren väntar på, inte vad systemet heter:
 *
 *   sparade      interested, saved        — inte skickad än
 *   svar         applied, screening       — bollen ligger hos arbetsgivaren
 *   intervju     phone, interview, assessment
 *   erbjudande   offer, accepted
 *   avslutade    rejected, withdrawn      — dämpad, aldrig röd
 *
 * `key` i stället för färdig svensk text: etiketterna renderas av vyn via
 * `t()`. Tidigare låg strängarna 'aktiva' / 'svar inväntas' här i datalagret
 * och kunde därför aldrig översättas — en engelskspråkig användare fick dem
 * på svenska oavsett språkval.
 *
 * Vaktas av `useJobsokHubSummary.test.ts`: summan av segmenten måste vara lika
 * med `total` för varje status i `ApplicationStatus`.
 */
const SEGMENTGRUPPER: Array<{ key: string; statusar: ApplicationStatus[]; deEmphasized?: boolean }> = [
  { key: 'saved', statusar: ['interested', 'saved'] },
  { key: 'awaiting', statusar: ['applied', 'screening'] },
  { key: 'interview', statusar: ['phone', 'interview', 'assessment'] },
  { key: 'offer', statusar: ['offer', 'accepted'] },
  { key: 'closed', statusar: ['rejected', 'withdrawn'], deEmphasized: true },
]

function buildApplicationStats(allRows: AppRow[]) {
  // Arkiverade räknas inte — hubbkortet ska spegla det Ansökningar-sidan visar.
  const rows = allRows.filter(r => !r.archivedAt)
  const byStatus: Record<string, number> = {}
  // Status kommer redan i gemener från applicationsApi.getStatusRows().
  // Tidigare lästes tabellen direkt här, och nycklarna nedan jämfördes mot
  // VERSALER från databasen — alla segment blev noll. Bara `total` stämde, och
  // eftersom hubbkortet bara läser `total` syntes felet aldrig.
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1

  const segments = SEGMENTGRUPPER.map(g => ({
    key: g.key,
    count: g.statusar.reduce((n, st) => n + (byStatus[st] ?? 0), 0),
    ...(g.deEmphasized ? { deEmphasized: true } : {}),
  }))

  // En status som inte finns i någon grupp skulle tyst försvinna igen. Hellre
  // en synlig restpost än ett tal som inte går ihop.
  const täckta = new Set(SEGMENTGRUPPER.flatMap(g => g.statusar as string[]))
  const övriga = Object.entries(byStatus)
    .filter(([st]) => !täckta.has(st))
    .reduce((n, [, c]) => n + c, 0)
  if (övriga > 0) segments.push({ key: 'other', count: övriga })

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

      // Kasta vid fel i stället för att låta `?? []` göra om ett avslag till
      // tom data. `applicationsApi.getStatusRows()` kastar redan; de fyra
      // direkta selecten gjorde det inte, så ett RLS-fel på `cvs` renderades
      // som "Inte påbörjat än". Se lärdomen 2026-08-09.
      for (const [namn, r] of [
        ['cvs', cvR],
        ['cover_letters', lettersR],
        ['interview_sessions', sessionsR],
        ['spontaneous_companies', sponR],
      ] as const) {
        if (r.error) throw Object.assign(new Error(`${namn}: ${r.error.message}`), { cause: r.error })
      }

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
