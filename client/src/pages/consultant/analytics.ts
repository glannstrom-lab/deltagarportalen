/**
 * Rena beräkningsfunktioner utbrutna ur AnalyticsTab.tsx (KK6, 2026-09-02).
 *
 * Samma grepp som `cohorts.ts` (AR1) och `placeringsmatt.ts` (AG3/KS1): logik
 * som satt kvar inne i en ~1200-raders komponent gick inte att nå från ett
 * test — och det var precis så `cohorts.ts`s QNaN-bugg kunde nå en skarp PDF
 * utan att något test fällde den. `computeMonthlyProgress`, `calculateTrends`
 * och `calculateGoalCategories` hade samma egenskap: rena, testbara, men
 * instängda.
 *
 * Fixturerna i `analytics.test.ts` speglar `consultant_dashboard_participants`
 * och `consultant_goals` som de faktiskt ser ut i prod (kolumnnamn hämtade ur
 * `supabase/schema-snapshot.json`) — INGET `created_at` på deltagarraden
 * (samma fälla som `cohorts.ts` dokumenterar), och `consultant_placements`
 * saknar helt `placement_date` trots att `computeMonthlyProgress` läser den
 * kolumnen i första hand (`||`-kedjan faller alltid vidare till `start_date`
 * i prod — inte en bugg, men värt att veta om man ändrar ordningen).
 */

import i18n from '@/i18n/config'

export interface MonthlyProgressPoint {
  month: string
  value: number
}

export interface TrendPoint {
  value: number
  isPositive: boolean
}

export interface TrendData {
  cvCompletion: TrendPoint
  placementTime: TrendPoint
  goalsCompletion: TrendPoint
  engagement: TrendPoint
}

export interface GoalCategoryCount {
  category: string
  count: number
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']

/**
 * Verklig månadsserie: slutförda mål + placeringar per månad (riktiga
 * timestamps). Fabricerade tidigare en ATS-progression med `Math.random()`
 * — borttaget 2026-06-06. Tomma månader blir 0 (sanning: inget slutfördes
 * den månaden), inte uppdiktade värden — skiljer sig alltså från
 * "tomt underlag" (ingen data alls), som `calculateGoalCategories` nedan
 * hanterar.
 *
 * `now` är injicerbar för deterministiska tester, precis som
 * `followupStatus` i `placeringsmatt.ts`.
 */
export function computeMonthlyProgress(
  range: string,
  goals: Array<Record<string, unknown>>,
  placements: Array<Record<string, unknown>>,
  now: Date = new Date()
): MonthlyProgressPoint[] {
  let numMonths: number
  switch (range) {
    case 'week': numMonths = 1; break
    case 'month': numMonths = 1; break
    case 'quarter': numMonths = 3; break
    case 'year': numMonths = 12; break
    default: numMonths = 6
  }

  const buckets: MonthlyProgressPoint[] = []
  const indexByKey: Record<string, number> = {}
  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    indexByKey[`${d.getFullYear()}-${d.getMonth()}`] = buckets.length
    buckets.push({ month: MONTH_LABELS[d.getMonth()], value: 0 })
  }

  const bump = (iso: unknown) => {
    if (!iso) return
    const d = new Date(iso as string)
    if (isNaN(d.getTime())) return
    const idx = indexByKey[`${d.getFullYear()}-${d.getMonth()}`]
    if (idx !== undefined) buckets[idx].value += 1
  }

  goals.forEach(g => { if (g.status === 'COMPLETED') bump(g.completed_at || g.updated_at) })
  placements.forEach(p => bump(p.placement_date || p.start_date || p.created_at))

  return buckets
}

/** Ren procentandel — 0 om nämnaren är 0 (delas aldrig med noll). */
function safeRate(numerator: number, denominator: number): number {
  return denominator > 0 ? (numerator / denominator) * 100 : 0
}

function calcPercentChange(current: number, previous: number): TrendPoint {
  if (previous === 0) return { value: current > 0 ? 100 : 0, isPositive: current >= 0 }
  const change = Math.round(((current - previous) / previous) * 100)
  return { value: Math.abs(change), isPositive: change >= 0 }
}

