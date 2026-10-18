import { describe, it, expect } from 'vitest'
import { forslagTidpunkt } from './motesforslagApi'

describe('O13: tidpunkten för ett mötesförslag', () => {
  const nu = new Date('2026-10-18T10:00:00')

  it('datum och klockslag blir en ISO-tid i framtiden', () => {
    const iso = forslagTidpunkt('2026-10-20', '09:30', nu)
    expect(new Date(iso).getTime()).toBe(new Date('2026-10-20T09:30:00').getTime())
  })

  it('en tid som redan passerat nekas — databasen nekar den ändå, men deltagaren ska få veta varför', () => {
    expect(() => forslagTidpunkt('2026-10-18', '09:00', nu)).toThrow('passerad')
  })

  it('felaktiga fält nekas', () => {
    expect(() => forslagTidpunkt('20-10-2026', '09:00', nu)).toThrow('ogiltig')
    expect(() => forslagTidpunkt('2026-10-20', '9', nu)).toThrow('ogiltig')
  })
})
