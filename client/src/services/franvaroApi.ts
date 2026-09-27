/**
 * franvaroApi — deltagaren anmäler att hen inte kan komma till ett pass (F1,
 * persona-genomgång 2026-09-12). Skriver tre kolumner på activity_sessions
 * (absence_reported_at, absence_reason, absence_note) som triggern
 * activity_sessions_participant_guard släpper igenom för deltagaren så länge
 * konsulenten inte markerat passet. Notisen till konsulenten läggs av en
 * databastrigger (activity_sessions_absence_notify) — deltagaren har ingen
 * INSERT-rätt på konsulentens notiser och ska inte ha det.
 *
 * Kolumnerna kommer ur migrationen 20260913000000_f1_franvaroanmalan.sql.
 * Tills den är körd mot prod svarar uppdateringen 42703/PGRST204 — UI:t visar
 * då det vanliga felet "gick inte att anmäla".
 */

import { supabase } from '@/lib/supabase'
import { mapSession, type ActivitySession } from './aktivitetApi'

export type FranvaroOrsak = 'sick' | 'child_care' | 'authority_meeting' | 'other'

export const FRANVARO_ORSAKER: readonly FranvaroOrsak[] = ['sick', 'child_care', 'authority_meeting', 'other'] as const

/** Passet så som det ser ut efter migrationen. Fälten saknas i ActivitySession tills snapshoten är uppdaterad. */
export type SessionMedFranvaro = ActivitySession & {
  absence_reported_at?: string | null
  absence_reason?: FranvaroOrsak | null
  absence_note?: string | null
  /** RD11: deltagarens förklaring i efterhand. Kolumnen kommer ur PENDING_20260927b_franvaro_forklaring.sql. */
  participant_explanation?: string | null
  participant_explanation_at?: string | null
}

/**
 * RD11 (rollspelet 2026-09-27): en markerad frånvaro gick inte att förklara i
 * efterhand och stod oförklarad på intyget till handläggaren.
 *
 * Förklaringen är en egen kolumn, inte `absence_note`: anmälan kommer FÖRE
 * passet och hör ihop med en orsak (CHECK-par), förklaringen kommer EFTER
 * konsulentens markering. Guarden i databasen släpper igenom förklaringen bara
 * på pass som konsulenten markerat som frånvaro.
 */
export const FORKLARING_MAX = 500

export interface Franvaroforklaring {
  text: string
  at: string | null
}

export function forklaringAv(session: ActivitySession): Franvaroforklaring | null {
  const s = session as SessionMedFranvaro
  const text = s.participant_explanation?.trim()
  return text ? { text, at: s.participant_explanation_at ?? null } : null
}

/**
 * Kan deltagaren förklara frånvaron på det här passet? Konsulenten har markerat
 * frånvaro, och raden bär kolumnen — före migrationen finns nyckeln inte i
 * `select('*')`-svaret, och då visas ingen knapp som bara kan misslyckas.
 */
export function kanForklaraFranvaro(session: ActivitySession): boolean {
  if (session.attendance !== 'absent_invalid' && session.attendance !== 'absent_valid') return false
  return Object.prototype.hasOwnProperty.call(session, 'participant_explanation')
}

export interface Franvaroanmalan {
  reportedAt: string
  reason: FranvaroOrsak
  note: string | null
}

/** Läser anmälan ur ett pass, eller null. Tål rader från före migrationen. */
export function franvaroAv(session: ActivitySession): Franvaroanmalan | null {
  const s = session as SessionMedFranvaro
  if (!s.absence_reported_at || !s.absence_reason) return null
  return { reportedAt: s.absence_reported_at, reason: s.absence_reason, note: s.absence_note ?? null }
}

/**
 * Kan deltagaren anmäla frånvaro på det här passet just nu? Kommande, omarkerat, inte redan anmält.
 *
 * RD27 (rollspelet 2026-09-27): eget jobbsökande undantogs tidigare. Anna hade
 * nio timmar eget jobbsökande en söndag och kunde inte sjukanmäla sig på det.
 * Är hon sjuk söker hon inte jobb heller — det ska gå att säga. Databasens guard
 * har aldrig skilt på passtyp; det var bara klienten.
 */
export function kanAnmalaFranvaro(session: ActivitySession, nu: Date = new Date()): boolean {
  if (session.attendance) return false
  if (franvaroAv(session)) return false
  const idag = `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, '0')}-${String(nu.getDate()).padStart(2, '0')}`
  const nuTid = `${String(nu.getHours()).padStart(2, '0')}:${String(nu.getMinutes()).padStart(2, '0')}`
  return session.date > idag || (session.date === idag && session.start_time > nuTid)
}

/**
 * RD27: hur mycket en anmälan gäller. `pass` = bara det här passet, `dag` = alla
 * pass samma dag, `period` = alla pass från och med passets dag till ett valt datum.
 */
export type Omfattning = 'pass' | 'dag' | 'period'

/** Längsta period en anmälan får gälla. Längre än så är en sak för ett samtal, inte ett formulär. */
export const PERIOD_MAX_DAGAR = 14

