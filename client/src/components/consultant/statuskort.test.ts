/**
 * KC13: statuskorten i chefsvyn. Ärlighetsregeln är det som prövas: ett tal
 * utan underlag ska bli "—" med ett varför, aldrig 0 % — och före migrationen
 * (kolumnerna saknas) får veckomål och dokumentation inte visas som noll.
 *
 * Kan falla: ta bort `harKolumner`-kontrollen (före-migrationstestet faller),
 * eller nämnarkontrollen i tal() (nolltestet faller).
 */
import { describe, it, expect } from 'vitest'
import { statuskort } from './statuskort'
import type { CaseloadRow } from '@/services/orgApi'

const rad = (o: Partial<CaseloadRow>): CaseloadRow => ({
  org_id: 'o1', org_name: 'Org', consultant_id: 'u', role: 'konsulent', first_name: 'K', last_name: 'K',
  antal_deltagare: 5, antal_aktiva_planer: 4, ogiltig_franvaro_30d: 0,
  antal_veckomal_underlag: 3, antal_veckomal_nadda: 2, antal_dokumentation_klar: 1, ...o,
})

describe('KC13 statuskort', () => {
  it('summerar över konsulenter och skriver "x av y"', () => {
    const k = statuskort([rad({}), rad({ consultant_id: 'v', antal_deltagare: 3, antal_aktiva_planer: 2, antal_veckomal_underlag: 2, antal_veckomal_nadda: 2, antal_dokumentation_klar: 0 })])
    expect(k.plan.text).toBe('6 av 8')
    expect(k.veckomal.text).toBe('4 av 5')
    expect(k.dokumentation.text).toBe('1 av 6')
  })

  it('procent först från tio i nämnaren', () => {
    expect(statuskort([rad({ antal_deltagare: 10, antal_aktiva_planer: 7 })]).plan.text).toBe('7 av 10 (70 %)')
    expect(statuskort([rad({ antal_deltagare: 9, antal_aktiva_planer: 7 })]).plan.text).toBe('7 av 9')
  })

  it('deltagare i uppföljning räknas inte i nämnaren', () => {
    expect(statuskort([rad({ antal_deltagare: 6, antal_uppfoljning: 2, antal_aktiva_planer: 4 })]).plan.text).toBe('4 av 4')
  })

  it('noll i nämnaren ger "—" och ett varför, aldrig 0 %', () => {
    const k = statuskort([rad({ antal_deltagare: 0, antal_aktiva_planer: 0, antal_veckomal_underlag: 0, antal_veckomal_nadda: 0, antal_dokumentation_klar: 0 })])
    for (const t of [k.plan, k.veckomal, k.dokumentation]) {
      expect(t.text).toBe('—')
      expect(t.visas).toBe(false)
      if (!t.visas) expect(t.varfor.length).toBeGreaterThan(10)
    }
  })

  it('före migrationen: veckomål och dokumentation "—", inte 0 — planen räknas ändå', () => {
    const k = statuskort([rad({ antal_veckomal_underlag: undefined, antal_veckomal_nadda: undefined, antal_dokumentation_klar: undefined })])
    expect(k.plan.text).toBe('4 av 5')
    expect(k.veckomal.text).toBe('—')
    expect(k.dokumentation.text).toBe('—')
    if (!k.veckomal.visas) expect(k.veckomal.varfor).toMatch(/databasen/)
  })

  it('aldrig över 100 %: fler aktiva planer än deltagare kapas', () => {
    expect(statuskort([rad({ antal_deltagare: 2, antal_aktiva_planer: 3 })]).plan.text).toBe('2 av 2')
  })
})
