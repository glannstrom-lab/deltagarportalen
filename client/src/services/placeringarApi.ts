/**
 * placeringarApi — praktik/arbetsträning/arbetsprövning/subventionerad
 * anställning i konsulentvyn (spår AG1).
 *
 * Tabellerna `consultant_work_placements` och
 * `consultant_work_placement_followups` skapas av migrationen
 * `supabase/migrations/20260831130000_ag1_work_placements.sql` — INTE körd
 * ännu (kräver Mikaels ja, se CLAUDE.md). Innan den är körd och
 * `npm run schema:refresh` har uppdaterat snapshoten kommer varje anrop
 * här att misslyckas mot en riktig databas, och `npm run lint:schema`
 * kommer flagga tabellnamnen som drift tills snapshoten är uppdaterad.
 *
 * Mönster (samma som consultantService.ts): varje metod hämtar
 * `auth.getUser()` själv och KASTAR om ingen är inloggad eller om
 * databasen svarar med fel. Ingen metod sväljer ett fel till `[]` eller
 * `null` — det mönstret (`if (error) { console.error(...); return [] }`)
 * är projektets stående synd (se CLAUDE.md, "Ett fel får aldrig se ut som
 * tom data"). Anroparen (PlatserTab / React Query) äger tre-lägen-logiken:
 * laddar / fel / klart.
 *
 * RLS begränsar redan konsulentens åtkomst till deltagare hen har en AKTIV
 * relation till (EXISTS mot consultant_participants, se migrationen och
 * KS2-lärdomen i CLAUDE.md) — men vi filtrerar även explicit på
 * `consultant_id = user.id` i frågorna här, av samma skäl som övriga
 * services i filen: policyn är golvet, inte den enda spärren.
 */

import { supabase } from '@/lib/supabase'
import { MILSTOLPE_VECKOR, PERIOD_RIKTVARDE } from '@/components/consultant/placeringLabels'

// ============================================================================
// TYPER
// ============================================================================

export type PlaceringTyp =
  | 'praktik'
  | 'arbetstraning'
  | 'arbetsprovning'
  | 'subventionerad_anstallning'

export type PlaceringStatus = 'planerad' | 'pagaende' | 'avslutad' | 'avbruten'

export type Niva = 'lag' | 'mellan' | 'hog'
export type Temperaturkrav = 'normal' | 'kyla' | 'varme'
export type EmployerHiringInterest = 'positiv' | 'avvaktande' | 'ej_aktuellt' | 'okant'

export interface Placering {
  id: string
  consultant_id: string
  participant_id: string
  company_account_id: string | null

  placement_type: PlaceringTyp
  status: PlaceringStatus

  company_name: string
  org_number: string | null
  occupation: string | null
  industry: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  address: string | null

  start_date: string | null
  end_date: string | null
  hours_per_week: number | null
  schedule_days: string | null
  can_ramp_up: boolean
  ramp_up_plan: string | null

  lifting_required: boolean | null
  standing_required: boolean | null
  temperature_demands: Temperaturkrav | null
  noise_level: Niva | null
  pace_level: Niva | null
  shift_work: boolean
  physical_notes: string | null

  participant_supervision_need: Niva | null
  workplace_supervision_capacity: Niva | null
  supervision_notes: string | null

  language_requirements: string | null
  drivers_license_required: boolean
  other_requirements: string | null

  sick_call_phone: string | null
  sick_call_instructions: string | null

  // ---- VAD skiljs från VARFÖR (Mikael, uppdragssvar 2026-08-31). Slå
  // aldrig ihop de här två igen — se byggArbetsgivarUnderlag() nedan. ----
  /** VAD arbetsplatsen ska göra, utan orsak. FÅR delas med arbetsgivaren. */
  employer_instructions: string | null
  /** VARFÖR — konsulentens interna anteckning, art. 9-närliggande. FÅR ALDRIG nå arbetsgivaren. */
  internal_adaptation_notes: string | null
  work_environment_responsibility: string | null

  // ---- Arbetsgivarens motivation — konsulentens interna underlag, inte
  // data att skicka tillbaka till arbetsgivaren. ----
  employer_future_needs: string | null
  employer_hiring_interest: EmployerHiringInterest | null

  notes: string | null

  created_at: string
  updated_at: string
}

