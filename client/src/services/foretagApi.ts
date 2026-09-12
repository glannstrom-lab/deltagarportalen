/**
 * foretagApi — företagskontots egna läs- och skrivvägar (AG6/AG7/AG8,
 * migration 20260913100000, körd i prod 2026-09-13).
 *
 * Företaget läser ALDRIG employer_share_proposals, consultant_work_placements,
 * profiles eller cvs direkt. Det får två vyer ägda av postgres med vitlistade
 * kolumner:
 *   employer_proposals  — bara accepterade förslag till det egna företaget,
 *                          personuppgifter bara där deltagaren bockat show_*.
 *                          UPDATE går via en INSTEAD OF-trigger: en UPDATE utan
 *                          nytt employer_response räknas som "öppnad" (view_count
 *                          + 1, inom taket), en UPDATE med 'interested'|'declined'
 *                          är företagets svar och skapar notis till konsulenten.
 *   employer_placements — placeringar hos företaget som har ett accepterat
 *                          förslag (samtycket är villkoret för att en person syns).
 * Egna tabeller (RLS via ar_foretagsmedlem): employer_profiles, employer_places,
 * employer_checkins. Meddelanden bor i delningsforslagApi.foretagsTradApi — skriv
 * inga egna meddelandefrågor här.
 *
 * Mönster som övriga services: kastar vid fel, sväljer aldrig till []. Databasens
 * felmeddelanden är på svenska och ska visas rakt av i UI:t.
 */

import { supabase } from '@/lib/supabase'
import type { ForetagsSvar } from '@/services/delningsforslagApi'
import type { Niva, PlaceringStatus, PlaceringTyp, Temperaturkrav } from '@/services/placeringarApi'

export type { ForetagsSvar }

export type PlatsStatus = 'oppen' | 'pausad' | 'tillsatt' | 'stangd'
export type Handledningskapacitet = Niva
export type AvstamningVecka = 12 | 24
export type FortsattIntresse = 'ja' | 'kanske' | 'nej'

// ---------------------------------------------------------------- profil