function plusDagar(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + n)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

/** Sista tillåtna datum för en period som börjar `fran`. */
export function periodensSistaDag(fran: string): string {
  return plusDagar(fran, PERIOD_MAX_DAGAR - 1)
}

/**
 * Passen en period-anmälan gäller: inom [fran, till], och bara de som går att
 * anmäla just nu (kommande, omarkerade, inte redan anmälda). Ren funktion.
 */
export function passIPerioden(
  sessions: readonly ActivitySession[],
  fran: string,
  till: string,
  nu: Date = new Date(),
): ActivitySession[] {
  return sessions.filter((s) => s.date >= fran && s.date <= till && kanAnmalaFranvaro(s, nu))
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Inte inloggad')
  return data.user.id
}

export const franvaroApi = {
  /** Anmäl frånvaro på ett eget pass. Notering trimmas; tom notering sparas som null. */
  async anmal(sessionId: string, input: { orsak: FranvaroOrsak; notering?: string }): Promise<ActivitySession> {
    const userId = await requireUserId()
    if (!FRANVARO_ORSAKER.includes(input.orsak)) throw new Error('Okänd orsak')
    const { data, error } = await supabase
      .from('activity_sessions')
      .update({
        absence_reported_at: new Date().toISOString(),
        absence_reason: input.orsak,
        absence_note: input.notering?.trim().slice(0, 500) || null,
      })
      .eq('id', sessionId)
      .eq('participant_id', userId)
      .select('*')
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('Passet hittades inte, eller så tillhör det inte dig')
    // RD13: samma form som listMySessions — "09:00", inte "09:00:00"
    return mapSession(data as Record<string, unknown>)
  },

  /**
   * RD11: förklara en markerad frånvaro i efterhand. Tom text tar bort
   * förklaringen. En databastrigger lägger en notis hos konsulenten.
   *
   * Kolumnerna skapades av `20260927b_franvaro_forklaring.sql` (körd 2026-09-27).
   */
  async forklara(sessionId: string, text: string): Promise<ActivitySession> {
    const userId = await requireUserId()
    const ren = text.trim().slice(0, FORKLARING_MAX)
    const { data, error } = await supabase
      .from('activity_sessions')
      .update({
        participant_explanation: ren || null,
        participant_explanation_at: ren ? new Date().toISOString() : null,
      })
      .eq('id', sessionId)
      .eq('participant_id', userId)
      .select('*')
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('Passet hittades inte, eller så tillhör det inte dig')
    // RD13: samma form som listMySessions — "09:00", inte "09:00:00"
    return mapSession(data as Record<string, unknown>)
  },

  /**
   * RD27: anmäl frånvaro på alla anmälningsbara pass i en period — "hela dagen"
   * är samma sak med `fran === till`. En enda UPDATE över passens id:n; guarden i
   * databasen gäller för varje rad som förut, och notistriggern lägger en notis
   * per pass hos konsulenten. Returnerar de uppdaterade passen (tom lista = inget
   * att anmäla i perioden).
   */
  async anmalPeriod(
    fran: string,
    till: string,
    input: { orsak: FranvaroOrsak; notering?: string },
    nu: Date = new Date(),
  ): Promise<ActivitySession[]> {
    const userId = await requireUserId()
    if (!FRANVARO_ORSAKER.includes(input.orsak)) throw new Error('Okänd orsak')
    if (till < fran) throw new Error('Perioden slutar före den börjar')
    if (till > periodensSistaDag(fran)) throw new Error(`Perioden får vara högst ${PERIOD_MAX_DAGAR} dagar`)

    const { data: rader, error: lasfel } = await supabase
      .from('activity_sessions')
      .select('*')
      .eq('participant_id', userId)
      .gte('date', fran)
      .lte('date', till)
    if (lasfel) throw lasfel
    const ids = passIPerioden((rader ?? []).map((r) => mapSession(r as Record<string, unknown>)), fran, till, nu).map((s) => s.id)
    if (ids.length === 0) return []

    const { data, error } = await supabase
      .from('activity_sessions')
      .update({
        absence_reported_at: new Date().toISOString(),
        absence_reason: input.orsak,
        absence_note: input.notering?.trim().slice(0, 500) || null,
      })
      .in('id', ids)
      .eq('participant_id', userId)
      .select('*')
    if (error) throw error
    return (data ?? []).map((r) => mapSession(r as Record<string, unknown>))
  },

  /** Ångra en anmälan (innan konsulenten markerat passet). Ger ingen ny notis. */
  async angra(sessionId: string): Promise<ActivitySession> {
    const userId = await requireUserId()
    const { data, error } = await supabase
      .from('activity_sessions')
      .update({ absence_reported_at: null, absence_reason: null, absence_note: null })
      .eq('id', sessionId)
      .eq('participant_id', userId)
      .select('*')
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('Passet hittades inte, eller så tillhör det inte dig')
    // RD13: samma form som listMySessions — "09:00", inte "09:00:00"
    return mapSession(data as Record<string, unknown>)
  },
}
