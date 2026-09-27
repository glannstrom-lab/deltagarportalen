/**
 * aktivitetSchema — ren logik för schemamallar, pass, veckosaldo och
 * veckomål enligt aktivitetskravet (SoL 12 kap. 4 a–6 a §§, KM3/KM4/KM6).
 *
 * Inga anrop hit rör databasen; allt går att testa utan mockar. Datum är
 * alltid `YYYY-MM-DD`-strängar i lokal tid — ALDRIG `toISOString()`, som
 * flyttar ett kvällsdatum till nästa dag i UTC (samma fälla som
 * `generateRecurringEvents()` i calendarData.ts, som dessutom bara kunde ge
 * EN veckodag per vecka: efter första träffen hoppade den sju dagar. Den hade
 * noll anropare och togs bort 2026-09-22).
 *
 * Aktivitetstyperna är lagens fyra (12 kap. 6 a §) plus `jobsearch_own`,
 * eget jobbsökande, som ska ha tid i planen men INTE räknas som anvisad
 * aktivitet (Kunskapsguiden, FAQ om aktivitetskravet).
 */

export type ActivityType = 'motivation' | 'language' | 'jobsearch' | 'workplace' | 'jobsearch_own' | 'sfi' | 'studier' | 'vagledning' | 'halsa'

export type Attendance = 'present' | 'absent_valid' | 'absent_invalid' | 'sick_certified' | 'external'

/** Lagens tak. 40 h/vecka; −10 h när barn under 8 år finns i hushållet. */
export const MAX_VECKOTIMMAR = 40
export const BARNAVDRAG_TIMMAR = 10

/** De fem ursprungliga typerna, i väljarens ordning — de utökade läggs till av `valbaraPasstyper`. */
export const AKTIVITETSTYPER: readonly ActivityType[] = ['motivation', 'language', 'jobsearch', 'workplace', 'jobsearch_own'] as const

/**
 * RK28 (rollspelet 2026-09-27): fler passtyper — SFI, studier, vägledning och
 * hälsa. PÅSLAGNA 2026-09-27: CHECK-villkoret vidgades av
 * `supabase/migrations/20260927c_fler_passtyper.sql`, `ActivityType` omfattar
 * dem, och läsvyerna har etiketter (stegen nedan är gjorda).
 *
 * Så slås de på, i ordning:
 *   1. Kör PENDING-migrationen (döp om den), `npm run schema:refresh`.
 *   2. Sätt `UTOKADE_AKTIVITETSTYPER_PA = true` — då visas de i "Lägg till pass".
 *   3. Vidga `ActivityType` till `PassTyp` och ge typerna etiketter i
 *      läsvyerna som har egna `Record<ActivityType, …>`: MinVecka.tsx,
 *      narvaroIntygPdf.ts, underlagspaketPdf.ts, aktivitetsplanPdf.ts. Typkollen
 *      pekar ut dem. (De ägdes av andra spår när det här skrevs.)
 *
 * Hur de räknas:
 *   · Alla fyra är anvisade (`arAnvisad`) — planen kan kräva dem, och
 *     veckosaldot räknar dem mot den anvisade delen av veckomålet.
 *     SFI hör till lagens p. 2 (språk); studier, vägledning och hälsa till p. 1
 *     (motivera eller öka förmågan att ta arbete eller påbörja utbildning).
 *   · SFI och studier hålls av skolan, inte av verksamheten. De räknas därför
 *     INTE i avtalsloggen mot Rusta och matcha (FFU räknar aktiviteter
 *     leverantören håller i) — se `arVerksamhetsledd`. Vägledning och hälsa
 *     räknas där när verksamheten håller i dem, som övriga anvisade pass.
 *   · Fysisk-härledningen (`arFysiskt` i aktivitetslogg.ts) är oförändrad:
 *     ifylld plats = fysiskt. Den tillämpas bara på verksamhetsledda pass.
 */
