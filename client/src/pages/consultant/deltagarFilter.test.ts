import { describe, it, expect } from 'vitest'
import { manadensGranser, ogiltigFranvaroIVeckan, utanUnderlagIManaden } from './deltagarFilter'

describe('ogiltigFranvaroIVeckan', () => {
  // Onsdag 2026-10-14: veckan är mån 12 – sön 18.
  const p = (participant_id: string, date: string, attendance: string | null) => ({ participant_id, date, attendance })
  it('tar bara absent_invalid inom innevarande vecka', () => {
    const ut = ogiltigFranvaroIVeckan([
      p('a', '2026-10-13', 'absent_invalid'),
      p('b', '2026-10-13', 'absent_valid'),
      p('c', '2026-10-13', 'sick_certified'),
      p('d', '2026-10-09', 'absent_invalid'), // förra veckan
      p('e', '2026-10-19', 'absent_invalid'), // nästa vecka
      p('f', '2026-10-18', 'absent_invalid'), // söndag räknas
    ], '2026-10-14')
    expect([...ut].sort()).toEqual(['a', 'f'])
  })
})

describe('utanUnderlagIManaden', () => {
  const planer = [
    { participant_id: 'a', status: 'active' },
    { participant_id: 'b', status: 'active' },
    { participant_id: 'c', status: 'paused' },
  ]
  it('aktiva planer utan underlag i månaden; ångrade och andra månader räknas inte', () => {
    const ut = utanUnderlagIManaden(planer, [
      { participant_id: 'a', handed_over_at: new Date(2026, 9, 5, 12).toISOString(), withdrawn_at: null },
      { participant_id: 'b', handed_over_at: new Date(2026, 9, 5, 12).toISOString(), withdrawn_at: new Date(2026, 9, 5, 13).toISOString() },
    ], '2026-10-14')
    expect([...ut]).toEqual(['b'])
    const annan = utanUnderlagIManaden(planer, [{ participant_id: 'a', handed_over_at: new Date(2026, 8, 30, 12).toISOString(), withdrawn_at: null }], '2026-10-14')
    expect([...annan].sort()).toEqual(['a', 'b'])
  })
})

describe('manadensGranser', () => {
  it('första och sista dagen', () => {
    expect(manadensGranser('2026-02-10')).toEqual({ from: '2026-02-01', to: '2026-02-28' })
    expect(manadensGranser('2026-10-14')).toEqual({ from: '2026-10-01', to: '2026-10-31' })
  })
})
