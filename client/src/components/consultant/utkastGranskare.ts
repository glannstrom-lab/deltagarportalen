/**
 * utkastGranskare — AIX13. Ett deterministiskt lager under konsulentens AI-utkast.
 *
 * Kontrollerar varje mening i ett utkast mot det underlag utkastet byggdes på:
 *   1. datum    — finns datumet (eller dag+månad) i underlaget?
 *   2. tal      — finns siffran/procenten/klockslaget i underlaget?
 *   3. värdeomdömen — ord som bedömer personen i stället för att beskriva (KSL21:s
 *      linje: leverantören registrerar fakta, "giltig/ogiltig" avgör Arbetsförmedlingen)
 *   4. hälsoord — uppgifter som hör till GDPR art. 9 och sällan ska stå i en rapport
 *
 * Ren funktion, ingen AI, inget nätverk. Det den kan lova är smalt och står i
 * KONTROLLTEXT: utkastet är *kontrollerat mot underlaget, inte mot sanningen*. Ett tal
 * som finns i underlaget kan vara fel tal; en mening utan flagga kan ändå vara
 * missvisande. Granskaren fångar det som går att fånga med regler — inget mer.
 *
 * Kända gränser (medvetna): talord utom "två"–"tolv" före en enhet kontrolleras inte;
 * ett tal som råkar finnas någon annanstans i underlaget (t.ex. periodens "30 dagar")
 * godkänns även om utkastet använder det om något annat; månadsnamn utan dag
 * ("i oktober") kontrolleras inte.
 *
 * Konsulentvyn översätts inte (DESIGN.md §2) — svenska literaler.
 */

export type ProblemTyp = 'datum' | 'tal' | 'varderingsord' | 'halsoord'

export interface Problem {
  typ: ProblemTyp
  /** Det som flaggades, ordagrant ur meningen. */
  text: string
  /** Kort förklaring till konsulenten. */
  forklaring: string
}

export interface GranskadMening {
  text: string
  problem: Problem[]
}

export interface Granskning {
  meningar: GranskadMening[]
  /** Antal meningar med minst ett problem. */
  antalFlaggade: number
  /** Antal problem totalt. */
  antalProblem: number
  /** true = ingenting flaggades. Betyder INTE att utkastet är sant. */
  ren: boolean
}

export const KONTROLLTEXT =
  'Kontrollerad mot underlaget, inte mot sanningen. Granskningen jämför datum och tal med det AI:n fick och letar efter värderande och hälsorelaterade ord. Den kan inte avgöra om något är riktigt eller fullständigt — läs igenom utkastet själv.'

// ── Ordlistor ────────────────────────────────────────────────────────────────
// Varje post är ett regexuttryck (utan flaggor) som matchas på ordstart; \p{L}* tar böjningar.
// Ordgränser görs med \p{L}-lookarounds — \b fungerar inte med å/ä/ö.

/**
 * Värdeomdömen: ord som bedömer personen. Första raden är KSL21 — leverantören
 * bedömer inte om ett skäl är giltigt, det gör Arbetsförmedlingen (IAF 2024:12).
 */
const VARDERINGSORD: readonly string[] = [
  // KSL21
  'o?giltig\\p{L}*', 'godtagbar\\p{L}*', 'o?trovärdig\\p{L}*', 'oursäktad\\p{L}*', 'skolk\\p{L}*',
  // inställning och motivation
  'o?motiverad\\p{L}*', 'o?engagerad\\p{L}*', 'o?intresserad\\p{L}*', 'ointresse\\p{L}*', 'ovillig\\p{L}*', 'ovilja',
  'attityd\\p{L}*', 'trotsig\\p{L}*', 'tjurig\\p{L}*', 'lat', 'lata', 'lathet', 'slö\\p{L}*', 'slarvig\\p{L}*', 'försumlig\\p{L}*',
  // person
  'o?pålitlig\\p{L}*', 'o?trevlig\\p{L}*', 'arrogant\\p{L}*', 'svårhanterlig\\p{L}*', 'jobbig\\p{L}*', 'problematisk\\p{L}*',
  'hopplös\\p{L}*', 'misslyckad\\p{L}*', 'misslyckades', 'misslyckande\\p{L}*',
  // beröm och kritik
  'duktig\\p{L}*', 'imponerande', 'fantastisk\\p{L}*', 'utmärkt', 'exemplarisk\\p{L}*', 'lovande', 'framgångsrik\\p{L}*',
  'dålig\\p{L}*', 'bristande', 'bristfällig\\p{L}*', 'svag(?:a|t)?',
  // värderande stämning
  'tyvärr', 'dessvärre', 'glädjande', 'oroande', 'alarmerande', 'bekymmersam\\p{L}*',
]