/** Fälten formuläret skriver. Serverdefault sköter status/typ-defaults, id, tidsstämplar. */
export type PlaceringInput = Partial<Omit<Placering, 'id' | 'consultant_id' | 'created_at' | 'updated_at'>> & {
  participant_id: string
  company_name: string
  placement_type: PlaceringTyp
}

export type UppfoljningStatus = 'good' | 'concerns' | 'critical'

export interface PlaceringUppfoljning {
  id: string
  placement_id: string
  consultant_id: string
  /** Milstolpe (se MILSTOLPE_VECKOR i placeringLabels.ts), inte löpnummer i en veckoserie. */
  week_number: number
  followup_date: string
  /** Genomförd (kan ha attendance/status) eller PLANERAD (inget av det ännu). */
  is_completed: boolean
  attendance_pct: number | null
  /**
   * NULL = planerad, inte genomförd än. En genomförd uppföljning har alltid
   * en status — se CHECK-constraint `cwpf_status_kraver_genomford` i
   * migrationen. Ett förifyllt värde här på något som inte hänt vore ett
   * påhittat värde (CLAUDE.md).
   */
  status: UppfoljningStatus | null
  topics_to_discuss: string | null
  notes: string | null
  next_step: string | null
  created_at: string
  updated_at: string
}

export type PlaceringUppfoljningInput = Partial<
  Omit<PlaceringUppfoljning, 'id' | 'consultant_id' | 'created_at' | 'updated_at'>
> & {
  placement_id: string
  week_number: number
  followup_date: string
}

/** Rad från vyn `consultant_dashboard_participants` — bara det picker-listan behöver. */
export interface KopplaBarDeltagare {
  participant_id: string
  first_name: string | null
  last_name: string | null
  email: string
}

