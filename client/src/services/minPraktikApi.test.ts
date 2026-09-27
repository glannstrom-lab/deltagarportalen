/**
 * RD25: deltagarens egen praktikplats. Två saker som kan falla:
 *   1. Kolumnlistan hämtar aldrig konsulentens interna underlag — RLS släpper
 *      igenom hela raden till deltagaren, så skyddet är listan själv.
 *      Mutation: byt PRAKTIK_KOLUMNER mot '*' → faller.
 *   2. Pågående plats går före planerad.
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

import { PRAKTIK_KOLUMNER, valjAktuellPlats, type MinPraktik } from './minPraktikApi'

describe('minPraktikApi (RD25)', () => {
  it('hämtar aldrig konsulentens interna anteckningar', () => {
    expect(PRAKTIK_KOLUMNER).not.toContain('*')
    for (const intern of ['internal_adaptation_notes', 'employer_future_needs', 'employer_hiring_interest', 'supervision_notes', 'notes', 'physical_notes', 'participant_supervision_need']) {
      expect(PRAKTIK_KOLUMNER.split(/,\s*/)).not.toContain(intern)
    }
  })

  it('pågående plats går före planerad', () => {
    const p = (o: Partial<MinPraktik>) => ({ id: 'x', status: 'planerad', start_date: null, ...o }) as MinPraktik
    expect(valjAktuellPlats([p({ id: 'plan', start_date: '2026-09-01' }), p({ id: 'pag', status: 'pagaende', start_date: '2026-10-01' })])?.id).toBe('pag')
    expect(valjAktuellPlats([p({ id: 'sen', start_date: '2026-11-01' }), p({ id: 'tidig', start_date: '2026-10-01' })])?.id).toBe('tidig')
    expect(valjAktuellPlats([])).toBeNull()
  })
})
