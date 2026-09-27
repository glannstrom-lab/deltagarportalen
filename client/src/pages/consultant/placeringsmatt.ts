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
 *
 * RR5 (rollspelet 2026-09-27): punkten räknades som 90/180 dagar från start
 * (9/7 → 7/10) i stället för tre respektive sex KALENDERMÅNADER (9/7 → 9/10).
 * Konstanterna nedan finns kvar som ungefärliga tal för läsaren; räkningen
 * går genom `uppfoljningspunkt()`.
 */
export const FOLLOWUP_3M_DAYS = 90
export const FOLLOWUP_6M_DAYS = 180
export const FOLLOWUP_SOON_WINDOW_DAYS = 14

export type Uppfoljning = '3m' | '6m'

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseYmd(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Uppföljningspunkten: startdatum + 3 (eller 6) kalendermånader, lokal tid.
 * En dag som inte finns i målmånaden klipps till månadens sista dag
 * (31/8 + 3 mån = 30/11). `null` utan giltigt startdatum.
 */
export function uppfoljningspunkt(startDate: string | null, vilken: Uppfoljning): string | null {
  if (!startDate) return null
  const start = parseYmd(startDate)
  if (!start) return null
  const manader = vilken === '3m' ? 3 : 6
  const sista = new Date(start.getFullYear(), start.getMonth() + manader + 1, 0).getDate()
  return ymd(new Date(start.getFullYear(), start.getMonth() + manader, Math.min(start.getDate(), sista)))
}

function dagarMellan(fran: string, till: string): number {
  const a = parseYmd(fran)!
  const b = parseYmd(till)!
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

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
  const vilken: Uppfoljning = row.followup3m ? '6m' : '3m'
  const punkt = uppfoljningspunkt(row.startDate, vilken)
  if (!punkt) {
    return { tone: 'unknown', text: 'Startdatum saknas — uppföljning kan inte beräknas' }
  }

  const label = row.followup3m ? '6-månadersuppföljning' : '3-månadersuppföljning'
  const daysLeft = dagarMellan(ymd(now), punkt)

  if (daysLeft <= 0) {
    return { tone: 'due', text: `${label} väntar (${Math.abs(daysLeft)} dagar sedan)` }
  }
  if (daysLeft <= FOLLOWUP_SOON_WINDOW_DAYS) {
    return { tone: 'soon', text: `${label} om ${daysLeft} dagar` }
  }
  return { tone: 'ok', text: `${label} om ${daysLeft} dagar` }
}

/**
 * RR5: får uppföljningen registreras nu? 6-månadersuppföljningen kunde kryssas
 * före 3-månaders, och 3-månaders gick att kryssa tio dagar före punkten —
 * underlaget avgör resultatersättningen.
 *   · ordningen är spärrad: 6 mån kräver att 3 mån är registrerad
 *   · en redan registrerad uppföljning registreras inte igen
 *   · före punkten går det bara med en skriven motivering
 */
export type RegistreringsBesked =
  | { tillaten: false; skal: string }
  | { tillaten: true; punkt: string; kraverMotivering: boolean; skal: string | null }

export function kanRegistreraUppfoljning(
  row: PlacementFollowupInput,
  vilken: Uppfoljning,
  idag: string,
): RegistreringsBesked {
  const punkt = uppfoljningspunkt(row.startDate, vilken)
  if (!punkt) return { tillaten: false, skal: 'Startdatum saknas — uppföljningspunkten kan inte beräknas. Ange startdatum på placeringen först.' }
  if (vilken === '3m' && row.followup3m) return { tillaten: false, skal: '3-månadersuppföljningen är redan registrerad.' }
  if (vilken === '6m' && row.followup6m) return { tillaten: false, skal: '6-månadersuppföljningen är redan registrerad.' }
  if (vilken === '6m' && !row.followup3m) return { tillaten: false, skal: 'Registrera 3-månadersuppföljningen först.' }
  const kvar = dagarMellan(idag, punkt)
  if (kvar > 0) {
    return {
      tillaten: true,
      punkt,
      kraverMotivering: true,
      skal: `Uppföljningspunkten är ${punkt}, om ${kvar} ${kvar === 1 ? 'dag' : 'dagar'}. En uppföljning i förtid kräver en motivering.`,
    }
  }
  return { tillaten: true, punkt, kraverMotivering: false, skal: null }
}
