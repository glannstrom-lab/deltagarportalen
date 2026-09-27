/**
 * RK14 (rollspelet 2026-09-27): "Senaste kontakt: 3" — ett tal utan enhet som
 * inte rörde sig efter en Oro-anteckning och ett bokat möte.
 */
import { describe, it, expect } from 'vitest'
import { senasteKontakt, kontaktAlderText } from './senasteKontakt'

const NU = new Date(2026, 8, 27, 15, 0, 0)
const dag = (n: number) => { const d = new Date(NU); d.setDate(d.getDate() - n); d.setHours(10, 0, 0, 0); return d.toISOString() }

describe('senasteKontakt', () => {
  it('en journalanteckning i dag flyttar kontakten, fast den loggade är 3 dagar gammal', () => {
    const k = senasteKontakt({ last_contact_at: dag(3), last_note_date: dag(0) }, NU)
    expect(k).toEqual({ at: dag(0), kalla: 'journal' })
  })
  it('ett genomfört möte räknas; ett inbokat (även passerat) gör det inte', () => {
    expect(senasteKontakt({ last_contact_at: dag(10), moten: [{ scheduled_at: dag(2), status: 'completed' }] }, NU)?.kalla).toBe('mote')
    expect(senasteKontakt({ last_contact_at: dag(10), moten: [{ scheduled_at: dag(1), status: 'scheduled' }] }, NU)?.kalla).toBe('loggad')
  })
  it('ett meddelande räknas', () => {
    expect(senasteKontakt({ last_contact_at: dag(10), senasteMeddelande: dag(4) }, NU)?.kalla).toBe('meddelande')
  })
  it('inget underlag → null, aldrig 0', () => {
    expect(senasteKontakt({}, NU)).toBeNull()
  })
})

describe('kontaktAlderText har alltid en enhet', () => {
  it('i dag, i går, N dagar sedan', () => {
    expect(kontaktAlderText(dag(0), NU)).toBe('i dag')
    expect(kontaktAlderText(dag(1), NU)).toBe('i går')
    expect(kontaktAlderText(dag(3), NU)).toBe('3 dagar sedan')
  })
})
