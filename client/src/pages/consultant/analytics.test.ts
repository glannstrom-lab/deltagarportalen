/**
 * Tester för de rena analysfunktionerna utbrutna ur AnalyticsTab.tsx (KK6,
 * 2026-09-02) — samma grepp som `cohorts.test.ts` (AR1) och
 * `AnalyticsTab.placements.test.ts` (AG3/KS1).
 *
 * Fixturerna har vyns/tabellernas verkliga kolumnuppsättning, hämtad ur
 * `supabase/schema-snapshot.json` 2026-09-02:
 * - `consultant_dashboard_participants`: har `has_cv`, `last_login`,
 *   `first_name`/`last_name` — INGET `created_at` (samma fälla som
 *   `cohorts.test.ts` dokumenterar).
 * - `consultant_goals`: `title`, `status`, `completed_at`, `updated_at`,
 *   `created_at`, `deadline`, `progress`, `participant_id`.
 * - `consultant_placements`: `start_date`, `created_at` — INGET
 *   `placement_date`, trots att `computeMonthlyProgress` läser den kolumnen
 *   först i sin `||`-kedja. Testet nedan bevisar att kedjan ändå landar rätt
 *   (faller vidare till `start_date`) med en fixtur utan det fältet.
 *
 * vitest kör den riktiga i18next-instansen med sv.json (se lärdomen
 * "i18n-svep-mönster") — testerna för calculateGoalCategories jämför alltså
 * mot de riktiga svenska strängarna, inte mot en fallback-nyckel.
 */

import { describe, it, expect } from 'vitest'
import { computeMonthlyProgress, calculateTrends, calculateGoalCategories } from './analytics'

describe('computeMonthlyProgress', () => {
  const now = new Date('2026-09-02T12:00:00Z')

  it('bygger rätt antal hinkar per intervall (quarter=3, year=12)', () => {
    expect(computeMonthlyProgress('quarter', [], [], now)).toHaveLength(3)
    expect(computeMonthlyProgress('year', [], [], now)).toHaveLength(12)
  })

  it('week och month ger samma enda hink (befintligt beteende, inte ändrat här)', () => {
    expect(computeMonthlyProgress('week', [], [], now)).toHaveLength(1)
    expect(computeMonthlyProgress('month', [], [], now)).toHaveLength(1)
  })

  it('räknar avslutade mål i rätt månad, ignorerar ej avslutade', () => {
    const goals = [
      { status: 'COMPLETED', completed_at: '2026-09-01T00:00:00Z' },
      { status: 'IN_PROGRESS', completed_at: '2026-09-01T00:00:00Z' }, // ska INTE räknas
      { status: 'COMPLETED', completed_at: '2026-08-15T00:00:00Z' },
    ]
    const buckets = computeMonthlyProgress('quarter', goals, [], now)
    // quarter med now=2026-09-02 ⇒ juli, augusti, september
    const sep = buckets.find(b => b.month === 'Sep')!
    const aug = buckets.find(b => b.month === 'Aug')!
    expect(sep.value).toBe(1)
    expect(aug.value).toBe(1)
  })

  it('faller tillbaka på updated_at när completed_at saknas', () => {
    const goals = [{ status: 'COMPLETED', completed_at: null, updated_at: '2026-09-02T00:00:00Z' }]
    const buckets = computeMonthlyProgress('month', goals, [], now)
    expect(buckets[0].value).toBe(1)
  })

  it('placeringar räknas via start_date — prod har aldrig placement_date (schema-snapshot)', () => {
    const placements = [
      { start_date: '2026-09-01T00:00:00Z', created_at: '2026-08-01T00:00:00Z' },
    ]
    const buckets = computeMonthlyProgress('month', [], placements, now)
    expect(buckets[0].value).toBe(1)
  })

  it('faller tillbaka på created_at när start_date saknas', () => {
    const placements = [{ start_date: null, created_at: '2026-09-01T00:00:00Z' }]
    const buckets = computeMonthlyProgress('month', [], placements, now)
    expect(buckets[0].value).toBe(1)
  })

  it('ogiltigt/saknat datum ökar ingen hink och kastar inte', () => {
    const goals = [{ status: 'COMPLETED', completed_at: 'inte-ett-datum' }]
    expect(() => computeMonthlyProgress('month', goals, [], now)).not.toThrow()
    const buckets = computeMonthlyProgress('month', goals, [], now)
    expect(buckets[0].value).toBe(0)
    for (const b of buckets) expect(Number.isFinite(b.value)).toBe(true)
  })

  it('en månad utanför fönstret bumpas inte (index saknas i indexByKey)', () => {
    const goals = [{ status: 'COMPLETED', completed_at: '2020-01-01T00:00:00Z' }]
    const buckets = computeMonthlyProgress('month', goals, [], now)
    expect(buckets.every(b => b.value === 0)).toBe(true)
  })
})

