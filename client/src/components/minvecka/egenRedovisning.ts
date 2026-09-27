/**
 * egenRedovisning — deltagarens egen redovisning på närvarointyget (RD29,
 * rollspelet 2026-09-27).
 *
 * Anna har checkat in på sina pass och sökt jobb varje vecka. Intyget till
 * handläggaren visade bara konsulentens markeringar — "Ej markerat" stod där
 * hon själv visste att hon varit. Det hon gjort ska synas, som HENNES
 * redovisning, tydligt skild från det konsulenten bedömt.
 *
 * Två delar, båda ur data portalen redan har:
 *   - egna incheckningar: pass i månaden med `self_checkin_at`
 *   - eget jobbsökande: sparade jobb, skickade ansökningar, CV, brev och
 *     intervjuövningar i månaden (samma räkning som Min vecka, jobbsokAktivitet.ts)
 *
 * PDF:en byggs i `services/narvaroIntygPdf.ts` (ägs av annan agent). Den här
 * filen levererar färdiga svenska rader — PDF:en ritar dem. Intyget är svenskt
 * med flit: det lämnas till en svensk handläggare.
 *
 * `INTYG_HAR_EGEN_REDOVISNING` styr raden i Min vecka som lovar att intyget
 * visar det här. Den står på `false` tills PDF:en faktiskt ritar avsnittet —
 * en text som lovar något intyget inte gör är värre än ingen text.
 */

import { supabase } from '@/lib/supabase'
import type { ActivitySession } from '@/services/aktivitetApi'
import { lokaltDatum, type SavedJobRad } from '@/services/jobbsokAktivitet'

/** Sätt till true när narvaroIntygPdf.ts ritar `egenRedovisning`. */
export const INTYG_HAR_EGEN_REDOVISNING = true

export interface EgenIncheckning {
  datum: string
  tid: string
  titel: string
  /** HH:MM lokal tid när hon checkade in. */
  incheckadKl: string
}

export interface ManadensJobbsok {
  sparadeJobb: number
  ansokningar: number
  cvUppdaterat: boolean
  brev: number
  intervjuovningar: number
}

export interface EgenRedovisning {
  incheckningar: EgenIncheckning[]
  /** null = kunde inte hämtas. Då säger intyget det, i stället för att tiga. */
  jobbsok: ManadensJobbsok | null
}

/** Statusar som betyder att en ansökan faktiskt skickats (samma som jobbsokAktivitet.ts). */
const SKICKAD: ReadonlySet<string> = new Set(['applied', 'interview', 'offer', 'accepted', 'rejected'])

const MANADER = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december']

