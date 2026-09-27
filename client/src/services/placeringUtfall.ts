/**
 * placeringUtfall — Rusta och matchas utfall och uppföljning på en placering
 * i `consultant_placements` (RR5/RR7, rollspelet 2026-09-27).
 *
 * ── PENDING_20260927b ────────────────────────────────────────────────────
 * Kolumnerna för studier, omfattning, slutdatum, nivå och uppföljningens
 * datum/utfall/underlag/anteckning skapas av
 * `supabase/migrations/20260927b_placering_utfall.sql` (körd 2026-09-27, flaggan
 * är nu `true`). Med flaggan `false` gjorde klienten så här:
 *   · skriver aldrig de nya kolumnerna (inga 42703/PGRST204-fel)
 *   · sparar omfattning, slutdatum och nivå som en läsbar rad i `notes`
 *   · döljer "Studier" som typ (CHECK-villkoret släpper inte igenom det)
 *   · skriver uppföljningens datum, utfall, underlag och anteckning i
 *     journalen (consultant_journal, kategori PROGRESS) — samma sak skrivs
 *     även efter migrationen, så journalen är alltid det spårbara underlaget.
 * Efter körning: `npm run schema:refresh`, sätt flaggan till true.
 * Kolumnerna läses bara via `select('*')` och skrivs bara via spridda objekt
 * (`...utfallKolumner()`), så lint:schema/lint:kolumner ser dem inte innan de
 * finns i snapshoten.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Ren logik här; skrivningen bor i consultantService.
 */

import type { Uppfoljning } from '@/pages/consultant/placeringsmatt'
import { langtDatum } from '@/components/consultant/aktivitetEtiketter'

/** PENDING_20260927b — sätts till true när migrationen körts och schema:refresh gjorts. */
export const UTFALL_KOLUMNER_FINNS = true

export type PlaceringTyp = 'permanent' | 'temp' | 'trial' | 'studies'
export type Niva = 'A' | 'B' | 'C'
export type UppfoljningUtfall = 'kvar' | 'kvar_annan' | 'studier' | 'slutat' | 'ej_nadd'
export type UppfoljningUnderlag =
  | 'anstallningsbevis'
  | 'lonespecifikation'
  | 'studieintyg'
  | 'arbetsgivaren_muntligt'
  | 'deltagaren_muntligt'
  | 'inget'

export const PLACERINGSTYP_ETIKETT: Record<PlaceringTyp, string> = {
  permanent: 'Tillsvidareanställning',
  temp: 'Tidsbegränsad anställning',
  trial: 'Provanställning',
  studies: 'Studier',
}

export const UTFALL_ETIKETT: Record<UppfoljningUtfall, string> = {
  kvar: 'Kvar i samma anställning/studier',
  kvar_annan: 'I arbete hos annan arbetsgivare',
  studier: 'Studerar',
  slutat: 'Inte längre i arbete eller studier',
  ej_nadd: 'Gick inte att nå',
}

export const UNDERLAG_ETIKETT: Record<UppfoljningUnderlag, string> = {
  anstallningsbevis: 'Anställningsbevis',
  lonespecifikation: 'Lönespecifikation',
  studieintyg: 'Studieintyg/antagningsbesked',
  arbetsgivaren_muntligt: 'Arbetsgivaren muntligt',
  deltagaren_muntligt: 'Deltagaren muntligt',
  inget: 'Inget underlag än',
}

/** Placeringstyper konsulenten kan välja just nu. */
export function valbaraTyper(kolumnerFinns: boolean = UTFALL_KOLUMNER_FINNS): PlaceringTyp[] {
  return kolumnerFinns ? ['permanent', 'temp', 'trial', 'studies'] : ['permanent', 'temp', 'trial']
}

export interface PlaceringExtra {
  end_date?: string | null
  hours_per_week?: number | null
  scope_percent?: number | null
  outcome_level?: Niva | null
}

/** "30 h/vecka", "75 %", eller null. */
export function omfattningText(e: Pick<PlaceringExtra, 'hours_per_week' | 'scope_percent'>): string | null {
  if (e.hours_per_week) return `${String(e.hours_per_week).replace('.', ',')} h/vecka`
  if (e.scope_percent) return `${e.scope_percent} %`
  return null
}

/** Läsbar rad med det kolumnerna ännu inte kan bära. Tom sträng = inget att skriva. */
export function extraSomText(e: PlaceringExtra): string {
  const delar: string[] = []
  const omf = omfattningText(e)
  if (omf) delar.push(`Omfattning: ${omf}`)
  if (e.end_date) delar.push(`Slutdatum: ${e.end_date}`)
  if (e.outcome_level) delar.push(`Nivå: ${e.outcome_level}`)
  return delar.join(' · ')
}

