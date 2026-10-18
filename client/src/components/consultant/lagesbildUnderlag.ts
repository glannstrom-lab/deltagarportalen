/**
 * KF6 (2026-10-18): underlaget till "Läget just nu" — AI-sammanfattningen av en
 * deltagare för konsulenten (Workbusters motsvarighet heter deltagarprofil).
 *
 * Det här är dataminimeringen, och den är hela poängen med att ha en egen
 * funktion i stället för att skicka raderna rakt till /api/ai:
 *  - Frånvaro räknas, men ORSAKEN följer aldrig med. `sick`/`sick_certified`
 *    är hälsouppgifter (art. 9), och `absent_valid`/`absent_invalid` är en
 *    giltighetsbedömning som en leverantör inte får göra (KSL21). Allt blir
 *    "frånvaro".
 *  - Frånvaroanteckningar, deltagarens förklaringar, planens fritext och
 *    `forsorjningshinder` följer inte med — de bär hälsa och sociala förhållanden.
 *  - CONCERN-anteckningar är interna och utesluts, precis som i rapportutkastet.
 *  - Inget namn: personen är "deltagaren".
 */

import { formatLocalDate } from '@/services/aktivitetSchema'

export interface JournalRad { content: string; category: string | null; created_at: string }
export interface MalRad { title: string | null; status: string | null; deadline: string | null }
export interface PassRad { date: string; attendance: string | null }
export interface PlanRad { status: string | null; start_date: string | null; end_date: string | null; weekly_hours_target: number | null; template_name: string | null }
export interface MoteRad { scheduled_at: string; status: string | null }

export interface LagesbildUnderlag {
  idag: string
  plan: { status: string; start: string | null; slut: string | null; timmarPerVecka: number | null; mall: string | null } | null
  narvaro: { narvarande: number; franvaro: number; ejMarkerat: number; kommande: number; dagar: number }
  journal: Array<{ datum: string; kategori: string; text: string }>
  mal: Array<{ titel: string; status: string; deadline: string | null }>
  nastaMote: string | null
}

/** Tidsstämpel → svenskt dygn. `.slice(0, 10)` ger UTC-dygnet, fel 00–02 (felklassen "idag i UTC"). */
const lokalDag = (iso: string) => formatLocalDate(new Date(iso))

const FRANVARO = new Set(['absent_valid', 'absent_invalid', 'sick', 'sick_certified'])
const MAX_JOURNAL = 30
const MAX_TEXT = 600

export function byggLagesbildUnderlag(in_: {
  idag: string
  journal: JournalRad[]
  mal: MalRad[]
  pass: PassRad[]
  plan: PlanRad | null
  moten: MoteRad[]
  dagar?: number
}): LagesbildUnderlag {
  const dagar = in_.dagar ?? 28
  const narvaro = { narvarande: 0, franvaro: 0, ejMarkerat: 0, kommande: 0, dagar }
  for (const p of in_.pass) {
    if (p.date > in_.idag) { narvaro.kommande++; continue }
    if (p.attendance === 'present' || p.attendance === 'external') narvaro.narvarande++
    else if (p.attendance && FRANVARO.has(p.attendance)) narvaro.franvaro++
    else narvaro.ejMarkerat++
  }

  const journal = in_.journal
    .filter((j) => j.category !== 'CONCERN' && j.content?.trim())
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, MAX_JOURNAL)
    .map((j) => ({ datum: lokalDag(j.created_at), kategori: j.category || 'GENERAL', text: j.content.trim().slice(0, MAX_TEXT) }))

  const nasta = in_.moten
    // Bara bokade möten — inte inställda och inte deltagarens förslag (O13).
    .filter((m) => m.status === 'scheduled' && lokalDag(m.scheduled_at) >= in_.idag)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0]

  return {
    idag: in_.idag,
    plan: in_.plan
      ? { status: in_.plan.status || 'okänd', start: in_.plan.start_date, slut: in_.plan.end_date, timmarPerVecka: in_.plan.weekly_hours_target, mall: in_.plan.template_name }
      : null,
    narvaro,
    journal,
    mal: in_.mal.map((g) => ({ titel: g.title || '', status: g.status || 'okänd', deadline: g.deadline ? g.deadline.slice(0, 10) : null })),
    nastaMote: nasta ? lokalDag(nasta.scheduled_at) : null,
  }
}

/** Finns det något alls att sammanfatta? Utan underlag anropas inte AI:n. */
export function harUnderlag(u: LagesbildUnderlag): boolean {
  const n = u.narvaro
  return u.journal.length > 0 || u.mal.length > 0 || !!u.plan || n.narvarande + n.franvaro + n.ejMarkerat > 0
}
