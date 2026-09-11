import { describe, it, expect, vi, beforeEach } from 'vitest'

const insert = vi.fn(async () => ({ error: null }))
const selectKedja = {
  select: vi.fn(),
}
const from = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => from(...args),
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'kons-1' } }, error: null })) },
  },
}))

import { laslogg, orgSomStangtAv, sessionNyckel, VIEWED_ACTION } from './laslogg'

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  from.mockImplementation((tabell: string) => {
    if (tabell === 'audit_logs') return { insert, ...selectKedja }
    return selectKedja
  })
})

describe('loggaVisning', () => {
  it('skriver VIEWED_PARTICIPANT_DATA med deltagaren i participant_id', async () => {
    await laslogg.loggaVisning('delt-9')
    expect(from).toHaveBeenCalledWith('audit_logs')
    expect(insert).toHaveBeenCalledWith({
      user_id: 'kons-1',
      action: VIEWED_ACTION,
      resource_type: 'participant',
      resource_id: 'delt-9',
      participant_id: 'delt-9',
    })
  })

  it('kastar när databasen säger nej', async () => {
    insert.mockResolvedValueOnce({ error: { message: 'permission denied' } } as never)
    await expect(laslogg.loggaVisning('delt-9')).rejects.toBeTruthy()
  })
})

describe('loggaVisningEnGang', () => {
  it('loggar första gången och sätter sessionsnyckeln, sedan inte igen', async () => {
    expect(await laslogg.loggaVisningEnGang('delt-9')).toBe(true)
    expect(sessionStorage.getItem(sessionNyckel('delt-9'))).toBe('1')
    expect(await laslogg.loggaVisningEnGang('delt-9')).toBe(false)
    expect(insert).toHaveBeenCalledTimes(1)
  })

  it('sväljer fel med console.warn och sätter INTE nyckeln', async () => {
    insert.mockResolvedValueOnce({ error: { message: 'nere' } } as never)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(await laslogg.loggaVisningEnGang('delt-9')).toBe(false)
    expect(warn).toHaveBeenCalled()
    expect(sessionStorage.getItem(sessionNyckel('delt-9'))).toBeNull()
    warn.mockRestore()
  })
})

describe('orgSomStangtAv', () => {
  it('hittar organisationen med ai_enabled=false, annars null', () => {
    expect(orgSomStangtAv([])).toBeNull()
    expect(orgSomStangtAv([{ org_id: 'o', org_name: 'Kommun', ai_enabled: true }])).toBeNull()
    expect(orgSomStangtAv([
      { org_id: 'a', org_name: 'A', ai_enabled: true },
      { org_id: 'b', org_name: 'B', ai_enabled: false },
    ])?.org_name).toBe('B')
  })
})
