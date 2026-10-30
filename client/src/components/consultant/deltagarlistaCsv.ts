/**
 * deltagarlistaCsv — FN6: läs och granska en deltagarlista (CSV) innan något skickas.
 *
 * Ren logik, inga databasanrop. Svenska literaler: konsulentvyn översätts inte
 * (DESIGN.md §2).
 *
 * Vad som stöds (och därmed vad dialogen får lova):
 *   · avgränsare: semikolon (Excel på svensk Windows), komma eller tabb — avgörs
 *     av första raden
 *   · citattecken med "" som escape, radbrytning inne i citerat fält, CRLF/LF
 *   · UTF-8 med eller utan BOM, och Windows-1252 (Excels "CSV" utan UTF-8) — vid
 *     ogiltig UTF-8 antas Windows-1252
 *   · rubriker i valfri ordning: namn (eller förnamn + efternamn), e-post,
 *     ärendenummer, startdatum. Bara e-post är obligatorisk.
 *   · datum: ÅÅÅÅ-MM-DD, ÅÅÅÅ/MM/DD, ÅÅÅÅMMDD, D/M-ÅÅÅÅ, D.M.ÅÅÅÅ (dag först)
 * Stöds INTE: .xlsx (spara som CSV), Excels serienummer för datum, tvåsiffriga år.
 */

import { valideraArendenummer } from '@/services/planMarkning'

export const MAX_RADER = 200
/** Citattecken i e-post, mellanslag och >1 snabel-a är aldrig en adress vi vill skicka till. */
const EPOST_RE = /^[^\s@"<>(),;:\\]+@[^\s@"<>(),;:\\]+\.[^\s@"<>(),;:\\.]{2,}$/

// ---------------------------------------------------------------------------
// Avkodning
// ---------------------------------------------------------------------------

export type Teckenkodning = 'utf-8' | 'windows-1252'

/** UTF-8 (med/utan BOM) om byten är giltig UTF-8, annars Windows-1252. */
export function avkodaCsv(bytes: Uint8Array): { text: string; kodning: Teckenkodning } {
  try {
    const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes)
    return { text: text.replace(/^\uFEFF/, ''), kodning: 'utf-8' }
  } catch {
    return { text: new TextDecoder('windows-1252').decode(bytes).replace(/^\uFEFF/, ''), kodning: 'windows-1252' }
  }
}

// ---------------------------------------------------------------------------
// Tokenisering
// ---------------------------------------------------------------------------

export type Avgransare = ';' | ',' | '\t'

/** Räknar kandidater på första (icke-tomma) raden utanför citattecken. Semikolon vinner vid lika. */
export function hittaAvgransare(text: string): Avgransare {
  const antal: Record<Avgransare, number> = { ';': 0, ',': 0, '\t': 0 }
  let iCitat = false
  for (const tecken of text.replace(/^\uFEFF/, '')) {
    if (tecken === '"') iCitat = !iCitat
    else if (!iCitat && (tecken === '\n' || tecken === '\r')) {
      if (antal[';'] + antal[','] + antal['\t'] > 0) break
    } else if (!iCitat && tecken in antal) antal[tecken as Avgransare] += 1
  }
  if (antal[';'] >= antal[','] && antal[';'] >= antal['\t'] && antal[';'] > 0) return ';'
  if (antal['\t'] > antal[',']) return '\t'
  if (antal[','] > 0) return ','
  return ';'
}

export interface CsvRad { rad: number; falt: string[] }

/** Delar upp texten i rader och fält. `rad` är radens 1-baserade startrad i filen. */
export function tokeniseraCsv(text: string, avgransare: Avgransare): CsvRad[] {
  const rader: CsvRad[] = []
  let falt: string[] = []
  let nuvarande = ''
  let iCitat = false
  let startRad = 1
  let radNr = 1
  const src = text.replace(/^\uFEFF/, '')

  const avslutaRad = () => {
    falt.push(nuvarande)
    nuvarande = ''
    rader.push({ rad: startRad, falt })
    falt = []
  }

  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (iCitat) {
      if (c === '"') {
        if (src[i + 1] === '"') { nuvarande += '"'; i++ } else iCitat = false
      } else {
        if (c === '\n') radNr++
        nuvarande += c
      }
    } else if (c === '"' && nuvarande === '') {
      iCitat = true
    } else if (c === avgransare) {
      falt.push(nuvarande)
      nuvarande = ''
    } else if (c === '\r' || c === '\n') {
      if (c === '\r' && src[i + 1] === '\n') i++
      avslutaRad()
      radNr++
      startRad = radNr
    } else {
      nuvarande += c
    }
  }
  if (nuvarande !== '' || falt.length > 0) avslutaRad()
  return rader
}

// ---------------------------------------------------------------------------
// Rubriker
// ---------------------------------------------------------------------------

export type Kolumn = 'namn' | 'fornamn' | 'efternamn' | 'epost' | 'arende' | 'startdatum'

function normaliseraRubrik(s: string): string {
  return s.toLowerCase().replace(/^\uFEFF/, '').replace(/[\s\-_.:]/g, '')
}

