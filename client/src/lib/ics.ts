/**
 * Kalenderexport (NF1, 2026-09-24) — en ren funktion som bygger en
 * RFC 5545-korrekt VCALENDAR, plus en liten nedladdningshjälp.
 *
 * Tiderna i portalen är svensk väggklocka (`date` + `start_time` i
 * activity_sessions). De skrivs ut i UTC (`...Z`), inte som flytande tid och
 * inte med TZID — då behövs ingen VTIMEZONE-komponent, och varje kalender
 * (Google, Outlook, Apple) visar passet rätt i användarens egen tidszon.
 * Omräkningen går via Intl med `Europe/Stockholm`, så sommartiden följer
 * tidszonsdatabasen och inte en hårdkodad regel — och den beror INTE på vilken
 * tidszon webbläsaren står i (en deltagare på semester i Thailand ska ändå få
 * passet kl 09 svensk tid).
 *
 * Tre saker i RFC 5545 som är lätta att göra fel:
 *  - radbrytningen är CRLF, inte LF (§3.1)
 *  - rader längre än 75 OKTETTER viks, och fortsättningsraden börjar med ett
 *    blanksteg (§3.1). Oktetter, inte tecken: "å" är två. En vikning får inte
 *    klyva ett flerbytestecken.
 *  - i TEXT-värden eskaperas bakstreck, semikolon, komma och radbrytning (§3.3.11)
 */

export interface IcsHandelse {
  /** Stabilt id — samma pass ger samma UID, så en ny import uppdaterar i stället för att dubblera. */
  uid: string
  /** YYYY-MM-DD, svensk väggklocka */
  datum: string
  /** HH:MM eller HH:MM:SS, svensk väggklocka */
  start: string
  /** HH:MM eller HH:MM:SS, svensk väggklocka. Före eller lika med start = över midnatt. */
  slut: string
  titel: string
  plats?: string | null
  beskrivning?: string | null
}

export interface IcsAlternativ {
  /** Tidpunkten som blir DTSTAMP. Default: nu. */
  nu?: Date
}

const TIDSZON = 'Europe/Stockholm'
const PRODID = '-//Jobin//Min vecka//SV'
const CRLF = '\r\n'
const MAX_OKTETTER = 75

/** Escaping av ett TEXT-värde enligt RFC 5545 §3.3.11. */
export function escapaText(varde: string): string {
  return varde
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
}

const kodare = new TextEncoder()

function oktetter(s: string): number {
  return kodare.encode(s).length
}

/**
 * Viker en innehållsrad så att ingen fysisk rad överstiger 75 oktetter
 * (exklusive CRLF). Fortsättningsraderna börjar med ett blanksteg, som räknas
 * in i radens 75. Kodpunkter klyvs aldrig.
 */
export function vikRad(rad: string): string {
  if (oktetter(rad) <= MAX_OKTETTER) return rad
  const delar: string[] = []
  let aktuell = ''
  let aktuellaOktetter = 0
  let grans = MAX_OKTETTER
  for (const tecken of rad) {
    const n = oktetter(tecken)
    if (aktuellaOktetter + n > grans) {
      delar.push(aktuell)
      aktuell = ''
      aktuellaOktetter = 0
      grans = MAX_OKTETTER - 1 // blanksteget i början av fortsättningsraden
    }
    aktuell += tecken
    aktuellaOktetter += n
  }
  delar.push(aktuell)
  return delar.join(`${CRLF} `)
}

function tvaSiffror(n: number): string {
  return String(n).padStart(2, '0')
}

/** Date → 20260924T070000Z */
export function utcStampel(d: Date): string {
  return (
    `${d.getUTCFullYear()}${tvaSiffror(d.getUTCMonth() + 1)}${tvaSiffror(d.getUTCDate())}` +
    `T${tvaSiffror(d.getUTCHours())}${tvaSiffror(d.getUTCMinutes())}${tvaSiffror(d.getUTCSeconds())}Z`
  )
}

const stockholmFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIDSZON,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

/** Hur många ms Stockholm ligger före UTC vid ett givet ögonblick. */
function stockholmForskjutning(ms: number): number {
  const delar: Record<string, number> = {}
  for (const p of stockholmFormat.formatToParts(new Date(ms))) {
    if (p.type !== 'literal') delar[p.type] = Number(p.value)
  }
  const somUtc = Date.UTC(delar.year, delar.month - 1, delar.day, delar.hour, delar.minute, delar.second)
  return somUtc - (ms - (ms % 1000))
}

function tolkaDatum(datum: string): [number, number, number] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datum)
  if (!m) throw new Error(`Ogiltigt datum: ${datum}`)
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

function tolkaTid(tid: string): [number, number, number] {
  const m = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(tid)
  if (!m) throw new Error(`Ogiltig tid: ${tid}`)
  return [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)]
}

function sekunder(tid: string): number {
  const [h, m, s] = tolkaTid(tid)
  return h * 3600 + m * 60 + s
}

/**
 * Svensk väggklocka → UTC-ögonblick. Två varv räcker: första gissningen
 * använder förskjutningen vid väggklockan tolkad som UTC, andra rättar den
 * om gissningen hamnade på andra sidan ett sommartidsbyte.
 */
export function stockholmTillUtc(datum: string, tid: string, extraDagar = 0): Date {
  const [y, mo, d] = tolkaDatum(datum)
  const [h, mi, s] = tolkaTid(tid)
  const vagg = Date.UTC(y, mo - 1, d + extraDagar, h, mi, s)
  let utc = vagg - stockholmForskjutning(vagg)
  utc = vagg - stockholmForskjutning(utc)
  return new Date(utc)
}

function textRad(namn: string, varde: string): string {
  return vikRad(`${namn}:${escapaText(varde)}`)
}

/** Bygger en hel VCALENDAR med en VEVENT per händelse. */
export function byggIcs(handelser: IcsHandelse[], alternativ: IcsAlternativ = {}): string {
  const dtstamp = utcStampel(alternativ.nu ?? new Date())
  const rader: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]
  for (const h of handelser) {
    const start = stockholmTillUtc(h.datum, h.start)
    const overMidnatt = sekunder(h.slut) <= sekunder(h.start)
    const slut = stockholmTillUtc(h.datum, h.slut, overMidnatt ? 1 : 0)
    rader.push('BEGIN:VEVENT')
    rader.push(textRad('UID', h.uid))
    rader.push(`DTSTAMP:${dtstamp}`)
    rader.push(`DTSTART:${utcStampel(start)}`)
    rader.push(`DTEND:${utcStampel(slut)}`)
    rader.push(textRad('SUMMARY', h.titel))
    if (h.plats?.trim()) rader.push(textRad('LOCATION', h.plats.trim()))
    if (h.beskrivning?.trim()) rader.push(textRad('DESCRIPTION', h.beskrivning.trim()))
    rader.push('END:VEVENT')
  }
  rader.push('END:VCALENDAR')
  return rader.join(CRLF) + CRLF
}

/** Filnamn utan tecken som operativsystemen inte tål. */
export function icsFilnamn(bas: string): string {
  const rent = bas.replace(/[\\/:*?"<>|\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
  return `${rent || 'kalender'}.ics`
}

/**
 * Laddar ner en .ics-fil. Öppnar INTE i ny flik: `window.open` efter ett
 * `await` räknas inte som utlöst av klicket och stoppas av popup-spärren, och
 * en ny flik med text/calendar gör olika saker i olika webbläsare.
 */
export function laddaNerIcs(innehall: string, filnamn: string): void {
  const blob = new Blob([innehall], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filnamn
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
