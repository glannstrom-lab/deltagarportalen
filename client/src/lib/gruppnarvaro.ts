/**
 * Gruppnärvaro (RK36, rollspelet 2026-09-27) — ren logik.
 *
 * "Jobbsökarverkstaden har tio deltagare — markera närvaro för hela passet på
 * en skärm i stället för tio deltagarsidor." Ett grupppass finns inte som egen
 * rad i databasen: varje deltagare har sitt eget `activity_sessions`-pass
 * (planen genereras per deltagare ur mallen). Ett grupppass är därför de pass
 * hos konsulentens deltagare som har SAMMA datum, start, slut och titel.
 * Titeln jämförs utan skiftläge och utan omgivande blanksteg — "Jobbsökarverkstad"
 * och "jobbsökarverkstad " är samma pass; "Jobbsökarverkstad 2" är det inte.
 *
 * Närvaron sätts per pass genom `aktivitetsplanApi.markAttendance` — samma väg
 * som Min dag och deltagarsidan, ingen kopia av logiken.
 */
import type { Attendance } from '@/services/aktivitetSchema'
import { orsakText, type PassIdag } from './dagensPass'

export interface PassGrupp {
  nyckel: string
  date: string
  start_time: string
  end_time: string
  title: string
  pass: PassIdag[]
}

const kort = (t: string) => t.slice(0, 5)

export function gruppNyckel(p: Pick<PassIdag, 'date' | 'start_time' | 'end_time' | 'title'>): string {
  return `${p.date}|${kort(p.start_time)}|${kort(p.end_time)}|${p.title.trim().toLocaleLowerCase('sv-SE')}`
}

/** Passen grupperade, i tidsordning. Deltagarnas ordning inom gruppen följer indata. */
export function grupperaPass(pass: readonly PassIdag[]): PassGrupp[] {
  const grupper = new Map<string, PassGrupp>()
  for (const p of pass) {
    const nyckel = gruppNyckel(p)
    const g = grupper.get(nyckel)
    if (g) g.pass.push(p)
    else grupper.set(nyckel, { nyckel, date: p.date, start_time: kort(p.start_time), end_time: kort(p.end_time), title: p.title.trim(), pass: [p] })
  }
  return [...grupper.values()].sort((a, b) => a.start_time.localeCompare(b.start_time) || a.title.localeCompare(b.title, 'sv'))
}

/** Bara grupper med minst två deltagare — ett ensamt pass markeras där det står. */
export function gemensammaPass(pass: readonly PassIdag[]): PassGrupp[] {
  return grupperaPass(pass).filter((g) => new Set(g.pass.map((p) => p.participant_id)).size >= 2)
}

/** Länken till gruppvyn för ett grupppass. */
export function gruppLank(g: Pick<PassGrupp, 'date' | 'start_time' | 'end_time' | 'title'>): string {
  const q = new URLSearchParams({ datum: g.date, start: g.start_time, slut: g.end_time, titel: g.title })
  return `/consultant/pass/grupp?${q.toString()}`
}

/**
 * Vilka pass "Alla omarkerade närvarande" får röra: omarkerade pass där
 * deltagaren INTE har anmält frånvaro. En anmäld frånvaro ska bedömas, inte
 * skrivas över med närvaro i ett massklick.
 */
export function kanMarkerasNarvarandeIMassa(p: PassIdag): boolean {
  return p.attendance === null && !p.absence_reason
}

// ---------------------------------------------------------------------------
// Förslag (omtaget "Kvarter", steg 4, 2026-10-11)
// ---------------------------------------------------------------------------
//
// "Närvaro för ett helt pass på en skärm": deltagarens egen incheckning och
// anmälda frånvaro fyller i ett FÖRSLAG som konsulenten bekräftar. Förslaget
// sparas aldrig av sig självt — det skrivs först när konsulenten klickar,
// antingen på valet i raden eller på "Bekräfta alla förslag".
//
//   self_checkin_at                    → Här
//   anmäld frånvaro: sjuk              → Sjuk
//   anmäld frånvaro: vård av barn,
//     möte hos en myndighet            → Giltig
//   anmäld frånvaro: annat             → inget förslag (konsulenten bedömer)
//
// Ogiltig föreslås aldrig — det är ett beslut med följder för deltagaren och
// ska tas aktivt, ett pass i taget. En incheckning väger tyngre än en anmälan:
// den som anmält sig sjuk men ändå checkat in är på plats.

