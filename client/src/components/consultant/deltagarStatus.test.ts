/**
 * Läget Uppföljning (beslut 2026-10-11). Mutationer som ska fälla:
 *   · raknasMotTaket returnerar alltid true → testet om taket faller;
 *   · foreslaUppfoljning ignorerar visaAvtalskrav → kommuntestet faller.
 */
import { describe, it, expect } from 'vitest'
import { antalMotTaket, arDeltagarStatus, DELTAGAR_STATUSAR, foreslaUppfoljning, raknasMotTaket, STATUS_ORD } from './deltagarStatus'
import { STATUS_ETIKETT } from './deltagarExport'

describe('deltagarStatus', () => {
  it('uppföljning räknas inte mot taket, allt annat gör det', () => {
    expect(raknasMotTaket('FOLLOW_UP')).toBe(false)
    for (const s of ['ACTIVE', 'ON_HOLD', 'INACTIVE', 'COMPLETED', null, undefined]) expect(raknasMotTaket(s)).toBe(true)
  })

  it('taket räknas som antal minus de i uppföljning — och alla när kolumnen saknas (före migrationen)', () => {
    expect(antalMotTaket({ antal_deltagare: 52, antal_uppfoljning: 4 })).toBe(48)
    expect(antalMotTaket({ antal_deltagare: 52 })).toBe(52)
    expect(antalMotTaket({ antal_deltagare: 52, antal_uppfoljning: null })).toBe(52)
  })

  it('föreslås bara där Rusta och matcha-avtalet gäller, och inte för den som redan är där eller avslutad', () => {
    expect(foreslaUppfoljning(true, 'ACTIVE')).toBe(true)
    expect(foreslaUppfoljning(true, undefined)).toBe(true)
    expect(foreslaUppfoljning(false, 'ACTIVE')).toBe(false)
    expect(foreslaUppfoljning(null, 'ACTIVE')).toBe(false)
    expect(foreslaUppfoljning(true, 'FOLLOW_UP')).toBe(false)
    expect(foreslaUppfoljning(true, 'COMPLETED')).toBe(false)
  })

  it('varje status har ett ord, också i exporten', () => {
    for (const s of DELTAGAR_STATUSAR) {
      expect(STATUS_ORD[s]).toBeTruthy()
      expect(STATUS_ETIKETT[s]).toBeTruthy()
    }
    expect(arDeltagarStatus('FOLLOW_UP')).toBe(true)
    expect(arDeltagarStatus('NYTT')).toBe(false)
  })
})
