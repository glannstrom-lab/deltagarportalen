import { describe, it, expect } from 'vitest'
import { grundersattningRader, grundersattningCsv } from './grundersattningUnderlag'
import type { ActivityPlan } from './aktivitetApi'

const plan = (o: Partial<ActivityPlan>): ActivityPlan => ({
  id: 'p', participant_id: 'd', consultant_id: 'k', org_id: 'o', template_id: null, template_name: null,
  start_date: '2026-01-01', end_date: null, weekly_hours_target: 0, jobsearch_hours_per_week: 0,
  target_reason: null, status: 'active', plan_text: null, decided_at: null, forsorjningshinder: null,
  nedsattning_underlag_lamnat_at: null, af_registered_at: null, case_reference: 'A-1',
  created_at: '', updated_at: '', ...o,
})

describe('KF2: grundersättning per månad (FFU ROM2 §5.1)', () => {
  it('nivå C, 100 %, hela april 2026 = 20 dagar × 90 kr', () => {
    const [r] = grundersattningRader([plan({ rom_niva: 'C', deltagandegrad: 100 })], '2026-04', () => 'Ada')
    expect(r).toMatchObject({ dagar: 20, dagbelopp: 90, faktor: 1, summa: 1800 })
  })

  it('under 100 % ger 80 %', () => {
    const [r] = grundersattningRader([plan({ rom_niva: 'A', deltagandegrad: 75 })], '2026-04', () => 'Bo')
    expect(r.summa).toBe(20 * 55 * 0.8)
  })

  it('saknad nivå eller grad: ingen summa, och raden säger vad som fattas', () => {
    const [r] = grundersattningRader([plan({ rom_niva: null, deltagandegrad: null })], '2026-04', () => 'Cy')
    expect(r.summa).toBeNull()
    expect(r.anmarkning).toBe('Ange nivå och deltagandegrad på planen')
  })

  it('planer som inte överlappar månaden kommer inte med', () => {
    const rader = grundersattningRader([
      plan({ id: 'a', start_date: '2026-05-01', rom_niva: 'B', deltagandegrad: 100 }),
      plan({ id: 'b', start_date: '2026-01-01', end_date: '2026-03-31', rom_niva: 'B', deltagandegrad: 100 }),
    ], '2026-04', () => 'X')
    expect(rader).toHaveLength(0)
  })

  it('CSV: semikolon, decimalkomma, BOM, summa och antal ofullständiga — inget personnummer-fält', () => {
    const rader = grundersattningRader([
      plan({ id: 'a', rom_niva: 'A', deltagandegrad: 75 }),
      plan({ id: 'b', rom_niva: null, deltagandegrad: 100 }),
    ], '2026-04', (p) => (p.id === 'a' ? 'Ada' : 'Bo'))
    const csv = grundersattningCsv(rader, '2026-04')
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv).toContain('Ada;A-1;A;2026-01-01;;75;20;55;0,8;880;')
    expect(csv).toMatch(/Summa;;;;;;;;;880;1 rad\(er\) utan summa/)
    expect(csv).not.toMatch(/personnummer/i)
  })
})
