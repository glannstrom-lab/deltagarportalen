/**
 * aktivitetSchema — ren logik för schemamallar, pass, veckosaldo och
 * veckomål enligt aktivitetskravet (SoL 12 kap. 4 a–6 a §§, KM3/KM4/KM6).
 *
 * Inga anrop hit rör databasen; allt går att testa utan mockar. Datum är
 * alltid `YYYY-MM-DD`-strängar i lokal tid — ALDRIG `toISOString()`, som
 * flyttar ett kvällsdatum till nästa dag i UTC (samma fälla som
 * `generateRecurringEvents()` i calendarData.ts, som dessutom bara kan ge
 * EN veckodag per vecka: efter första träffen hoppar den sju dagar).
 *
 * Aktivitetstyperna är lagens fyra (12 kap. 6 a §) plus `jobsearch_own`,
 * eget jobbsökande, som ska ha tid i planen men INTE räknas som anvisad
 * aktivitet (Kunskapsguiden, FAQ om aktivitetskravet).
 */

export type ActivityType = 'motivation' | 'language' | 'jobsearch' | 'workplace' | 'jobsearch_own'

export type Attendance = 'present' | 'absent_valid' | 'absent_invalid' | 'sick_certified' | 'external'

/** Lagens tak. 40 h/vecka; −10 h när barn under 8 år finns i hushållet. */
export const MAX_VECKOTIMMAR = 40
export const BARNAVDRAG_TIMMAR = 10

export const AKTIVITETSTYPER: readonly ActivityType[] = ['motivation', 'language', 'jobsearch', 'workplace', 'jobsearch_own'] as const

/** Typer som räknas som anvisad aktivitet enligt lagen. */
export const ANVISADE_TYPER: ReadonlySet<ActivityType> = new Set<ActivityType>(['motivation', 'language', 'jobsearch', 'workplace'])

export interface TemplateItem {
  /** ISO-veckodag: 1 = måndag … 7 = söndag */
  weekday: number
  /** `HH:MM` */
  start_time: string
  end_time: string
  title: string
  activity_type: ActivityType
  location?: string | null
  notes?: string | null
}

export interface GeneratedSession {
  date: string
  start_time: string
  end_time: string
  title: string
  activity_type: ActivityType
  location: string | null
  notes: string | null
}

export interface SessionLike {
  date: string
  start_time: string
  end_time: string
  activity_type: ActivityType
  attendance: Attendance | null
}

// ---------------------------------------------------------------------------
// Datum och tid — lokal tid, aldrig UTC
// ---------------------------------------------------------------------------

export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(s: string, n: number): string {
  const d = parseLocalDate(s)
  d.setDate(d.getDate() + n)
  return formatLocalDate(d)
}

/** ISO-veckodag 1–7 för ett `YYYY-MM-DD`. */
export function isoWeekday(s: string): number {
  const js = parseLocalDate(s).getDay() // 0 = söndag
  return js === 0 ? 7 : js
}

/** Måndagen i veckan som innehåller datumet. */
export function veckansMandag(s: string): string {
  return addDays(s, 1 - isoWeekday(s))
}

/** Minuter mellan två `HH:MM`. Negativt om end < start — anroparen validerar. */
export function minuterMellan(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return eh * 60 + em - (sh * 60 + sm)
}

export function timmar(start: string, end: string): number {
  return Math.round((minuterMellan(start, end) / 60) * 10) / 10
}

// ---------------------------------------------------------------------------
// Veckomål
// ---------------------------------------------------------------------------

export interface VeckomalIndata {
  barnUnder8: boolean
  /** Timmar per vecka i deltidsarbete, 0 om inget. */
  deltidTimmar?: number
}

/**
 * Föreslaget veckomål enligt lagen: 40 h, −10 h vid barn under 8, minus
 * deltidsarbetets timmar (kravet är proportionellt). Aldrig under 0.
 * Konsulenten får alltid sätta ett lägre tal med motivering — det här är
 * förslaget, inte beslutet.
 */
export function foreslagetVeckomal({ barnUnder8, deltidTimmar = 0 }: VeckomalIndata): number {
  let mal = MAX_VECKOTIMMAR
  if (barnUnder8) mal -= BARNAVDRAG_TIMMAR
  mal -= Math.max(0, deltidTimmar)
  return Math.max(0, mal)
}

// ---------------------------------------------------------------------------
// Mallens timmar
// ---------------------------------------------------------------------------

export function mallensVeckotimmar(items: readonly TemplateItem[]): number {
  return Math.round(items.reduce((sum, it) => sum + minuterMellan(it.start_time, it.end_time), 0) / 60 * 10) / 10
}