/**
 * Jämför aktuell period mot föregående för fyra nyckeltal. Rena procenttal
 * (aldrig NaN — `safeRate` skyddar nämnaren) matas in i `calcPercentChange`,
 * som i sin tur aldrig delar med noll (branchen `previous === 0` går före
 * divisionen). Ett tomt underlag (0 deltagare/mål i endera perioden) ger
 * alltså `{ value: 0, isPositive: true }` — komponenten döljer redan
 * trendpilen när `value === 0` (se render-grinden i AnalyticsTab.tsx), så
 * en "0 %"-trend visas aldrig som om den vore mätt.
 *
 * `placementTime` saknar en historisk serie helt (ingen snapshot-tabell) och
 * är därför alltid `{ value: 0, isPositive: true }` — samma render-grind
 * döljer den, i stället för att visa en uppdiktad procentsats.
 */
export function calculateTrends(
  currentParticipants: Array<Record<string, unknown>>,
  previousParticipants: Array<Record<string, unknown>>,
  currentGoals: Array<Record<string, unknown>>,
  previousGoals: Array<Record<string, unknown>>,
  now: Date = new Date()
): TrendData {
  const currentCvRate = safeRate(currentParticipants.filter(p => p.has_cv).length, currentParticipants.length)
  const previousCvRate = safeRate(previousParticipants.filter(p => p.has_cv).length, previousParticipants.length)

  const currentGoalsComplete = currentGoals.filter(g => g.status === 'COMPLETED').length
  const currentGoalsRate = safeRate(currentGoalsComplete, currentGoals.length)

  const previousGoalsComplete = previousGoals.filter(g => g.status === 'COMPLETED').length
  const previousGoalsRate = safeRate(previousGoalsComplete, previousGoals.length)

  const recentThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const currentEngaged = currentParticipants.filter(p =>
    p.last_login && new Date(p.last_login as string) > recentThreshold
  ).length
  const currentEngagementRate = safeRate(currentEngaged, currentParticipants.length)

  // Samma tröskel (senaste 7 dagarna räknat från `now`) används medvetet för
  // föregående periods deltagare — se ursprunget i AnalyticsTab.tsx. Ingen
  // separat "föregående periods engagemang"-tidsserie finns.
  const previousEngaged = previousParticipants.filter(p =>
    p.last_login && new Date(p.last_login as string) > recentThreshold
  ).length
  const previousEngagementRate = safeRate(previousEngaged, previousParticipants.length)

  return {
    cvCompletion: calcPercentChange(currentCvRate, previousCvRate),
    // Ingen historisk placeringstidsserie ännu → 0 döljer trenden
    // (render-grinden i AnalyticsTab.tsx) i stället för att visa en
    // uppdiktad procentsats.
    placementTime: { value: 0, isPositive: true },
    goalsCompletion: calcPercentChange(currentGoalsRate, previousGoalsRate),
    engagement: calcPercentChange(currentEngagementRate, previousEngagementRate),
  }
}

/**
 * Grupperar mål på nyckelord i titeln.
 *
 * KK6-rättelse: den gamla implementationen returnerade tre kategorier med
 * `count: 0` när `goals.length === 0` — "CV-förbättring: 0 mål" när det i
 * själva verket inte fanns ETT ENDA mål. Det är precis mönstret CLAUDE.md
 * varnar för (2026-08-09: "ett påhittat värde har alltid föredragits framför
 * ett tomt fält") — tre påhittade nollor i stället för ett ärligt tomt läge.
 * Tomt underlag ger nu en tom lista; anroparen visar en invit i stället
 * (se AnalyticsTab.tsx, kortet "Vanligaste målkategorierna").
 */
export function calculateGoalCategories(goals: Array<Record<string, unknown>>): GoalCategoryCount[] {
  if (goals.length === 0) return []

  const categories: Record<string, number> = {}

  goals.forEach(goal => {
    const title = String(goal.title ?? '').toLowerCase()
    let category = i18n.t('consultant.analytics.goalCategories.other')

    if (title.includes('cv') || title.includes('resume') || title.includes('meritförteckning')) {
      category = i18n.t('consultant.analytics.goalCategories.cvImprovement')
    } else if (title.includes('jobb') || title.includes('ansök') || title.includes('söka')) {
      category = i18n.t('consultant.analytics.goalCategories.jobApplications')
    } else if (title.includes('intervju')) {
      category = i18n.t('consultant.analytics.goalCategories.interviewTraining')
    } else if (title.includes('nätverk') || title.includes('linkedin') || title.includes('kontakt')) {
      category = i18n.t('consultant.analytics.goalCategories.networking')
    } else if (title.includes('kompetens') || title.includes('kurs') || title.includes('utbildning')) {
      category = i18n.t('consultant.analytics.goalCategories.skillsDevelopment')
    }

    categories[category] = (categories[category] || 0) + 1
  })

  // RK24: lika antal sorteras på namn, så Översikt, Rapporter och PDF:en
  // aldrig visar samma data i olika ordning beroende på radernas hämtordning.
  return Object.entries(categories)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'sv'))
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }))
}

