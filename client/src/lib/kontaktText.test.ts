import { describe, it, expect } from 'vitest'
import { kontaktText, dagarSedanKontakt } from './kontaktText'

const t = (k: string, o?: Record<string, unknown>) => (o?.count !== undefined ? `${k}:${o.count}` : k)

describe('PG24 — samma kontaktstatus på Översikt och deltagarkortet', () => {
  it('saknad kontakt är "Aldrig kontaktad", inte "7+ dagar"', () => {
    expect(dagarSedanKontakt(null)).toBeNull()
    expect(kontaktText(t, null)).toBe('consultant.participants.neverContacted')
  })

  it('en gammal kontakt räknas i hela dagar', () => {
    const nu = Date.parse('2026-09-14T12:00:00Z')
    expect(dagarSedanKontakt('2026-09-01T12:00:00Z', nu)).toBe(13)
    expect(kontaktText(t, 13)).toBe('consultant.alerts.noContactDays:13')
  })

  it('en kontakt i framtiden ger 0, aldrig negativa dagar', () => {
    const nu = Date.parse('2026-09-14T12:00:00Z')
    expect(dagarSedanKontakt('2026-09-20T12:00:00Z', nu)).toBe(0)
  })
})
