/**
 * RD13 (rollspelet 2026-09-27): efter en frånvaroanmälan stod passtiden
 * "09:00:00–12:00:00" i Min vecka. Postgres svarar `time` med sekunder;
 * listMySessions kortar till HH:MM (mapSession), men franvaroApi returnerade
 * raden rått och Min vecka lade den rakt i cachen.
 *
 * Mutation: returnera `data as ActivitySession` igen → testerna faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

let rad: Record<string, unknown> = {}
vi.mock('@/lib/supabase', () => {
  const kedja: Record<string, unknown> = {}
  for (const m of ['update', 'eq', 'select']) kedja[m] = () => kedja
  kedja.maybeSingle = async () => ({ data: rad, error: null })
  return {
    supabase: {
      from: () => kedja,
      auth: { getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }) },
    },
  }
})

import { franvaroApi } from './franvaroApi'

beforeEach(() => {
  rad = { id: 's1', date: '2026-09-28', start_time: '09:00:00', end_time: '12:00:00', title: 'Verkstad' }
})

describe('franvaroApi ger passtiden utan sekunder (RD13)', () => {
  it('anmal', async () => {
    const s = await franvaroApi.anmal('s1', { orsak: 'sick' })
    expect(s.start_time).toBe('09:00')
    expect(s.end_time).toBe('12:00')
  })
  it('angra', async () => {
    const s = await franvaroApi.angra('s1')
    expect(`${s.start_time}–${s.end_time}`).toBe('09:00–12:00')
  })
  it('forklara', async () => {
    const s = await franvaroApi.forklara('s1', 'Bussen ställdes in')
    expect(s.start_time).toBe('09:00')
  })
})
