/**
 * Kohortberäkningen för konsulentens analysvy.
 *
 * Utbruten ur `AnalyticsTab.tsx` 2026-08-17 i samband med AR1. Skälet till att
 * den ligger i en egen fil är inte filstorlek utan testbarhet: funktionen är
 * ren, dess utdata går rakt in i den PDF konsulenten skickar till
 * uppdragsgivaren, och den producerade strängen `QNaN NaN` i drift utan att
 * något test kunde fälla — den gick inte att nå utanför komponenten.
 *
 * Testerna ligger i `cohorts.test.ts` och innehåller den negativa kontrollen:
 * matas den med vyns verkliga form (utan `created_at`) ska den INTE svara med
 * ett kvartal.
 */

export interface CohortData {
  cohort: string
  participants: number
  cvComplete: number
  placed: number
  avgTime: number
}

/**
 * AR1 (2026-08-17): kohorterna hette `QNaN NaN` för samtliga deltagare.
 *
 * Funktionen läste `p.created_at`, men `participants` kommer ur vyn
 * `consultant_dashboard_participants` — som inte har den kolumnen.
 * `fetchAnalytics` i `AnalyticsTab.tsx` konstaterade redan exakt det i en
 * kommentar ("vyn saknar created_at, gav 400/42703 i prod") för en annan
 * fråga, men kohortberäkningen fick aldrig samma rättelse. Resultatet blev
 * `new Date(undefined)` → Invalid Date → `Q${NaN} ${NaN}`, och eftersom
 * kohortanalysen är **påslagen som default** i exportdialogen följde strängen
 * `QNaN NaN` med in i den PDF konsulenten skickar till uppdragsgivaren.
 *
 * Vyn har `assigned_at` (när deltagaren kopplades till den här konsulenten)
 * och `registered_at` (när kontot skapades). För en konsulents kohort är
 * `assigned_at` rätt mått — samma bedömning som kommentaren ovan redan gjort
 * — med `registered_at` som reserv för anropare som inte har den.
 *
 * Deltagare utan användbart datum hamnar i en egen, namngiven kohort i
 * stället för att få ett påhittat kvartal eller försvinna tyst ur
 * summeringen. Båda alternativen hade brutit mot regeln i ROADMAP B31: ett
 * värde utan underlag visar `—` och en rad om varför, aldrig ett tal.
 */
export const KOHORT_UTAN_DATUM = 'Okänt startdatum'

/** Startdatumet för en deltagare, eller null när inget av fälten går att läsa. */
export const startdatum = (p: Record<string, unknown>): Date | null => {
  const raw = p.assigned_at ?? p.registered_at ?? p.created_at
  if (typeof raw !== 'string' && !(raw instanceof Date)) return null
  const d = new Date(raw as string)
  return isNaN(d.getTime()) ? null : d
}

// Helper function to calculate cohorts from participant data
export const calculateCohorts = (participants: Array<Record<string, unknown>>, placements: Array<Record<string, unknown>>): CohortData[] => {
  if (!participants || participants.length === 0) return []

  // Group participants by quarter based on assigned_at (start date)
  const quarters: Record<string, {
    participants: Array<Record<string, unknown>>
    placements: Array<Record<string, unknown>>
  }> = {}

  participants.forEach(p => {
    const date = startdatum(p)
    const key = date
      ? `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`
      : KOHORT_UTAN_DATUM

    if (!quarters[key]) {
      quarters[key] = { participants: [], placements: [] }
    }
    quarters[key].participants.push(p)
  })

  // Add placements to their respective quarters
  placements?.forEach(placement => {
    const participantId = placement.participant_id
    // Find which quarter this participant belongs to
    for (const key of Object.keys(quarters)) {
      const found = quarters[key].participants.find(p => p.id === participantId || p.user_id === participantId)
      if (found) {
        quarters[key].placements.push(placement)
        break
      }
    }
  })

  // Calculate metrics for each cohort
  const cohortList: CohortData[] = Object.entries(quarters)
    .map(([cohort, data]) => {
      const total = data.participants.length
      const withCV = data.participants.filter(p => p.has_cv).length
      const placed = data.placements.length

      // Genomsnittlig tid till placering.
      //
      // Samma NaN-källa som kohortnyckeln hade: `participant.created_at`
      // finns inte, så differensen blev NaN och `Math.max(1, NaN)` är NaN —
      // vilket smittade hela summan. Nu räknas bara de placeringar där BÅDA
      // datumen faktiskt går att läsa, och nämnaren är antalet sådana par,
      // inte antalet placeringar. Annars hade ett oläsbart datum sänkt
      // snittet i stället för att utebli ur det.
      let avgTime = 0
      if (data.placements.length > 0) {
        let dagarTotalt = 0
        let matbara = 0
        for (const placement of data.placements) {
          const participant = data.participants.find(
            p => p.id === placement.participant_id || p.user_id === placement.participant_id
          )
          if (!participant) continue
          const startDate = startdatum(participant)
          const raw = placement.start_date || placement.created_at
          const placementDate = typeof raw === 'string' ? new Date(raw) : null
          if (!startDate || !placementDate || isNaN(placementDate.getTime())) continue
          const days = Math.floor((placementDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
          dagarTotalt += Math.max(1, days)
          matbara += 1
        }
        // Noll mätbara par ⇒ 0, som redan betyder "visas inte" i tabellen
        // nedan. Ett påhittat snitt vore värre än ett tomt fält.
        avgTime = matbara > 0 ? Math.round(dagarTotalt / matbara) : 0
      }

      return {
        cohort,
        participants: total,
        cvComplete: total > 0 ? Math.round((withCV / total) * 100) : 0,
        placed: total > 0 ? Math.round((placed / total) * 100) : 0,
        avgTime: avgTime || 0,
      }
    })
    // Sort by year and quarter descending (most recent first).
    // "Okänt startdatum" har ingen plats på tidsaxeln och sorteras sist —
    // utan den här grenen hade `parseInt('startdatum')` gett NaN, och en
    // NaN-jämförelse gör sorteringen odefinierad för HELA listan, inte bara
    // för den raden.
    .sort((a, b) => {
      if (a.cohort === KOHORT_UTAN_DATUM) return 1
      if (b.cohort === KOHORT_UTAN_DATUM) return -1
      const [aQ, aY] = a.cohort.split(' ')
      const [bQ, bY] = b.cohort.split(' ')
      const yearDiff = parseInt(bY) - parseInt(aY)
      if (yearDiff !== 0) return yearDiff
      return parseInt(bQ.replace('Q', '')) - parseInt(aQ.replace('Q', ''))
    })
    .slice(0, 6) // Keep last 6 quarters

  return cohortList
}
