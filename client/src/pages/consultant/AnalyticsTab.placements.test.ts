/**
 * Tester för de rena placeringsfunktionerna i AnalyticsTab.tsx (AG3/KS1).
 *
 * Bakgrund: KPI-kortet "Avslutade med jobb" räknade
 * `completedParticipants / totalParticipants` — andelen deltagare med
 * status COMPLETED, som konsulenten sätter manuellt för flytt, byte av
 * konsulent OCH avhopp, inte bara riktiga placeringar. Talet gick rakt in i
 * rapporter till Arbetsförmedlingen/kommunen. `computePlacementMetric`
 * räknar i stället från `consultant_placements` och visar aldrig ett
 * gissat 0 % — CLAUDE.md-regeln: ett värde utan underlag visar `—` och en
 * rad om varför.
 *
 * `followupStatus` är den logik som avgör om en 3- eller
 * 6-månadersuppföljning väntar (Rusta och matchas två
 * utbetalningspunkter). Ren funktion med injicerbar `now` — inget
 * `new Date()` i själva testet, så resultatet är deterministiskt.
 *
 * Funktionerna importeras direkt ur sidfilen (samma mönster som
 * `cohorts.ts` användes för att undvika, men de är rena top-level-exports
 * utan Supabase-anrop, så modulimporten kör inga sidoeffekter).
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  computePlacementMetric,
  followupStatus,
  FOLLOWUP_3M_DAYS,
  FOLLOWUP_6M_DAYS,
} from './placeringsmatt'

/**
 * Källkodsvakt för KPI-kortets callsite (rad ~811 i AnalyticsTab.tsx).
 *
 * `computePlacementMetric` är en ren funktion och är fullständigt
 * mutationstestad ovan — men den bevisar ingenting om VILKET tal
 * komponenten faktiskt matar in. Den ursprungliga buggen satt just där:
 * `analytics.completedParticipants` (status COMPLETED) skickades in där
 * `analytics.totalPlacements` (consultant_placements) hör hemma. Ett test
 * som bara anropar funktionen direkt med egna siffror kan inte se en sådan
 * felkopplad callsite — det kräver att man läser eller kör hela komponenten.
 * Att rendera AnalyticsTab kräver att mocka ett tiotal separata
 * Supabase-frågor; källkodsvakten är den billiga, exakta kontrollen tills
 * ett sådant renderingstest finns.
 */
const analyticsTabKod = readFileSync(join(__dirname, 'AnalyticsTab.tsx'), 'utf-8')
  .replace(/(?<!:)\/\/.*$/gm, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')

describe('AnalyticsTab.tsx — KPI-kortets datakälla (källkodsvakt)', () => {
  it('computePlacementMetric matas med totalPlacements, aldrig completedParticipants', () => {
    // Matchar callsite-anropet (kräver "analytics." i argumenten) — inte
    // funktionsdeklarationen, som också matchar `computePlacementMetric(...)`
    // men aldrig innehåller ordet "analytics".
    const anrop = analyticsTabKod.match(/=\s*computePlacementMetric\(([^)]*)\)/)
    expect(anrop, 'anropet till computePlacementMetric hittades inte i källkoden').not.toBeNull()
    const argument = anrop![1]
    expect(argument).toContain('analytics.totalPlacements')
    expect(argument).not.toContain('analytics.completedParticipants')
  })
})

describe('computePlacementMetric', () => {
  it('noll placeringar → hasPlacements=false, value=null, rate=null (aldrig 0 %)', () => {
    const result = computePlacementMetric(0, 12)
    expect(result).toEqual({ hasPlacements: false, value: null, rate: null })
  })

  it('räknar en verklig placeringsgrad när det finns registrerade placeringar', () => {
    const result = computePlacementMetric(3, 12)
    expect(result).toEqual({ hasPlacements: true, value: 3, rate: 25 })
  })

  it('delar aldrig med noll deltagare — Math.max(total, 1) skyddar nämnaren', () => {
    const result = computePlacementMetric(2, 0)
    expect(result.hasPlacements).toBe(true)
    expect(result.rate).toBe(200)
  })
})

describe('followupStatus', () => {
  const now = new Date('2026-08-31T12:00:00Z')

  it('inget startdatum → unknown, gissar aldrig ett antal dagar', () => {
    const status = followupStatus({ startDate: null, followup3m: false, followup6m: false }, now)
    expect(status.tone).toBe('unknown')
    expect(status.text).toMatch(/Startdatum saknas/)
  })

  it('ogiltigt startdatum → unknown (samma skydd som saknat datum)', () => {
    const status = followupStatus({ startDate: 'inte-ett-datum', followup3m: false, followup6m: false }, now)
    expect(status.tone).toBe('unknown')
  })

  it('båda uppföljningarna gjorda → done, oavsett datum', () => {
    const status = followupStatus({ startDate: '2020-01-01', followup3m: true, followup6m: true }, now)
    expect(status.tone).toBe('done')
  })

  it('nyss startad (5 dagar) → ok, långt kvar till 3-månadersuppföljningen', () => {
    const start = new Date(now)
    start.setDate(start.getDate() - 5)
    const status = followupStatus(
      { startDate: start.toISOString().slice(0, 10), followup3m: false, followup6m: false },
      now
    )
    expect(status.tone).toBe('ok')
    expect(status.text).toContain('3-månadersuppföljning')
  })

  it(`${FOLLOWUP_3M_DAYS - 10} dagar sedan start → soon (inom 14-dagarsfönstret)`, () => {
    const start = new Date(now)
    start.setDate(start.getDate() - (FOLLOWUP_3M_DAYS - 10))
    const status = followupStatus(
      { startDate: start.toISOString().slice(0, 10), followup3m: false, followup6m: false },
      now
    )
    expect(status.tone).toBe('soon')
  })

  it(`${FOLLOWUP_3M_DAYS + 5} dagar sedan start, 3m ej gjord → due (väntar)`, () => {
    const start = new Date(now)
    start.setDate(start.getDate() - (FOLLOWUP_3M_DAYS + 5))
    const status = followupStatus(
      { startDate: start.toISOString().slice(0, 10), followup3m: false, followup6m: false },
      now
    )
    expect(status.tone).toBe('due')
    expect(status.text).toContain('3-månadersuppföljning')
  })

  it('3m gjord men 6m inte, förbi 6-månadersgränsen → due räknar mot 6m, inte 3m', () => {
    const start = new Date(now)
    start.setDate(start.getDate() - (FOLLOWUP_6M_DAYS + 3))
    const status = followupStatus(
      { startDate: start.toISOString().slice(0, 10), followup3m: true, followup6m: false },
      now
    )
    expect(status.tone).toBe('due')
    expect(status.text).toContain('6-månadersuppföljning')
    expect(status.text).not.toContain('3-månadersuppföljning')
  })
})