/** Hälsoord: GDPR art. 9. Ska de med i en rapport är det ett aktivt val, inte ett AI-infall. */
const HALSOORD: readonly string[] = [
  'diagnos\\p{L}*', 'sjuk\\p{L}*', 'ohälsa\\p{L}*', 'hälsotillstånd\\p{L}*', 'funktionsnedsättning\\p{L}*', 'handikapp\\p{L}*',
  'depression\\p{L}*', 'deprimerad\\p{L}*', 'ångest\\p{L}*', 'panik\\p{L}*', 'utbränd\\p{L}*', 'utmattning\\p{L}*',
  'bipolär\\p{L}*', 'schizofreni\\p{L}*', 'psykos\\p{L}*', 'psykisk\\p{L}*', 'psykiatri\\p{L}*', 'psykiatrisk\\p{L}*', 'adhd', 'add', 'autism\\p{L}*',
  'autistisk\\p{L}*', 'npf', 'neuropsykiatrisk\\p{L}*', 'ptsd', 'trauma\\p{L}*', 'dyslexi\\p{L}*', 'epilepsi\\p{L}*', 'diabetes',
  'cancer', 'smärt\\p{L}*', 'värk', 'sömnproblem\\p{L}*', 'självmord\\p{L}*', 'suicid\\p{L}*', 'självskad\\p{L}*',
  'missbruk\\p{L}*', 'beroendeproblem\\p{L}*', 'beroendesjukdom\\p{L}*', 'beroendevård\\p{L}*','alkohol\\p{L}*', 'narkotika\\p{L}*', 'droger', 'medicin\\p{L}*', 'läkemedel\\p{L}*',
  'läkare\\p{L}*', 'läkarintyg\\p{L}*', 'vårdcentral\\p{L}*', 'rehab\\p{L}*', 'terapi\\p{L}*', 'terapeut\\p{L}*', 'kurator\\p{L}*',
  'mår\\s+(?:dåligt|sämre|bättre|bra)',
]

const LB = '(?<![\\p{L}\\p{N}])'
const RB = '(?![\\p{L}\\p{N}])'
const ordRegex = (lista: readonly string[]) => new RegExp(`${LB}(?:${lista.join('|')})${RB}`, 'giu')

const VARDE_RE = ordRegex(VARDERINGSORD)
const HALSO_RE = ordRegex(HALSOORD)

function traffar(re: RegExp, text: string): string[] {
  re.lastIndex = 0
  return [...text.matchAll(re)].map((m) => m[0])
}

/** Hälsoord i en text — används också före ett AI-anrop (AIX11: varna innan stolparna lämnar portalen). */
export function hittaHalsoord(text: string): string[] {
  return [...new Set(traffar(HALSO_RE, text).map((o) => o.toLowerCase()))]
}

/** Värdeomdömen i en text. */
export function hittaVarderingsord(text: string): string[] {
  return [...new Set(traffar(VARDE_RE, text).map((o) => o.toLowerCase()))]
}

// ── Datum ────────────────────────────────────────────────────────────────────

const MANADER: Record<string, number> = {
  januari: 1, jan: 1, februari: 2, feb: 2, mars: 3, mar: 3, april: 4, apr: 4, maj: 5, juni: 6, jun: 6, juli: 7, jul: 7,
  augusti: 8, aug: 8, september: 9, sep: 9, sept: 9, oktober: 10, okt: 10, november: 11, nov: 11, december: 12, dec: 12,
}
const MANADSNAMN = Object.keys(MANADER).sort((a, b) => b.length - a.length).join('|')

interface Datum { ar: number | null; man: number; dag: number; start: number; slut: number; text: string }

function arGiltigDag(man: number, dag: number): boolean {
  return man >= 1 && man <= 12 && dag >= 1 && dag <= 31
}

function helAr(s: string | undefined): number | null {
  if (!s) return null
  const n = Number(s)
  return s.length === 2 ? 2000 + n : n
}

