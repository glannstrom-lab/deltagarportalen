/**
 * periodiskRapport — underlag för den periodiska rapporten (RM6/NF2).
 *
 * Rusta och matcha, FFU §5.1.1: grundersättningen betalas inte ut utan
 * godkänd periodisk rapport. Portalen har inget API mot Arbetsförmedlingen;
 * det här är ett INTERNT UNDERLAG som konsulenten för över för hand till
 * Mina sidor för fristående aktörer (MSFA).
 *
 * PREMISS (2026-10-31): repot belägger INTE MSFA-formulärets fält och
 * ordning. Det som är belagt är avtalskraven — aktivitetstid (FFU §4.1.1),
 * minst 50 % fysiska per deltagare, individuellt möte minst var 14:e dag och
 * fysiskt minst var 28:e (RM3). Underlaget är byggt på dem och på passens
 * egna uppgifter; fältordningen är en rimlig gruppering, inte AF:s.
 * UI:t säger det.
 *
 * Skillnad mot `periodiskaFalt` (aktivitetslogg.ts, månad, bedömda veckor):
 * det här gäller ett fritt datumintervall, listar varje pass som källa, och
 * visar även planerade pass som ännu inte markerats.
 *
 * Frånvaro: fakta ("anmäld i förväg" / "inte anmäld i förväg"), aldrig en
 * bedömning av om skälet är godtagbart (KSL21, IAF 2024:12).
 *
 * Ren logik, lokal tid, inga databasanrop. Ett värde utan underlag är
 * `null` / "—", aldrig 0.
 */

import type { ActivityPlan, ActivitySession } from './aktivitetApi'
import { arNarvaro, parseLocalDate, timmar, type PassTyp } from './aktivitetSchema'
import { arFysisktPass, arLeverantorsledd, type PassFlaggor } from './planMarkning'
import { FYSISKT_GRANS_DAGAR, MOTE_GRANS_DAGAR, type MoteRad } from './moteskadens'

export interface RapportPeriod {
  from: string
  to: string
}

export type UnderlagPass = Pick<ActivitySession, 'id' | 'plan_id' | 'date' | 'start_time' | 'end_time' | 'title' | 'attendance' | 'location' | 'sick_certificate_received'> & { activity_type: PassTyp } & PassFlaggor
export type UnderlagMote = Pick<MoteRad, 'participant_id' | 'scheduled_at' | 'meeting_type' | 'status'>

export interface UnderlagFalt {
  id: 'planering' | 'genomforda' | 'fysiska' | 'moten' | 'franvaro'
  etikett: string
  /** Texten att kopiera, utan källa. */
  text: string
  /** Vilka pass/möten talen bygger på, en rad per källa. Tom lista = inga. */
  kalla: string[]
}

export interface PeriodiskRapport {
  period: RapportPeriod
  /** Antal kalenderdagar i perioden, inklusive första och sista. */
  dagar: number
  /** 0–1, eller `null` när inget genomfört pass finns. */
  andelFysiska: number | null
  /** `null` = inget underlag; annars om 50 %-kravet är uppfyllt. */
  fysiskaKravUppfyllt: boolean | null
  genomfordaMinuter: number
  planeradeMinuter: number
  falt: UnderlagFalt[]
}

const TYP_TEXT: Record<MoteRad['meeting_type'], string> = { physical: 'fysiskt', video: 'video', phone: 'telefon' }
const FRANVARO_TEXT: Record<string, string> = {
  absent_valid: 'frånvarande, anmäld i förväg',
  absent_invalid: 'frånvarande, inte anmäld i förväg',
  sick_certified: 'sjuk',
}

