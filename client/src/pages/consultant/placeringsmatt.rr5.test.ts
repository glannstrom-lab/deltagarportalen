/**
 * RR5 (rollspelet 2026-09-27): 3-månadersuppföljningen var en kryssruta som
 * gick att sätta tio dagar före punkten, 6 mån gick att kryssa före 3 mån, och
 * punkten räknades som 90 dagar (9/7 → 7/10) i stället för tre månader (9/10).
 */
import { describe, it, expect } from 'vitest'
import { uppfoljningspunkt, kanRegistreraUppfoljning, followupStatus } from './placeringsmatt'

describe('uppfoljningspunkt — kalendermånader, inte 90/180 dagar', () => {
  it('9/7 + 3 mån = 9/10 och + 6 mån = 9/1', () => {
    expect(uppfoljningspunkt('2026-07-09', '3m')).toBe('2026-10-09')
    expect(uppfoljningspunkt('2026-07-09', '6m')).toBe('2027-01-09')
  })
  it('en dag som inte finns i målmånaden klipps till månadens sista', () => {
    expect(uppfoljningspunkt('2026-08-31', '3m')).toBe('2026-11-30')
  })
  it('utan startdatum finns ingen punkt', () => {
    expect(uppfoljningspunkt(null, '3m')).toBeNull()
  })
  it('followupStatus räknar mot kalendermånaden (7/10 är två dagar kvar, inte "väntar")', () => {
    const s = followupStatus({ startDate: '2026-07-09', followup3m: false, followup6m: false }, new Date(2026, 9, 7, 12))
    expect(s.tone).toBe('soon')
    expect(s.text).toBe('3-månadersuppföljning om 2 dagar')
  })
})

describe('kanRegistreraUppfoljning', () => {
  const rad = { startDate: '2026-07-09', followup3m: false, followup6m: false }
  it('6 mån före 3 mån är spärrat', () => {
    const b = kanRegistreraUppfoljning(rad, '6m', '2027-02-01')
    expect(b.tillaten).toBe(false)
  })
  it('före punkten krävs motivering', () => {
    const b = kanRegistreraUppfoljning(rad, '3m', '2026-09-29')
    expect(b).toMatchObject({ tillaten: true, kraverMotivering: true, punkt: '2026-10-09' })
  })
  it('på eller efter punkten krävs ingen motivering', () => {
    expect(kanRegistreraUppfoljning(rad, '3m', '2026-10-09')).toMatchObject({ tillaten: true, kraverMotivering: false })
  })
  it('en registrerad uppföljning registreras inte igen, och startdatum krävs', () => {
    expect(kanRegistreraUppfoljning({ ...rad, followup3m: true }, '3m', '2026-11-01').tillaten).toBe(false)
    expect(kanRegistreraUppfoljning({ ...rad, startDate: null }, '3m', '2026-11-01').tillaten).toBe(false)
    expect(kanRegistreraUppfoljning({ ...rad, followup3m: true }, '6m', '2027-01-09')).toMatchObject({ tillaten: true, kraverMotivering: false })
  })
})
