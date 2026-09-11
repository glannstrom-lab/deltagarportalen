import { describe, it, expect } from 'vitest'
import { kadens, kadensForMoten, kadensText, dagarSedan, type MoteRad } from './moteskadens'

// Idag = tisdag 2026-09-15 kl 10 lokal tid.
const IDAG = new Date(2026, 8, 15, 10, 0, 0)

function forDagarSedan(n: number, hour = 13): string {
  const d = new Date(IDAG)
  d.setDate(d.getDate() - n)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

const mote = (dagar: number, o: Partial<MoteRad> = {}): MoteRad => ({
  participant_id: 'p1',
  scheduled_at: forDagarSedan(dagar),
  meeting_type: 'video',
  status: 'completed',
  ...o,
})

describe('dagarSedan räknar kalenderdagar i lokal tid', () => {
  it('ett möte kl 23 i går är 1 dag sedan, inte 0', () => {
    expect(dagarSedan(forDagarSedan(1, 23), IDAG)).toBe(1)
  })
  it('ett möte tidigt i dag är 0 dagar sedan', () => {
    expect(dagarSedan(forDagarSedan(0, 1), IDAG)).toBe(0)
  })
})

describe('kadensForMoten — 14-dagarsgränsen för individuellt möte', () => {
  it('13 dagar sedan (fysiskt) = snart (inom 3 dagar från gränsen)', () => {
    const k = kadensForMoten([mote(13, { meeting_type: 'physical' })], IDAG)
    expect(k.dagarSedanMote).toBe(13)
    expect(k.laget).toBe('snart')
  })
  it('14 dagar sedan = snart (gränsen är inte passerad)', () => {
    expect(kadensForMoten([mote(14, { meeting_type: 'physical' })], IDAG).laget).toBe('snart')
  })
  it('15 dagar sedan = över', () => {
    expect(kadensForMoten([mote(15, { meeting_type: 'physical' })], IDAG).laget).toBe('over')
  })
  it('5 dagar sedan med fysiskt möte = ok', () => {
    expect(kadensForMoten([mote(5, { meeting_type: 'physical' })], IDAG).laget).toBe('ok')
  })
})

describe('kadensForMoten — 28-dagarsgränsen för fysiskt', () => {
  it('fysiskt 27 dagar sedan men video i går = snart (fysiskt vinner)', () => {
    const k = kadensForMoten([mote(1), mote(27, { meeting_type: 'physical' })], IDAG)
    expect(k.dagarSedanMote).toBe(1)
    expect(k.veckorSedanFysiskt).toBe(3)
    expect(k.laget).toBe('snart')
  })
  it('fysiskt 29 dagar sedan men video i går = över', () => {
    const k = kadensForMoten([mote(1), mote(29, { meeting_type: 'physical' })], IDAG)
    expect(k.laget).toBe('over')
    expect(k.veckorSedanFysiskt).toBe(4)
  })
  it('bara video-möten ⇒ fysiskt saknas, flaggas som snart', () => {
    const k = kadensForMoten([mote(2), mote(9)], IDAG)
    expect(k.dagarSedanFysiskt).toBeNull()
    expect(k.veckorSedanFysiskt).toBeNull()
    expect(k.laget).toBe('snart')
  })
})

describe('kadensForMoten — vad som inte räknas', () => {
  it('inget möte alls = inget', () => {
    const k = kadensForMoten([], IDAG)
    expect(k).toEqual({ dagarSedanMote: null, veckorSedanFysiskt: null, dagarSedanFysiskt: null, laget: 'inget' })
  })
  it('inbokade och avbokade möten räknas inte, inte heller möten i framtiden', () => {
    const framtid = new Date(IDAG); framtid.setDate(framtid.getDate() + 3)
    const k = kadensForMoten([
      mote(2, { status: 'scheduled' }),
      mote(3, { status: 'cancelled', meeting_type: 'physical' }),
      { participant_id: 'p1', scheduled_at: framtid.toISOString(), meeting_type: 'physical', status: 'completed' },
      mote(20),
    ], IDAG)
    expect(k.dagarSedanMote).toBe(20)
    expect(k.laget).toBe('over')
  })
})

describe('kadens per deltagare', () => {
  it('grupperar på participant_id', () => {
    const m = kadens([mote(3), mote(40, { participant_id: 'p2', meeting_type: 'physical' })], IDAG)
    expect(m.get('p1')?.dagarSedanMote).toBe(3)
    expect(m.get('p2')?.laget).toBe('over')
    expect(m.get('p3')).toBeUndefined()
  })
})

describe('kadensText', () => {
  it('säger "Inget möte än" i stället för 0', () => {
    expect(kadensText(undefined)).toBe('Inget möte än')
    expect(kadensText(kadensForMoten([], IDAG))).toBe('Inget möte än')
  })
  it('skriver dagar och veckor', () => {
    expect(kadensText(kadensForMoten([mote(9), mote(22, { meeting_type: 'physical' })], IDAG))).toBe('Senaste möte 9 dagar sedan · fysiskt 3 v sedan')
    expect(kadensText(kadensForMoten([mote(0, { meeting_type: 'physical', scheduled_at: forDagarSedan(0, 1) })], IDAG))).toBe('Senaste möte i dag · fysiskt denna vecka')
    expect(kadensText(kadensForMoten([mote(1)], IDAG))).toBe('Senaste möte i går · inget fysiskt än')
  })
})