function dm(ymd: string): string {
  const d = parseLocalDate(ymd)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

/** Lokal kalenderdag för ett ISO-ögonblick. */
export function lokalDag(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dagarMellan(a: string, b: string): number {
  const da = parseLocalDate(a)
  const db = parseLocalDate(b)
  return Math.round((Date.UTC(db.getFullYear(), db.getMonth(), db.getDate()) - Date.UTC(da.getFullYear(), da.getMonth(), da.getDate())) / 86_400_000)
}

/** Tid i timmar med decimalkomma: 1,5 h. */
export function timText(minuter: number): string {
  const h = Math.round((minuter / 60) * 10) / 10
  return `${String(h).replace('.', ',')} h`
}

function minuter(p: Pick<UnderlagPass, 'start_time' | 'end_time'>): number {
  return Math.round(timmar(p.start_time, p.end_time) * 60)
}

/** Det längsta mellanrummet (dagar) mellan två på varandra följande datum, `null` vid färre än två. */
export function langstaMellanrum(datum: readonly string[]): number | null {
  const s = [...datum].sort()
  if (s.length < 2) return null
  let max = 0
  for (let i = 1; i < s.length; i++) max = Math.max(max, dagarMellan(s[i - 1], s[i]))
  return max
}

function passRad(p: UnderlagPass): string {
  const fys = arFysisktPass(p) ? 'fysiskt' : 'digitalt'
  return `${dm(p.date)} ${p.start_time}–${p.end_time} ${p.title} (${fys})`
}

export function sammanstallPeriodiskRapport(
  plan: Pick<ActivityPlan, 'id' | 'participant_id' | 'start_date' | 'end_date'>,
  pass: readonly UnderlagPass[],
  moten: readonly UnderlagMote[],
  period: RapportPeriod,
): PeriodiskRapport {
  // Planens giltighetstid begränsar perioden; pass och möten utanför räknas inte.
  const from = period.from > plan.start_date ? period.from : plan.start_date
  const to = plan.end_date !== null && plan.end_date < period.to ? plan.end_date : period.to
  const iPeriod = from <= to
  const eget = pass
    .filter((p) => p.plan_id === plan.id && iPeriod && p.date >= from && p.date <= to && arLeverantorsledd(p))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))

  const genomforda = eget.filter((p) => arNarvaro(p.attendance))
  const ejMarkerade = eget.filter((p) => p.attendance === null)
  const franvaro = eget.filter((p) => p.attendance !== null && p.attendance in FRANVARO_TEXT)

  const genomfordaMin = genomforda.reduce((s, p) => s + minuter(p), 0)
  const planeradeMin = eget.reduce((s, p) => s + minuter(p), 0)

  const fysiska = genomforda.filter(arFysisktPass)
  const andel = genomforda.length === 0 ? null : fysiska.length / genomforda.length

  const planering: UnderlagFalt = {
    id: 'planering',
    etikett: 'Planering och period',
    text: iPeriod
      ? `Period ${dm(from)}–${dm(to)}. Planerade anvisade aktiviteter: ${eget.length} pass, ${eget.length === 0 ? '—' : timText(planeradeMin)}. ` +
        `Därav ännu inte markerade: ${ejMarkerade.length}.`
      : 'Perioden ligger utanför planens giltighetstid — inget att redovisa.',
    kalla: eget.map((p) => `${passRad(p)} — ${p.attendance === null ? 'ej markerat' : (FRANVARO_TEXT[p.attendance] ?? 'genomfört')}`),
  }

  const genomfordaFalt: UnderlagFalt = {
    id: 'genomforda',
    etikett: 'Genomförda aktiviteter',
    text: genomforda.length === 0
      ? '— (inga genomförda pass i perioden)'
      : `${genomforda.length} pass, ${timText(genomfordaMin)}\n` + genomforda.map(passRad).join('\n'),
    kalla: genomforda.map(passRad),
  }

  const fysiskaText = andel === null
    ? '— (inget genomfört pass i perioden)'
    : `${Math.round(andel * 100)} % (${fysiska.length} av ${genomforda.length} pass) — krav minst 50 %: ${andel >= 0.5 ? 'uppfyllt' : 'ej uppfyllt'}`
  const fysiskaFalt: UnderlagFalt = {
    id: 'fysiska',
    etikett: 'Andel fysiska aktiviteter',
    text: fysiskaText,
    kalla: genomforda.map(passRad),
  }

  // Möten: bara genomförda, i planens period.
  const egnaMoten = moten
    .filter((m) => m.participant_id === plan.participant_id && m.status === 'completed')
    .map((m) => ({ dag: lokalDag(m.scheduled_at), typ: m.meeting_type }))
    .filter((m) => iPeriod && m.dag >= from && m.dag <= to)
    .sort((a, b) => a.dag.localeCompare(b.dag))
  const alla = langstaMellanrum(egnaMoten.map((m) => m.dag))
  const fys = langstaMellanrum(egnaMoten.filter((m) => m.typ === 'physical').map((m) => m.dag))
  let motenText: string
  if (egnaMoten.length === 0) {
    motenText = 'Inga genomförda möten registrerade i perioden.'
  } else {
    const nFys = egnaMoten.filter((m) => m.typ === 'physical').length
    const rader = [`${egnaMoten.length} ${egnaMoten.length === 1 ? 'möte' : 'möten'} (varav ${nFys} fysiska): ${egnaMoten.map((m) => `${dm(m.dag)} ${TYP_TEXT[m.typ]}`).join(', ')}`]
    rader.push(alla === null
      ? 'Längsta mellanrum: — (färre än två möten i perioden)'
      : `Längsta mellanrum mellan möten: ${alla} dagar (kravet är högst ${MOTE_GRANS_DAGAR}) — ${alla <= MOTE_GRANS_DAGAR ? 'inom kravet' : 'över kravet'}`)
    rader.push(fys === null
      ? 'Längsta mellanrum mellan fysiska möten: — (färre än två fysiska möten i perioden)'
      : `Längsta mellanrum mellan fysiska möten: ${fys} dagar (kravet är högst ${FYSISKT_GRANS_DAGAR}) — ${fys <= FYSISKT_GRANS_DAGAR ? 'inom kravet' : 'över kravet'}`)
    motenText = rader.join('\n')
  }
  const motenFalt: UnderlagFalt = {
    id: 'moten',
    etikett: 'Individuella möten och kadens',
    text: motenText,
    kalla: egnaMoten.map((m) => `${dm(m.dag)} ${TYP_TEXT[m.typ]} (genomfört)`),
  }

  const franvaroFalt: UnderlagFalt = {
    id: 'franvaro',
    etikett: 'Frånvaro',
    text: franvaro.length === 0
      ? 'Ingen frånvaro registrerad i perioden.'
      : franvaro.map((p) => {
        const utfall = p.attendance === 'sick_certified'
          ? (p.sick_certificate_received ? 'sjuk, intyg inkommet' : 'sjuk, intyg saknas')
          : FRANVARO_TEXT[p.attendance as string]
        return `${dm(p.date)} ${p.title}: ${utfall}`
      }).join('\n'),
    kalla: franvaro.map(passRad),
  }

  return {
    period: { from, to },
    dagar: iPeriod ? dagarMellan(from, to) + 1 : 0,
    andelFysiska: andel,
    fysiskaKravUppfyllt: andel === null ? null : andel >= 0.5,
    genomfordaMinuter: genomfordaMin,
    planeradeMinuter: planeradeMin,
    falt: [planering, genomfordaFalt, fysiskaFalt, motenFalt, franvaroFalt],
  }
}

/** Fältet som en kopierbar textbit. */
export function faltSomText(f: UnderlagFalt): string {
  return `${f.etikett}:\n${f.text}`
}

/** Hela underlaget som en text. */
export function allaFaltSomText(namn: string, r: PeriodiskRapport): string {
  return `Underlag för periodisk rapport – ${namn}, ${r.period.from} till ${r.period.to}\n\n` + r.falt.map(faltSomText).join('\n\n')
}

/** Kontrollerar att ett datumintervall går att använda. */
export function kontrolleraPeriod(from: string, to: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return 'Välj både från- och till-datum.'
  if (from > to) return 'Från-datumet ligger efter till-datumet.'
  if (dagarMellan(from, to) > 366) return 'Välj högst ett år åt gången.'
  return null
}
