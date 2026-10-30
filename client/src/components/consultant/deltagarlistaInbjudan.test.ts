import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { GranskadRad } from './deltagarlistaCsv'

const mock = vi.hoisted(() => ({
  insert: vi.fn(),
  selectProfiles: vi.fn(),
  selectInvitations: vi.fn(),
  getSession: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: mock.getSession },
    from: (tabell: string) => {
      if (tabell === 'profiles') {
        return { select: () => ({ eq: () => ({ range: mock.selectProfiles }) }) }
      }
      return {
        insert: (v: unknown) => ({ select: () => ({ single: () => mock.insert(v) }) }),
        select: () => ({ eq: () => ({ is: () => ({ gt: () => ({ range: mock.selectInvitations }) }) }) }),
      }
    },
  },
}))

import { hamtaBefintliga, skickaInbjudningar } from './deltagarlistaInbjudan'

function rad(n: number, over: Partial<GranskadRad> = {}): GranskadRad {
  return { rad: n + 1, fornamn: `F${n}`, efternamn: `E${n}`, epost: `u${n}@x.se`, arendenummer: null, startdatum: null, status: 'ok', orsak: null, ...over }
}

const vila = async () => {}

function mejlSvar(resultat: Array<{ invitationId: string; success: boolean; error?: string }>) {
  return { ok: true, status: 200, json: async () => ({ results: resultat }) }
}

describe('hamtaBefintliga', () => {
  beforeEach(() => { mock.selectProfiles.mockReset(); mock.selectInvitations.mockReset() })

  it('samlar adresser skiftlägesokänsligt ur båda källorna', async () => {
    mock.selectProfiles.mockResolvedValue({ data: [{ email: 'A@B.se' }], error: null })
    mock.selectInvitations.mockResolvedValue({ data: [{ email: ' c@d.se ' }, { email: null }], error: null })
    const r = await hamtaBefintliga('k1')
    expect([...r.kopplade]).toEqual(['a@b.se'])
    expect([...r.inbjudna]).toEqual(['c@d.se'])
  })

  it('läsfel KASTAR — vi får inte skicka utan dubblettkontroll', async () => {
    mock.selectProfiles.mockResolvedValue({ data: [], error: null })
    mock.selectInvitations.mockResolvedValue({ data: null, error: { message: 'rls' } })
    await expect(hamtaBefintliga('k1')).rejects.toThrow(/rls/)
  })

  it('läser flera sidor när första är full', async () => {
    const full = Array.from({ length: 1000 }, (_, i) => ({ email: `p${i}@x.se` }))
    mock.selectProfiles
      .mockResolvedValueOnce({ data: full, error: null })
      .mockResolvedValueOnce({ data: [{ email: 'sist@x.se' }], error: null })
    mock.selectInvitations.mockResolvedValue({ data: [], error: null })
    const r = await hamtaBefintliga('k1')
    expect(r.kopplade.size).toBe(1001)
    expect(r.kopplade.has('sist@x.se')).toBe(true)
  })
})