function datumSv(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MANADER[m - 1]} ${y}`
}

function klockslag(ts: string): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function iManaden(v: string | null | undefined, manad: string): boolean {
  const d = lokaltDatum(v)
  return d !== null && d.startsWith(`${manad}-`)
}

/** Pass i månaden där hon själv checkat in, i tidsordning. Ren funktion. */
export function egnaIncheckningar(sessions: readonly ActivitySession[], manad: string): EgenIncheckning[] {
  return sessions
    .filter((s) => s.date.startsWith(`${manad}-`) && !!s.self_checkin_at)
    .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
    .map((s) => ({
      datum: s.date,
      tid: `${s.start_time}-${s.end_time}`,
      titel: s.title,
      incheckadKl: klockslag(s.self_checkin_at as string),
    }))
}

export interface JobbsokUnderlag {
  savedJobs: SavedJobRad[]
  cvUpdatedAt: string | null
  coverLetters: { created_at: string }[]
  interviews: { completed_at: string | null; started_at: string | null }[]
}

/** Månadens jobbsökande. Ren funktion. */
export function raknaManadensJobbsok(u: JobbsokUnderlag, manad: string): ManadensJobbsok {
  return {
    sparadeJobb: u.savedJobs.filter((r) => iManaden(r.created_at, manad)).length,
    ansokningar: u.savedJobs.filter((r) => SKICKAD.has((r.status ?? '').toLowerCase()) && iManaden(r.application_date, manad)).length,
    cvUppdaterat: iManaden(u.cvUpdatedAt, manad),
    brev: u.coverLetters.filter((r) => iManaden(r.created_at, manad)).length,
    intervjuovningar: u.interviews.filter((r) => iManaden(r.completed_at ?? r.started_at, manad)).length,
  }
}

function plusDagar(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + n)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

function manadensGranser(manad: string): { from: string; to: string } {
  const [y, m] = manad.split('-').map(Number)
  const sista = new Date(y, m, 0).getDate()
  return { from: `${manad}-01`, to: `${manad}-${String(sista).padStart(2, '0')}` }
}

/** Hämtar månadens jobbsökande (bara egna rader, RLS). Kastar vid fel. */
export async function hamtaManadensJobbsok(manad: string): Promise<ManadensJobbsok> {
  const { data: { user }, error: authFel } = await supabase.auth.getUser()
  if (authFel) throw authFel
  if (!user) throw new Error('Inte inloggad')
  const { from, to } = manadensGranser(manad)
  // Ett dygn marginal åt båda håll: tidsstämplarna är UTC, månaden är lokal.
  // Den exakta gränsen dras i lokal tid av raknaManadensJobbsok.
  const franTs = `${plusDagar(from, -1)}T00:00:00`
  const tillTs = `${plusDagar(to, 1)}T23:59:59`
  const [jobb, cv, brev, intervju] = await Promise.all([
    supabase
      .from('saved_jobs')
      .select('created_at, application_date, status')
      .eq('user_id', user.id)
      .or(`created_at.gte.${franTs},application_date.gte.${from}`)
      .or(`created_at.lte.${tillTs},application_date.lte.${to}`),
    supabase.from('cvs').select('updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(1),
    supabase.from('cover_letters').select('created_at').eq('user_id', user.id).gte('created_at', franTs).lte('created_at', tillTs),
    supabase.from('interview_sessions').select('completed_at, started_at').eq('user_id', user.id).gte('created_at', franTs).lte('created_at', tillTs),
  ])
  for (const r of [jobb, cv, brev, intervju]) if (r.error) throw r.error
  return raknaManadensJobbsok(
    {
      savedJobs: (jobb.data ?? []) as SavedJobRad[],
      cvUpdatedAt: ((cv.data ?? [])[0]?.updated_at as string | undefined) ?? null,
      coverLetters: (brev.data ?? []) as { created_at: string }[],
      interviews: (intervju.data ?? []) as { completed_at: string | null; started_at: string | null }[],
    },
    manad,
  )
}

/**
 * Det PDF:en ska rita, färdigt på svenska. Rubriken och förklaringen skiljer
 * avsnittet från konsulentens markeringar — det är deltagarens egna uppgifter,
 * inte bedömda. Raka citattecken och inga specialtecken: Helvetica i jsPDF.
 */
export interface EgenRedovisningAvsnitt {
  rubrik: string
  forklaring: string
  incheckningar: { head: string[]; body: string[][]; tomText: string | null }
  jobbsokRubrik: string
  jobbsokRader: string[]
}

export function egenRedovisningAvsnitt(r: EgenRedovisning): EgenRedovisningAvsnitt {
  const j = r.jobbsok
  let jobbsokRader: string[]
  if (j === null) {
    jobbsokRader = ['Uppgifterna om eget jobbsökande kunde inte hämtas när intyget skapades.']
  } else {
    jobbsokRader = [
      j.sparadeJobb > 0 ? `Sparade jobbannonser: ${j.sparadeJobb}` : null,
      j.ansokningar > 0 ? `Skickade ansökningar: ${j.ansokningar}` : null,
      j.cvUppdaterat ? 'CV uppdaterat under månaden' : null,
      j.brev > 0 ? `Personliga brev: ${j.brev}` : null,
      j.intervjuovningar > 0 ? `Intervjuövningar: ${j.intervjuovningar}` : null,
    ].filter((x): x is string => x !== null)
    if (jobbsokRader.length === 0) jobbsokRader = ['Inget eget jobbsökande är registrerat i Jobin den här månaden.']
  }
  return {
    rubrik: 'Deltagarens egen redovisning',
    forklaring:
      'Uppgifterna i det här avsnittet har deltagaren själv registrerat i Jobin. De är inte bedömda eller bekräftade av arbetskonsulenten och ingår inte i närvaron ovan. Jobbsökande utanför Jobin syns inte här.',
    incheckningar: {
      head: ['Datum', 'Tid', 'Aktivitet', 'Egen incheckning'],
      body: r.incheckningar.map((i) => [datumSv(i.datum), i.tid, i.titel, `Incheckad kl ${i.incheckadKl}`]),
      tomText: r.incheckningar.length === 0 ? 'Inga egna incheckningar den här månaden.' : null,
    },
    jobbsokRubrik: 'Eget jobbsökande i Jobin',
    jobbsokRader,
  }
}
