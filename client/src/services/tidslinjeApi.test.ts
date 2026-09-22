/**
 * Tidslinjen blandar två tidsformat: timestamptz i UTC ("…+00:00") från
 * journal, mål, möten och platser, och lokal tid utan zon (`date` +
 * `start_time`) från passen. Fram till 2026-09-22 sorterades de som strängar —
 * ett pass kl. 09:00 svensk tid hamnade då FÖRE (senare än) en anteckning
 * kl. 10:30 samma dag, eftersom den lagras som 08:30Z.
 *
 * Tidszonen sätts uttryckligen: CI kör i UTC och kan aldrig se felet annars.
 * Mutation (kontrollerad): återställ strängjämförelsen i sorteringen och
 * `${date}T${start_time}` som tidpunkt → testet faller.
 */
process.env.TZ = 'Europe/Stockholm'

import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase', () => {
  const tom: Record<string, unknown> = {}
  tom.select = () => tom
  tom.eq = () => tom
  tom.then = (res: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(res)
  return { supabase: { from: () => tom } }
})

vi.mock('@/services/consultantService', () => ({
  consultantService: {
    getJournalEntries: async () => [
      { id: 'j1', category: 'GENERAL', content: 'Samtal om CV', created_at: '2026-09-22T08:30:00.123456+00:00' },
    ],
    getGoalsForParticipant: async () => [],
  },
}))

vi.mock('@/services/aktivitetApi', () => ({
  aktivitetsplanApi: {
    listForParticipant: async () => [{ id: 'plan-1' }],
    listAllSessions: async () => [
      { id: 'p1', date: '2026-09-22', start_time: '09:00', title: 'Jobbsökarpass', attendance: 'present', self_checkin_at: null },
    ],
  },
}))

import { hamtaTidslinje } from './tidslinjeApi'

describe('hamtaTidslinje — sortering över tidszoner', () => {
  it('anteckningen 10:30 (08:30Z) kommer före passet 09:00 lokal tid', async () => {
    const { handelser } = await hamtaTidslinje('deltagare-1')
    expect(handelser.map(h => h.id)).toEqual(['journal-j1', 'pass-p1'])
  })

  it('passets tidpunkt är en riktig tidpunkt (09:00 svensk tid = 07:00Z)', async () => {
    const { handelser } = await hamtaTidslinje('deltagare-1')
    const pass = handelser.find(h => h.id === 'pass-p1')!
    expect(new Date(pass.tidpunkt).toISOString()).toBe('2026-09-22T07:00:00.000Z')
  })
})
