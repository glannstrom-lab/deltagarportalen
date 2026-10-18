import { describe, it, expect } from 'vitest'
import { bekraftelseLage, type PlanBekraftelse } from './planBekraftelseApi'

const b = (plan_updated_at: string, confirmed_at: string): PlanBekraftelse =>
  ({ id: confirmed_at, plan_id: 'p', plan_updated_at, confirmed_at })

describe('KF5: bekräftelsens läge mot planens version', () => {
  it('ingen bekräftelse → ej', () => {
    expect(bekraftelseLage('2026-10-18T01:00:00Z', [])).toEqual({ lage: 'ej' })
  })

  it('samma ögonblick i olika skrivsätt räknas som samma version', () => {
    // Postgres svarar med mikrosekunder och +00:00; planen kan ha ms och Z.
    expect(bekraftelseLage('2026-10-18T01:00:00.192Z', [b('2026-10-18T01:00:00.192+00:00', '2026-10-18T08:00:00Z')]))
      .toEqual({ lage: 'aktuell', bekraftad: '2026-10-18T08:00:00Z' })
  })

  it('planen ändrad efter bekräftelsen → äldre, med datumet för den senaste', () => {
    const lage = bekraftelseLage('2026-10-19T10:00:00Z', [
      b('2026-10-10T10:00:00Z', '2026-10-11T08:00:00Z'),
      b('2026-10-18T01:00:00Z', '2026-10-18T08:00:00Z'),
    ])
    expect(lage).toEqual({ lage: 'aldre', bekraftad: '2026-10-18T08:00:00Z' })
  })
})
