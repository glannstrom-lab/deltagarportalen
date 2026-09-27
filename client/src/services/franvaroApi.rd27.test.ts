/**
 * RD27 (rollspelet 2026-09-27): hela dagen, flera dagar och eget jobbsökande.
 * Mutation: lägg tillbaka `activity_type === 'jobsearch_own'`-spärren i
 * kanAnmalaFranvaro → första testet faller.
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }) }, from: () => ({}) },
}))

import { franvaroApi, kanAnmalaFranvaro, passIPerioden, periodensSistaDag, PERIOD_MAX_DAGAR } from './franvaroApi'
import type { ActivitySession } from './aktivitetApi'

const nu = new Date('2026-09-27T18:00:00')
const s = (o: Record<string, unknown>): ActivitySession =>
  ({ id: 'x', date: '2026-09-28', start_time: '09:00', end_time: '12:00', attendance: null, activity_type: 'jobsearch', ...o }) as ActivitySession

describe('RD27: period och eget jobbsökande', () => {
  it('eget jobbsökande går att anmäla', () => {
    expect(kanAnmalaFranvaro(s({ activity_type: 'jobsearch_own' }), nu)).toBe(true)
  })

  it('perioden tar bara anmälningsbara pass inom datumen', () => {
    const lista = [
      s({ id: 'a', date: '2026-09-28' }),
      s({ id: 'b', date: '2026-09-29', activity_type: 'jobsearch_own' }),
      s({ id: 'c', date: '2026-09-29', attendance: 'present' }),
      s({ id: 'd', date: '2026-09-30', absence_reported_at: 'x', absence_reason: 'sick' }),
      s({ id: 'e', date: '2026-10-01' }),
      s({ id: 'f', date: '2026-09-27', start_time: '08:00' }),
    ]
    expect(passIPerioden(lista, '2026-09-27', '2026-09-30', nu).map((x) => x.id)).toEqual(['a', 'b'])
  })

  it(`en period får vara högst ${PERIOD_MAX_DAGAR} dagar och inte baklänges`, async () => {
    expect(periodensSistaDag('2026-09-28')).toBe('2026-10-11')
    await expect(franvaroApi.anmalPeriod('2026-09-28', '2026-10-12', { orsak: 'sick' })).rejects.toThrow(/högst/)
    await expect(franvaroApi.anmalPeriod('2026-09-28', '2026-09-27', { orsak: 'sick' })).rejects.toThrow(/före/)
  })
})
