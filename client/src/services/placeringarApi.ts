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
  /** AG6: företagskontot (organizations.kind='arbetsgivare'). Sätts av inbjudan (employer_invitations) eller vid val av företagets plats. */
  company_account_id: string | null
  /** AG6: företagets egen plats (employer_places) som den här placeringen bygger på. Nullbar — manuellt inmatade platser har ingen. */
  place_id: string | null

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

/**
 * AG6: en rad i `employer_places` — det företaget erbjuder, utan person.
 * Personal har SELECT på alla (policy "Personal läser företagens platser").
 * `organizations` bäddas in via FK org_id, men konsulenten har bara SELECT
 * på organisationer hon själv är medlem i ("Medlem ser sin organisation",
 * KM2) — för ett företagskonto blir inbäddningen därför normalt `null`.
 * Visa aldrig ett påhittat företagsnamn i det läget (CLAUDE.md 2026-08-09).
 */
export interface Foretagsplats {
  id: string
  org_id: string
  title: string
  placement_type: PlaceringTyp
  description: string | null
  status: 'oppen' | 'pausad' | 'tillsatt' | 'stangd'
  hours_per_week: number | null
  schedule_days: string | null
  start_from: string | null
  address: string | null
  lifting_required: boolean | null
  standing_required: boolean | null
  temperature_demands: Temperaturkrav | null
  noise_level: Niva | null
  pace_level: Niva | null
  shift_work: boolean
  physical_notes: string | null
  workplace_supervision_capacity: Niva | null
  supervision_notes: string | null
  language_requirements: string | null
  drivers_license_required: boolean
  other_requirements: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  sick_call_phone: string | null
  sick_call_instructions: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  organizations: { name: string; org_number: string | null } | null
}

/** AG6: företagets avstämning (employer_checkins) — konsulenten läser raderna på egna placeringar. */
export interface Foretagsavstamning {
  id: string
  placement_id: string
  org_id: string
  author_id: string | null
  milestone_week: number
  going_well: string | null
  concerns: string | null
  continue_interest: 'ja' | 'kanske' | 'nej' | null
  created_at: string
}

export interface ForetagsInbjudanInput {
  org_number: string
  company_name: string
  email: string
  contact_name: string
  /** Placeringen vars company_account_id ska sättas — bara om konsulenten äger den (triggern kontrollerar). */
  placement_id?: string | null
}

/** Raden vyn `employer_invitations` returnerar efter INSTEAD OF INSERT. */
export interface ForetagsInbjudan {
  id: string
  org_id: string
  company_name: string | null
  org_number: string | null
  email: string
  contact_name: string | null
  /** true = e-posten hade redan ett konto; personen blev medlem direkt och mejlet säger "logga in". */
  existing_account: boolean
  email_sent: boolean | null
  used_at: string | null
  expires_at: string | null
  created_at: string
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
 * id, consultant_id, participant_id, company_account_id, place_id, status,
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

/**
 * KS2 b (2026-09-12): inget filter på consultant_id här. RLS ("KS2b: konsulent
 * läser aktiva deltagares platser") avgör vad som syns — även företrädarens
 * platser för en överlämnad deltagare. Skriv-/raderingsfunktionerna nedan
 * filtrerar fortfarande på egen consultant_id, som RLS också kräver.
 */
async function getPlaceringar(): Promise<Placering[]> {
  await kravInloggadAnvandare()

  const { data, error } = await supabase
    .from('consultant_work_placements')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

async function getPlaceringarForDeltagare(participantId: string): Promise<Placering[]> {
  await kravInloggadAnvandare()

  const { data, error } = await supabase
    .from('consultant_work_placements')
    .select('*')
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

// ============================================================================
// FÖRETAGSKONTOT (AG6) — företagets platser, inbjudan, avstämningar
// ============================================================================

/**
 * Alla företags platser (RLS: personal läser alla). Anroparen filtrerar på
 * status — PlaceringFormModal visar bara `oppen`. Inbäddningen av
 * `organizations` är best effort (se Foretagsplats): null när RLS nekar.
 */
async function getForetagsplatser(): Promise<Foretagsplats[]> {
  await kravInloggadAnvandare()

  const { data, error } = await supabase
    .from('employer_places')
    .select('*, organizations(name, org_number)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as Foretagsplats[]
}

/**
 * Bjuder in företagets kontaktperson: INSERT i vyn `employer_invitations`
 * (INSTEAD OF-trigger, definer) som hittar eller skapar företagskontot på
 * org.nr, sätter placeringens company_account_id om konsulenten äger den,
 * och skapar inbjudan. Därefter mejlet via edge-funktionen send-invite-email
 * — samma anrop som InviteParticipantDialog, men ett misslyckat mejl KASTAS
 * här i stället för console.warn + tyst succé: raden finns, mejlet nådde
 * inte fram, och det ska konsulenten få veta.
 *
 * Databasens fel är på svenska och ska visas rakt av ("Demokontot kan inte
 * bjuda in …", "Organisationsnumret ska ha tio siffror", "E-posten tillhör
 * ett personalkonto …").
 */
async function bjudInForetag(input: ForetagsInbjudanInput): Promise<ForetagsInbjudan> {
  await kravInloggadAnvandare()

  const { data, error } = await supabase
    .from('employer_invitations')
    .insert({
      org_number: input.org_number.trim(),
      company_name: input.company_name.trim(),
      email: input.email.trim(),
      contact_name: input.contact_name.trim(),
      placement_id: input.placement_id ?? null,
    })
    .select('*')
    .single()

  if (error) throw new Error(felText(error))
  const inbjudan = data as ForetagsInbjudan

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Inbjudan är registrerad men mejlet kunde inte skickas: ingen inloggad session.')

  let svar: Response
  try {
    svar = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invite-email`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invitationId: inbjudan.id }),
    })
  } catch (e) {
    throw new Error(`Inbjudan är registrerad men mejlet kunde inte skickas: ${e instanceof Error ? e.message : 'nätverksfel'}`)
  }
  if (!svar.ok) {
    let detalj = `HTTP ${svar.status}`
    try {
      const body = (await svar.json()) as { error?: string; details?: string }
      detalj = [body.error, body.details].filter(Boolean).join(' — ') || detalj
    } catch {
      // svaret var inte JSON — HTTP-koden får räcka
    }
    throw new Error(`Inbjudan är registrerad men mejlet kunde inte skickas: ${detalj}`)
  }

  return inbjudan
}

/** Företagets avstämningar på en placering (RLS: bara på egna placeringar). Tom lista = inga rader, inte fel. */
async function getForetagsavstamningar(placementId: string): Promise<Foretagsavstamning[]> {
  await kravInloggadAnvandare()

  const { data, error } = await supabase
    .from('employer_checkins')
    .select('*')
    .eq('placement_id', placementId)
    .order('milestone_week', { ascending: true })

  if (error) throw error
  return (data || []) as Foretagsavstamning[]
}

/** Databasens (svenska) meddelande föredras — triggrarna skriver dem för att visas rakt av. */
function felText(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    const m = (e as { message: string }).message.trim()
    if (m) return m
  }
  return 'Kunde inte spara'
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
  getForetagsplatser,
  bjudInForetag,
  getForetagsavstamningar,
  // Ren logik, ingen nätverksåtkomst — se sektionen ovan kravInloggadAnvandare.
  byggArbetsgivarUnderlag,
  harHandledningsobalans,
  berakMilstolpeUppfoljningar,
  berakPeriodForslag,
}