export type UtokadAktivitetstyp = 'sfi' | 'studier' | 'vagledning' | 'halsa'
/** Alla typer ett pass kan ha när de utökade typerna är påslagna. */
export type PassTyp = ActivityType | UtokadAktivitetstyp
export const UTOKADE_AKTIVITETSTYPER: readonly UtokadAktivitetstyp[] = ['sfi', 'studier', 'vagledning', 'halsa'] as const
/** Brytare — se kommentaren ovan. Slå inte på före migrationen. */
export const UTOKADE_AKTIVITETSTYPER_PA = true

/** Typerna som får väljas för ett nytt pass. */
export function valbaraPasstyper(ordning: readonly ActivityType[], pa: boolean = UTOKADE_AKTIVITETSTYPER_PA): readonly PassTyp[] {
  return pa ? [...ordning, ...UTOKADE_AKTIVITETSTYPER] : ordning
}

/** Typer som räknas som anvisad aktivitet enligt lagen. */
export const ANVISADE_TYPER: ReadonlySet<PassTyp> = new Set<PassTyp>(['motivation', 'language', 'jobsearch', 'workplace', 'sfi', 'studier', 'vagledning', 'halsa'])

/** Anvisade pass som någon annan än verksamheten håller i (skolan). */
export const EXTERNT_HALLNA_TYPER: ReadonlySet<PassTyp> = new Set<PassTyp>(['sfi', 'studier'])

/**
 * Markeringar som räknas som närvaro. `external` — "Annan aktivitet" — är en
 * markering konsulenten gjort och räknas därför med: deltagaren var någon
 * annanstans i enlighet med planen, inte frånvarande.
 *
 * GG2 (2026-09-20): definitionen bodde i fyra filer, och en av dem sa något
 * annat. `narvaroIntygPdf.ts` räknade bara `present`, medan veckosaldot,
 * nämndrapporten och aktivitetsloggen räknade `present` + `external` — samma
 * period kunde alltså visa ett tal i deltagarens eget kvitto och ett annat i
 * nämndens rapport. En definition som tre filer delar och en fjärde härmar är
 * inte en definition. Läs den härifrån; skriv aldrig ett eget set.
 */
export const NARVARANDE_UTFALL: ReadonlySet<Attendance> = new Set<Attendance>(['present', 'external'])

/** Räknas passets markering som närvaro? `null` (omarkerat) gör det inte. */
export function arNarvaro(attendance: Attendance | null | undefined): boolean {
  return !!attendance && NARVARANDE_UTFALL.has(attendance)
}

/**
 * Är passet en anvisad aktivitet — alltså något verksamheten håller i?
 * Eget jobbsökande (`jobsearch_own`) är det inte, oavsett markering.
 *
 * RR1 (2026-09-27): aktivitetsloggen mot Rusta och matcha-avtalet räknade
 * deltagarens eget jobbsökande hemma som aktivitetstid, medan veckosaldot på
 * Aktivitet-fliken hoppade över det. Samma vecka var "uppfylld" i Rapporter och
 * "Närvaro 0 h" på deltagaren. Avtalet räknar leverantörsledda aktiviteter,
 * lagen räknar anvisade — i båda fallen står eget jobbsökande utanför. Läs
 * definitionen härifrån i stället för att skriva ett eget villkor.
 */
export function arAnvisad(s: { activity_type: PassTyp }): boolean {
  return ANVISADE_TYPER.has(s.activity_type)
}

/**
 * Anvisat OCH hållet av verksamheten själv — det avtalet med
 * Arbetsförmedlingen räknar. SFI och studier hålls av skolan (RK28).
 */
export function arVerksamhetsledd(s: { activity_type: PassTyp }): boolean {
  return arAnvisad(s) && !EXTERNT_HALLNA_TYPER.has(s.activity_type)
}

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

/**
 * ISO 8601-veckonummer (vecka 1 = veckan med årets första torsdag) — det
 * nummer kommunen planerar i. RK27: veckan hette bara "21 sep – 27 sep".
 */