/**
 * Kolumnerna att sprida in i insert-objektet — tomt före migrationen. Före
 * migrationen hamnar samma uppgifter i `notes` via `anteckningMedExtra`.
 */
export function extraKolumner(e: PlaceringExtra, kolumnerFinns: boolean = UTFALL_KOLUMNER_FINNS): Record<string, unknown> {
  if (!kolumnerFinns) return {}
  const ut: Record<string, unknown> = {}
  if (e.end_date) ut.end_date = e.end_date
  if (e.hours_per_week) ut.hours_per_week = e.hours_per_week
  if (e.scope_percent) ut.scope_percent = e.scope_percent
  if (e.outcome_level) ut.outcome_level = e.outcome_level
  return ut
}

export function anteckningMedExtra(notes: string | undefined, e: PlaceringExtra, kolumnerFinns: boolean = UTFALL_KOLUMNER_FINNS): string | undefined {
  if (kolumnerFinns) return notes
  const rad = extraSomText(e)
  if (!rad) return notes
  return notes ? `${rad}\n${notes}` : rad
}

export interface UppfoljningInput {
  vilken: Uppfoljning
  /** Dagen uppföljningen gjordes, YYYY-MM-DD. */
  datum: string
  utfall: UppfoljningUtfall
  underlag: UppfoljningUnderlag
  anteckning: string
  /** Krävs när uppföljningen görs före punkten. */
  motivering?: string
}

/** Uppföljningskolumnerna att sprida in i update-objektet — tomt före migrationen. */
export function utfallKolumner(input: UppfoljningInput, userId: string, kolumnerFinns: boolean = UTFALL_KOLUMNER_FINNS): Record<string, unknown> {
  if (!kolumnerFinns) return {}
  const p = input.vilken === '3m' ? 'followup_3m' : 'followup_6m'
  const not = [input.anteckning.trim(), input.motivering?.trim() ? `Motivering till förtida uppföljning: ${input.motivering.trim()}` : '']
    .filter(Boolean)
    .join('\n')
  return {
    [`${p}_date`]: input.datum,
    [`${p}_outcome`]: input.utfall,
    [`${p}_evidence`]: input.underlag,
    [`${p}_note`]: not || null,
    [`${p}_by`]: userId,
  }
}

/** Journalraden — det spårbara underlaget, före och efter migrationen. */
export function uppfoljningJournaltext(
  placering: { employer_name: string; job_title?: string | null; start_date?: string | null },
  input: UppfoljningInput,
): string {
  const rubrik = input.vilken === '3m' ? '3-månadersuppföljning' : '6-månadersuppföljning'
  const var_ = [placering.employer_name, placering.job_title].filter(Boolean).join(', ')
  const rader = [
    `${rubrik} av placeringen ${var_}${placering.start_date ? ` (start ${placering.start_date})` : ''}.`,
    `Uppföljningen gjord: ${input.datum}.`,
    `Utfall: ${UTFALL_ETIKETT[input.utfall]}.`,
    `Underlag: ${UNDERLAG_ETIKETT[input.underlag]}.`,
  ]
  if (input.motivering?.trim()) rader.push(`Gjord före uppföljningspunkten. Motivering: ${input.motivering.trim()}`)
  if (input.anteckning.trim()) rader.push(`Anteckning: ${input.anteckning.trim()}`)
  return rader.join('\n')
}

/**
 * RR6: placeringens läge sett från en dag — för deltagarsidans rubrik.
 * Ett startdatum i framtiden är en kommande placering, inte en pågående.
 */
export type PlaceringLage = 'kommande' | 'pagaende' | 'avslutad'

export function placeringLage(p: { start_date?: string | null } & PlaceringExtra, idag: string): PlaceringLage {
  if (p.end_date && p.end_date < idag) return 'avslutad'
  if (p.start_date && p.start_date > idag) return 'kommande'
  return 'pagaende'
}

type RubrikPlacering = { employer_name: string; placement_type?: string | null; start_date?: string | null } & PlaceringExtra

/** "Anställd hos X sedan 9 juli 2026" — rubrikens rad, eller null utan pågående/kommande placering. */
export function placeringRubrik(placeringar: readonly RubrikPlacering[], idag: string): string | null {
  const aktuell = placeringar.find((p) => placeringLage(p, idag) !== 'avslutad')
  if (!aktuell) return null
  const lage = placeringLage(aktuell, idag)
  const studier = aktuell.placement_type === 'studies'
  const vad = studier ? `Studier vid ${aktuell.employer_name}` : `Anställd hos ${aktuell.employer_name}`
  if (lage === 'kommande' && aktuell.start_date) return `${vad} från ${langtDatum(aktuell.start_date)}`
  return aktuell.start_date ? `${vad} sedan ${langtDatum(aktuell.start_date)}` : vad
}