const RUBRIKER: Record<string, Kolumn> = {
  namn: 'namn', name: 'namn', fulltnamn: 'namn', deltagare: 'namn', deltagarensnamn: 'namn',
  fornamn: 'fornamn', förnamn: 'fornamn', firstname: 'fornamn', givenname: 'fornamn',
  efternamn: 'efternamn', lastname: 'efternamn', surname: 'efternamn', familyname: 'efternamn',
  epost: 'epost', email: 'epost', mejl: 'epost', mail: 'epost', epostadress: 'epost', emailadress: 'epost', mejladress: 'epost',
  arendenummer: 'arende', ärendenummer: 'arende', arende: 'arende', ärende: 'arende', arendeid: 'arende', ärendeid: 'arende',
  arendenr: 'arende', ärendenr: 'arende', casenumber: 'arende', caseid: 'arende', diarienummer: 'arende',
  startdatum: 'startdatum', start: 'startdatum', startdate: 'startdatum', startar: 'startdatum', börjar: 'startdatum', borjar: 'startdatum',
  inskrivningsdatum: 'startdatum', inskrivendatum: 'startdatum',
}

export function tolkaRubrik(rubrik: string): Kolumn | null {
  return RUBRIKER[normaliseraRubrik(rubrik)] ?? null
}

// ---------------------------------------------------------------------------
// Fältvalidering
// ---------------------------------------------------------------------------

/** ÅÅÅÅ-MM-DD eller null. Dag först vid snedstreck/punkt. Verkligt datum krävs (31 feb nekas). */
export function tolkaDatum(text: string): string | null {
  const s = text.trim()
  let ar: number, man: number, dag: number
  let m: RegExpMatchArray | null
  if ((m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/)) || (m = s.match(/^(\d{4})(\d{2})(\d{2})$/))) {
    ar = +m[1]; man = +m[2]; dag = +m[3]
  } else if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/))) {
    dag = +m[1]; man = +m[2]; ar = +m[3]
  } else return null
  if (ar < 1900 || ar > 2100 || man < 1 || man > 12 || dag < 1) return null
  if (dag > new Date(Date.UTC(ar, man, 0)).getUTCDate()) return null
  return `${ar}-${String(man).padStart(2, '0')}-${String(dag).padStart(2, '0')}`
}

export function arGiltigEpost(epost: string): boolean {
  return epost.length <= 254 && EPOST_RE.test(epost) && !epost.includes('..')
}

/** "Anna Maria Svensson" → förnamn "Anna Maria", efternamn "Svensson". "Svensson, Anna" → Anna / Svensson. */
export function delaNamn(namn: string): { fornamn: string; efternamn: string } {
  const n = namn.trim().replace(/\s+/g, ' ')
  if (n === '') return { fornamn: '', efternamn: '' }
  if (n.includes(',')) {
    const [efter, ...fore] = n.split(',')
    return { fornamn: fore.join(',').trim(), efternamn: efter.trim() }
  }
  const delar = n.split(' ')
  if (delar.length === 1) return { fornamn: delar[0], efternamn: '' }
  return { fornamn: delar.slice(0, -1).join(' '), efternamn: delar[delar.length - 1] }
}

// ---------------------------------------------------------------------------
// Hela granskningen
// ---------------------------------------------------------------------------

export type RadStatus = 'ok' | 'fel' | 'dubblett' | 'redan_kopplad' | 'redan_inbjuden'

export interface GranskadRad {
  /** Radens nummer i filen (rubrikraden är rad 1). */
  rad: number
  fornamn: string
  efternamn: string
  epost: string
  arendenummer: string | null
  startdatum: string | null
  status: RadStatus
  /** Förklaring i ord när status inte är 'ok' — färg ensam bär ingenting. */
  orsak: string | null
}

export type Granskning =
  | { ok: false; fel: string }
  | { ok: true; rader: GranskadRad[]; avgransare: Avgransare; kolumner: Kolumn[]; ignoreradeRubriker: string[] }

const AVGRANSARNAMN: Record<Avgransare, string> = { ';': 'semikolon', ',': 'komma', '\t': 'tabb' }
export function avgransarnamn(a: Avgransare): string { return AVGRANSARNAMN[a] }

