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
import { arLeverantorsledd } from '@/services/planMarkning'
import { avvikelserader } from '@/services/avvikelserapport'
import { avvikelseDag8, lakarintygDag8, type Franvaroperiod } from '@/services/franvaroperiod'
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
  /**
   * Möteskadensen (14/28 dagar) är Rusta och matcha-avtalets krav. Kommunen har
   * inget sådant krav, så punkterna läggs bara till för leverantörer
   * (slipningen 2026-10-11, kommunfynd A1). Utan värde: med, som tidigare.
   */
  medMotesregel?: boolean
  /**
   * KSL21: hos en Rusta och matcha-leverantör är `absent_invalid` "frånvarande,
   * inte anmäld" — fakta, aldrig "ogiltig". Utan värde: kommunens ord.
   */
  franvaroSomFakta?: boolean
}): Bradskande[] {
  const { deltagare, moten, pass, idag, medMotesregel = true, franvaroSomFakta = false } = args
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
      text: franvaroSomFakta
        ? (datum.length === 1
          ? `Frånvarande utan anmälan ${kortDatum(senast)}`
          : `Frånvarande utan anmälan på ${datum.length} pass senaste 7 dagarna, senast ${kortDatum(senast)}`)
        : (datum.length === 1
          ? `Ogiltig frånvaro ${kortDatum(senast)}`
          : `Ogiltig frånvaro på ${datum.length} pass senaste 7 dagarna, senast ${kortDatum(senast)}`),
    })
  }

  for (const d of deltagare) {
    if (!medMotesregel) break
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
  | 'lakarintyg_dag8'

export interface AttGora {
  typ: AttGoraTyp
  participantId: string
  pass: AttGoraPass
  /** Bara lakarintyg_dag8: sjukperioden punkten bygger på. */
  period?: Pick<Franvaroperiod, 'start' | 'slut' | 'dagar' | 'kanVaraLangre'>
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
  lakarintyg_dag8: 2,
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

/** KSL21: frånvarons ord. Leverantör: anmäld/inte anmäld (fakta). Kommun: giltig/ogiltig. */
function franvaroSlag(a: Attendance | null, franvaroSomFakta: boolean): string {
  if (franvaroSomFakta) return a === 'absent_invalid' ? 'inte anmäld' : 'anmäld i förväg'
  return a === 'absent_invalid' ? 'ogiltig' : 'giltig'
}

/** Vilken punkt passet ger, eller null. Ren regel — testas utan React. */
export function attGoraForPass(p: AttGoraPass, idag: string, franvaroSomFakta = false): AttGora | null {
  const fran = addDays(idag, -(ATT_GORA_BAKAT_DAGAR - 1))
  const till = addDays(idag, ATT_GORA_FRAMAT_DAGAR)
  if (p.date < fran || p.date > till) return null
  const ut = (typ: AttGoraTyp, text: string): AttGora => ({ typ, participantId: p.participant_id, pass: p, text })

  if (p.attendance === 'absent_invalid' || p.attendance === 'absent_valid') {
    const forklaring = p.participant_explanation?.trim()
    const ny = !!forklaring && (!p.marked_at || !p.participant_explanation_at
      || new Date(p.participant_explanation_at).getTime() > new Date(p.marked_at).getTime())
    if (forklaring && ny) {
      const slag = franvaroSlag(p.attendance, franvaroSomFakta)
      const kort = forklaring.length > 120 ? `${forklaring.slice(0, 117)}…` : forklaring
      return ut('forklaring', `Har förklarat frånvaron ${passNamn(p)}, markerad som ${slag}: ”${kort}”`)
    }
    if (p.attendance === 'absent_invalid' && !p.attendance_note?.trim()) {
      return ut('franvaro_utan_anteckning', franvaroSomFakta
        ? `Frånvarande utan anmälan ${passNamn(p)} saknar orsak`
        : `Ogiltig frånvaro ${passNamn(p)} saknar anteckning`)
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
 * KSL19: en punkt per deltagare vars sjukfrånvaro pågått mer än sju kalenderdagar
 * utan att intyget kommit in. Räkningen (och dess antaganden) bor i
 * services/franvaroperiod.ts. Inget paragrafnummer anges — det är obelagt.
 */
function lakarintygPunkter(pass: readonly AttGoraPass[], mina: ReadonlySet<string>, idag: string): AttGora[] {
  const perPerson = new Map<string, AttGoraPass[]>()
  for (const p of pass) {
    if (!mina.has(p.participant_id)) continue
    const lista = perPerson.get(p.participant_id) ?? []
    lista.push(p)
    perPerson.set(p.participant_id, lista)
  }
  const ut: AttGora[] = []
  for (const [participantId, lista] of perPerson) {
    const period = lakarintygDag8(lista, idag)
    if (!period) continue
    const { start, slut, dagar, kanVaraLangre } = period
    ut.push({
      typ: 'lakarintyg_dag8',
      participantId,
      pass: period.pass[period.pass.length - 1],
      period: { start, slut, dagar, kanVaraLangre },
      text: `Sjuk sedan ${kortDatum(start)} — läkarintyg behövs från dag 8`,
    })
  }
  return ut
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
  /** KSL21: leverantörens ord (anmäld/inte anmäld) i stället för giltig/ogiltig. */
  franvaroSomFakta?: boolean
  /**
   * KSL19: flagga "Läkarintyg behövs från dag 8". Bara kommunens regel — för en
   * leverantör (franvaroSomFakta) läggs den aldrig till, oavsett värde här.
   * Utan värde: på för kommun.
   */
  lakarintygDag8?: boolean
}): AttGora[] {
  const mina = new Set(args.deltagare.map((d) => d.participant_id))
  const idag = formatLocalDate(args.idag)
  const ut: AttGora[] = []
  for (const p of args.pass) {
    if (!mina.has(p.participant_id)) continue
    const punkt = attGoraForPass(p, idag, args.franvaroSomFakta ?? false)
    if (punkt) ut.push(punkt)
  }
  if (!args.franvaroSomFakta && args.lakarintygDag8 !== false) {
    ut.push(...lakarintygPunkter(args.pass, mina, idag))
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
  /**
   * KSL14: avvikelser (frånvarande, sjuk) som konsulenten inte antecknat som
   * rapporterade till AF — en rad per deltagare. `null` = underlaget kunde inte
   * hämtas: då påstår vi varken att något saknas eller att allt är rapporterat.
   */
  avvikelserEjRapporterade: LeverantorPunkt[] | null
  /**
   * KSL20 (AFFS 2023:1 § 10): sjukfrånvaro som fortsatt efter dag 8 utan att en ny
   * avvikelserapport antecknats som lämnad. `null`/utelämnad = underlaget saknas.
   */
  avvikelseDag8?: LeverantorPunkt[] | null
}

/** Pass med det avvikelsereglerna (services/avvikelserapport.ts) läser. */
export type AvvikelsePass = Parameters<typeof avvikelserader>[0][number] & { participant_id: string }

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
  /** KSL14: passen från början av förra månaden till i dag. `null`/utelämnad = kunde inte hämtas. */
  avvikelsePass?: readonly AvvikelsePass[] | null
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

  // Slipningen 2026-10-11 (R&M A4): en deltagare som fått jobb (placering som har
  // startat) och inte har någon aktiv plan jagades ändå för fysiska möten. Hennes
  // uppgift är uppföljningen. Med en aktiv plan är hon kvar i tjänsten — då gäller kravet.
  const medAktivPlan = new Set(args.plans.filter((p) => p.status === 'active').map((p) => p.participant_id))
  const placerade = new Set(args.placeringar
    .filter((p) => (!p.start_date || p.start_date <= idagIso) && !medAktivPlan.has(p.participant_id))
    .map((p) => p.participant_id))
  const utanFysisktMote: LeverantorPunkt[] = []
  for (const d of deltagare) {
    if (d.status !== 'ACTIVE' || placerade.has(d.participant_id)) continue
    const k = kadensForMoten(args.moten.filter((m) => m.participant_id === d.participant_id), idag)
    if (k.bokatFysiskt) continue
    if (k.dagarSedanFysiskt !== null && k.dagarSedanFysiskt <= FYSISKT_GRANS_DAGAR) continue
    utanFysisktMote.push({
      participantId: d.participant_id,
      text: k.dagarSedanFysiskt === null
        // Bara att inget genomfört fysiskt möte finns i datan — inte "90 dagar".
        ? 'Inget genomfört fysiskt möte än'
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

  // KSL14: avvikelser som ännu inte noterats som rapporterade till AF. Samma regel som
  // avvikelserapporten (leverantörsledda pass, bara markerade utfall).
  let avvikelserEjRapporterade: LeverantorPunkt[] | null = null
  if (args.avvikelsePass) {
    avvikelserEjRapporterade = []
    const from = fornaManadensStart(idagIso)
    for (const d of deltagare) {
      const ejRapporterade = avvikelserader(args.avvikelsePass.filter((p) => p.participant_id === d.participant_id), from, idagIso)
        .filter((r) => r.underrattad === null)
      if (ejRapporterade.length === 0) continue
      const aldsta = ejRapporterade[0]
      avvikelserEjRapporterade.push({
        participantId: d.participant_id,
        text: ejRapporterade.length === 1
          ? `Avvikelse ${kortDatum(aldsta.datum)} är inte rapporterad till AF`
          : `${ejRapporterade.length} avvikelser är inte rapporterade till AF, den äldsta ${kortDatum(aldsta.datum)}`,
      })
    }
  }

  // KSL20: ny rapport dag 8 vid fortsatt frånvaro. Samma passunderlag och samma
  // räkning som kommunens läkarintygsflagga (services/franvaroperiod.ts).
  let avvikelseDag8Punkter: LeverantorPunkt[] | null = null
  if (args.avvikelsePass) {
    avvikelseDag8Punkter = []
    for (const d of deltagare) {
      const lista = args.avvikelsePass.filter((p) => p.participant_id === d.participant_id && arLeverantorsledd(p))
      const period = avvikelseDag8(lista, idagIso, 'sick')
      if (!period) continue
      avvikelseDag8Punkter.push({
        participantId: d.participant_id,
        text: `Sjuk sedan ${kortDatum(period.start)} — ny avvikelserapport till AF behövs för dag 8`,
      })
    }
  }

  return { bedomdaPlaner, underTimkravet, utanFysisktMote, uppfoljningar, avvikelserEjRapporterade, avvikelseDag8: avvikelseDag8Punkter }
}

/** Första dagen i förra månaden (YYYY-MM-DD): hit hämtas passen för avvikelserna. */
export function fornaManadensStart(idagIso: string): string {
  const [y, m] = idagIso.split('-').map(Number)
  const ar = m === 1 ? y - 1 : y
  const man = m === 1 ? 12 : m - 1
  return `${ar}-${String(man).padStart(2, '0')}-01`
}

/** Sammanfattningsraden. Timkravet utan en enda bedömd vecka skrivs inte som 0. */
export function leverantorSammanfattning(l: LeverantorLage): string[] {
  return [
    l.bedomdaPlaner === 0
      ? 'Timkravet: ingen avslutad vecka att bedöma'
      : `${l.underTimkravet.length} deltagare under timkravet`,
    `${l.utanFysisktMote.length} utan fysiskt möte`,
    `${l.uppfoljningar.length} ${l.uppfoljningar.length === 1 ? 'uppföljning' : 'uppföljningar'} inom 14 dagar`,
    // Okänt (null) skrivs inte som 0 — då utelämnas raden hellre än att påstå något.
    ...(l.avvikelserEjRapporterade === null
      ? []
      : [`${l.avvikelserEjRapporterade.length} deltagare med avvikelse som inte rapporterats till AF`]),
    ...(l.avvikelseDag8 == null || l.avvikelseDag8.length === 0
      ? []
      : [`${l.avvikelseDag8.length} med sjukfrånvaro som behöver en ny avvikelserapport dag 8`]),
  ]
}

// ===========================================================================
// Min dag i omtaget "Kvarter" (steg 3, 2026-10-11)
// ===========================================================================
//
// Förslagets två principer för Min dag: "Nästa steg står överst, och det är
// ett" och "Personen är enheten". Det som Att göra, Kräver uppmärksamhet,
// leverantörens vecka och dagens möten tidigare listade var för sig blir här
// EN rad per människa, med det mest brådskande först och "+N till" efter —
// och den enda viktigaste saken lyfts ut till ett nästa steg.
//
// Inga nya regler: varje punkt kommer ur reglerna ovan (attGoraIdag,
// bradskandePunkter, leverantorsLage) eller ur Översiktens möten, mål och
// kontaktregel. Det nya är ordningen och orden ("läget" som en mening).

export type MinDagTyp =
  | AttGoraTyp
  | 'franvaro'
  | 'mote_over_gransen'
  | 'utan_fysiskt'
  | 'under_timkravet'
  | 'uppfoljning'
  | 'mote_idag'
  | 'deadline'
  | 'kontakt'

/** Lägre tal = mer brådskande. Förslagets ordning: frånvaro utan anteckning först. */
export const MIN_DAG_PRIO: Record<MinDagTyp, number> = {
  franvaro_utan_anteckning: 10,
  forklaring: 20,
  anmald_franvaro: 25,
  sjuk_utan_intyg: 30,
  lakarintyg_dag8: 29,
  kvittera: 35,
  franvaro: 40,
  omarkerat: 45,
  mote_over_gransen: 50,
  utan_fysiskt: 52,
  under_timkravet: 55,
  uppfoljning: 58,
  mote_idag: 65,
  deadline: 75,
  kontakt: 85,
}

/** Statusens namn i Kvarter-systemet (components/ui/kvarterStatus.ts). */
export type MinDagStatus = 'narvarande' | 'giltig' | 'ogiltig' | 'sjuk' | 'vantar' | 'planerat'

export interface MinDagPunkt {
  typ: MinDagTyp
  participantId: string
  /** "Läget" — en mening om personen, ord före siffror. */
  lage: string
  /** Mindre text under läget. */
  detalj?: string
  status?: MinDagStatus
  /** Egen text i statuschippet; utelämnad → statusens ord. */
  statusText?: string
  /** Passet punkten gäller (Att göra-punkterna). */
  pass?: AttGoraPass
  /** Dagens möte (mote_idag). */
  mote?: { id: string; scheduledAt: string; meetingLink: string | null }
}

export interface MinDagPerson {
  participantId: string
  /** Mest brådskande först. Minst en punkt. */
  punkter: MinDagPunkt[]
}

const VECKODAG_SEDAN = ['söndags', 'måndags', 'tisdags', 'onsdags', 'torsdags', 'fredags', 'lördags']
const VECKODAG_FRAM = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag']

function isoTillDatum(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Ett datum som ord, relativt i dag: "i dag", "i går", "i fredags", "på
 * torsdag", annars "10 okt". Ord före siffror — men bara inom en vecka, där
 * ordet är entydigt.
 */
export function dagOrd(iso: string, idag: string): string {
  const dagar = Math.round((isoTillDatum(iso).getTime() - isoTillDatum(idag).getTime()) / 86_400_000)
  if (dagar === 0) return 'i dag'
  if (dagar === -1) return 'i går'
  if (dagar === 1) return 'i morgon'
  const vd = isoTillDatum(iso).getDay()
  if (dagar < 0 && dagar >= -6) return `i ${VECKODAG_SEDAN[vd]}`
  if (dagar > 0 && dagar <= 6) return `på ${VECKODAG_FRAM[vd]}`
  return kortDatum(iso)
}

function passTid(p: Pick<AttGoraPass, 'start_time' | 'end_time'>): string {
  return `${p.start_time.slice(0, 5)}–${p.end_time.slice(0, 5)}`
}

/** En Att göra-punkt som läge. Texterna i attGoraForPass står kvar för andra vyer. */
export function lageForAttGora(a: AttGora, idag: string, franvaroSomFakta = false): MinDagPunkt {
  const p = a.pass
  const nar = dagOrd(p.date, idag)
  const bas = { typ: a.typ, participantId: a.participantId, pass: p }
  switch (a.typ) {
    case 'franvaro_utan_anteckning':
      return franvaroSomFakta
        ? { ...bas, lage: `Var inte på ${p.title} ${nar}`, detalj: 'Frånvarande, inte anmäld i förväg. Saknar en rad om orsaken', status: 'ogiltig', statusText: 'Frånvarande, inte anmäld' }
        : { ...bas, lage: `Var inte på ${p.title} ${nar}`, detalj: 'Ogiltig frånvaro, saknar en rad om vad som hände', status: 'ogiltig' }
    case 'forklaring': {
      const forklaring = (p.participant_explanation ?? '').trim()
      const kort = forklaring.length > 120 ? `${forklaring.slice(0, 117)}…` : forklaring
      const slag = franvaroSlag(p.attendance, franvaroSomFakta)
      return { ...bas, lage: `Har förklarat frånvaron ${nar}`, detalj: `${p.title}, markerad som ${slag}: ”${kort}”`, status: 'vantar' }
    }
    case 'anmald_franvaro': {
      const orsak = p.absence_reason ? ANMALAN_ORSAK[p.absence_reason] ?? p.absence_reason : 'ingen orsak angiven'
      const not = p.absence_note?.trim() ? ` · ”${p.absence_note.trim()}”` : ''
      return { ...bas, lage: `Har anmält frånvaro ${nar}: ${orsak}`, detalj: `${p.title} ${passTid(p)}${not}`, status: 'vantar' }
    }
    case 'sjuk_utan_intyg':
      return { ...bas, lage: `Sjuk ${nar}, intyget har inte kommit`, detalj: `${p.title} ${passTid(p)}`, status: 'sjuk' }
    case 'lakarintyg_dag8': {
      const per = a.period
      const langd = per ? `${per.kanVaraLangre ? 'minst ' : ''}${dagar(per.dagar)} i följd` : ''
      return {
        ...bas,
        lage: 'Läkarintyg behövs från dag 8',
        detalj: per ? `Sjuk sedan ${kortDatum(per.start)}, ${langd} enligt planens pass. Räknat i kalenderdagar.` : undefined,
        status: 'sjuk',
        statusText: 'Läkarintyg dag 8',
      }
    }
    case 'kvittera':
      return {
        ...bas,
        lage: p.activity_type === 'jobsearch_own' ? `Har redovisat eget jobbsökande ${nar}` : `Checkade in på ${p.title} ${nar}`,
        detalj: passTid(p),
        status: 'vantar',
        statusText: 'Väntar på kvittens',
      }
    case 'omarkerat':
      return { ...bas, lage: `${p.title} ${nar} är inte markerat`, detalj: passTid(p), status: 'planerat', statusText: 'Inte markerat' }
  }
}

export interface MoteIdag {
  id: string
  participantId: string
  scheduledAt: string
  meetingType: string | null
  meetingLink: string | null
  latestNote: { content: string } | null
}

export interface MalDeadline {
  goalId: string
  goalTitle: string
  participantId: string
  daysLeft: number
}

export interface KontaktPunkt {
  participantId: string
  /** Texten ur kontaktText (samma ord som deltagarkortet). */
  text: string
}

const MOTESFORM: Record<string, string> = { physical: 'på kontoret', video: 'digitalt', phone: 'per telefon' }

function klockslag(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function dagar(n: number): string {
  return `${n} ${n === 1 ? 'dag' : 'dagar'}`
}

/**
 * Alla punkter i Min dag, grupperade per person. Personens mest brådskande
 * punkt avgör personens plats; lika → den med flest punkter först.
 */
export function minDagPersoner(args: {
  attGora: readonly AttGora[]
  bradskande: readonly Bradskande[]
  leverantor: LeverantorLage | null
  moten: readonly MoteIdag[]
  deadlines: readonly MalDeadline[]
  kontakter: readonly KontaktPunkt[]
  idag: Date
  /** KSL21: leverantörens ord för frånvaron (fakta), aldrig giltig/ogiltig. */
  franvaroSomFakta?: boolean
}): MinDagPerson[] {
  const idag = formatLocalDate(args.idag)
  const fakta = args.franvaroSomFakta ?? false
  const punkter: MinDagPunkt[] = []

  for (const a of args.attGora) {
    // En incheckning på ett av dagens pass bekräftas i passet (nästa steg "Markera
    // närvaro" eller Dagens pass) — inte en gång till som en rad per person.
    if (a.typ === 'kvittera' && a.pass.date === idag && a.pass.activity_type !== 'jobsearch_own') continue
    punkter.push(lageForAttGora(a, idag, fakta))
  }
  for (const b of bradskandeUtanDubbletter(args.bradskande, args.attGora)) {
    punkter.push(b.typ === 'franvaro'
      ? fakta
        ? { typ: 'franvaro', participantId: b.participantId, lage: b.text, detalj: 'Orsaken är antecknad, avvikelsen är klar att rapportera', status: 'ogiltig', statusText: 'Frånvarande, inte anmäld' }
        : { typ: 'franvaro', participantId: b.participantId, lage: b.text, detalj: 'Anteckningen finns, underlaget är klart', status: 'ogiltig' }
      : { typ: 'mote_over_gransen', participantId: b.participantId, lage: b.text, detalj: 'Mötesregeln i avtalet', status: 'vantar', statusText: 'Möte behövs' })
  }
  if (args.leverantor) {
    // En mötesrad och en "utan fysiskt möte"-rad för samma person säger samma sak.
    const moteRedan = new Set(args.bradskande.filter((b) => b.typ === 'mote').map((b) => b.participantId))
    for (const p of args.leverantor.utanFysisktMote) {
      if (moteRedan.has(p.participantId)) continue
      punkter.push({ typ: 'utan_fysiskt', participantId: p.participantId, lage: p.text, detalj: 'Ett fysiskt möte behövs enligt avtalet', status: 'vantar', statusText: 'Fysiskt möte behövs' })
    }
    for (const p of args.leverantor.underTimkravet) {
      punkter.push({ typ: 'under_timkravet', participantId: p.participantId, lage: p.text, detalj: 'Senaste avslutade veckan', status: 'ogiltig', statusText: 'Under timkravet' })
    }
    for (const p of args.leverantor.avvikelserEjRapporterade ?? []) {
      punkter.push({ typ: 'franvaro', participantId: p.participantId, lage: p.text, detalj: 'Skriv in den i AF:s system och markera den som underrättad på deltagarens plan', status: 'vantar', statusText: 'Avvikelse att rapportera' })
    }
    for (const p of args.leverantor.avvikelseDag8 ?? []) {
      punkter.push({ typ: 'franvaro', participantId: p.participantId, lage: p.text, detalj: 'Frånvaron fortsätter efter dag 8. Skriv in en ny rapport i AF:s system och markera passet som underrättat.', status: 'vantar', statusText: 'Ny rapport dag 8' })
    }
    for (const p of args.leverantor.uppfoljningar) {
      punkter.push({ typ: 'uppfoljning', participantId: p.participantId, lage: p.text, status: 'vantar', statusText: 'Uppföljning' })
    }
  }
  for (const m of args.moten) {
    const form = m.meetingType ? MOTESFORM[m.meetingType] : null
    const not = m.latestNote?.content.trim()
    punkter.push({
      typ: 'mote_idag',
      participantId: m.participantId,
      lage: `Möte i dag ${klockslag(m.scheduledAt)}${form ? `, ${form}` : ''}`,
      detalj: not ? `Senaste anteckningen: ${not.length > 90 ? `${not.slice(0, 87)}…` : not}` : 'Inga anteckningar än',
      status: 'planerat',
      statusText: 'Möte i dag',
      mote: { id: m.id, scheduledAt: m.scheduledAt, meetingLink: m.meetingLink },
    })
  }
  for (const d of args.deadlines) {
    const nar = d.daysLeft < 0
      ? `skulle ha varit klart för ${dagar(Math.abs(d.daysLeft))} sedan`
      : d.daysLeft === 0 ? 'ska vara klart i dag' : `ska vara klart om ${dagar(d.daysLeft)}`
    punkter.push({
      typ: 'deadline',
      participantId: d.participantId,
      lage: `Målet ”${d.goalTitle}” ${nar}`,
      status: d.daysLeft < 0 ? 'vantar' : 'planerat',
      statusText: d.daysLeft < 0 ? 'Försenat mål' : 'Mål',
    })
  }
  for (const k of args.kontakter) {
    punkter.push({ typ: 'kontakt', participantId: k.participantId, lage: k.text, detalj: 'Har ni pratat utanför Jobin? Logga det, så försvinner raden.' })
  }

  const perPerson = new Map<string, MinDagPunkt[]>()
  for (const p of punkter) {
    const lista = perPerson.get(p.participantId) ?? []
    lista.push(p)
    perPerson.set(p.participantId, lista)
  }
  return [...perPerson.entries()]
    .map(([participantId, lista]) => ({
      participantId,
      punkter: [...lista].sort((a, b) => MIN_DAG_PRIO[a.typ] - MIN_DAG_PRIO[b.typ]),
    }))
    .sort((a, b) =>
      MIN_DAG_PRIO[a.punkter[0].typ] - MIN_DAG_PRIO[b.punkter[0].typ]
      || b.punkter.length - a.punkter.length
      || a.participantId.localeCompare(b.participantId))
}

/**
 * Radens läge när det mest brådskande finns flera gånger: "Fyra pass är inte
 * markerade" i stället för det första passet och "+3 till". Personen är
 * enheten — tio omarkerade pass är en sak om Dana, inte tio. `fler` räknar
 * bara det som är något ANNAT än det sammanfattade.
 */
export function radSammanfattning(person: MinDagPerson, franvaroSomFakta = false): { lage: string; detalj?: string; fler: number } {
  const [forsta] = person.punkter
  const samma = person.punkter.filter((p) => p.typ === forsta.typ)
  const n = samma.length
  const fler = person.punkter.length - n
  if (n < 2) return { lage: forsta.lage, detalj: forsta.detalj, fler }
  const tal = talOrd(n).toLowerCase()
  switch (forsta.typ) {
    case 'omarkerat':
      return { lage: `${talOrd(n)} pass är inte markerade`, detalj: `Det första: ${forsta.lage.replace(/ är inte markerat$/, '')}`, fler }
    case 'franvaro_utan_anteckning':
      return { lage: `Var inte på ${tal} pass`, detalj: franvaroSomFakta ? 'Frånvarande, inte anmäld i förväg, utan en rad om orsaken' : 'Ogiltig frånvaro utan en rad om vad som hände', fler }
    case 'kvittera':
      return { lage: `${talOrd(n)} redovisningar väntar på din kvittens`, detalj: forsta.lage, fler }
    case 'anmald_franvaro':
      return { lage: `Har anmält frånvaro för ${tal} pass`, detalj: forsta.lage, fler }
    case 'sjuk_utan_intyg':
      return { lage: `Sjuk på ${tal} pass, intyget har inte kommit`, detalj: forsta.detalj, fler }
    case 'forklaring':
      return { lage: `Har förklarat frånvaron för ${tal} pass`, detalj: forsta.detalj, fler }
    case 'deadline':
      return { lage: `${talOrd(n)} mål ska vara klara snart eller är försenade`, detalj: forsta.lage, fler }
    default:
      return { lage: forsta.lage, detalj: forsta.detalj, fler: person.punkter.length - 1 }
  }
}

/** Antal saker i dag: varje punkt, plus varje pass att markera nu. */
export function antalSaker(personer: readonly MinDagPerson[], pass: readonly PassAttMarkera[]): number {
  return personer.reduce((s, p) => s + p.punkter.length, 0) + pass.length
}

// ---------------------------------------------------------------------------
// Nästa steg
// ---------------------------------------------------------------------------

/** Ett pass i dag som ska markeras: samma tid och titel = ett pass (som gruppnärvaron). */
export interface PassAttMarkera {
  title: string
  date: string
  start_time: string
  end_time: string
  deltagare: number
  incheckade: number
  anmalda: number
  omarkerade: number
}

/** Hur lång tid före start ett pass räknas som "nu" (minuter). */
export const PASS_SNART_MINUTER = 60

function minuterIn(hhmm: string): number {
  const [h, m] = hhmm.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

/**
 * Dagens pass som behöver markeras nu: har börjat eller börjar inom en timme,
 * och minst en deltagare saknar markering. Eget jobbsökande räknas inte — det
 * kvitteras, det markeras inte (gruppnärvaron gör samma sak). Tidigast först.
 */
export function passAttMarkera(pass: readonly AttGoraPass[], nu: Date): PassAttMarkera[] {
  const idag = formatLocalDate(nu)
  const nuMin = nu.getHours() * 60 + nu.getMinutes()
  const grupper = new Map<string, AttGoraPass[]>()
  for (const p of pass) {
    if (p.date !== idag || p.activity_type === 'jobsearch_own') continue
    if (minuterIn(p.start_time) - PASS_SNART_MINUTER > nuMin) continue
    const nyckel = `${p.start_time.slice(0, 5)}|${p.end_time.slice(0, 5)}|${p.title.trim().toLocaleLowerCase('sv-SE')}`
    const lista = grupper.get(nyckel) ?? []
    lista.push(p)
    grupper.set(nyckel, lista)
  }
  const ut: PassAttMarkera[] = []
  for (const lista of grupper.values()) {
    const omarkerade = lista.filter((p) => p.attendance === null)
    if (omarkerade.length === 0) continue
    const forsta = lista[0]
    ut.push({
      title: forsta.title.trim(),
      date: forsta.date,
      start_time: forsta.start_time.slice(0, 5),
      end_time: forsta.end_time.slice(0, 5),
      deltagare: new Set(lista.map((p) => p.participant_id)).size,
      incheckade: omarkerade.filter((p) => !!p.self_checkin_at).length,
      anmalda: omarkerade.filter((p) => !!p.absence_reported_at).length,
      omarkerade: omarkerade.length,
    })
  }
  return ut.sort((a, b) => a.start_time.localeCompare(b.start_time) || a.title.localeCompare(b.title, 'sv'))
}

const TAL = ['Noll', 'En', 'Två', 'Tre', 'Fyra', 'Fem', 'Sex', 'Sju', 'Åtta', 'Nio', 'Tio', 'Elva', 'Tolv']

/** Tal i ord upp till tolv ("Fyra"), sedan siffror. Stor bokstav först. */
export function talOrd(n: number): string {
  return n >= 0 && n < TAL.length ? TAL[n] : String(n)
}

/** "Sex deltagare. Fyra har checkat in själva, en har anmält frånvaro." */
export function passMening(p: PassAttMarkera): string {
  const delar: string[] = []
  if (p.incheckade > 0) delar.push(`${p.incheckade === p.deltagare && p.deltagare > 1 ? 'alla' : talOrd(p.incheckade).toLowerCase()} har checkat in ${p.incheckade === 1 ? 'själv' : 'själva'}`)
  if (p.anmalda > 0) delar.push(`${talOrd(p.anmalda).toLowerCase()} har anmält frånvaro`)
  const forsta = `${talOrd(p.deltagare)} deltagare.`
  if (delar.length === 0) return `${forsta} Ingen är markerad än.`
  const resten = delar.join(', ')
  return `${forsta} ${resten.charAt(0).toUpperCase()}${resten.slice(1)}.`
}

export type NastaStegVal =
  | { typ: 'punkt'; punkt: MinDagPunkt }
  | { typ: 'pass'; pass: PassAttMarkera }

/**
 * Den enda viktigaste saken, i förslagets ordning:
 *   1. frånvaro utan anteckning (dokumentationen handläggaren behöver)
 *   2. ett pass att markera nu
 *   3. underlag och avvikelser: förklaringar, anmälningar, intyg, kvittenser,
 *      omarkerade pass och leverantörens punkter mot avtalet
 *   4. dagens närmaste möte som inte har varit
 *   5. resten (mål, kontakt)
 * Ingenting → null. Den som anropar får inte fråga medan datan laddar eller
 * när den inte kunde läsas — då finns inget att påstå.
 */
export function valjNastaSteg(personer: readonly MinDagPerson[], pass: readonly PassAttMarkera[], nu: Date): NastaStegVal | null {
  const forsta = personer.map((p) => p.punkter[0])
  const franvaro = forsta.find((p) => p.typ === 'franvaro_utan_anteckning')
  if (franvaro) return { typ: 'punkt', punkt: franvaro }
  if (pass.length > 0) return { typ: 'pass', pass: pass[0] }
  const underlag = forsta.find((p) => MIN_DAG_PRIO[p.typ] < MIN_DAG_PRIO.mote_idag)
  if (underlag) return { typ: 'punkt', punkt: underlag }
  const moten = personer
    .flatMap((p) => p.punkter)
    .filter((p) => p.typ === 'mote_idag' && p.mote && new Date(p.mote.scheduledAt).getTime() >= nu.getTime() - 15 * 60_000)
    .sort((a, b) => a.mote!.scheduledAt.localeCompare(b.mote!.scheduledAt))
  if (moten[0]) return { typ: 'punkt', punkt: moten[0] }
  const ovrigt = forsta.find((p) => p.typ !== 'mote_idag')
  return ovrigt ? { typ: 'punkt', punkt: ovrigt } : null
}

/** Personerna utan läkarintygsflaggan (dag 8). En person som bara hade den försvinner ur listan. */
export function utanLakarintyg(personer: readonly MinDagPerson[]): MinDagPerson[] {
  return personer
    .map((p) => ({ ...p, punkter: p.punkter.filter((x) => x.typ !== 'lakarintyg_dag8') }))
    .filter((p) => p.punkter.length > 0)
}

/** Personerna utan punkten som blev nästa steg — samma sak ska inte stå två gånger. */
export function utanNastaSteg(personer: readonly MinDagPerson[], val: NastaStegVal | null): MinDagPerson[] {
  if (!val || val.typ !== 'punkt') return [...personer]
  return personer
    .map((p) => ({ ...p, punkter: p.punkter.filter((x) => x !== val.punkt) }))
    .filter((p) => p.punkter.length > 0)
}

// ---------------------------------------------------------------------------
// Veckan i en mening
// ---------------------------------------------------------------------------

/**
 * En mening om veckan ur närvarodatan Översikten redan hämtar — bara det datan
 * bär. Räknar konsulentens deltagare med minst ett pass måndag–i går (dagens
 * pass kan fortfarande pågå). Eget jobbsökande räknas inte. Ingen sådan
 * deltagare → null: hellre ingen mening än en påhittad.
 */
export function veckanIEnMening(
  pass: readonly AttGoraPass[],
  deltagare: readonly { participant_id: string }[],
  nu: Date,
): string | null {
  const mina = new Set(deltagare.map((d) => d.participant_id))
  const idag = formatLocalDate(nu)
  const mandag = veckansMandag(idag)
  const perPerson = new Map<string, AttGoraPass[]>()
  for (const p of pass) {
    if (!mina.has(p.participant_id) || p.activity_type === 'jobsearch_own') continue
    if (p.date < mandag || p.date >= idag) continue
    const lista = perPerson.get(p.participant_id) ?? []
    lista.push(p)
    perPerson.set(p.participant_id, lista)
  }
  const med = perPerson.size
  if (med === 0) return null
  let allaPass = 0
  let omarkerade = 0
  for (const lista of perPerson.values()) {
    if (lista.every((p) => p.attendance === 'present' || p.attendance === 'external')) allaPass += 1
    omarkerade += lista.filter((p) => p.attendance === null).length
  }
  const forsta = med === 1
    ? (allaPass === 1
      ? 'Den enda deltagaren med pass den här veckan har varit på alla sina.'
      : 'Den enda deltagaren med pass den här veckan har inte varit på alla sina.')
    : allaPass === med
      ? `Alla ${talOrd(med).toLowerCase()} deltagare med pass den här veckan har varit på alla sina.`
      : `${talOrd(allaPass)} av ${talOrd(med).toLowerCase()} deltagare med pass den här veckan har varit på alla sina.`
  // "pass" är ett ett-ord: "Ett pass", inte "En pass".
  const andra = omarkerade === 0 ? '' : omarkerade === 1 ? ' Ett pass är inte markerat än.' : ` ${talOrd(omarkerade)} pass är inte markerade än.`
  return forsta + andra
}
