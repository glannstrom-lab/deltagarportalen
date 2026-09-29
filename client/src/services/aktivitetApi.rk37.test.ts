/**
 * RK37/RK40 (rollspelet 2026-09-27): serieändring, pass på valda datum och
 * ärendenummer — mot en mockad Supabase-kedja.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const rad = (id: string, date: string) => ({
  id, plan_id: 'plan1', participant_id: 'delt', date, start_time: '10:00:00', end_time: '12:00:00',
  title: 'Verkstad', activity_type: 'jobsearch', location: null, notes: null, attendance: null,
  attendance_note: null, sick_certificate_received: false, marked_by: null, marked_at: null, self_checkin_at: null,
  created_at: '', updated_at: '',
})
let svar: { data: unknown; error: unknown } = { data: [], error: null }
const anrop: Array<[string, unknown[]]> = []
function kedja(): Record<string, unknown> {
  const k: Record<string, unknown> = {}
  for (const m of ['update', 'insert', 'delete', 'select', 'eq', 'in', 'gte', 'lte', 'order', 'is']) {
    k[m] = vi.fn((...a: unknown[]) => { anrop.push([m, a]); return k })
  }
  k.single = vi.fn(async () => svar)
  k.then = (res: (v: unknown) => unknown) => Promise.resolve(svar).then(res)
  return k
}
vi.mock('@/lib/supabase', () => ({
  supabase: { from: () => kedja(), auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'kons' } }, error: null })) } },
}))
vi.mock('./aktivitetNotiser', () => ({
  notisOgiltigFranvaro: vi.fn(async () => undefined),
  notisPassAndrat: vi.fn(async () => undefined),
  notisPlanSkapad: vi.fn(async () => undefined),
}))

import { aktivitetsplanApi } from './aktivitetApi'
import { notisPassAndrat } from './aktivitetNotiser'

beforeEach(() => { vi.clearAllMocks(); anrop.length = 0 })

describe('RK37: ändra en serie', () => {
  it('skriver samma ändring på alla id:n i ett anrop och ger EN notis', async () => {
    svar = { data: [rad('b', '2026-10-13'), rad('a', '2026-10-06')], error: null }
    const andrade = await aktivitetsplanApi.updateSessions(['a', 'b'], { start_time: '10:00', title: '  Verkstad ', location: '  ' })
    expect(anrop.find(([m]) => m === 'update')?.[1][0]).toEqual({ start_time: '10:00', title: 'Verkstad', location: null })
    expect(anrop.find(([m]) => m === 'in')?.[1]).toEqual(['id', ['a', 'b']])
    expect(andrade.map((s) => s.id)).toEqual(['a', 'b'])
    expect(andrade[0].start_time).toBe('10:00')
    expect(notisPassAndrat).toHaveBeenCalledTimes(1)
  })

  it('kastar när färre pass än begärt ändrades — ingen tyst halv serie', async () => {
    svar = { data: [rad('a', '2026-10-06')], error: null }
    await expect(aktivitetsplanApi.updateSessions(['a', 'b'], { title: 'X' })).rejects.toThrow(/Bara 1 av 2/)
  })

  it('märkningen skrivs sedan migrationen 20260927d_plan_och_pass', async () => {
    svar = { data: [rad('a', '2026-10-06')], error: null }
    await aktivitetsplanApi.updateSessions(['a'], { title: 'X' }, { is_physical: false })
    expect(anrop.find(([m]) => m === 'update')?.[1][0]).toEqual({ title: 'X', is_physical: false })
  })
})

describe('RK37: pass på valda datum', () => {
  it('ett insert med en rad per datum, som arbetsplatspass', async () => {
    svar = { data: [rad('a', '2026-10-05'), rad('b', '2026-10-07')], error: null }
    const skapade = await aktivitetsplanApi.addSessionsOnDates('plan1', 'delt',
      { date: '2026-10-05', start_time: '08:00', end_time: '12:00', title: 'Nordfrakt AB', activity_type: 'workplace', location: 'Nordfrakt AB' },
      ['2026-10-05', '2026-10-07'], { work_placement_id: 'w1', is_physical: true })
    const rader = anrop.find(([m]) => m === 'insert')?.[1][0] as Array<Record<string, unknown>>
    expect(rader.map((r) => r.date)).toEqual(['2026-10-05', '2026-10-07'])
    expect(rader[0]).toMatchObject({ activity_type: 'workplace', location: 'Nordfrakt AB', plan_id: 'plan1', participant_id: 'delt' })
    expect(rader[0]).toMatchObject({ work_placement_id: 'w1', is_physical: true })
    expect(skapade).toHaveLength(2)
  })

  it('inga datum = inget anrop', async () => {
    expect(await aktivitetsplanApi.addSessionsOnDates('plan1', 'delt', { date: '', start_time: '08:00', end_time: '12:00', title: 'X', activity_type: 'workplace' }, [])).toEqual([])
    expect(anrop).toEqual([])
  })
})

describe('RK40/RR28 efter migrationen', () => {
  it('ärendenummer och underrättelse skrivs till databasen', async () => {
    svar = { data: [{ id: 'plan1' }], error: null }
    await aktivitetsplanApi.sattArendenummer('plan1', 'KS-1').catch(() => undefined)
    await aktivitetsplanApi.sattAfUnderrattad('s1', '2026-09-27T10:00:00Z').catch(() => undefined)
    expect(anrop.filter(([m]) => m === 'update').length).toBeGreaterThanOrEqual(2)
  })
})

describe('SFT7: flytta pass', () => {
  it('skriver bara datum, per pass, och bara på omarkerade pass', async () => {
    svar = { data: [rad('a', '2026-10-07')], error: null }
    const flyttade = await aktivitetsplanApi.flyttaSessions([{ id: 'a', date: '2026-10-07' }])
    expect(anrop.find(([m]) => m === 'update')?.[1][0]).toEqual({ date: '2026-10-07' })
    expect(anrop.find(([m]) => m === 'is')?.[1]).toEqual(['attendance', null])
    expect(flyttade).toHaveLength(1)
    expect(notisPassAndrat).toHaveBeenCalledTimes(1)
  })

  it('kastar när ett pass inte gick att flytta (redan markerat) — ingen tyst halv serie', async () => {
    svar = { data: [], error: null }
    await expect(aktivitetsplanApi.flyttaSessions([{ id: 'a', date: '2026-10-07' }])).rejects.toThrow(/Bara 0 av 1/)
  })

  it('tystNotis undertrycker notisen (ändras fält samtidigt kommer den därifrån)', async () => {
    svar = { data: [rad('a', '2026-10-07')], error: null }
    await aktivitetsplanApi.flyttaSessions([{ id: 'a', date: '2026-10-07' }], { tystNotis: true })
    expect(notisPassAndrat).not.toHaveBeenCalled()
  })
})
