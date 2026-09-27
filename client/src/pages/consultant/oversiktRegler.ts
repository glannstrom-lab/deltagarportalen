/**
 * oversiktRegler — rena regler för konsulentens Översikt (rollspelet 2026-09-27).
 *
 * RK6: "Möten denna vecka" räknade veckan som `idag − getDay() + 1`. På en
 * söndag är getDay() 0, så "veckan" blev måndagen EFTER — kortet visade nästa
 * veckas möten och Min dag missade dagens. Veckan är måndag–söndag i lokal tid.
 *
 * RR3/RK7: Min dag sa "Inga brådskande punkter idag" om en deltagare som inte
 * haft möte på 33 dagar, och ogiltig frånvaro syntes inte alls. Det brådskande
 * räknas här ur samma källor som deltagarlistans möteschip (moteskadens.ts) och
 * passens närvaro — inget eget tal, ingen egen gräns.
 */

import { kadensForMoten, MOTE_GRANS_DAGAR, FYSISKT_GRANS_DAGAR, type MoteRad } from '@/services/moteskadens'
import { addDays, formatLocalDate, isoVeckonummer, veckansMandag, type Attendance, type PassTyp } from '@/services/aktivitetSchema'
import { vantarPaKvittens } from '@/services/egenrapport'
import { avtalskravPerDeltagare, senasteAvslutadeSondag } from '@/services/aktivitetslogg'
import type { ActivityPlan } from '@/services/aktivitetApi'
import { followupStatus } from './placeringsmatt'

/** Måndag 00:00 till söndag 23:59:59.999 i lokal tid, för veckan `nu` ligger i. */
export function veckansGranser(nu: Date): { start: Date; slut: Date } {
  const start = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate())
  const dagarSedanMandag = (start.getDay() + 6) % 7 // mån=0 … sön=6
  start.setDate(start.getDate() - dagarSedanMandag)
  const slut = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999)
  return { start, slut }
}