// ---------------------------------------------------------------------------
// Genomsnittlig placeringstid (RR4, 2026-09-27)
// ---------------------------------------------------------------------------

export interface Placeringstid {
  /** Snitt i hela dagar, eller `null` när ingen placering går att mäta — aldrig 0. */
  snittDagar: number | null
  /** Placeringar som ingår i snittet. */
  matbara: number
  /** Placeringar med startdatum efter idag — jobbet har inte börjat. */
  kommande: number
  /** Placeringar som saknar kopplingsdatum eller startdatum, eller startade före kopplingen. */
  utanUnderlag: number
  /** En rad om varför talet saknas eller vad som inte räknats — `null` när allt räknats. */
  forklaring: string | null
}

/** `YYYY-MM-DD` i lokal tid ur ett datum eller en tidsstämpel; `null` om oläsbart. */
function lokaltDatum(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length < 10) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const d = new Date(raw)
  if (isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dagarMellan(fran: string, till: string): number {
  const [a, b, c] = fran.split('-').map(Number)
  const [x, y, z] = till.split('-').map(Number)
  return Math.round((Date.UTC(x, y - 1, z) - Date.UTC(a, b - 1, c)) / 86_400_000)
}

const plural = (n: number, en: string, flera: string) => `${n} ${n === 1 ? en : flera}`

/**
 * "Från start till jobb": dagar från deltagarens start hos konsulenten
 * (`assigned_at`, kopplingen) till placeringens `start_date`.
 *
 * RR4: den gamla uträkningen tog `start_date − created_at` med golvet 1 — alltså
 * hur långt efter registreringen jobbet började, och en placering registrerad i
 * efterhand gav alltid 1 dag. I prod 2026-09-27: 70 och 82 dagar från kopplingen
 * visades som "11 dagar" (golvat −80 och 22).
 *
 * Räknas inte: placeringar utan kopplingsdatum eller startdatum, placeringar som
 * startade före kopplingen, och placeringar vars jobb inte har börjat än. Varje
 * sådan grupp nämns i `forklaring`, så talet aldrig ser mer heltäckande ut än
 * det är.
 */
export function placeringstid(
  placements: ReadonlyArray<Record<string, unknown>>,
  participants: ReadonlyArray<Record<string, unknown>>,
  idag: string,
): Placeringstid {
  const koppling = new Map<string, string>()
  for (const p of participants) {
    const id = p.participant_id ?? p.user_id ?? p.id
    const datum = lokaltDatum(p.assigned_at)
    if (typeof id === 'string' && datum) koppling.set(id, datum)
  }

  let summa = 0
  let matbara = 0
  let kommande = 0
  let utanUnderlag = 0
  for (const pl of placements) {
    const start = lokaltDatum(pl.start_date)
    const fran = typeof pl.participant_id === 'string' ? koppling.get(pl.participant_id) : undefined
    if (!start || !fran) { utanUnderlag += 1; continue }
    if (start > idag) { kommande += 1; continue }
    const dagar = dagarMellan(fran, start)
    if (dagar < 0) { utanUnderlag += 1; continue }
    summa += dagar
    matbara += 1
  }

  const delar: string[] = []
  if (kommande > 0) delar.push(`${plural(kommande, 'placering har', 'placeringar har')} startdatum framåt och räknas när jobbet har börjat`)
  if (utanUnderlag > 0) delar.push(`${plural(utanUnderlag, 'placering saknar', 'placeringar saknar')} kopplingsdatum eller startdatum, eller startade före kopplingen`)

  let forklaring: string | null
  if (placements.length === 0) forklaring = 'Inga placeringar i perioden.'
  else if (matbara === 0) forklaring = `Ingen placering går att mäta än: ${delar.join('; ')}.`
  else forklaring = delar.length > 0 ? `Räknat på ${plural(matbara, 'placering', 'placeringar')}; ${delar.join('; ')}.` : null

  return {
    snittDagar: matbara > 0 ? Math.round(summa / matbara) : null,
    matbara,
    kommande,
    utanUnderlag,
    forklaring,
  }
}
