/**
 * Rena mätfunktioner för placeringar — utbrutna ur AnalyticsTab.tsx.
 *
 * Skälet är dubbelt. Dels kräver `react-refresh/only-export-components` att en
 * komponentfil bara exporterar komponenter, och de här två exporterades från
 * AnalyticsTab (2 eslint-errors mot taket 0). Dels är utbrytningen samma grepp
 * som gav `cohorts.ts` sina tester: logik som sitter inne i en 1 000-raders
 * komponent går inte att testa isolerat, och det var precis därför QNaN-buggen
 * kunde nå en skarp PDF.
 */

/**
 * AG3/KS1 (2026-08-31): "Avslutade med jobb"-kortet räknade tidigare
 * `completedParticipants / totalParticipants` — andelen deltagare med
 * status COMPLETED. Konsulenten sätter den statusen manuellt för flytt,
 * byte av konsulent OCH avhopp, inte bara riktiga placeringar. Talet gick
 * rakt in i rapporter till Arbetsförmedlingen/kommunen.
 *
 * Riktig källa är `consultant_placements`, skriven av PlacementDialog via
 * `consultantService.recordPlacement()`. Ren funktion (inget `t()`, ingen
 * Supabase) så den går att mutationstesta isolerat — se
 * AnalyticsTab.placements.test.ts.
 *
 * Regeln i CLAUDE.md: ett värde utan underlag visar `—` och en rad om
 * varför, aldrig 0 %. Noll registrerade placeringar (prod: 0 rader i
 * consultant_placements 2026-08-31) är precis det läget.
 */
export interface PlacementMetric {
  hasPlacements: boolean
  value: number | null
  rate: number | null
}

export function computePlacementMetric(totalPlacements: number, totalParticipants: number): PlacementMetric {
  if (!totalPlacements || totalPlacements <= 0) {
    return { hasPlacements: false, value: null, rate: null }
  }
  return {
    hasPlacements: true,
    value: totalPlacements,
    rate: Math.round((totalPlacements / Math.max(totalParticipants, 1)) * 100),
  }
}

/**
 * Uppföljningsstatus för en enskild placering (Rusta och matchas två
 * utbetalningspunkter: halva resultatersättningen efter 3 månader, resten
 * efter 6). Ren funktion med injicerbar `now` för deterministiska tester.
 *
 * Ett saknat startdatum ger ALDRIG ett gissat antal dagar — se `unknown`.
 */
export const FOLLOWUP_3M_DAYS = 90
export const FOLLOWUP_6M_DAYS = 180
export const FOLLOWUP_SOON_WINDOW_DAYS = 14

export interface PlacementFollowupInput {
  startDate: string | null
  followup3m: boolean
  followup6m: boolean
}

export type FollowupTone = 'done' | 'ok' | 'soon' | 'due' | 'unknown'

export interface FollowupStatus {
  tone: FollowupTone
  text: string
}

export function followupStatus(row: PlacementFollowupInput, now: Date = new Date()): FollowupStatus {
  if (row.followup3m && row.followup6m) {
    return { tone: 'done', text: 'Båda uppföljningarna klara' }
  }
  if (!row.startDate) {
    return { tone: 'unknown', text: 'Startdatum saknas — uppföljning kan inte beräknas' }
  }
  const start = new Date(row.startDate)
  if (isNaN(start.getTime())) {
    return { tone: 'unknown', text: 'Startdatum saknas — uppföljning kan inte beräknas' }
  }

  const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const targetDays = row.followup3m ? FOLLOWUP_6M_DAYS : FOLLOWUP_3M_DAYS
  const label = row.followup3m ? '6-månadersuppföljning' : '3-månadersuppföljning'
  const daysLeft = targetDays - daysSinceStart

  if (daysLeft <= 0) {
    return { tone: 'due', text: `${label} väntar (${Math.abs(daysLeft)} dagar sedan)` }
  }
  if (daysLeft <= FOLLOWUP_SOON_WINDOW_DAYS) {
    return { tone: 'soon', text: `${label} om ${daysLeft} dagar` }
  }
  return { tone: 'ok', text: `${label} om ${daysLeft} dagar` }
}
