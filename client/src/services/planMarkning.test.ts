/**
 * RK40 (ärendenummer utan personnummer) och RR27 (märkta pass), rollspelet 2026-09-27.
 */
import { describe, it, expect } from 'vitest'
import {
  arFysisktPass,
  arLeverantorsledd,
  arendeKolumn,
  forvaldaFlaggor,
  fysiskHarledd,
  innehallerPersonnummer,
  passKolumner,
  planensArende,
  underrattadKolumner,
  valideraArendenummer,
} from './planMarkning'

describe('RK40: personnummer nekas som ärendenummer', () => {
  it('känner igen personnummer i alla vanliga former', () => {
    for (const pnr of ['850101-1234', '8501011234', '19850101-1234', '198501011234', '850101+1234', '850101 1234', 'AF 19850101-1234', 'Dnr 850101-1234 (Anna)']) {
      expect(innehallerPersonnummer(pnr), pnr).toBe(true)
    }
  })

  it('känner igen samordningsnummer (dag + 60)', () => {
    expect(innehallerPersonnummer('850161-1234')).toBe(true)
  })

  it('släpper igenom ärendenummer utan personnummerform', () => {
    for (const nr of ['KS-2026/0042', 'Dnr 2026-1234', '1234567890', 'A-12345', '2026-000123', '851301-1234', '850132-1234', '12345678901234']) {
      expect(innehallerPersonnummer(nr), nr).toBe(false)
    }
  })

  it('validering: tomt = null, personnummer nekas, för långt nekas, annars trimmat', () => {
    expect(valideraArendenummer('   ')).toEqual({ ok: true, varde: null })
    expect(valideraArendenummer(' KS-2026/0042 ')).toEqual({ ok: true, varde: 'KS-2026/0042' })
    const pnr = valideraArendenummer('850101-1234')
    expect(pnr.ok).toBe(false)
    if (!pnr.ok) expect(pnr.fel).toMatch(/personnummer/)
    expect(valideraArendenummer('x'.repeat(61)).ok).toBe(false)
  })

  it('kolumnen skrivs bara när den finns', () => {
    expect(arendeKolumn('KS-1', false)).toEqual({})
    expect(arendeKolumn('KS-1', true)).toEqual({ case_reference: 'KS-1' })
    expect(arendeKolumn(null, true)).toEqual({ case_reference: null })
  })

  it('planens ärende: tomt och saknat fält är null', () => {
    expect(planensArende({})).toBeNull()
    expect(planensArende({ case_reference: '  ' })).toBeNull()
    expect(planensArende({ case_reference: 'KS-1' })).toBe('KS-1')
  })
})

describe('RR27: märkningen vinner över härledningen', () => {
  const arbetsplats = { activity_type: 'workplace' as const, location: 'Nordfrakt' }
  const digitalt = { activity_type: 'jobsearch' as const, location: null }

  it('omärkta pass räknas på härledningen, som före RR27', () => {
    expect(arFysisktPass(arbetsplats)).toBe(true)
    expect(arFysisktPass(digitalt)).toBe(false)
    expect(arLeverantorsledd({ activity_type: 'jobsearch' })).toBe(true)
    expect(arLeverantorsledd({ activity_type: 'jobsearch_own' })).toBe(false)
    expect(arLeverantorsledd({ activity_type: 'sfi' })).toBe(false)
    expect(fysiskHarledd({ ...arbetsplats, is_physical: null })).toBe(true)
  })

  it('märkningen gäller även när den säger emot typ och plats', () => {
    expect(arFysisktPass({ ...arbetsplats, is_physical: false })).toBe(false)
    expect(arFysisktPass({ ...digitalt, is_physical: true })).toBe(true)
    expect(arLeverantorsledd({ activity_type: 'jobsearch', is_provider_led: false })).toBe(false)
    expect(arLeverantorsledd({ activity_type: 'jobsearch_own', is_provider_led: true })).toBe(true)
    expect(fysiskHarledd({ is_physical: false })).toBe(false)
  })

  it('förvalet i dialogen följer härledningen', () => {
    expect(forvaldaFlaggor(arbetsplats)).toEqual({ is_provider_led: true, is_physical: true })
    expect(forvaldaFlaggor({ activity_type: 'jobsearch_own', location: null })).toEqual({ is_provider_led: false, is_physical: false })
  })

  it('pass-kolumnerna är tomma före migrationen och skriver bara det som angetts efter', () => {
    expect(passKolumner({ is_physical: true, work_placement_id: 'w1' }, false)).toEqual({})
    expect(passKolumner({ is_physical: false }, true)).toEqual({ is_physical: false })
    expect(passKolumner({ is_provider_led: true, is_physical: true, work_placement_id: 'w1' }, true)).toEqual({ is_provider_led: true, is_physical: true, work_placement_id: 'w1' })
  })

  it('underrättad: tid och vem hör ihop, null nollställer båda', () => {
    expect(underrattadKolumner('2026-09-27T10:00:00Z', 'k1', false)).toEqual({})
    expect(underrattadKolumner('2026-09-27T10:00:00Z', 'k1', true)).toEqual({ af_notified_at: '2026-09-27T10:00:00Z', af_notified_by: 'k1' })
    expect(underrattadKolumner(null, 'k1', true)).toEqual({ af_notified_at: null, af_notified_by: null })
  })
})
