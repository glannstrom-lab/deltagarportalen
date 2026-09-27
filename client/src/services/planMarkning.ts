/**
 * planMarkning — ärendenummer på planen (RK40) och märkta pass (RR27, RK37),
 * rollspelet 2026-09-27.
 *
 * ── PENDING_20260927d_plan_och_pass ──────────────────────────────────────
 * Kolumnerna skapas av `supabase/migrations/PENDING_20260927d_plan_och_pass.sql`:
 *   activity_plans.case_reference
 *   activity_sessions.is_provider_led, is_physical, work_placement_id,
 *                     af_notified_at, af_notified_by
 * Med `PLAN_PASS_KOLUMNER_FINNS = false` gör klienten så här:
 *   · skriver aldrig de nya kolumnerna (spridda objekt ur funktionerna nedan
 *     är tomma), så inga 42703/PGRST204-fel
 *   · döljer ärendefältet, flaggorna i passdialogerna och "AF underrättad"
 *   · räknar avtalsloggen på härledningen som förut (typ + platsfält)
 * Efter körning: `npm run schema:refresh`, sätt konstanten till true.
 * Kolumnerna läses bara via `select('*')` och skrivs bara via spridda objekt,
 * så lint:schema/lint:kolumner ser dem inte innan de finns i snapshoten.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Ren logik, inga databasanrop.
 */

import { arVerksamhetsledd, type PassTyp } from './aktivitetSchema'

/** PENDING_20260927d_plan_och_pass — true när migrationen körts och schema:refresh gjorts. */
export const PLAN_PASS_KOLUMNER_FINNS = true

// ---------------------------------------------------------------------------
// RK40: ärendenummer — utan personnummer
// ---------------------------------------------------------------------------

export const ARENDE_MAX_LANGD = 60

export type ArendeRegelverk = 'kommun' | 'leverantor'

/** Etiketten på fältet: kommunens verksamhetssystem respektive AF:s ärende-id. */
export const ARENDE_ETIKETT: Record<ArendeRegelverk, string> = {
  kommun: 'Ärendenummer i verksamhetssystemet',
  leverantor: 'Ärende-id hos Arbetsförmedlingen',
}

function giltigtDatum(ar: number, manad: number, dag: number): boolean {
  if (manad < 1 || manad > 12) return false
  // Samordningsnummer: dag + 60.
  const d = dag > 60 ? dag - 60 : dag
  if (d < 1) return false
  const dagarIManad = new Date(2000 + (ar % 100), manad, 0).getDate()
  return d <= dagarIManad
}

/**
 * Innehåller texten något som har formen av ett personnummer eller
 * samordningsnummer — ÅÅMMDD-XXXX, ÅÅÅÅMMDDXXXX, med eller utan bindestreck
 * eller plus — med ett datum som kan finnas? Siffrorna får inte ingå i en
 * längre sifferföljd. Kontrollsiffran prövas inte: ett felskrivet
 * personnummer är fortfarande ett personnummer.
 */
export function innehallerPersonnummer(text: string): boolean {
  const re = /(?<!\d)(?:(?:19|20)(\d{2})|(\d{2}))(\d{2})(\d{2})\s?[-+]?\s?\d{4}(?!\d)/g
  for (const m of text.matchAll(re)) {
    const ar = Number(m[1] ?? m[2])
    if (giltigtDatum(ar, Number(m[3]), Number(m[4]))) return true
  }
  return false
}

export type ArendeValidering = { ok: true; varde: string | null } | { ok: false; fel: string }

/** Tom text = inget ärendenummer (null). Personnummer nekas — planen ska matchas utan det. */
export function valideraArendenummer(text: string): ArendeValidering {
  const varde = text.trim()
  if (varde === '') return { ok: true, varde: null }
  if (varde.length > ARENDE_MAX_LANGD) return { ok: false, fel: `Högst ${ARENDE_MAX_LANGD} tecken.` }
  if (innehallerPersonnummer(varde)) {
    return { ok: false, fel: 'Det ser ut som ett personnummer. Ange ärendets nummer — personnummer sparas inte i Jobin.' }
  }
  return { ok: true, varde }
}

