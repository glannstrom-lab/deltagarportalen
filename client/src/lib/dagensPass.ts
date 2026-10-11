/**
 * Dagens pass (F9) — data och statuslogik, skild från komponenten så att
 * testerna kan pröva logiken utan React och fast refresh håller.
 */
import { supabase } from '@/lib/supabase'
import type { ActivitySession } from '@/services/aktivitetApi'
import type { Attendance } from '@/services/aktivitetSchema'

import { anvandareFranSession } from '@/lib/anvandareFranSession'
export type PassIdag = Pick<
  ActivitySession,
  'id' | 'participant_id' | 'plan_id' | 'date' | 'start_time' | 'end_time' | 'title' | 'attendance' | 'self_checkin_at'
> & {
  absence_reason?: string | null
  absence_note?: string | null
  /** Hämtas sedan 2026-10-11 så att gruppnärvaron kan hoppa över eget jobbsökande. */
  activity_type?: ActivitySession['activity_type']
  /** KSL21: planens organisation — avgör om frånvaron visas som fakta (leverantör) eller giltig/ogiltig (kommun). */
  plan_org_id?: string | null
}

const ORSAK: Record<string, string> = {
  sick: 'sjuk',
  child_care: 'vård av barn',
  authority_meeting: 'möte hos en myndighet',
  other: 'annat',
}

/** Deltagarens anmälningsorsak i ord ("sjuk", "vård av barn"). Okänd orsak står som den är. */
export function orsakText(orsak: string | null | undefined): string {
  if (!orsak) return 'ingen orsak angiven'
  return ORSAK[orsak] ?? orsak
}

export const NARVARO_ETIKETT: Record<Attendance, string> = {
  present: 'Närvarande',
  absent_valid: 'Frånvaro, giltig',
  absent_invalid: 'Frånvaro, ogiltig',
  sick_certified: 'Sjuk',
  external: 'Annan aktivitet',
}

/** KSL21: leverantörens ord — fakta, aldrig giltig/ogiltig (samma som components/consultant/franvaroFakta.ts). */
export const NARVARO_ETIKETT_LEVERANTOR: Record<Attendance, string> = {
  present: 'Närvarande',
  absent_valid: 'Frånvarande, anmäld i förväg',
  absent_invalid: 'Frånvarande, inte anmäld',
  sick_certified: 'Sjuk',
  external: 'Annan aktivitet',
}

/** Status för ett pass i dag, härledd ur datan — aldrig gissad. */
export function passStatus(
  p: PassIdag,
  nu: Date = new Date(),
  regelverk?: 'kommun' | 'leverantor' | null,
): { text: string; ton: 'ok' | 'varning' | 'neutral' | 'info' } {
  const ord = regelverk === 'leverantor' ? NARVARO_ETIKETT_LEVERANTOR : NARVARO_ETIKETT
  if (p.attendance) return { text: ord[p.attendance] ?? p.attendance, ton: p.attendance === 'present' ? 'ok' : 'neutral' }
  if (p.absence_reason) {
    const orsak = ORSAK[p.absence_reason] ?? p.absence_reason
    return { text: `Anmäld frånvaro: ${orsak}${p.absence_note ? ` — „${p.absence_note}”` : ''}`, ton: 'info' }
  }
  if (p.self_checkin_at) {
    const kl = new Date(p.self_checkin_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
    return { text: `Incheckad ${kl}`, ton: 'ok' }
  }
  const slut = new Date(`${p.date}T${p.end_time}`)
  if (!Number.isNaN(slut.getTime()) && nu > slut) return { text: 'Saknar närvaro', ton: 'varning' }
  return { text: 'Väntar', ton: 'neutral' }
}

function idagISO(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dag = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${dag}`
}

/**
 * Dagens pass för den INLOGGADE KONSULENTENS egna planer.
 *
 * 2026-09-22 (drift-genomgången): frågan förlitade sig på RLS för urvalet.
 * Men `activity_sessions` har också policyn "Organisationens chef läser pass"
 * — en chef eller admin fick hela organisationens pass i sin "Min dag", med
 * deltagare som inte finns i hennes lista (namnet blev "okänd") och
 * närvaroknappar som UPDATE-policyn sedan nekar (bara planens egen konsulent
 * får skriva, se ST2). Nu begränsas urvalet till planer där
 * `activity_plans.consultant_id` är den inloggade — samma villkor som
 * skrivpolicyn, så varje knapp som visas också fungerar.
 *
 * `datum` (RK36, gruppnärvaro): samma urval för en annan dag. Utan = i dag.
 */
export async function hamtaDagensPass(datum: string = idagISO()): Promise<PassIdag[]> {
  const { data: { user }, error: userError } = await anvandareFranSession()
  if (userError) throw userError
  if (!user) throw new Error('Inte inloggad')

  const { data: planer, error: planFel } = await supabase
    .from('activity_plans')
    .select('id, org_id')
    .eq('consultant_id', user.id)
  if (planFel) throw planFel
  const planOrg = new Map((planer ?? []).map((p: { id: string; org_id: string | null }) => [p.id, p.org_id ?? null]))
  const planIds = [...planOrg.keys()]
  if (planIds.length === 0) return []

  const { data, error } = await supabase
    .from('activity_sessions')
    .select('id, participant_id, plan_id, date, start_time, end_time, title, attendance, self_checkin_at, absence_reason, absence_note, activity_type')
    .eq('date', datum)
    .in('plan_id', planIds)
    .order('start_time', { ascending: true })
  if (error) throw error
  return ((data ?? []) as PassIdag[]).map((p) => ({ ...p, plan_org_id: planOrg.get(p.plan_id) ?? null }))
}

