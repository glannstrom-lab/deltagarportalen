/**
 * Dagens pass (F9) — data och statuslogik, skild från komponenten så att
 * testerna kan pröva logiken utan React och fast refresh håller.
 */
import { supabase } from '@/lib/supabase'
import type { ActivitySession } from '@/services/aktivitetApi'
import type { Attendance } from '@/services/aktivitetSchema'

export type PassIdag = Pick<
  ActivitySession,
  'id' | 'participant_id' | 'plan_id' | 'date' | 'start_time' | 'end_time' | 'title' | 'attendance' | 'self_checkin_at'
> & {
  absence_reason?: string | null
  absence_note?: string | null
}

const ORSAK: Record<string, string> = {
  sick: 'sjuk',
  child_care: 'vård av barn',
  authority_meeting: 'möte hos en myndighet',
  other: 'annat',
}

export const NARVARO_ETIKETT: Record<Attendance, string> = {
  present: 'Närvarande',
  absent_valid: 'Frånvaro, giltig',
  absent_invalid: 'Frånvaro, ogiltig',
  sick_certified: 'Sjuk',
  external: 'Annan aktivitet',
}

/** Status för ett pass i dag, härledd ur datan — aldrig gissad. */
export function passStatus(p: PassIdag, nu: Date = new Date()): { text: string; ton: 'ok' | 'varning' | 'neutral' | 'info' } {
  if (p.attendance) return { text: NARVARO_ETIKETT[p.attendance] ?? p.attendance, ton: p.attendance === 'present' ? 'ok' : 'neutral' }
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

export async function hamtaDagensPass(): Promise<PassIdag[]> {
  const { data, error } = await supabase
    .from('activity_sessions')
    .select('id, participant_id, plan_id, date, start_time, end_time, title, attendance, self_checkin_at, absence_reason, absence_note')
    .eq('date', idagISO())
    .order('start_time', { ascending: true })
  if (error) throw error
  return (data ?? []) as PassIdag[]
}

