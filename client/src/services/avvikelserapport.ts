/**
 * avvikelserapport — leverantörens avvikelser per deltagare och period (RR28,
 * rollspelet 2026-09-27).
 *
 * En Rusta och matcha-leverantör rapporterar avvikelser till handläggaren på
 * Arbetsförmedlingen (FFU §4.4). Kommunens "Underlag till handläggaren /
 * socialnämnden" är fel ord och fel mottagare för dem och är dolt i
 * leverantörens vy (`regelverkForPlan`). Här byggs i stället raderna:
 * datum, typ, orsak och om AF underrättats — ur passen, inget annat.
 *
 * Bara leverantörsledda pass räknas (samma regel som avtalsloggen), och bara
 * pass konsulenten markerat. Ett omarkerat passerat pass är inte en avvikelse
 * — det är ett okänt utfall, och det räknas separat så det syns.
 *
 * Portalen skickar ingenting till Arbetsförmedlingen. "Underrättad" är
 * konsulentens egen anteckning om att det gjorts (PENDING_20260927d).
 *
 * Ren logik, inga databasanrop.
 */

import type { ActivitySession } from './aktivitetApi'
import type { PassTyp } from './aktivitetSchema'
import { arLeverantorsledd } from './planMarkning'

type AvvikelseKalla = Pick<ActivitySession, 'id' | 'plan_id' | 'date' | 'title' | 'attendance' | 'attendance_note' | 'sick_certificate_received'> & {
  activity_type: PassTyp
  is_provider_led?: boolean | null
  absence_reason?: string | null
  absence_note?: string | null
  participant_explanation?: string | null
  af_notified_at?: string | null
}

export interface AvvikelseRad {
  sessionId: string
  datum: string
  pass: string
  typ: string
  /** Konsulentens anteckning, deltagarens anmälan och förklaring — eller null när ingen orsak finns antecknad. */
  orsak: string | null
  /** ISO-tidsstämpel, eller null = inte antecknat som underrättad. */
  underrattad: string | null
}

const ANMALD_ORSAK: Record<string, string> = {
  sick: 'sjuk',
  child_care: 'vård av barn',
  authority_meeting: 'möte hos myndighet',
  other: 'annat skäl',
}

function typText(s: AvvikelseKalla): string | null {
  switch (s.attendance) {
    case 'absent_invalid': return 'Ogiltig frånvaro'
    case 'absent_valid': return 'Giltig frånvaro'
    case 'sick_certified': return s.sick_certificate_received ? 'Sjuk, intyg inkommet' : 'Sjuk, intyg saknas'
    default: return null
  }
}

function orsakText(s: AvvikelseKalla): string | null {
  const delar: string[] = []
  if (s.attendance_note?.trim()) delar.push(s.attendance_note.trim())
  if (s.absence_reason) {
    const anmald = ANMALD_ORSAK[s.absence_reason] ?? s.absence_reason
    delar.push(`Anmäld i förväg av deltagaren: ${anmald}${s.absence_note?.trim() ? ` (${s.absence_note.trim()})` : ''}`)
  }
  if (s.participant_explanation?.trim()) delar.push(`Deltagarens förklaring: ${s.participant_explanation.trim()}`)
  return delar.length > 0 ? delar.join('. ') : null
}

export function avvikelserader(sessions: readonly AvvikelseKalla[], from: string, to: string): AvvikelseRad[] {
  return sessions
    .filter((s) => s.date >= from && s.date <= to && arLeverantorsledd(s))
    .map((s) => ({ s, typ: typText(s) }))
    .filter((r): r is { s: AvvikelseKalla; typ: string } => r.typ !== null)
    .sort((a, b) => a.s.date.localeCompare(b.s.date))
    .map(({ s, typ }) => ({
      sessionId: s.id,
      datum: s.date,
      pass: s.title,
      typ,
      orsak: orsakText(s),
      underrattad: s.af_notified_at ?? null,
    }))
}

/** Leverantörsledda pass i perioden, före i dag, som inte är markerade — utfallet är okänt. */
export function omarkeradePasserade(sessions: readonly AvvikelseKalla[], from: string, to: string, idag: string): number {
  return sessions.filter((s) => s.date >= from && s.date <= to && s.date < idag && s.attendance === null && arLeverantorsledd(s)).length
}

function datumText(iso: string): string {
  return iso.slice(0, 10)
}

/** Raderna som text att kopiera till Arbetsförmedlingens system. */
export function avvikelserSomText(rader: readonly AvvikelseRad[], underrattadKanAnges: boolean): string {
  if (rader.length === 0) return 'Inga avvikelser registrerade i perioden.'
  return rader.map((r) => {
    const delar = [datumText(r.datum), r.typ, r.pass, `Orsak: ${r.orsak ?? 'ingen antecknad'}`]
    if (underrattadKanAnges) delar.push(`AF underrättad: ${r.underrattad ? datumText(new Date(r.underrattad).toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' })) : 'nej'}`)
    return delar.join(' · ')
  }).join('\n')
}

/** Månaderna från planens start till i dag, senaste först. Högst tolv. */
export function avvikelseManader(planStart: string, idag: string): string[] {
  const ut: string[] = []
  let [ar, m] = idag.slice(0, 7).split('-').map(Number)
  const forsta = planStart.slice(0, 7)
  while (ut.length < 12) {
    const ym = `${ar}-${String(m).padStart(2, '0')}`
    if (ym < forsta) break
    ut.push(ym)
    m -= 1
    if (m === 0) { m = 12; ar -= 1 }
  }
  return ut.length > 0 ? ut : [idag.slice(0, 7)]
}
