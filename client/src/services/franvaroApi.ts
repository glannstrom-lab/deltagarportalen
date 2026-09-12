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
import type { ActivitySession } from './aktivitetApi'

export type FranvaroOrsak = 'sick' | 'child_care' | 'authority_meeting' | 'other'

export const FRANVARO_ORSAKER: readonly FranvaroOrsak[] = ['sick', 'child_care', 'authority_meeting', 'other'] as const

/** Passet så som det ser ut efter migrationen. Fälten saknas i ActivitySession tills snapshoten är uppdaterad. */
export type SessionMedFranvaro = ActivitySession & {
  absence_reported_at?: string | null
  absence_reason?: FranvaroOrsak | null
  absence_note?: string | null
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

/** Kan deltagaren anmäla frånvaro på det här passet just nu? Kommande, omarkerat, inte redan anmält. */
export function kanAnmalaFranvaro(session: ActivitySession, nu: Date = new Date()): boolean {
  if (session.attendance) return false
  if (session.activity_type === 'jobsearch_own') return false
  if (franvaroAv(session)) return false
  const idag = `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, '0')}-${String(nu.getDate()).padStart(2, '0')}`
  const nuTid = `${String(nu.getHours()).padStart(2, '0')}:${String(nu.getMinutes()).padStart(2, '0')}`
  return session.date > idag || (session.date === idag && session.start_time > nuTid)
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
      .single()
    if (error) throw error
    return data as ActivitySession
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
      .single()
    if (error) throw error
    return data as ActivitySession
  },
}