export interface ForetagsProfil {
  org_id: string
  description: string | null
  accepts_interns: boolean | null
  typical_needs: string | null
  website: string | null
  city: string | null
  industry: string | null
  employee_count: string | null
  company_data: Record<string, unknown> | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export type ForetagsProfilInput = Partial<
  Pick<ForetagsProfil, 'description' | 'accepts_interns' | 'typical_needs' | 'website' | 'city' | 'industry' | 'employee_count'>
>

// ---------------------------------------------------------------- platser

export interface Plats {
  id: string
  org_id: string
  title: string
  placement_type: PlaceringTyp
  description: string | null
  status: PlatsStatus
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
  workplace_supervision_capacity: Handledningskapacitet | null
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
}

export type PlatsInput = Partial<Omit<Plats, 'id' | 'org_id' | 'created_by' | 'created_at' | 'updated_at'>> & {
  title: string
  placement_type: PlaceringTyp
}

// ---------------------------------------------------------------- förslag (vy)

/** En kompetens ur profile_skills, som vyn bygger med jsonb_build_object. */
export interface ForslagKompetens {
  name: string
  category: string | null
  level: string | number | null
  years_experience: number | null
}

/** Rad ur vyn employer_proposals. Fält med `| null` är null när deltagaren inte delat dem. */
export interface Forslag {
  id: string
  org_id: string
  placement_id: string
  presentation_text: string | null
  expires_at: string | null
  max_views: number | null
  view_count: number
  last_viewed_at: string | null
  decided_at: string | null
  created_at: string
  employer_response: ForetagsSvar
  employer_message: string | null
  employer_responded_at: string | null
  show_contact: boolean
  show_summary: boolean
  show_skills: boolean
  show_experience: boolean
  show_education: boolean
  placement_type: PlaceringTyp
  occupation: string | null
  start_date: string | null
  end_date: string | null
  hours_per_week: number | null
  schedule_days: string | null
  place_id: string | null
  place_title: string | null
  consultant_first_name: string | null
  consultant_last_name: string | null
  consultant_email: string | null
  consultant_phone: string | null
  participant_first_name: string | null
  participant_last_name: string | null
  participant_email: string | null
  participant_phone: string | null
  participant_location: string | null
  participant_summary: string | null
  participant_skills: ForslagKompetens[] | null
  /** jsonb ur cvs.work_experience — formen ägs av CV-byggaren, hantera okänd form utan krasch. */
  participant_experience: unknown
  /** jsonb ur cvs.education — samma förbehåll. */
  participant_education: unknown
}

// ---------------------------------------------------------------- pågående (vy)

export interface PagaendePlacering {
  id: string
  org_id: string
  placement_type: PlaceringTyp
  status: PlaceringStatus
  occupation: string | null
  start_date: string | null
  end_date: string | null
  hours_per_week: number | null
  schedule_days: string | null
  can_ramp_up: boolean | null
  ramp_up_plan: string | null
  employer_instructions: string | null
  work_environment_responsibility: string | null
  sick_call_phone: string | null
  sick_call_instructions: string | null
  place_id: string | null
  place_title: string | null
  participant_first_name: string | null
  participant_last_name: string | null
  consultant_first_name: string | null
  consultant_last_name: string | null
  consultant_email: string | null
  consultant_phone: string | null
  proposal_id: string
  employer_response: ForetagsSvar
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------- avstämningar

export interface Avstamning {
  id: string
  placement_id: string
  org_id: string
  author_id: string | null
  milestone_week: number
  going_well: string | null
  concerns: string | null
  continue_interest: FortsattIntresse | null
  created_at: string
}

export interface AvstamningInput {
  placement_id: string
  org_id: string
  milestone_week: AvstamningVecka
  going_well?: string | null
  concerns?: string | null
  continue_interest?: FortsattIntresse | null
}

// ---------------------------------------------------------------- inbjudan

export interface ForetagsInbjudan {
  id: string
  org_id: string
  email: string
  contact_name: string | null
  /** true = personen hade redan ett konto och är medlem direkt; mejlet säger "logga in". */
  existing_account: boolean
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Inte inloggad')
  return data.user.id
}

/** Databasens svenska meddelande före allt annat — triggrarna skriver dem för att visas rakt av. */
export function foretagFelText(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    const m = (e as { message: string }).message.trim()
    if (m) return m
  }
  if (e instanceof Error && e.message.trim()) return e.message
  return 'Något gick fel. Försök igen.'
}

function tomTillNull(v: string | null | undefined): string | null {
  const t = (v ?? '').trim()
  return t ? t : null
}

export const foretagApi = {
  // ============================================================== profil

  async getProfil(orgId: string): Promise<ForetagsProfil | null> {
    await requireUserId()
    const { data, error } = await supabase
      .from('employer_profiles')
      .select('*')
      .eq('org_id', orgId)
      .maybeSingle()
    if (error) throw error
    return (data as ForetagsProfil | null) ?? null
  },

  async upsertProfil(orgId: string, input: ForetagsProfilInput): Promise<ForetagsProfil> {
    const userId = await requireUserId()
    const { data, error } = await supabase
      .from('employer_profiles')
      .upsert({ ...input, org_id: orgId, updated_by: userId }, { onConflict: 'org_id' })
      .select('*')
      .single()
    if (error) throw error
    return data as ForetagsProfil
  },

  // ============================================================== platser

  async listaPlatser(orgId: string): Promise<Plats[]> {
    await requireUserId()
    const { data, error } = await supabase
      .from('employer_places')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as Plats[]
  },

  async skapaPlats(orgId: string, input: PlatsInput): Promise<Plats> {
    const userId = await requireUserId()
    if (!input.title.trim()) throw new Error('Ge platsen en rubrik')
    const { data, error } = await supabase
      .from('employer_places')
      .insert({ ...input, title: input.title.trim(), org_id: orgId, created_by: userId })
      .select('*')
      .single()
    if (error) throw error
    return data as Plats
  },

  async uppdateraPlats(id: string, patch: Partial<PlatsInput>): Promise<Plats> {
    await requireUserId()
    if (patch.title !== undefined && !patch.title.trim()) throw new Error('Ge platsen en rubrik')
    const { data, error } = await supabase
      .from('employer_places')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as Plats
  },

  async raderaPlats(id: string): Promise<void> {
    await requireUserId()
    const { error } = await supabase.from('employer_places').delete().eq('id', id)
    if (error) throw error
  },

  // ============================================================== förslag

  /** Förslag deltagaren godkänt att dela med just detta företag. Nyaste beslut först. */
  async listaForslag(orgId: string): Promise<Forslag[]> {
    await requireUserId()
    const { data, error } = await supabase
      .from('employer_proposals')
      .select('*')
      .eq('org_id', orgId)
      .order('decided_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as Forslag[]
  },

  /**
   * "Öppnad": en UPDATE via vyn UTAN nytt employer_response får triggern
   * employer_proposals_update att räkna en visning (view_count + 1, last_viewed_at
   * = now()) — inom max_views. PostgREST kan inte uttrycka `set view_count =
   * view_count`, så vi skickar en kolumn triggern ändå skriver över själv
   * (last_viewed_at). Kastar databasens "Förslaget kan inte visas fler gånger"
   * när taket är nått — visa det, sväljer inte.
   */
  async markeraOppnad(id: string): Promise<void> {
    await requireUserId()
    const { error } = await supabase
      .from('employer_proposals')
      .update({ last_viewed_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw new Error(foretagFelText(error))
  },

  /**
   * Företagets svar. Triggern kräver 'interested' | 'declined', nekar ett andra
   * svar efter ett nej, och skapar notisen till konsulenten själv.
   */
  async svara(id: string, svar: Exclude<ForetagsSvar, 'pending'>, meddelande?: string | null): Promise<void> {
    await requireUserId()
    const { error } = await supabase
      .from('employer_proposals')
      .update({ employer_response: svar, employer_message: tomTillNull(meddelande) })
      .eq('id', id)
    if (error) throw new Error(foretagFelText(error))
  },

  // ============================================================== pågående

  async listaPagaende(orgId: string): Promise<PagaendePlacering[]> {
    await requireUserId()
    const { data, error } = await supabase
      .from('employer_placements')
      .select('*')
      .eq('org_id', orgId)
      .order('start_date', { ascending: false })
    if (error) throw error
    return (data ?? []) as PagaendePlacering[]
  },

  // ============================================================== avstämningar

  async listaAvstamningar(orgId: string): Promise<Avstamning[]> {
    await requireUserId()
    const { data, error } = await supabase
      .from('employer_checkins')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as Avstamning[]
  },

  /** RLS kräver author_id = auth.uid() och att placeringen syns i employer_placements. */
  async skapaAvstamning(input: AvstamningInput): Promise<Avstamning> {
    const userId = await requireUserId()
    if (input.milestone_week !== 12 && input.milestone_week !== 24) {
      throw new Error('Avstämningen görs vid vecka 12 eller vecka 24')
    }
    const { data, error } = await supabase
      .from('employer_checkins')
      .insert({
        placement_id: input.placement_id,
        org_id: input.org_id,
        author_id: userId,
        milestone_week: input.milestone_week,
        going_well: tomTillNull(input.going_well),
        concerns: tomTillNull(input.concerns),
        continue_interest: input.continue_interest ?? null,
      })
      .select('*')
      .single()
    if (error) throw new Error(foretagFelText(error))
    return data as Avstamning
  },

  // ============================================================== kollegor

  /**
   * Bjuder in en kollega till företagskontot: INSERT på vyn employer_invitations
   * (INSTEAD OF-triggern skapar inbjudan, gör en befintlig användare medlem direkt,
   * och nekar demokonton med 42501 + svensk text) — sedan mejlet via edge-
   * funktionen send-invite-email, exakt som InviteParticipantDialog gör. Ett
   * mejlfel kastas: inbjudan finns då i databasen men personen har inte fått
   * något, och det ska den som bjuder in få veta.
   */
  async bjudInKollega(orgId: string, email: string, contactName: string): Promise<ForetagsInbjudan> {
    await requireUserId()
    const adress = email.trim().toLowerCase()
    if (!adress.includes('@')) throw new Error('Ange en giltig e-postadress')
    const { data, error } = await supabase
      .from('employer_invitations')
      .insert({ org_id: orgId, email: adress, contact_name: tomTillNull(contactName) })
      .select('id, org_id, email, contact_name, existing_account')
      .single()
    if (error) throw new Error(foretagFelText(error))
    const inbjudan = data as ForetagsInbjudan

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Inbjudan är sparad men mejlet kunde inte skickas: sessionen saknas. Logga in igen och försök på nytt.')
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
      throw new Error(`Inbjudan är sparad men mejlet kunde inte skickas (${foretagFelText(e)}). Be kollegan logga in med adressen ${adress}, eller försök igen.`)
    }
    if (!svar.ok) {
      throw new Error(`Inbjudan är sparad men mejlet kunde inte skickas (HTTP ${svar.status}). Be kollegan logga in med adressen ${adress}, eller försök igen.`)
    }
    return inbjudan
  },
}

// ============================================================================
// Ren logik (ingen nätverksåtkomst) — testbar utan mock
// ============================================================================

const MS_PER_DAG = 86_400_000

/**
 * "Vecka X av Y" räknat ur start- och slutdatum. Före start: vecka 0. Utan start:
 * null (ingen påhittad vecka). Utan slut: totalt = null → "vecka X".
 */
export function veckaAvTotal(
  startDate: string | null,
  endDate: string | null,
  idag: Date = new Date(),
): { vecka: number; totalt: number | null } | null {
  if (!startDate) return null
  const start = new Date(startDate)
  if (Number.isNaN(start.getTime())) return null
  const dagar = Math.floor((idag.getTime() - start.getTime()) / MS_PER_DAG)
  const vecka = dagar < 0 ? 0 : Math.floor(dagar / 7) + 1
  let totalt: number | null = null
  if (endDate) {
    const slut = new Date(endDate)
    if (!Number.isNaN(slut.getTime()) && slut.getTime() >= start.getTime()) {
      totalt = Math.max(1, Math.ceil((slut.getTime() - start.getTime()) / MS_PER_DAG / 7))
    }
  }
  return { vecka, totalt }
}

/** Hela dagar sedan ett datum — för "äldsta väntar X dagar". */
export function dagarSedan(iso: string | null, idag: Date = new Date()): number | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return Math.max(0, Math.floor((idag.getTime() - d.getTime()) / MS_PER_DAG))
}

export function formateraDatum(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function fulltNamn(fornamn: string | null | undefined, efternamn: string | null | undefined): string {
  return [fornamn, efternamn].filter((s) => !!s && s.trim()).join(' ').trim()
}