describe('skickaInbjudningar', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    mock.insert.mockReset(); mock.getSession.mockReset(); fetchMock.mockReset()
    mock.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } })
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => { vi.unstubAllGlobals() })

  it('sparar metadata (ärende, startdatum, källa) och mejlar i grupper om fyra med paus emellan', async () => {
    mock.insert.mockImplementation(async (v: { email: string }) => ({ data: { id: 'id-' + v.email }, error: null }))
    fetchMock.mockImplementation(async (_u: string, init: { body: string }) => {
      const ids: string[] = JSON.parse(init.body).invitationIds
      return mejlSvar(ids.map((invitationId) => ({ invitationId, success: true })))
    })
    const vilor: number[] = []
    const rader = [rad(0, { arendenummer: 'K-1', startdatum: '2026-11-03' }), ...[1, 2, 3, 4, 5].map((n) => rad(n))]
    const framsteg: number[] = []
    const ut = await skickaInbjudningar(rader, 'k1', { vila: async (ms) => { vilor.push(ms) }, onFramsteg: (k) => framsteg.push(k) })

    expect(ut.every((u) => u.utfall === 'skickad')).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2) // 4 + 2
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).invitationIds).toHaveLength(4)
    expect(vilor).toHaveLength(1) // bara mellan grupperna
    expect(framsteg).toEqual([4, 6])
    const forsta = mock.insert.mock.calls.find(([v]) => v.email === 'u0@x.se')![0]
    expect(forsta).toMatchObject({
      role: 'USER', invited_by: 'k1', consultant_id: 'k1',
      metadata: { first_name: 'F0', last_name: 'E0', case_reference: 'K-1', start_date: '2026-11-03', source: 'deltagarlista' },
    })
    const andra = mock.insert.mock.calls.find(([v]) => v.email === 'u1@x.se')![0]
    expect(andra.metadata).not.toHaveProperty('case_reference')
  })

  it('rad 17 av 40: ett insertfel visas på sin rad och de andra går igenom', async () => {
    mock.insert.mockImplementation(async (v: { email: string }) =>
      v.email === 'u16@x.se' ? { data: null, error: { message: 'permission denied' } } : { data: { id: 'id-' + v.email }, error: null })
    fetchMock.mockImplementation(async (_u: string, init: { body: string }) =>
      mejlSvar((JSON.parse(init.body).invitationIds as string[]).map((invitationId) => ({ invitationId, success: true }))))
    const rader = Array.from({ length: 40 }, (_, i) => rad(i))
    const ut = await skickaInbjudningar(rader, 'k1', { vila })
    expect(ut).toHaveLength(40)
    const fel = ut.filter((u) => u.utfall === 'fel')
    expect(fel).toHaveLength(1)
    expect(fel[0]).toMatchObject({ epost: 'u16@x.se' })
    expect(fel[0].meddelande).toContain('permission denied')
    expect(ut.filter((u) => u.utfall === 'skickad')).toHaveLength(39)
  })

  it('mejlfel på en rad blir "sparad utan mejl" med orsaken, inte "skickad"', async () => {
    mock.insert.mockImplementation(async (v: { email: string }) => ({ data: { id: 'id-' + v.email }, error: null }))
    fetchMock.mockResolvedValue(mejlSvar([
      { invitationId: 'id-u0@x.se', success: true },
      { invitationId: 'id-u1@x.se', success: false, error: 'Resend 422: invalid to' },
    ]))
    const ut = await skickaInbjudningar([rad(0), rad(1)], 'k1', { vila })
    expect(ut[0].utfall).toBe('skickad')
    expect(ut[1].utfall).toBe('sparad_utan_mejl')
    expect(ut[1].meddelande).toContain('Resend 422')
  })

  it('saknar edge-svaret en rad räknas den inte som skickad', async () => {
    mock.insert.mockImplementation(async (v: { email: string }) => ({ data: { id: 'id-' + v.email }, error: null }))
    fetchMock.mockResolvedValue(mejlSvar([{ invitationId: 'id-u0@x.se', success: true }]))
    const ut = await skickaInbjudningar([rad(0), rad(1)], 'k1', { vila })
    expect(ut[1].utfall).toBe('sparad_utan_mejl')
  })

  it('icke-2xx från mejltjänsten (t.ex. demokonto) markerar hela gruppen med felet', async () => {
    mock.insert.mockImplementation(async (v: { email: string }) => ({ data: { id: 'id-' + v.email }, error: null }))
    fetchMock.mockResolvedValue({ ok: false, status: 403, json: async () => ({ error: 'Demokontot kan inte skicka inbjudningar.' }) })
    const ut = await skickaInbjudningar([rad(0), rad(1)], 'k1', { vila })
    expect(ut.map((u) => u.utfall)).toEqual(['sparad_utan_mejl', 'sparad_utan_mejl'])
    expect(ut[0].meddelande).toContain('Demokontot')
  })

  it('nätverksfel i fetch sväljs inte', async () => {
    mock.insert.mockResolvedValue({ data: { id: 'i' }, error: null })
    fetchMock.mockRejectedValue(new Error('Failed to fetch'))
    const ut = await skickaInbjudningar([rad(0)], 'k1', { vila })
    expect(ut[0]).toMatchObject({ utfall: 'sparad_utan_mejl' })
    expect(ut[0].meddelande).toContain('Failed to fetch')
  })

  it('ingen session: inbjudningarna sparas men ingen räknas som skickad', async () => {
    mock.getSession.mockResolvedValue({ data: { session: null } })
    mock.insert.mockResolvedValue({ data: { id: 'i' }, error: null })
    const ut = await skickaInbjudningar([rad(0)], 'k1', { vila })
    expect(ut[0].utfall).toBe('sparad_utan_mejl')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('429 från Resend försöks om en gång', async () => {
    mock.insert.mockImplementation(async (v: { email: string }) => ({ data: { id: 'id-' + v.email }, error: null }))
    fetchMock
      .mockResolvedValueOnce(mejlSvar([{ invitationId: 'id-u0@x.se', success: false, error: 'Resend 429: rate limit' }]))
      .mockResolvedValueOnce(mejlSvar([{ invitationId: 'id-u0@x.se', success: true }]))
    const ut = await skickaInbjudningar([rad(0)], 'k1', { vila })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(ut[0].utfall).toBe('skickad')
  })

  it('rader som inte är "ok" rörs aldrig (fel, dubbletter, redan kopplade)', async () => {
    mock.insert.mockResolvedValue({ data: { id: 'i' }, error: null })
    fetchMock.mockResolvedValue(mejlSvar([{ invitationId: 'i', success: true }]))
    const ut = await skickaInbjudningar(
      [rad(0), rad(1, { status: 'fel' }), rad(2, { status: 'dubblett' }), rad(3, { status: 'redan_kopplad' }), rad(4, { status: 'redan_inbjuden' })],
      'k1', { vila },
    )
    expect(ut).toHaveLength(1)
    expect(mock.insert).toHaveBeenCalledTimes(1)
  })

  it('avbrott: kvarvarande rader blir "ej skickad" och inget mer sparas', async () => {
    mock.insert.mockImplementation(async (v: { email: string }) => ({ data: { id: 'id-' + v.email }, error: null }))
    fetchMock.mockImplementation(async (_u: string, init: { body: string }) =>
      mejlSvar((JSON.parse(init.body).invitationIds as string[]).map((invitationId) => ({ invitationId, success: true }))))
    const ac = new AbortController()
    const ut = await skickaInbjudningar(Array.from({ length: 8 }, (_, i) => rad(i)), 'k1', { vila, signal: ac.signal, onFramsteg: () => ac.abort() })
    expect(ut.filter((u) => u.utfall === 'skickad')).toHaveLength(4)
    expect(ut.filter((u) => u.utfall === 'ej_skickad')).toHaveLength(4)
    expect(mock.insert).toHaveBeenCalledTimes(4)
  })
})