/** Kolumnen att sprida in i update-objektet — tomt före migrationen. */
export function arendeKolumn(varde: string | null, kolumnerFinns: boolean = PLAN_PASS_KOLUMNER_FINNS): Record<string, unknown> {
  return kolumnerFinns ? { case_reference: varde } : {}
}

/** Planens ärendenummer, eller null (också före migrationen, då fältet inte finns). */
export function planensArende(plan: { case_reference?: string | null }): string | null {
  const v = plan.case_reference?.trim()
  return v ? v : null
}

// ---------------------------------------------------------------------------
// RR27: leverantörsledd/egen och fysisk/digital per pass
// ---------------------------------------------------------------------------

export interface PassFlaggor {
  /** true = leverantören håller i passet, false = deltagarens egen aktivitet, null = inte märkt. */
  is_provider_led?: boolean | null
  /** true = fysiskt, false = digitalt, null = inte märkt. */
  is_physical?: boolean | null
}

type FlaggPass = PassFlaggor & { activity_type: PassTyp; location: string | null }

/** Härledningen från före RR27: arbetsplats eller ifyllt platsfält = fysiskt. */
export function harlettFysiskt(s: Pick<FlaggPass, 'activity_type' | 'location'>): boolean {
  return s.activity_type === 'workplace' || (s.location !== null && s.location.trim() !== '')
}

/** Fysiskt? Märkningen om den finns, annars härledningen (gamla pass). */
export function arFysisktPass(s: FlaggPass): boolean {
  return typeof s.is_physical === 'boolean' ? s.is_physical : harlettFysiskt(s)
}

/** Leverantörsledd? Märkningen om den finns, annars typen (anvisat och inte skolans). */
export function arLeverantorsledd(s: PassFlaggor & { activity_type: PassTyp }): boolean {
  return typeof s.is_provider_led === 'boolean' ? s.is_provider_led : arVerksamhetsledd(s)
}

export function fysiskHarledd(s: PassFlaggor): boolean {
  return typeof s.is_physical !== 'boolean'
}

export function ledningHarledd(s: PassFlaggor): boolean {
  return typeof s.is_provider_led !== 'boolean'
}

/** Förval i "Lägg till pass": samma som härledningen säger om typen och platsen. */
export function forvaldaFlaggor(s: Pick<FlaggPass, 'activity_type' | 'location'>): { is_provider_led: boolean; is_physical: boolean } {
  return { is_provider_led: arVerksamhetsledd(s), is_physical: harlettFysiskt(s) }
}

export interface PassExtra extends PassFlaggor {
  work_placement_id?: string | null
}

/** Pass-kolumnerna att sprida in i insert/update — tomt före migrationen. Odefinierat skrivs inte. */
export function passKolumner(e: PassExtra, kolumnerFinns: boolean = PLAN_PASS_KOLUMNER_FINNS): Record<string, unknown> {
  if (!kolumnerFinns) return {}
  const ut: Record<string, unknown> = {}
  if (e.is_provider_led !== undefined) ut.is_provider_led = e.is_provider_led
  if (e.is_physical !== undefined) ut.is_physical = e.is_physical
  if (e.work_placement_id !== undefined) ut.work_placement_id = e.work_placement_id
  return ut
}

/** RR28: "AF underrättad" — kolumnerna att sprida in; null nollställer. */
export function underrattadKolumner(nar: string | null, av: string | null, kolumnerFinns: boolean = PLAN_PASS_KOLUMNER_FINNS): Record<string, unknown> {
  return kolumnerFinns ? { af_notified_at: nar, af_notified_by: nar ? av : null } : {}
}