/** Alla datum i en text, med läge — så att deras siffror kan strykas ur talkontrollen. */
function hittaDatum(text: string): Datum[] {
  const ut: Datum[] = []
  const lagg = (m: RegExpMatchArray, ar: number | null, man: number, dag: number) => {
    if (!arGiltigDag(man, dag)) return
    const start = m.index ?? 0
    ut.push({ ar, man, dag, start, slut: start + m[0].length, text: m[0] })
  }
  // 2026-10-30
  for (const m of text.matchAll(/(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/g)) lagg(m, Number(m[1]), Number(m[2]), Number(m[3]))
  // 30 oktober (2026)
  const sv = new RegExp(`(?<!\\d)(\\d{1,2})\\s+(${MANADSNAMN})(?:\\.(?=\\s+\\d{4}))?(?:\\s+(\\d{4}))?(?![\\p{L}\\d])`, 'giu')
  for (const m of text.matchAll(sv)) lagg(m, m[3] ? Number(m[3]) : null, MANADER[m[2].toLowerCase()], Number(m[1]))
  // 30/10 eller 30/10/2026 — dag/månad
  for (const m of text.matchAll(/(?<![\d/])(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?![\d/])/g)) lagg(m, helAr(m[3]), Number(m[2]), Number(m[1]))
  // 30.10.2026 — endast med årtal, så att decimaltal (1.5) inte tas för datum
  for (const m of text.matchAll(/(?<![\d.])(\d{1,2})\.(\d{1,2})\.(\d{4})(?!\d|\.\d)/g)) lagg(m, Number(m[3]), Number(m[2]), Number(m[1]))
  // Överlappande träffar (t.ex. "2026-10-30" kan inte också bli något annat): behåll första.
  ut.sort((a, b) => a.start - b.start)
  const rena: Datum[] = []
  for (const d of ut) if (!rena.length || d.start >= rena[rena.length - 1].slut) rena.push(d)
  return rena
}

function ersattMedMellanslag(text: string, spann: Array<{ start: number; slut: number }>): string {
  let ut = text
  for (const s of [...spann].sort((a, b) => b.start - a.start)) ut = ut.slice(0, s.start) + ' '.repeat(s.slut - s.start) + ut.slice(s.slut)
  return ut
}

// ── Tal ──────────────────────────────────────────────────────────────────────

const TALORD: Record<string, string> = { två: '2', tre: '3', fyra: '4', fem: '5', sex: '6', sju: '7', åtta: '8', nio: '9', tio: '10', elva: '11', tolv: '12' }
const ENHETER = 'gånger|gång|samtal|möten|möte|veckor|vecka|dagar|dag|pass|timmar|timme|ansökningar|ansökan|besök|kontakter|kontakt|mål|anteckningar|månader|månad'
const TALORD_RE = new RegExp(`${LB}(${Object.keys(TALORD).join('|')})\\s+(?:${ENHETER})${RB}`, 'giu')

interface Underlag {
  dm: Set<string>        // "ÅÅÅÅ-MM-DD"
  md: Set<string>        // "MM-DD"
  ar: Set<string>        // årtal som förekommer i något datum
  tal: Set<string>       // normaliserade tal
  tider: Set<string>     // "HH:MM"
  text: string           // gemener, för talord
}

const p2 = (n: number) => String(n).padStart(2, '0')

function normaliseraTal(s: string): string {
  const n = s.replace(',', '.').replace(/^0+(?=\d)/, '')
  return n.includes('.') ? n.replace(/0+$/, '').replace(/\.$/, '') : n
}

/** Tider (14:05) och tal (inte i datum) ur en text, plus datumnycklar. */
function plockaFakta(text: string): Underlag {
  const datum = hittaDatum(text)
  const u: Underlag = { dm: new Set(), md: new Set(), ar: new Set(), tal: new Set(), tider: new Set(), text: text.toLowerCase() }
  for (const d of datum) {
    u.md.add(`${p2(d.man)}-${p2(d.dag)}`)
    if (d.ar) { u.dm.add(`${d.ar}-${p2(d.man)}-${p2(d.dag)}`); u.ar.add(String(d.ar)) }
  }
  const utanDatum = ersattMedMellanslag(text, datum)
  for (const m of utanDatum.matchAll(/(?<!\d)(\d{1,2}):(\d{2})(?!\d)/g)) u.tider.add(`${p2(Number(m[1]))}:${m[2]}`)
  const utanTider = utanDatum.replace(/(?<!\d)\d{1,2}:\d{2}(?!\d)/g, ' ')
  for (const m of utanTider.matchAll(/\d+(?:[.,]\d+)?/g)) u.tal.add(normaliseraTal(m[0]))
  return u
}

// ── Meningar ─────────────────────────────────────────────────────────────────

/** Delar ett utkast i meningar. Rader är alltid egna meningar (rubriker, punktlistor). */
export function delaIMeningar(utkast: string): string[] {
  const ut: string[] = []
  for (const rad of utkast.split(/\r?\n/)) {
    const r = rad.trim()
    if (!r) continue
    // "1. Sammanfattning": listnumret är ingen mening — slå ihop det med det som följer.
    let hangande = ''
    for (const del of r.split(/(?<=[.!?])\s+(?=[\p{Lu}\d[(\-*])/u)) {
      const d = `${hangande}${del.trim()}`.trim()
      hangande = ''
      if (/^\d{1,2}[.)]$/.test(d)) { hangande = `${d} `; continue }
      if (d) ut.push(d)
    }
    if (hangande.trim()) ut.push(hangande.trim())
  }
  return ut
}

/** Markdown och listmarkörer bort — de ska varken granskas eller räknas som tal. */
function rensaMeningen(m: string): string {
  return m.replace(/^\s*(?:[-*•]\s+|\d{1,2}[.)]\s+)/, '').replace(/[*_`#]/g, '')
}

const DATUM_FORKLARING = 'Datumet finns inte i underlaget.'
const TAL_FORKLARING = 'Talet finns inte i underlaget.'

function granskaMening(mening: string, u: Underlag): Problem[] {
  const text = rensaMeningen(mening)
  const problem: Problem[] = []

  const datum = hittaDatum(text)
  for (const d of datum) {
    const nyckelMd = `${p2(d.man)}-${p2(d.dag)}`
    const ok = d.ar ? u.dm.has(`${d.ar}-${nyckelMd}`) : u.md.has(nyckelMd)
    if (!ok) problem.push({ typ: 'datum', text: d.text, forklaring: DATUM_FORKLARING })
  }

  const utanDatum = ersattMedMellanslag(text, datum)

  // Klockslag
  for (const m of utanDatum.matchAll(/(?<!\d)(\d{1,2}):(\d{2})(?!\d)/g)) {
    if (!u.tider.has(`${p2(Number(m[1]))}:${m[2]}`)) problem.push({ typ: 'tal', text: m[0], forklaring: 'Klockslaget finns inte i underlaget.' })
  }
  const utanTider = utanDatum.replace(/(?<!\d)\d{1,2}:\d{2}(?!\d)/g, ' ')

  // Siffror
  for (const m of utanTider.matchAll(/\d+(?:[.,]\d+)?/g)) {
    const n = normaliseraTal(m[0])
    if (u.tal.has(n)) continue
    if (/^(19|20)\d{2}$/.test(m[0]) && u.ar.has(m[0])) continue // ett årtal som står i något datum i underlaget
    problem.push({ typ: 'tal', text: m[0], forklaring: TAL_FORKLARING })
  }

  // Talord före enhet ("tre samtal")
  TALORD_RE.lastIndex = 0
  for (const m of text.matchAll(TALORD_RE)) {
    const ord = m[1].toLowerCase()
    if (u.tal.has(TALORD[ord]) || new RegExp(`${LB}${ord}${RB}`, 'iu').test(u.text)) continue
    problem.push({ typ: 'tal', text: m[0], forklaring: TAL_FORKLARING })
  }

  for (const ord of traffar(VARDE_RE, text)) {
    problem.push({ typ: 'varderingsord', text: ord, forklaring: 'Värderande ord. Beskriv vad som hände i stället för att bedöma personen.' })
  }
  for (const ord of traffar(HALSO_RE, text)) {
    problem.push({ typ: 'halsoord', text: ord, forklaring: 'Hälsorelaterat ord (särskild kategori av personuppgifter). Ska det verkligen stå med?' })
  }
  return problem
}

/**
 * Granskar ett utkast mot underlaget. `underlag` är all text utkastet fick bygga på
 * (journalrader, målrader, periodetikett …) — hela strängen/strängarna AI:n fick.
 */
export function granskaUtkast(utkast: string, underlag: string | readonly string[]): Granskning {
  const u = plockaFakta(Array.isArray(underlag) ? underlag.join('\n') : (underlag as string))
  const meningar = delaIMeningar(utkast).map((text) => ({ text, problem: granskaMening(text, u) }))
  const antalFlaggade = meningar.filter((m) => m.problem.length > 0).length
  const antalProblem = meningar.reduce((s, m) => s + m.problem.length, 0)
  return { meningar, antalFlaggade, antalProblem, ren: antalProblem === 0 }
}