export function granskaDeltagarlista(text: string): Granskning {
  const avgransare = hittaAvgransare(text)
  const alla = tokeniseraCsv(text, avgransare).filter((r) => r.falt.some((f) => f.trim() !== ''))
  if (alla.length === 0) return { ok: false, fel: 'Filen är tom.' }

  const [rubrikrad, ...data] = alla
  const kolumnPos = new Map<Kolumn, number>()
  const ignorerade: string[] = []
  rubrikrad.falt.forEach((r, i) => {
    const k = tolkaRubrik(r)
    if (k && !kolumnPos.has(k)) kolumnPos.set(k, i)
    else if (r.trim() !== '') ignorerade.push(r.trim())
  })
  if (!kolumnPos.has('epost')) {
    return {
      ok: false,
      fel: 'Första raden måste vara rubriker, och en av dem måste vara E-post. ' +
        `Hittade: ${rubrikrad.falt.map((f) => f.trim()).filter(Boolean).join(', ') || 'inga rubriker'}.`,
    }
  }
  if (data.length === 0) return { ok: false, fel: 'Filen har rubriker men inga deltagare.' }
  if (data.length > MAX_RADER) {
    return {
      ok: false,
      fel: `Filen har ${data.length} rader. Högst ${MAX_RADER} åt gången — dela upp den i flera filer. Inget har lästs in.`,
    }
  }

  const hamta = (r: CsvRad, k: Kolumn) => {
    const i = kolumnPos.get(k)
    return i === undefined ? '' : (r.falt[i] ?? '').trim()
  }

  const sedda = new Map<string, number>()
  const rader: GranskadRad[] = data.map((r) => {
    let fornamn = hamta(r, 'fornamn')
    let efternamn = hamta(r, 'efternamn')
    if (kolumnPos.has('namn') && fornamn === '' && efternamn === '') {
      ;({ fornamn, efternamn } = delaNamn(hamta(r, 'namn')))
    }
    const epost = hamta(r, 'epost').toLowerCase()
    const arendeRå = hamta(r, 'arende')
    const datumRå = hamta(r, 'startdatum')

    const fel: string[] = []
    if (epost === '') fel.push('E-post saknas')
    else if (!arGiltigEpost(epost)) fel.push('E-postadressen ser inte ut som en adress')

    let arendenummer: string | null = null
    if (arendeRå !== '') {
      const v = valideraArendenummer(arendeRå)
      if (v.ok) arendenummer = v.varde
      else fel.push(`Ärendenummer: ${v.fel}`)
    }
    let startdatum: string | null = null
    if (datumRå !== '') {
      startdatum = tolkaDatum(datumRå)
      if (!startdatum) fel.push(`Startdatum "${datumRå}" går inte att tolka — skriv ÅÅÅÅ-MM-DD`)
    }

    const bas = { rad: r.rad, fornamn, efternamn, epost, arendenummer, startdatum }
    if (fel.length > 0) return { ...bas, status: 'fel' as const, orsak: fel.join('. ') + '.' }

    const tidigare = sedda.get(epost)
    if (tidigare !== undefined) {
      return { ...bas, status: 'dubblett' as const, orsak: `Samma e-post som rad ${tidigare} i filen — hoppas över.` }
    }
    sedda.set(epost, r.rad)
    return { ...bas, status: 'ok' as const, orsak: null }
  })

  return { ok: true, rader, avgransare, kolumner: [...kolumnPos.keys()], ignoreradeRubriker: ignorerade }
}

/** Efter kontroll mot databasen: markera rader vars adress redan är kopplad eller inbjuden. */
export function markeraBefintliga(
  rader: GranskadRad[],
  kopplade: ReadonlySet<string>,
  inbjudna: ReadonlySet<string>,
): GranskadRad[] {
  return rader.map((r) => {
    if (r.status !== 'ok') return r
    if (kopplade.has(r.epost)) {
      return { ...r, status: 'redan_kopplad', orsak: 'Redan kopplad till dig — hoppas över.' }
    }
    if (inbjudna.has(r.epost)) {
      return { ...r, status: 'redan_inbjuden', orsak: 'Har redan en inbjudan som inte gått ut — hoppas över.' }
    }
    return r
  })
}

export function raknaStatus(rader: GranskadRad[]): Record<RadStatus, number> {
  const t: Record<RadStatus, number> = { ok: 0, fel: 0, dubblett: 0, redan_kopplad: 0, redan_inbjuden: 0 }
  for (const r of rader) t[r.status] += 1
  return t
}

// ---------------------------------------------------------------------------
// Resultatfil
// ---------------------------------------------------------------------------

export type UtfallTyp = 'skickad' | 'sparad_utan_mejl' | 'fel' | 'ej_skickad'

export interface Utfall { rad: number; epost: string; utfall: UtfallTyp; meddelande: string }

function csvFalt(v: string): string {
  // Skydd mot formelinjektion när filen öppnas i Excel: text som börjar med =,+,-,@ får ett ' framför.
  const s = /^[=+\-@]/.test(v) ? `'${v}` : v
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Semikolonavgränsad, UTF-8 med BOM — öppnas rätt i svensk Excel. */
export function utfallTillCsv(utfall: Utfall[]): string {
  const rubrik = ['Rad', 'E-post', 'Utfall', 'Meddelande']
  const etikett: Record<UtfallTyp, string> = {
    skickad: 'Inbjudan skickad',
    sparad_utan_mejl: 'Sparad men mejlet uteblev',
    fel: 'Misslyckades',
    ej_skickad: 'Ej skickad',
  }
  const rader = utfall.map((u) => [String(u.rad), u.epost, etikett[u.utfall], u.meddelande].map(csvFalt).join(';'))
  return '\uFEFF' + [rubrik.join(';'), ...rader].join('\r\n') + '\r\n'
}
