/**
 * jobbsokAktivitet — deltagarens eget jobbsökande, räknat ur det portalen
 * redan vet (KM9). Ingen ny tabell, ingen AI.
 *
 * Lagens plan ska avsätta tid för eget jobbsökande, men eget jobbsökande
 * räknas inte som anvisad aktivitet. Portalen kan visa vad deltagaren gjort
 * — sparade jobb, skickade ansökningar, CV, brev, intervjuträning — som
 * deltagarens EGEN redovisning, aldrig som kontroll.
 *
 * Premiss (RLS verifierad mot prod 2026-09-11):
 *   - saved_jobs: egna rader + "Consultants can view participant saved jobs"
 *     via profiles.consultant_id = auth.uid() (1:1-kopplingen, INTE
 *     consultant_participants). Konsulenten ser alltså sparade jobb och
 *     ansökningar för deltagare som har hen som profiles.consultant_id.
 *   - cvs, cover_letters, interview_sessions: BARA egna rader. Konsulenten
 *     får inte veckodata för dem; cv_updated_at finns i vyn
 *     consultant_dashboard_participants.
 *
 * Datum: `application_date` är ansökningsdatumet (applied_at är död, se
 * lärdomen i vag1-fallor). Alla jämförelser i lokal tid via
 * aktivitetSchema.
 */

import { supabase } from '@/lib/supabase'
import { addDays, formatLocalDate, veckansMandag } from './aktivitetSchema'

export interface SavedJobRad {
  created_at: string
  application_date: string | null
  status: string | null
}

export interface JobbsokRader {
  savedJobs: SavedJobRad[]
  /** cvs.updated_at för deltagarens CV, null om inget CV */
  cvUpdatedAt: string | null
  coverLetters: { created_at: string }[]
  interviews: { completed_at: string | null; started_at: string | null }[]
}

export interface Veckojobbsok {
  vecka: string
  sparadeJobb: number
  ansokningar: number
  cvUppdaterad: boolean
  intervjutraningar: number
  brev: number
}

/** Det konsulenten får läsa: bara saved_jobs (via RLS) + vyns cv_updated_at. */
export interface KonsulentVeckojobbsok {
  vecka: string
  sparadeJobb: number
  ansokningar: number
}

/** Statusar som betyder att en ansökan faktiskt skickats. */
const SKICKAD: ReadonlySet<string> = new Set(['applied', 'interview', 'offer', 'accepted', 'rejected'])

/** `YYYY-MM-DD` i lokal tid ur en timestamp eller ett datum. Null/ogiltigt → null. */
export function lokaltDatum(v: string | null | undefined): string | null {
  if (!v) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : formatLocalDate(d)
}

function iVecka(v: string | null | undefined, mandag: string, sondag: string): boolean {
  const d = lokaltDatum(v)
  return d !== null && d >= mandag && d <= sondag
}

/** Ren räkning för veckan som innehåller `datum`. */
export function raknaJobbsok(rader: JobbsokRader, datum: string): Veckojobbsok {
  const mandag = veckansMandag(datum)
  const sondag = addDays(mandag, 6)
  const sparadeJobb = rader.savedJobs.filter((r) => iVecka(r.created_at, mandag, sondag)).length
  const ansokningar = rader.savedJobs.filter(
    (r) => SKICKAD.has((r.status ?? '').toLowerCase()) && iVecka(r.application_date, mandag, sondag),
  ).length
  return {
    vecka: mandag,
    sparadeJobb,
    ansokningar,
    cvUppdaterad: iVecka(rader.cvUpdatedAt, mandag, sondag),
    intervjutraningar: rader.interviews.filter((r) => iVecka(r.completed_at ?? r.started_at, mandag, sondag)).length,
    brev: rader.coverLetters.filter((r) => iVecka(r.created_at, mandag, sondag)).length,
  }
}

export function harNagot(v: Veckojobbsok): boolean {
  return v.sparadeJobb > 0 || v.ansokningar > 0 || v.cvUppdaterad || v.intervjutraningar > 0 || v.brev > 0
}

async function requireUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) throw new Error('Inte inloggad')
  return user
}

/** Hämtar ett tidsfönster runt veckan så vi inte laddar hela historiken. */
function fonster(datum: string): { from: string; to: string } {
  const mandag = veckansMandag(datum)
  return { from: `${addDays(mandag, -1)}T00:00:00`, to: `${addDays(mandag, 7)}T23:59:59` }
}

export const jobbsokAktivitetApi = {
  /** Deltagarens egna rader för veckan som innehåller `datum`. Kastar vid fel. */
  async minaJobbsok(datum: string): Promise<Veckojobbsok> {
    const user = await requireUser()
    const { from, to } = fonster(datum)
    const mandag = veckansMandag(datum)
    const sondag = addDays(mandag, 6)

    const [jobb, cv, brev, intervju] = await Promise.all([
      supabase
        .from('saved_jobs')
        .select('created_at, application_date, status')
        .eq('user_id', user.id)
        .or(`created_at.gte.${from},application_date.gte.${mandag}`)
        .or(`created_at.lte.${to},application_date.lte.${sondag}`),
      supabase.from('cvs').select('updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(1),
      supabase.from('cover_letters').select('created_at').eq('user_id', user.id).gte('created_at', from).lte('created_at', to),
      supabase.from('interview_sessions').select('completed_at, started_at').eq('user_id', user.id).gte('created_at', from).lte('created_at', to),
    ])
    for (const r of [jobb, cv, brev, intervju]) if (r.error) throw r.error

    return raknaJobbsok(
      {
        savedJobs: (jobb.data ?? []) as SavedJobRad[],
        cvUpdatedAt: ((cv.data ?? [])[0]?.updated_at as string | undefined) ?? null,
        coverLetters: (brev.data ?? []) as { created_at: string }[],
        interviews: (intervju.data ?? []) as { completed_at: string | null; started_at: string | null }[],
      },
      datum,
    )
  },

  /**
   * Konsulentens vy av en deltagares vecka: bara saved_jobs, som RLS släpper
   * igenom om deltagaren har hen som profiles.consultant_id. Saknas den
   * kopplingen svarar databasen med tom lista, inte fel — därför returnerar
   * vi `null` när INGA rader alls går att läsa i ett fönster på ett år, så
   * UI:t kan skilja "inget den här veckan" från "får inte se".
   */
  async deltagarensJobbsok(participantId: string, datum: string): Promise<KonsulentVeckojobbsok | null> {
    await requireUser()
    const { from, to } = fonster(datum)
    const mandag = veckansMandag(datum)
    const sondag = addDays(mandag, 6)
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('created_at, application_date, status')
      .eq('user_id', participantId)
      .or(`created_at.gte.${from},application_date.gte.${mandag}`)
      .or(`created_at.lte.${to},application_date.lte.${sondag}`)
    if (error) throw error
    if ((data ?? []).length === 0) {
      const { count, error: countError } = await supabase
        .from('saved_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', participantId)
      if (countError) throw countError
      if (count === null) return null
      // count 0 kan vara "inget alls" eller "får inte se" — RLS filtrerar tyst.
      // Vi kan inte skilja dem här; UI:t säger det rakt ut.
      if (count === 0) return null
    }
    const v = raknaJobbsok({ savedJobs: (data ?? []) as SavedJobRad[], cvUpdatedAt: null, coverLetters: [], interviews: [] }, datum)
    return { vecka: v.vecka, sparadeJobb: v.sparadeJobb, ansokningar: v.ansokningar }
  },
}