describe('calculateTrends', () => {
  const now = new Date('2026-09-02T12:00:00Z')

  function deltagare(over: Record<string, unknown> = {}) {
    return { has_cv: false, last_login: null, ...over }
  }

  it('delar aldrig med noll deltagare — tomma listor ger 0, inte NaN', () => {
    const trends = calculateTrends([], [], [], [], now)
    expect(trends.cvCompletion).toEqual({ value: 0, isPositive: true })
    expect(trends.goalsCompletion).toEqual({ value: 0, isPositive: true })
    expect(trends.engagement).toEqual({ value: 0, isPositive: true })
    expect(Number.isNaN(trends.cvCompletion.value)).toBe(false)
  })

  it('placementTime är alltid 0/positiv — ingen historisk serie finns', () => {
    const trends = calculateTrends(
      [deltagare({ has_cv: true })],
      [deltagare({ has_cv: true })],
      [],
      [],
      now
    )
    expect(trends.placementTime).toEqual({ value: 0, isPositive: true })
  })

  it('räknar en verklig procentuell ökning i CV-täckning', () => {
    const current = [deltagare({ has_cv: true }), deltagare({ has_cv: true }), deltagare({ has_cv: false })]
    const previous = [deltagare({ has_cv: true }), deltagare({ has_cv: false }), deltagare({ has_cv: false })]
    const trends = calculateTrends(current, previous, [], [], now)
    // 66.7% vs 33.3% ⇒ +100%
    expect(trends.cvCompletion.isPositive).toBe(true)
    expect(trends.cvCompletion.value).toBeGreaterThan(0)
  })

  it('föregående period = 0 men aktuell > 0 ⇒ +100 %, aldrig division med noll', () => {
    const current = [
      { status: 'COMPLETED' },
    ]
    const trends = calculateTrends([], [], current, [], now)
    expect(trends.goalsCompletion).toEqual({ value: 100, isPositive: true })
  })

  it('engagemang räknas mot injicerad now — deterministiskt, inget new Date() i testet', () => {
    const recentlyActive = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    const staleActive = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const current = [deltagare({ last_login: recentlyActive }), deltagare({ last_login: staleActive })]
    const trends = calculateTrends(current, [], [], [], now)
    // 1 av 2 engagerade ⇒ 50%, jämfört med föregående period utan deltagare (0) ⇒ +100%
    expect(trends.engagement).toEqual({ value: 100, isPositive: true })
  })
})

describe('calculateGoalCategories', () => {
  it('tomt underlag ger tom lista — INTE tre påhittade nollor (KK6-rättelsen)', () => {
    expect(calculateGoalCategories([])).toEqual([])
  })

  it('kategoriserar på nyckelord i titeln med de riktiga svenska etiketterna', () => {
    const goals = [
      { title: 'Uppdatera mitt CV' },
      { title: 'Ansök till tre jobb' },
      { title: 'Öva inför intervju' },
    ]
    const result = calculateGoalCategories(goals)
    const categories = result.map(r => r.category)
    expect(categories).toContain('CV-förbättring')
    expect(categories).toContain('Jobbansökningar')
    expect(categories).toContain('Intervjuträning')
  })

  it('mål utan matchande nyckelord hamnar i "Övrigt"', () => {
    const result = calculateGoalCategories([{ title: 'Något helt annat' }])
    expect(result).toEqual([{ category: 'Övrigt', count: 1 }])
  })

  it('sorterar fallande på antal och begränsar till 5 kategorier', () => {
    const goals = [
      { title: 'söka jobb 1' }, { title: 'söka jobb 2' }, { title: 'söka jobb 3' },
      { title: 'cv 1' },
      { title: 'intervju 1' },
      { title: 'nätverka 1' },
      { title: 'kurs 1' },
      { title: 'något ospecifikt' },
    ]
    const result = calculateGoalCategories(goals)
    expect(result.length).toBeLessThanOrEqual(5)
    expect(result[0]).toEqual({ category: 'Jobbansökningar', count: 3 })
  })
})

describe('negativ kontroll — testerna kan falla', () => {
  it('hade fällt på den gamla implementationen (tre påhittade nollor vid tomt underlag)', () => {
    // Den gamla grenen i AnalyticsTab.tsx innan KK6/utbrytningen.
    const gammalImplementation = (goals: unknown[]) => {
      if (goals.length === 0) {
        return [
          { category: 'CV-förbättring', count: 0 },
          { category: 'Jobbansökningar', count: 0 },
          { category: 'Intervjuträning', count: 0 },
        ]
      }
      return []
    }
    // Bekräftar att den gamla koden verkligen fabricerade tre nollor — annars
    // bevisar testet ovan ("tomt underlag ger tom lista") ingenting om att
    // regressionen någonsin fanns.
    expect(gammalImplementation([])).toHaveLength(3)
    expect(calculateGoalCategories([])).toHaveLength(0)
  })
})
