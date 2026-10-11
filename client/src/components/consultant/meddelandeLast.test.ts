/**
 * "Läst HH:MM" under konsulentens meddelande (beslut 2026-10-11). Ett oläst
 * meddelande får ingen rad; före migrationen (ingen read_at) står bara "Läst".
 * Mutation: returnera 'Läst' även när is_read är false → första testet faller.
 */
import { describe, it, expect } from 'vitest'
import { lastText } from './meddelandeLast'

const nu = new Date('2026-10-11T15:00:00+02:00')

describe('lastText', () => {
  it('oläst ger ingen rad — varken "Läst" eller "Inte läst"', () => {
    expect(lastText({ is_read: false, read_at: null }, nu)).toBeNull()
    expect(lastText({ is_read: null }, nu)).toBeNull()
  })

  it('läst utan tid (före migrationen) påstår ingen tid', () => {
    expect(lastText({ is_read: true }, nu)).toBe('Läst')
    expect(lastText({ is_read: true, read_at: null }, nu)).toBe('Läst')
  })

  it('läst i dag: klockslaget i svensk tid', () => {
    expect(lastText({ is_read: true, read_at: '2026-10-11T12:32:00Z' }, nu)).toBe('Läst 14:32')
  })

  it('läst en annan dag: dag och klockslag', () => {
    expect(lastText({ is_read: true, read_at: '2026-10-03T07:05:00Z' }, nu)).toBe('Läst 3 okt 09:05')
  })
})