export function validateTemplateItem(it: TemplateItem): string | null {
  if (!Number.isInteger(it.weekday) || it.weekday < 1 || it.weekday > 7) return 'Veckodagen måste vara 1–7'
  if (!/^\d{2}:\d{2}$/.test(it.start_time) || !/^\d{2}:\d{2}$/.test(it.end_time)) return 'Tiden ska skrivas HH:MM'
  if (minuterMellan(it.start_time, it.end_time) <= 0) return 'Sluttiden måste vara efter starttiden'
  if (!it.title.trim()) return 'Passet behöver en rubrik'
  if (!AKTIVITETSTYPER.includes(it.activity_type)) return 'Okänd aktivitetstyp'
  return null
}

// ---------------------------------------------------------------------------
// Generering — ett pass per rad, alla veckodagar, lokal tid
// ---------------------------------------------------------------------------

/**
 * Genererar pass från `startDate` till och med `endDate` (inklusive) för
 * varje mallrad vars veckodag infaller. Startar man en onsdag genereras
 * onsdag–söndag första veckan. Raderna sorteras på datum, sedan starttid.
 */
export function generateSessions(
  items: readonly TemplateItem[],
  startDate: string,
  endDate: string,
): GeneratedSession[] {
  if (parseLocalDate(endDate) < parseLocalDate(startDate)) return []
  const byWeekday = new Map<number, TemplateItem[]>()
  for (const it of items) {
    const list = byWeekday.get(it.weekday) ?? []
    list.push(it)
    byWeekday.set(it.weekday, list)
  }
  const out: GeneratedSession[] = []
  let cursor = startDate
  const end = parseLocalDate(endDate).getTime()
  while (parseLocalDate(cursor).getTime() <= end) {
    const todays = byWeekday.get(isoWeekday(cursor))
    if (todays) {
      for (const it of [...todays].sort((a, b) => a.start_time.localeCompare(b.start_time))) {
        out.push({
          date: cursor,
          start_time: it.start_time,
          end_time: it.end_time,
          title: it.title,
          activity_type: it.activity_type,
          location: it.location ?? null,
          notes: it.notes ?? null,
        })
      }
    }
    cursor = addDays(cursor, 1)
  }
  return out
}

// ---------------------------------------------------------------------------
// Veckosaldo (KM6)
// ---------------------------------------------------------------------------

export interface Veckosaldo {
  /** Måndag i veckan, `YYYY-MM-DD` */
  vecka: string
  /** Timmar i anvisad aktivitet som är planerade (alla pass utom jobsearch_own) */
  planeradeTimmar: number
  /** Timmar där närvaro är `present` eller `external` */
  narvaroTimmar: number
  /** Timmar eget jobbsökande planerade */
  jobbsokTimmar: number
  antalPass: number
  antalOmarkerade: number
  antalOgiltigFranvaro: number
  antalGiltigFranvaro: number
  antalSjuk: number
}

/** Räknar veckosaldo för veckan som innehåller `datum`. */
export function veckosaldo(sessions: readonly SessionLike[], datum: string): Veckosaldo {
  const mandag = veckansMandag(datum)
  const sondag = addDays(mandag, 6)
  const inWeek = sessions.filter((s) => s.date >= mandag && s.date <= sondag)
  let planerade = 0
  let narvaro = 0
  let jobbsok = 0
  let omark = 0
  let ogiltig = 0
  let giltig = 0
  let sjuk = 0
  for (const s of inWeek) {
    const min = minuterMellan(s.start_time, s.end_time)
    if (s.activity_type === 'jobsearch_own') {
      jobbsok += min
      continue
    }
    planerade += min
    if (s.attendance === null) omark += 1
    else if (s.attendance === 'present' || s.attendance === 'external') narvaro += min
    else if (s.attendance === 'absent_invalid') ogiltig += 1
    else if (s.attendance === 'absent_valid') giltig += 1
    else if (s.attendance === 'sick_certified') sjuk += 1
  }
  const h = (m: number) => Math.round((m / 60) * 10) / 10
  return {
    vecka: mandag,
    planeradeTimmar: h(planerade),
    narvaroTimmar: h(narvaro),
    jobbsokTimmar: h(jobbsok),
    antalPass: inWeek.filter((s) => s.activity_type !== 'jobsearch_own').length,
    antalOmarkerade: omark,
    antalOgiltigFranvaro: ogiltig,
    antalGiltigFranvaro: giltig,
    antalSjuk: sjuk,
  }
}

export type Ampel = 'inga_pass' | 'under_mal' | 'pa_mal' | 'ogiltig_franvaro'

/**
 * Ampel för veckan mot veckomålet. `inga_pass` när inget är planerat —
 * visas som `—`, aldrig som 0 %. Ogiltig frånvaro vinner över allt annat.
 */
export function veckoampel(saldo: Veckosaldo, veckomal: number): Ampel {
  if (saldo.antalPass === 0) return 'inga_pass'
  if (saldo.antalOgiltigFranvaro > 0) return 'ogiltig_franvaro'
  if (saldo.planeradeTimmar + 0.05 >= veckomal) return 'pa_mal'
  return 'under_mal'
}
