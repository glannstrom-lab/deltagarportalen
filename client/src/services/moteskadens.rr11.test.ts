/**
 * RR11 (rollspelet 2026-09-27): efter att coachen bokat ett fysiskt möte 30/9
 * stod chipet oförändrat rött ("33 dagar sedan · inget fysiskt än"), dialogen
 * var förvald till video trots att regeln krävde fysiskt, och det fanns ingen
 * väg att markera ett möte som hållet — så chipet kunde aldrig röra sig.
 */
import { describe, it, expect } from 'vitest'
import { kadensForMoten, kadensText, forvaldMotestyp, vantarPaBekraftelse, KADENS_REGEL, type MoteRad } from './moteskadens'

const IDAG = new Date(2026, 8, 27, 10, 0, 0)
const dag = (n: number, h = 10) => { const d = new Date(IDAG); d.setDate(d.getDate() + n); d.setHours(h, 0, 0, 0); return d.toISOString() }
const m = (n: number, o: Partial<MoteRad> = {}): MoteRad => ({ participant_id: 'p1', scheduled_at: dag(n), meeting_type: 'video', status: 'completed', ...o })

describe('RR11 — bokat möte syns i chipet', () => {
  it('ett bokat fysiskt möte framåt står i texten, men läget ändras inte förrän det hållits', () => {
    const k = kadensForMoten([m(-33), m(3, { status: 'scheduled', meeting_type: 'physical' })], IDAG)
    expect(k.laget).toBe('over')
    expect(kadensText(k)).toBe('Senaste möte 33 dagar sedan · inget fysiskt än · fysiskt möte bokat 30/9')
  })
  it('inget möte än men ett bokat', () => {
    const k = kadensForMoten([m(2, { status: 'scheduled', meeting_type: 'phone' })], IDAG)
    expect(kadensText(k)).toBe('Inget möte än · telefonmöte bokat 29/9')
  })
})

describe('RR11 — förvald mötestyp följer regeln', () => {
  it('inget fysiskt möte någonsin → fysiskt', () => {
    expect(forvaldMotestyp(kadensForMoten([m(-3)], IDAG))).toBe('physical')
  })
  it('fysiskt för 20 dagar sedan → nästa möte (inom 14 dagar) måste vara fysiskt', () => {
    expect(forvaldMotestyp(kadensForMoten([m(-20, { meeting_type: 'physical' })], IDAG))).toBe('physical')
  })
  it('fysiskt för 5 dagar sedan → video duger', () => {
    expect(forvaldMotestyp(kadensForMoten([m(-5, { meeting_type: 'physical' })], IDAG))).toBe('video')
  })
  it('fysiskt redan bokat → inget krav på ett till', () => {
    expect(forvaldMotestyp(kadensForMoten([m(4, { status: 'scheduled', meeting_type: 'physical' })], IDAG))).toBe('video')
  })
})

describe('RR11 — möten som väntar på bekräftelse', () => {
  it('ett inbokat möte vars tid passerat väntar; ett framtida gör det inte', () => {
    expect(vantarPaBekraftelse({ status: 'scheduled', scheduled_at: dag(-1) }, IDAG)).toBe(true)
    expect(vantarPaBekraftelse({ status: 'scheduled', scheduled_at: dag(1) }, IDAG)).toBe(false)
    expect(vantarPaBekraftelse({ status: 'completed', scheduled_at: dag(-1) }, IDAG)).toBe(false)
  })
  it('regeln står i klartext med båda gränserna', () => {
    expect(KADENS_REGEL).toContain('14:e dag')
    expect(KADENS_REGEL).toContain('28:e dag')
  })
})
