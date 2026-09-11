/**
 * KM10: notiserna i aktivitetApi är en bonus — rätt typ till rätt deltagare,
 * bara vid ogiltig frånvaro, och ett notisfel får aldrig fälla huvudoperationen.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const rad = {
  id: 's1', plan_id: 'plan1', participant_id: 'delt', date: '2026-09-07', start_time: '09:00:00', end_time: '12:00:00',
  title: 'Jobbsökarverkstad', activity_type: 'jobsearch', location: null, notes: null, attendance: 'present',
  attendance_note: null, sick_certificate_received: false, marked_by: 'kons', marked_at: null, self_checkin_at: null,
  created_at: '', updated_at: '',
}
let svar: { data: unknown; error: unknown } = { data: rad, error: null }
function kedja(): Record<string, unknown> {
  const k: Record<string, unknown> = {}
  for (const m of ['update', 'insert', 'delete', 'select', 'eq', 'gte', 'lte', 'order']) k[m] = vi.fn(() => k)
  k.single = vi.fn(async () => svar)
  k.maybeSingle = vi.fn(async () => svar)
  return k
}
const from = vi.fn((_tabell: string) => kedja())
vi.mock('@/lib/supabase', () => ({
  supabase: { from: (tabell: string) => from(tabell), auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'kons' } }, error: null })) } },
}))
vi.mock('./aktivitetNotiser', () => ({
  notisOgiltigFranvaro: vi.fn(async () => undefined),
  notisPassAndrat: vi.fn(async () => undefined),
  notisPlanSkapad: vi.fn(async () => undefined),
}))

import { aktivitetsplanApi } from './aktivitetApi'
import { notisOgiltigFranvaro, notisPassAndrat } from './aktivitetNotiser'

beforeEach(() => { vi.clearAllMocks(); svar = { data: rad, error: null } })

describe('aktivitetApi × notiser', () => {
  it('ogiltig frånvaro ger en frånvaronotis till deltagaren', async () => {
    svar = { data: { ...rad, attendance: 'absent_invalid' }, error: null }
    const s = await aktivitetsplanApi.markAttendance('s1', { attendance: 'absent_invalid' })
    expect(s.attendance).toBe('absent_invalid')
    expect(notisOgiltigFranvaro).toHaveBeenCalledTimes(1)
    expect(vi.mocked(notisOgiltigFranvaro).mock.calls[0][0]).toMatchObject({ id: 's1', participant_id: 'delt', start_time: '09:00' })
  })

  it('giltig frånvaro, närvaro och nollställning ger INGEN notis', async () => {
    for (const a of ['absent_valid', 'present', 'sick_certified', 'external', null] as const) {
      svar = { data: { ...rad, attendance: a }, error: null }
      await aktivitetsplanApi.markAttendance('s1', { attendance: a })
    }
    expect(notisOgiltigFranvaro).not.toHaveBeenCalled()
  })

  it('ett notisfel fäller inte markeringen — det loggas', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.mocked(notisOgiltigFranvaro).mockRejectedValueOnce(new Error('42501'))
    svar = { data: { ...rad, attendance: 'absent_invalid' }, error: null }
    await expect(aktivitetsplanApi.markAttendance('s1', { attendance: 'absent_invalid' })).resolves.toMatchObject({ attendance: 'absent_invalid' })
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })

  it('nytt pass ger en passnotis med typ tillagt, borttaget pass med typ borttaget', async () => {
    await aktivitetsplanApi.addSession('plan1', 'delt', { date: '2026-09-07', start_time: '09:00', end_time: '12:00', title: 'Jobbsökarverkstad', activity_type: 'jobsearch' })
    expect(notisPassAndrat).toHaveBeenLastCalledWith(expect.objectContaining({ id: 's1', participant_id: 'delt' }), { typ: 'tillagt' })
    await aktivitetsplanApi.removeSession('s1')
    expect(notisPassAndrat).toHaveBeenLastCalledWith(expect.objectContaining({ id: 's1' }), { typ: 'borttaget' })
  })

  it('databasfel i huvudoperationen kastas — och ingen notis skickas', async () => {
    svar = { data: null, error: { message: 'nere' } }
    await expect(aktivitetsplanApi.markAttendance('s1', { attendance: 'absent_invalid' })).rejects.toBeTruthy()
    expect(notisOgiltigFranvaro).not.toHaveBeenCalled()
  })
})