export function isoVeckonummer(s: string): number {
  const torsdag = parseLocalDate(addDays(s, 4 - isoWeekday(s)))
  const forstaJan = new Date(torsdag.getFullYear(), 0, 1)
  const dagar = Math.round((torsdag.getTime() - forstaJan.getTime()) / 86_400_000)
  return Math.floor(dagar / 7) + 1
}

/**
 * Förifyllt datum för ett nytt pass (RK28). Tidigare veckans måndag — som
 * oftast redan passerat. Nu: en kommande vecka → dess måndag; annars i dag.
 * Faller dagen på en helg → måndagen efter.
 */
export function forslagetPassdatum(vecka: string, idag: string): string {
  const dag = vecka > idag ? vecka : idag
  const vd = isoWeekday(dag)
  return vd >= 6 ? addDays(dag, 8 - vd) : dag
}

/**
 * Samma veckodag varje vecka från `start` till och med `slut` (RK28,
 * "upprepa varje vecka till planens slut"). Tomt om `slut` ligger före.
 * Taket (105 veckor) skyddar mot ett felskrivet slutdatum.
 */
export function veckovisaDatum(start: string, slut: string): string[] {
  const ut: string[] = []
  for (let d = start; d <= slut && ut.length < 105; d = addDays(d, 7)) ut.push(d)
  return ut
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

const tiondelar = (h: number) => Math.round(h * 10) / 10

/** Mallens timmar per vecka, uppdelade på anvisad aktivitet och eget jobbsökande. */
export function mallensTimmarPerTyp(items: readonly TemplateItem[]): { anvisade: number; egetJobbsok: number } {
  let anvisade = 0
  let egetJobbsok = 0
  for (const it of items) {
    const min = minuterMellan(it.start_time, it.end_time)
    if (arAnvisad(it)) anvisade += min
    else egetJobbsok += min
  }
  return { anvisade: tiondelar(anvisade / 60), egetJobbsok: tiondelar(egetJobbsok / 60) }
}

/**
 * Veckomålets definition: **anvisad aktivitet + eget jobbsökande** — båda ska
 * ha tid i planen (Kunskapsguiden, FAQ om aktivitetskravet), och planens
 * `jobsearch_hours_per_week` är den del av målet som är eget jobbsökande.
 *
 * Den del av målet som närvaron ska mätas mot är alltså målet minus planens
 * eget jobbsökande. RK1 (2026-09-27): `veckoampel` jämförde närvaron i
 * anvisade pass med HELA målet — en plan på 8 h anvisat + 3 h eget (mål 11 h)
 * kunde aldrig bli grön, hur väl deltagaren än skötte sig. Eget jobbsökande
 * räknas inte in i närvaron: det är deltagarens egen redovisning, och grönt
 * kräver bekräftad närvaro (GG3).
 */
export function anvisatVeckomal(plan: { weekly_hours_target: number | string; jobsearch_hours_per_week: number | string | null }): number {
  const mal = Number(plan.weekly_hours_target) || 0
  const egen = Number(plan.jobsearch_hours_per_week) || 0
  return Math.max(0, tiondelar(mal - egen))
}

/**
 * RK2: förifyllt veckomål när en plan skapas ur en mall — mallens anvisade
 * timmar plus dess eget jobbsökande, aldrig över lagens förslag. Tidigare
 * förifylldes lagens tak (40 h) oavsett mall, så en mall på 8 h gav en plan på
 * 40 h utan varning, och det stod på dokumentet för underskrift.
 */
export function forifylltVeckomalUrMall(items: readonly TemplateItem[], lagensForslag: number): { veckomal: number; egetJobbsok: number } {
  const { anvisade, egetJobbsok } = mallensTimmarPerTyp(items)
  return { veckomal: Math.min(lagensForslag, tiondelar(anvisade + egetJobbsok)), egetJobbsok }
}

export interface VeckomalGlapp {
  /** Anvisad tid i schemat räcker inte till (eller överstiger) den anvisade delen av målet. */
  anvisat: string | null
  /** Planens eget jobbsökande stämmer inte med schemats. */
  egetJobbsok: string | null
}

const visaH = (h: number) => `${String(tiondelar(h)).replace('.', ',')} h`

/**
 * Går veckomålet ihop med schemat? Två frågor, var sin rad — `null` när den
 * stämmer. Toleransen är en tiondels timme, samma avrundning som saldot.
 */
export function veckomalMotSchema(indata: {
  veckomal: number
  egetJobbsokPlan: number
  anvisatSchema: number
  egetJobbsokSchema: number
}): VeckomalGlapp {
  const anvisatMal = Math.max(0, tiondelar(indata.veckomal - indata.egetJobbsokPlan))
  const anvisat = Math.abs(indata.anvisatSchema - anvisatMal) < 0.05
    ? null
    : indata.anvisatSchema < anvisatMal
      ? `Schemat har ${visaH(indata.anvisatSchema)} anvisad aktivitet, men veckomålet kräver ${visaH(anvisatMal)} (${visaH(indata.veckomal)} mål − ${visaH(indata.egetJobbsokPlan)} eget jobbsökande). Veckan kan inte nå målet.`
      : `Schemat har ${visaH(indata.anvisatSchema)} anvisad aktivitet, mer än veckomålets ${visaH(anvisatMal)} (${visaH(indata.veckomal)} mål − ${visaH(indata.egetJobbsokPlan)} eget jobbsökande).`
  const egetJobbsok = Math.abs(indata.egetJobbsokSchema - indata.egetJobbsokPlan) < 0.05
    ? null
    : `Planen anger ${visaH(indata.egetJobbsokPlan)} eget jobbsökande i veckan, schemat har ${visaH(indata.egetJobbsokSchema)}.`
  return { anvisat, egetJobbsok }
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
    else if (arNarvaro(s.attendance)) narvaro += min
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

export type Ampel =
  | 'inga_pass'
  | 'under_mal'
  | 'pa_mal'
  | 'ogiltig_franvaro'
  | 'ej_markerad'

/**
 * Ampel för veckan mot veckomålet. `inga_pass` när inget är planerat —
 * visas som `—`, aldrig som 0 %. Ogiltig frånvaro vinner över allt annat.
 *
 * GG3 (2026-09-20): grönt kräver **bekräftad närvaro**, inte schemalagda
 * timmar. Fram till nu jämfördes `planeradeTimmar` mot målet, så en vecka fylld
 * av omarkerade pass visade "På veckomålet" som om kravet vore uppfyllt —
 * konsulenten läser chippet som ett kvitto, och kravet är ett underlag för
 * ekonomiskt bistånd. Ett schema är en avsikt, inte ett utfall.
 *
 * `ej_markerad` är det ärliga mellanläget: målet är inte nått ÄN, och det finns
 * omarkerade pass kvar som kan ta veckan dit. Att kalla den "under målet" vore
 * lika osant som att kalla den grön — jämför regeln i CLAUDE.md om att ett
 * värde utan underlag visar `—` och en rad om varför.
 *
 * RK1 (2026-09-27): andra argumentet är den **anvisade** delen av målet —
 * `anvisatVeckomal(plan)`, inte `plan.weekly_hours_target`. Närvaron räknas
 * bara i anvisade pass, så den ska jämföras med den del av målet som gäller
 * anvisade pass. Skicka hela målet och en plan med eget jobbsökande kan aldrig
 * bli grön.
 */
export function veckoampel(saldo: Veckosaldo, anvisatMal: number): Ampel {
  if (saldo.antalPass === 0) return 'inga_pass'
  if (saldo.antalOgiltigFranvaro > 0) return 'ogiltig_franvaro'
  if (saldo.narvaroTimmar + 0.05 >= anvisatMal) return 'pa_mal'
  if (saldo.antalOmarkerade > 0) return 'ej_markerad'
  return 'under_mal'
}