async function kravInloggadAnvandare(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

// ============================================================================
// REN LOGIK (ingen nätverksåtkomst) — testas direkt, utan supabase-mock
// ============================================================================

/**
 * Fälten som får delas med en arbetsgivare — en ALLOWLIST med flit
 * (Mikael, uppdragssvar 2026-08-31). Räknas upp explicit i stället för att
 * härledas ur `Placering` med en denylist, så att ett nytt fält på
 * `consultant_work_placements` aldrig läcker hit av misstag — det måste
 * läggas till här FÖR HAND innan det kan nå ett arbetsgivarunderlag.
 *
 * Medvetet UTESLUTNA (konsulentens interna underlag, aldrig delningsbart):
 * id, consultant_id, participant_id, company_account_id, status,
 * contact_name/phone/email/address (arbetsgivarens EGNA kontaktuppgifter —
 * inget de behöver få tillbaka), participant_supervision_need,
 * workplace_supervision_capacity, supervision_notes (bedömningen av
 * ARBETSPLATSEN, inte instruktioner till den), internal_adaptation_notes
 * (VARFÖR, art. 9-närliggande), employer_future_needs,
 * employer_hiring_interest (säljargument/prognos om arbetsgivaren, inte
 * till arbetsgivaren), notes (fri intern anteckning), created_at, updated_at.
 */
export interface ArbetsgivarUnderlag {
  placement_type: PlaceringTyp
  company_name: string
  occupation: string | null
  industry: string | null
  start_date: string | null
  end_date: string | null
  hours_per_week: number | null
  schedule_days: string | null
  can_ramp_up: boolean
  ramp_up_plan: string | null
  lifting_required: boolean | null
  standing_required: boolean | null
  temperature_demands: Temperaturkrav | null
  noise_level: Niva | null
  pace_level: Niva | null
  shift_work: boolean
  physical_notes: string | null
  language_requirements: string | null
  drivers_license_required: boolean
  other_requirements: string | null
  sick_call_phone: string | null
  sick_call_instructions: string | null
  /** VAD arbetsplatsen ska göra — utan orsak. Det enda av "anpassnings"-fälten som får med. */
  employer_instructions: string | null
  work_environment_responsibility: string | null
}

/**
 * Bygger det underlag som FÅR serialiseras mot en arbetsgivare. Se
 * ArbetsgivarUnderlag ovan för allowlistens motivering. Skriv aldrig om
 * detta till `{ ...p }` eller en denylist — se
 * placeringarApi.test.ts ("byggArbetsgivarUnderlag") för vakten som fäller
 * om ett internt fält dyker upp i utdatan.
 */
function byggArbetsgivarUnderlag(p: Placering): ArbetsgivarUnderlag {
  return {
    placement_type: p.placement_type,
    company_name: p.company_name,
    occupation: p.occupation,
    industry: p.industry,
    start_date: p.start_date,
    end_date: p.end_date,
    hours_per_week: p.hours_per_week,
    schedule_days: p.schedule_days,
    can_ramp_up: p.can_ramp_up,
    ramp_up_plan: p.ramp_up_plan,
    lifting_required: p.lifting_required,
    standing_required: p.standing_required,
    temperature_demands: p.temperature_demands,
    noise_level: p.noise_level,
    pace_level: p.pace_level,
    shift_work: p.shift_work,
    physical_notes: p.physical_notes,
    language_requirements: p.language_requirements,
    drivers_license_required: p.drivers_license_required,
    other_requirements: p.other_requirements,
    sick_call_phone: p.sick_call_phone,
    sick_call_instructions: p.sick_call_instructions,
    employer_instructions: p.employer_instructions,
    work_environment_responsibility: p.work_environment_responsibility,
  }
}

/**
 * Handledningsobalansen — KRITISK, inte jämbördig med övriga dimensioner
 * (Mikael, uppdragssvar 2026-08-31): "arbetsplatsen inte har tid med
 * handledning" är den vanligaste orsaken till att en placering spricker.
 * `PlaceringCard` lyfter detta som en egen, synlig varning — INNAN
 * placeringen startar, inte en rad text bland andra.
 */
function harHandledningsobalans(p: Pick<Placering, 'workplace_supervision_capacity' | 'participant_supervision_need'>): boolean {
  return p.workplace_supervision_capacity === 'lag' && p.participant_supervision_need === 'hog'
}

/**
 * Förbereder de fyra MILSTOLPE-uppföljningarna (vecka 1/5/12/24,
 * MILSTOLPE_VECKOR i placeringLabels.ts) som PLANERADE rader utifrån ett
 * startdatum — inte en löpande veckoserie (Mikael, uppdragssvar
 * 2026-08-31). Planerade rader har `is_completed: false` och `status: null`
 * — ett förifyllt 'good' på något som inte hänt vore ett påhittat värde.
 */
function berakMilstolpeUppfoljningar(placementId: string, startDate: string): PlaceringUppfoljningInput[] {
  const start = new Date(`${startDate}T00:00:00Z`)
  return MILSTOLPE_VECKOR.map((vecka) => {
    const datum = new Date(start)
    datum.setUTCDate(datum.getUTCDate() + vecka * 7)
    return {
      placement_id: placementId,
      week_number: vecka,
      followup_date: datum.toISOString().slice(0, 10),
      is_completed: false,
      status: null,
    }
  })
}

export interface PeriodForslag {
  /** Föreslaget slutdatum baserat på riktvärdet, eller null om typen inte har någon bortre gräns. */
  foreslagetSlutdatum: string | null
  /** Diskret notering — sant om vald period är TYDLIGT längre än riktvärdet (≥50 % över). Blockerar aldrig. */
  avvikerTydligt: boolean
  /** Beskrivningstexten för insatstypens riktvärde, för att visas som hjälptext. */
  meddelande: string
}

/**
 * Periodriktvärde per insatstyp (PERIOD_RIKTVARDE i placeringLabels.ts) —
 * ett FÖRSLAG på slutdatum och en diskret avvikelsenotering. Blockerar
 * aldrig sparning; Mikael vet när ett undantag är rätt (uppdragssvar
 * 2026-08-31).
 */
function berakPeriodForslag(
  placementType: PlaceringTyp,
  startDate: string | null,
  endDate: string | null
): PeriodForslag {
  const riktvarde = PERIOD_RIKTVARDE[placementType]

  if (!startDate || !riktvarde.maxManader) {
    return { foreslagetSlutdatum: null, avvikerTydligt: false, meddelande: riktvarde.beskrivning }
  }

  const start = new Date(`${startDate}T00:00:00Z`)
  const foreslaget = new Date(start)
  foreslaget.setUTCMonth(foreslaget.getUTCMonth() + riktvarde.maxManader)
  const foreslagetSlutdatum = foreslaget.toISOString().slice(0, 10)

  let avvikerTydligt = false
  if (endDate) {
    const slut = new Date(`${endDate}T00:00:00Z`)
    const dagar = (slut.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    const maxDagar = riktvarde.maxManader * 30
    avvikerTydligt = dagar > maxDagar * 1.5
  }

  return { foreslagetSlutdatum, avvikerTydligt, meddelande: riktvarde.beskrivning }
}

// ============================================================================
// DELTAGARE ATT KOPPLA (picker)
// ============================================================================

async function getKopplingsbaraDeltagare(): Promise<KopplaBarDeltagare[]> {
  const consultantId = await kravInloggadAnvandare()

  const { data, error } = await supabase
    .from('consultant_dashboard_participants')
    .select('participant_id, first_name, last_name, email')
    .eq('consultant_id', consultantId)

  if (error) throw error
  return data || []
}

// ============================================================================
// PLACERINGAR
// ============================================================================

async function getPlaceringar(): Promise<Placering[]> {
  const consultantId = await kravInloggadAnvandare()

  const { data, error } = await supabase
    .from('consultant_work_placements')
    .select('*')
    .eq('consultant_id', consultantId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

async function getPlaceringarForDeltagare(participantId: string): Promise<Placering[]> {
  const consultantId = await kravInloggadAnvandare()

  const { data, error } = await supabase
    .from('consultant_work_placements')
    .select('*')
    .eq('consultant_id', consultantId)
    .eq('participant_id', participantId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

async function createPlacering(input: PlaceringInput): Promise<Placering> {
  const consultantId = await kravInloggadAnvandare()

  const { data, error } = await supabase
    .from('consultant_work_placements')
    .insert({ ...input, consultant_id: consultantId })
    .select('*')
    .single()

  if (error) throw error
  return data
}

async function updatePlacering(id: string, updates: Partial<PlaceringInput>): Promise<Placering> {
  const consultantId = await kravInloggadAnvandare()

  const { data, error } = await supabase
    .from('consultant_work_placements')
    .update(updates)
    .eq('id', id)
    .eq('consultant_id', consultantId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

async function deletePlacering(id: string): Promise<void> {
  const consultantId = await kravInloggadAnvandare()

  const { error } = await supabase
    .from('consultant_work_placements')
    .delete()
    .eq('id', id)
    .eq('consultant_id', consultantId)

  if (error) throw error
}

// ============================================================================
// VECKOUPPFÖLJNINGAR
// ============================================================================

async function getUppfoljningar(placementId: string): Promise<PlaceringUppfoljning[]> {
  await kravInloggadAnvandare()

  const { data, error } = await supabase
    .from('consultant_work_placement_followups')
    .select('*')
    .eq('placement_id', placementId)
    .order('week_number', { ascending: true })

  if (error) throw error
  return data || []
}

async function createUppfoljning(input: PlaceringUppfoljningInput): Promise<PlaceringUppfoljning> {
  const consultantId = await kravInloggadAnvandare()

  const { data, error } = await supabase
    .from('consultant_work_placement_followups')
    .insert({ ...input, consultant_id: consultantId })
    .select('*')
    .single()

  if (error) throw error
  return data
}

async function updateUppfoljning(
  id: string,
  updates: Partial<PlaceringUppfoljningInput>
): Promise<PlaceringUppfoljning> {
  const consultantId = await kravInloggadAnvandare()

  const { data, error } = await supabase
    .from('consultant_work_placement_followups')
    .update(updates)
    .eq('id', id)
    .eq('consultant_id', consultantId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

async function deleteUppfoljning(id: string): Promise<void> {
  const consultantId = await kravInloggadAnvandare()

  const { error } = await supabase
    .from('consultant_work_placement_followups')
    .delete()
    .eq('id', id)
    .eq('consultant_id', consultantId)

  if (error) throw error
}

export const placeringarApi = {
  getKopplingsbaraDeltagare,
  getPlaceringar,
  getPlaceringarForDeltagare,
  createPlacering,
  updatePlacering,
  deletePlacering,
  getUppfoljningar,
  createUppfoljning,
  updateUppfoljning,
  deleteUppfoljning,
  // Ren logik, ingen nätverksåtkomst — se sektionen ovan kravInloggadAnvandare.
  byggArbetsgivarUnderlag,
  harHandledningsobalans,
  berakMilstolpeUppfoljningar,
  berakPeriodForslag,
}