function lokaltDatum(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Fönstret för "ogiltig frånvaro senaste 7 dagarna": i dag och sex dagar bakåt. */
export function franvaroFonster(idag: Date): { fran: string; till: string } {
  const fran = new Date(idag.getFullYear(), idag.getMonth(), idag.getDate() - 6)
  return { fran: lokaltDatum(fran), till: lokaltDatum(idag) }
}

export type BradskandeTyp = 'franvaro' | 'mote'

export interface Bradskande {
  participantId: string
  typ: BradskandeTyp
  /** Konsulentvyn översätts inte (DESIGN.md §2). */
  text: string
}

interface DeltagareRad {
  participant_id: string
  status: string
}

interface PassRad {
  participant_id: string
  date: string
  attendance: string | null
}

const MANAD = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

function kortDatum(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${d} ${MANAD[m - 1]}`
}

/**
 * Det som brådskar för konsulentens egna deltagare:
 *   - ogiltig frånvaro på något pass de senaste 7 dagarna (alla deltagare i listan
 *     — frånvaron är ett faktum oavsett status);
 *   - aktiva deltagare vars möteskadens är röd i deltagarlistan (`laget: 'over'`):
 *     senaste genomförda möte över 14 dagar, eller senaste fysiska över 28.
 *     "Inget möte än" är grått i listan och flaggas inte här heller — samma
 *     regel på båda ställena, annars säger två vyer olika saker om samma person.
 * Frånvaron först — den är dagens viktigaste signal under aktivitetskravet.
 */
export function bradskandePunkter(args: {
  deltagare: readonly DeltagareRad[]
  moten: readonly MoteRad[]
  pass: readonly PassRad[]
  idag: Date
}): Bradskande[] {
  const { deltagare, moten, pass, idag } = args
  const mina = new Set(deltagare.map((d) => d.participant_id))
  const { fran, till } = franvaroFonster(idag)

  const franvaro = new Map<string, string[]>()
  for (const p of pass) {
    if (!mina.has(p.participant_id) || p.attendance !== 'absent_invalid') continue
    if (p.date < fran || p.date > till) continue
    const lista = franvaro.get(p.participant_id) ?? []
    lista.push(p.date)
    franvaro.set(p.participant_id, lista)
  }

  const ut: Bradskande[] = []
  for (const d of deltagare) {
    const datum = franvaro.get(d.participant_id)
    if (!datum) continue
    const senast = [...datum].sort().at(-1)!
    ut.push({
      participantId: d.participant_id,
      typ: 'franvaro',
      text: datum.length === 1
        ? `Ogiltig frånvaro ${kortDatum(senast)}`
        : `Ogiltig frånvaro på ${datum.length} pass senaste 7 dagarna, senast ${kortDatum(senast)}`,
    })
  }

  for (const d of deltagare) {
    if (d.status !== 'ACTIVE') continue
    const k = kadensForMoten(moten.filter((m) => m.participant_id === d.participant_id), idag)
    if (k.laget !== 'over') continue
    let text: string | null = null
    if (k.dagarSedanMote !== null && k.dagarSedanMote > MOTE_GRANS_DAGAR) {
      text = `Senaste möte ${k.dagarSedanMote} dagar sedan — gränsen är ${MOTE_GRANS_DAGAR}`
    } else if (k.dagarSedanFysiskt !== null && k.dagarSedanFysiskt > FYSISKT_GRANS_DAGAR) {
      text = `Senaste fysiska möte ${k.dagarSedanFysiskt} dagar sedan — gränsen är ${FYSISKT_GRANS_DAGAR}`
    }
    if (text) ut.push({ participantId: d.participant_id, typ: 'mote', text })
  }
  return ut
}

// ===========================================================================
// RK35 + RR26 (rollspelet 2026-09-27): "Att göra i dag"
// ===========================================================================
//
// Min dag listade det brådskande men inte det konsulenten faktiskt ska GÖRA
// i dag under aktivitetskravet. Varje punkt nedan är ett pass som väntar på
// ett beslut, och varje punkt har en åtgärd som kan tas direkt i listan.
// En punkt per pass — den första regeln som träffar vinner — så samma pass
// aldrig står två gånger.
//
//   forklaring               deltagaren har förklarat en markerad frånvaro
//                            EFTER markeringen (participant_explanation_at >
//                            marked_at). Klar när konsulenten tagit ställning
//                            (markerat om — marked_at blir nyare).
//   franvaro_utan_anteckning ogiltig frånvaro utan anteckning — just den
//                            dokumentationen behöver handläggaren (RK4).
//   sjuk_utan_intyg          markerad sjuk, intyget har inte kommit in (RK3).
//   anmald_franvaro          deltagaren har anmält frånvaro i förväg och passet
//                            är inte bedömt (F1).
//   kvittera                 egen redovisning eller incheckning som väntar på
//                            kvittens (RK15, services/egenrapport.ts).
//   omarkerat                ett pass som inte markerats på två dagar.
//
// Fönstret är 14 dagar bakåt och 7 framåt (anmälningar i förväg). Äldre än
// så hör hemma i veckovyn på deltagarsidan, inte i en dagslista.

export const ATT_GORA_BAKAT_DAGAR = 14
export const ATT_GORA_FRAMAT_DAGAR = 7
/** Ett pass som inte markerats så här många dagar efteråt blir en punkt. */
export const OMARKERAT_EFTER_DAGAR = 2

export interface AttGoraPass {
  id: string
  plan_id?: string
  participant_id: string
  date: string
  start_time: string
  end_time: string
  title: string
  activity_type: string
  attendance: Attendance | null
  attendance_note?: string | null
  sick_certificate_received?: boolean | null
  marked_at?: string | null
  self_checkin_at?: string | null
  location?: string | null
  absence_reported_at?: string | null
  absence_reason?: string | null
  absence_note?: string | null
  participant_explanation?: string | null
  participant_explanation_at?: string | null
}

export type AttGoraTyp =
  | 'forklaring'
  | 'franvaro_utan_anteckning'
  | 'sjuk_utan_intyg'
  | 'anmald_franvaro'
  | 'kvittera'
  | 'omarkerat'

export interface AttGora {
  typ: AttGoraTyp
  participantId: string
  pass: AttGoraPass
  /** Konsulentvyn översätts inte (DESIGN.md §2). */
  text: string
}

const ATT_GORA_ORDNING: Record<AttGoraTyp, number> = {
  forklaring: 0,
  franvaro_utan_anteckning: 1,
  sjuk_utan_intyg: 2,
  anmald_franvaro: 3,
  kvittera: 4,
  omarkerat: 5,
}

const ANMALAN_ORSAK: Record<string, string> = {
  sick: 'sjuk',
  child_care: 'vård av barn',
  authority_meeting: 'möte hos en myndighet',
  other: 'annat',
}

/** Datumintervallet passen ska hämtas för, i lokal tid. */
export function attGoraFonster(idag: Date): { fran: string; till: string } {
  const dag = formatLocalDate(idag)
  return { fran: addDays(dag, -(ATT_GORA_BAKAT_DAGAR - 1)), till: addDays(dag, ATT_GORA_FRAMAT_DAGAR) }
}

function passNamn(p: Pick<AttGoraPass, 'date' | 'title' | 'start_time' | 'end_time'>): string {
  return `${kortDatum(p.date)} (${p.title}, ${p.start_time.slice(0, 5)}–${p.end_time.slice(0, 5)})`
}

/** Vilken punkt passet ger, eller null. Ren regel — testas utan React. */
export function attGoraForPass(p: AttGoraPass, idag: string): AttGora | null {
  const fran = addDays(idag, -(ATT_GORA_BAKAT_DAGAR - 1))
  const till = addDays(idag, ATT_GORA_FRAMAT_DAGAR)
  if (p.date < fran || p.date > till) return null
  const ut = (typ: AttGoraTyp, text: string): AttGora => ({ typ, participantId: p.participant_id, pass: p, text })

  if (p.attendance === 'absent_invalid' || p.attendance === 'absent_valid') {
    const forklaring = p.participant_explanation?.trim()
    const ny = !!forklaring && (!p.marked_at || !p.participant_explanation_at
      || new Date(p.participant_explanation_at).getTime() > new Date(p.marked_at).getTime())
    if (forklaring && ny) {
      const slag = p.attendance === 'absent_invalid' ? 'ogiltig' : 'giltig'
      const kort = forklaring.length > 120 ? `${forklaring.slice(0, 117)}…` : forklaring
      return ut('forklaring', `Har förklarat frånvaron ${passNamn(p)}, markerad som ${slag}: ”${kort}”`)
    }
    if (p.attendance === 'absent_invalid' && !p.attendance_note?.trim()) {
      return ut('franvaro_utan_anteckning', `Ogiltig frånvaro ${passNamn(p)} saknar anteckning`)
    }
    return null
  }
  if (p.attendance === 'sick_certified') {
    return p.sick_certificate_received ? null : ut('sjuk_utan_intyg', `Sjuk ${passNamn(p)} — intyget har inte kommit in`)
  }
  if (p.attendance !== null) return null

  if (p.absence_reported_at) {
    const orsak = p.absence_reason ? ANMALAN_ORSAK[p.absence_reason] ?? p.absence_reason : 'ingen orsak angiven'
    const not = p.absence_note?.trim() ? ` — ”${p.absence_note.trim()}”` : ''
    return ut('anmald_franvaro', `Har anmält frånvaro ${passNamn(p)}: ${orsak}${not}`)
  }
  if (vantarPaKvittens({ ...p, attendance: null, self_checkin_at: p.self_checkin_at ?? null }, idag)) {
    const vad = p.activity_type === 'jobsearch_own' ? 'Egen redovisning' : 'Incheckning'
    return ut('kvittera', `${vad} ${passNamn(p)} väntar på kvittens`)
  }
  if (p.date <= addDays(idag, -OMARKERAT_EFTER_DAGAR)) {
    return ut('omarkerat', `Pass ${passNamn(p)} är inte markerat`)
  }
  return null
}

/**
 * Konsulentens punkter för i dag: det deltagaren väntar på svar om först,
 * sedan dokumentationen, sedan det som bara är omarkerat. Bara egna
 * deltagare (listan) räknas — samma avgränsning som bradskandePunkter.
 */
export function attGoraIdag(args: {
  deltagare: readonly { participant_id: string }[]
  pass: readonly AttGoraPass[]
  idag: Date
}): AttGora[] {
  const mina = new Set(args.deltagare.map((d) => d.participant_id))
  const idag = formatLocalDate(args.idag)
  const ut: AttGora[] = []
  for (const p of args.pass) {
    if (!mina.has(p.participant_id)) continue
    const punkt = attGoraForPass(p, idag)
    if (punkt) ut.push(punkt)
  }
  return ut.sort((a, b) =>
    ATT_GORA_ORDNING[a.typ] - ATT_GORA_ORDNING[b.typ]
    || a.pass.date.localeCompare(b.pass.date)
    || a.pass.start_time.localeCompare(b.pass.start_time))
}

/**
 * Brådskande-raderna som ska visas bredvid punkterna. En frånvarorad för en
 * deltagare vars frånvaro redan står som en punkt (saknad anteckning eller ny
 * förklaring) tas bort — annars säger listan samma sak två gånger.
 * Mötesraderna står alltid kvar.
 */
export function bradskandeUtanDubbletter(punkter: readonly Bradskande[], attGora: readonly AttGora[]): Bradskande[] {
  const franvaroPunkt = new Set(
    attGora.filter((a) => a.typ === 'franvaro_utan_anteckning' || a.typ === 'forklaring').map((a) => a.participantId),
  )
  return punkter.filter((p) => !(p.typ === 'franvaro' && franvaroPunkt.has(p.participantId)))
}

// ---------------------------------------------------------------------------
// RR26: leverantörens vecka mot avtalet (Rusta och matcha)
// ---------------------------------------------------------------------------
//
// "2 deltagare under timkravet · 1 utan fysiskt möte · 1 uppföljning inom 14
// dagar", där varje rad leder till åtgärden. Räknat med SAMMA regler som
// avtalsloggen (aktivitetslogg.ts), mötesregeln (moteskadens.ts) och
// uppföljningspunkterna (placeringsmatt.ts) — inget eget tal, ingen egen gräns.
//
//   under timkravet    senaste AVSLUTADE vecka (RR22) under kravet för planens
//                      månad (FFU §4.1.1). Planer utan bedömd vecka räknas inte.
//   utan fysiskt möte  aktiv deltagare utan genomfört fysiskt möte på
//                      FYSISKT_GRANS_DAGAR dagar och utan ett fysiskt möte
//                      bokat (RR11 — bokat är omhändertaget).
//   uppföljningar      placering vars nästa uppföljning är försenad eller
//                      infaller inom 14 dagar (followupStatus 'due'/'soon').

export interface LeverantorPunkt {
  participantId: string
  text: string
}

export interface LeverantorLage {
  /** Planer med en avslutad vecka att bedöma. 0 = inget att bedöma, inte "alla uppfyllda". */
  bedomdaPlaner: number
  underTimkravet: LeverantorPunkt[]
  utanFysisktMote: LeverantorPunkt[]
  uppfoljningar: LeverantorPunkt[]
}

export interface PlaceringRad {
  participant_id: string
  employer_name: string
  start_date?: string | null
  followup_3m: boolean
  followup_6m: boolean
}

function timText(h: number): string {
  return `${String(Math.round(h * 10) / 10).replace('.', ',')} h`
}

export function leverantorsLage(args: {
  deltagare: readonly DeltagareRad[]
  plans: readonly Pick<ActivityPlan, 'id' | 'participant_id' | 'start_date' | 'end_date' | 'status'>[]
  pass: readonly AttGoraPass[]
  moten: readonly MoteRad[]
  placeringar: readonly PlaceringRad[]
  idag: Date
}): LeverantorLage {
  const { deltagare, idag } = args
  const mina = new Set(deltagare.map((d) => d.participant_id))
  const idagIso = formatLocalDate(idag)

  // Timkravet: senaste avslutade vecka, en rad per deltagare.
  const sondag = senasteAvslutadeSondag(idagIso)
  const mandag = veckansMandag(sondag)
  const vecka = isoVeckonummer(mandag)
  const passFalt = args.pass.map((s) => ({
    plan_id: s.plan_id ?? '',
    date: s.date,
    start_time: s.start_time,
    end_time: s.end_time,
    attendance: s.attendance,
    location: s.location ?? null,
    activity_type: s.activity_type as PassTyp,
  }))
  const underTimkravet: LeverantorPunkt[] = []
  const redan = new Set<string>()
  let bedomdaPlaner = 0
  for (const plan of args.plans) {
    if (plan.status !== 'active' || !mina.has(plan.participant_id)) continue
    const v = avtalskravPerDeltagare(plan, passFalt, { from: mandag, to: sondag }).veckor[0]
    if (!v) continue
    bedomdaPlaner += 1
    if (v.uppfylld || redan.has(plan.participant_id)) continue
    redan.add(plan.participant_id)
    underTimkravet.push({
      participantId: plan.participant_id,
      text: `Vecka ${vecka}: ${timText(v.narvaroTimmar)} närvaro mot kravet ${timText(v.kravTimmar)}`,
    })
  }

  const utanFysisktMote: LeverantorPunkt[] = []
  for (const d of deltagare) {
    if (d.status !== 'ACTIVE') continue
    const k = kadensForMoten(args.moten.filter((m) => m.participant_id === d.participant_id), idag)
    if (k.bokatFysiskt) continue
    if (k.dagarSedanFysiskt !== null && k.dagarSedanFysiskt <= FYSISKT_GRANS_DAGAR) continue
    utanFysisktMote.push({
      participantId: d.participant_id,
      text: k.dagarSedanFysiskt === null
        ? 'Inget genomfört fysiskt möte de senaste 90 dagarna'
        : `Senaste fysiska möte ${k.dagarSedanFysiskt} dagar sedan — gränsen är ${FYSISKT_GRANS_DAGAR}`,
    })
  }

  const uppfoljningar: LeverantorPunkt[] = []
  for (const p of args.placeringar) {
    if (!mina.has(p.participant_id)) continue
    const s = followupStatus({ startDate: p.start_date ?? null, followup3m: p.followup_3m, followup6m: p.followup_6m }, idag)
    if (s.tone !== 'due' && s.tone !== 'soon') continue
    uppfoljningar.push({ participantId: p.participant_id, text: `${s.text} — ${p.employer_name}` })
  }

  return { bedomdaPlaner, underTimkravet, utanFysisktMote, uppfoljningar }
}

/** Sammanfattningsraden. Timkravet utan en enda bedömd vecka skrivs inte som 0. */
export function leverantorSammanfattning(l: LeverantorLage): string[] {
  return [
    l.bedomdaPlaner === 0
      ? 'Timkravet: ingen avslutad vecka att bedöma'
      : `${l.underTimkravet.length} deltagare under timkravet`,
    `${l.utanFysisktMote.length} utan fysiskt möte`,
    `${l.uppfoljningar.length} ${l.uppfoljningar.length === 1 ? 'uppföljning' : 'uppföljningar'} inom 14 dagar`,
  ]
}