export interface NarvaroForslag {
  varde: Attendance
  /** Varför förslaget finns, i ord: "Checkade in själv 12:58". */
  skal: string
}

const FORSLAG_FRAN_ORSAK: Record<string, Attendance> = {
  sick: 'sick_certified',
  child_care: 'absent_valid',
  authority_meeting: 'absent_valid',
}

function klockslag(iso: string): string {
  return new Date(iso).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Förslaget för ett omarkerat pass, eller null. Ett markerat pass har inget förslag.
 *
 * KSL21, leverantör: varje anmälan som inte är sjukdom föreslår "Frånvarande,
 * anmäld i förväg" — att den var anmäld är ett faktum, och leverantören bedömer
 * inte skälet (det gör Arbetsförmedlingen).
 */
export function narvaroForslag(p: PassIdag, regelverk?: 'kommun' | 'leverantor' | null): NarvaroForslag | null {
  if (p.attendance !== null) return null
  if (p.self_checkin_at) return { varde: 'present', skal: `Checkade in själv ${klockslag(p.self_checkin_at)}` }
  if (p.absence_reason) {
    const varde = regelverk === 'leverantor'
      ? (p.absence_reason === 'sick' ? 'sick_certified' : 'absent_valid')
      : FORSLAG_FRAN_ORSAK[p.absence_reason]
    if (!varde) return null
    return { varde, skal: `Anmälde frånvaro: ${orsakText(p.absence_reason)}` }
  }
  return null
}

/** Radens läge i ord, för ett pass som inte är markerat. */
export function omarkeratLage(p: PassIdag): string {
  if (p.self_checkin_at) return `Checkade in själv ${klockslag(p.self_checkin_at)}`
  if (p.absence_reason) {
    const not = p.absence_note?.trim() ? ` — „${p.absence_note.trim()}”` : ''
    return `Anmälde frånvaro: ${orsakText(p.absence_reason)}${not}`
  }
  return 'Inte markerad än'
}

/**
 * "Markera resten som närvarande": det som `kanMarkerasNarvarandeIMassa`
 * godtar och som inte redan har ett förslag (förslagen bekräftas för sig).
 */
export function restenNarvarande(pass: readonly PassIdag[]): PassIdag[] {
  return pass.filter((p) => kanMarkerasNarvarandeIMassa(p) && !narvaroForslag(p))
}

// ---------------------------------------------------------------------------
// Dagens pass som rader (DagensPass, omtaget steg 4)
// ---------------------------------------------------------------------------

export type DagensPost = { typ: 'grupp'; grupp: PassGrupp } | { typ: 'ensam'; pass: PassIdag }

/** Passen som rader: grupper med två deltagare eller fler, resten var för sig. */
export function dagensPoster(pass: readonly PassIdag[]): DagensPost[] {
  // Eget jobbsökande hör inte hemma i en grupp — det kvitteras per person,
  // och gruppvyn visar det inte (slipningen 2026-10-11, kommun A11).
  const egna = pass.filter((p) => p.activity_type === 'jobsearch_own')
  const poster: DagensPost[] = []
  for (const g of grupperaPass(pass.filter((p) => p.activity_type !== 'jobsearch_own'))) {
    if (new Set(g.pass.map((p) => p.participant_id)).size >= 2) poster.push({ typ: 'grupp', grupp: g })
    else for (const p of g.pass) poster.push({ typ: 'ensam', pass: p })
  }
  for (const p of egna) poster.push({ typ: 'ensam', pass: p })
  const tid = (x: DagensPost) => (x.typ === 'grupp' ? x.grupp.start_time : x.pass.start_time.slice(0, 5))
  return poster.sort((a, b) => tid(a).localeCompare(tid(b)))
}

/** Ett grupppass i ord: "6 deltagare · 4 har checkat in · 1 har anmält frånvaro". */
export function gruppLageText(g: PassGrupp): string {
  const n = g.pass.length
  const klara = g.pass.filter((p) => p.attendance !== null).length
  if (klara === n) return `${n} deltagare · alla markerade`
  const delar = [`${n} deltagare`]
  if (klara > 0) delar.push(`${klara} av ${n} markerade`)
  const incheckade = g.pass.filter((p) => p.attendance === null && p.self_checkin_at).length
  const anmalda = g.pass.filter((p) => p.attendance === null && !p.self_checkin_at && p.absence_reason).length
  if (incheckade > 0) delar.push(`${incheckade} har checkat in`)
  if (anmalda > 0) delar.push(`${anmalda} har anmält frånvaro`)
  return delar.join(' · ')
}
